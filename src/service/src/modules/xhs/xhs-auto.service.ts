import { Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto-js';
import { SignatureDto } from './dto/xhs-signature.dto';
// 导入TypeORM相关模块用于数据库操作
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XhsSignature } from './xhs-signature.entity';
import { RedisCacheService } from '../redisCache/redisCache.service';
import { Cron } from '@nestjs/schedule';
import { MoreThanOrEqual } from 'typeorm';

@Injectable()
export class XhsAutoService implements OnModuleInit {
  // 从环境变量或配置文件获取敏感信息，避免硬编码
  private readonly appKey = 'red.PLR6uhfocuZ0kRFs';
  private readonly appSecret = '6dc7b301dfde6e16b8b9ddd1d02afe98';
  // 应该在生产环境中从环境变量获取：
  // private readonly appKey = process.env.XHS_APP_KEY;
  // private readonly appSecret = process.env.XHS_APP_SECRET;
  
  // 环境标识，用于区分不同环境的Redis键
  private readonly ENV_PREFIX = 'dev';
  
  // Redis键名常量
  private get REDIS_XHS_TOKEN_KEY() {
    return `${this.ENV_PREFIX}:xhs:access_token`;
  }
  
  private get REDIS_XHS_TOKEN_EXPIRES_KEY() {
    return `${this.ENV_PREFIX}:xhs:access_token:expires_at`;
  }
  
  // Redis键名常量 - 抖音认证参数
  private get REDIS_DOUYIN_AUTH_KEY() {
    return `${this.ENV_PREFIX}:douyin:auth_params`;
  }
  
  private get REDIS_DOUYIN_AUTH_EXPIRES_KEY() {
    return `${this.ENV_PREFIX}:douyin:auth_params:expires_at`;
  }

  constructor(
    @InjectRepository(XhsSignature)
    private readonly signatureRepository: Repository<XhsSignature>,
    private readonly redisCacheService: RedisCacheService
  ) {
    console.log(`小红书服务初始化，环境: ${this.ENV_PREFIX}`);
  }

  /**
   * 模块初始化时执行
   */
  async onModuleInit() {
    console.log('小红书自动服务模块初始化');
    // 初始化时检查token
    await this.checkAndRefreshTokenIfNeeded();
  }

  /**
   * 每小时检查一次token状态
   */
  @Cron('0 0 * * * *') // 每小时执行一次
  async checkTokenStatus() {
    console.log('定期检查小红书access_token状态');
    await this.checkAndRefreshTokenIfNeeded();
  }
  
  /**
   * 检查并在需要时刷新token
   */
  private async checkAndRefreshTokenIfNeeded(): Promise<void> {
    try {
      // 从Redis获取token过期时间
      const expiresAtFromRedis = await this.redisCacheService.get({
        key: this.REDIS_XHS_TOKEN_EXPIRES_KEY
      });
      
      // 检查是否需要刷新，直接使用过期时间判断
      const shouldRefresh = !expiresAtFromRedis || 
                          Date.now() >= parseInt(expiresAtFromRedis);
      
      if (shouldRefresh) {
        console.log('定期检查发现token已过期，开始刷新');
        // 生成新的nonce和timestamp
        const { nonce, timestamp } = this.generateNonceAndTimestamp();
        // 刷新token
        await this.refreshAccessToken(nonce, timestamp);
      } else {
        console.log('定期检查：token状态正常，无需刷新');
      }
    } catch (error) {
      console.error('检查token状态时出错:', error);
    }
  }

  /**
   * 生成随机nonce和当前timestamp
   * @returns 包含nonce和timestamp的对象
   */
  private generateNonceAndTimestamp(): { nonce: string, timestamp: string } {
    const nonce = Math.random().toString(36).substring(2);
    const timestamp = Date.now().toString();
    return { nonce, timestamp };
  }

  /**
   * 生成小红书分享签名
   * @param appKey 应用Key
   * @param nonce 随机字符串
   * @param timestamp 时间戳
   * @param secretKey 密钥(appSecret或accessToken)
   * @returns 生成的签名
   */
  private generateSignature(appKey: string, nonce: string, timestamp: string, secretKey: string): string {
    const params = {
      appKey,
      nonce,
      timeStamp: timestamp,
    };

    // 按照键名对参数进行字典排序并拼接
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    console.log("sortedParams:"+sortedParams);
    // 拼接密钥并计算SHA256
    const stringToSign = sortedParams + secretKey;
    console.log("stringToSign:"+stringToSign);
    return crypto.SHA256(stringToSign).toString();
  }

  /**
   * 获取小红书access_token
   * @returns 访问令牌
   */
  private async getAccessToken(): Promise<string> {
    try {
      // 从Redis获取token
      const tokenFromRedis = await this.redisCacheService.get({
        key: this.REDIS_XHS_TOKEN_KEY
      });
      
      const expiresAtFromRedis = await this.redisCacheService.get({
        key: this.REDIS_XHS_TOKEN_EXPIRES_KEY
      });
      
      // 直接使用过期时间判断，不再提前刷新
      if (tokenFromRedis && expiresAtFromRedis) {
        // 检查是否仍有效
        if (Date.now() < parseInt(expiresAtFromRedis)) {
          console.log(`使用Redis缓存的有效token，环境: ${this.ENV_PREFIX}`);
          return tokenFromRedis;
        } else {
          console.log(`Redis中的token已过期，需要刷新，环境: ${this.ENV_PREFIX}`);
        }
      } else {
        console.log(`Redis中未找到有效token，环境: ${this.ENV_PREFIX}`);
      }
      
      // 到这里，说明需要刷新token
      console.log(`需要刷新token，环境: ${this.ENV_PREFIX}`);

      // 生成新的nonce和timestamp
      const { nonce, timestamp } = this.generateNonceAndTimestamp();

      // 刷新访问令牌
      const token = await this.refreshAccessToken(nonce, timestamp);
      console.log(`成功刷新token，环境: ${this.ENV_PREFIX}`);
      return token;
    } catch (error) {
      console.error(`获取小红书access_token失败，环境: ${this.ENV_PREFIX}:`, error);
      // 如果Redis中仍有缓存的token，作为应急措施返回
      try {
        const tokenFromRedis = await this.redisCacheService.get({
          key: this.REDIS_XHS_TOKEN_KEY
        });
        
        if (tokenFromRedis) {
          console.log(`获取失败，但有Redis缓存的token，使用旧token，环境: ${this.ENV_PREFIX}`);
          return tokenFromRedis;
        }
      } catch (_) {
        // 忽略Redis读取错误
      }
      
      // 重新抛出错误
      throw error;
    }
  }

  /**
   * 将token保存到Redis
   */
  private async saveTokenToRedis(token: string, expiresAt: number): Promise<void> {
    try {
      // 保存token到Redis
      await this.redisCacheService.set({
        key: this.REDIS_XHS_TOKEN_KEY,
        val: token
      });
      
      // 保存过期时间到Redis，使用实际过期时间
      const ttlInSeconds = Math.floor((expiresAt - Date.now()) / 1000);
      
      await this.redisCacheService.set({
        key: this.REDIS_XHS_TOKEN_EXPIRES_KEY,
        val: expiresAt.toString()
      }, ttlInSeconds > 0 ? ttlInSeconds : undefined);
      
      console.log(`小红书access_token已保存到Redis，环境: ${this.ENV_PREFIX}，TTL: ${ttlInSeconds}秒`);
    } catch (error) {
      console.error(`保存小红书access_token到Redis失败，环境: ${this.ENV_PREFIX}:`, error);
    }
  }

  /**
   * 内部方法：刷新访问令牌
   */
  private async refreshAccessToken(nonce: string, timestamp: string): Promise<string> {
    const maxRetries = 3; // 最大重试次数
    const retryDelay = 1000; // 重试间隔1秒
    let retryCount = 0;
    
    while (true) {
      try {
        // 使用appSecret生成签名
        const signature = this.generateSignature(this.appKey, nonce, timestamp, this.appSecret);
        console.log("请求access_token参数：",{
          app_key: this.appKey,
          nonce: nonce,
          timestamp: timestamp,
          signature: signature
        });
        
        // 请求access_token
        const response = await axios.post(
          'https://edith.xiaohongshu.com/api/sns/v1/ext/access/token',
          {
            app_key: this.appKey,
            nonce: nonce,
            timestamp: timestamp,
            signature: signature
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        // 检查响应是否成功
        if (!response.data.success) {
          throw new Error(`获取access_token失败: ${response.data.msg}, 代码: ${response.data.code}`);
        }

        // 提取响应数据
        const { access_token, expires_in } = response.data.data;
        
        // 计算过期时间
        let newExpiresAt = 0;
        
        if (expires_in) {
          // 如果expiresIn大于当前时间戳，则认为它是一个绝对时间戳
          if (expires_in > Date.now()) {
            newExpiresAt = expires_in;
          } else {
            // 否则认为它是相对时间（秒），转换为时间戳
            newExpiresAt = Date.now() + (expires_in * 1000);
          }
        }
        
        // 保存token到Redis
        await this.saveTokenToRedis(access_token, newExpiresAt);

        return access_token;
        
      } catch (error) {
        // 增加重试计数
        retryCount++;
        
        // 如果已达到最大重试次数，抛出异常
        if (retryCount >= maxRetries) {
          console.error(`刷新token失败，已重试${maxRetries}次，放弃重试:`, error);
          throw error;
        }
        
        // 输出错误并准备重试
        console.warn(`刷新token失败，${retryCount}/${maxRetries}次，将在${retryDelay/1000}秒后重试:`, error.message);
        
        // 等待指定时间后重试
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        console.log(`开始第${retryCount + 1}次重试获取access_token`);
      }
    }
  }

  /**
   * 获取小红书分享签名
   * @returns 签名数据
   */
  async getXhsSignature(): Promise<SignatureDto> {
    console.log('获取小红书分享签名');
    try {
      // 1. 直接生成新的签名，不先查询数据库
      console.log('生成新的签名');
      try {
        // 生成新的nonce和timestamp
        const { nonce, timestamp } = this.generateNonceAndTimestamp();
        
        // 获取access_token
        const accessToken = await this.getAccessToken();
        
        console.log('accessToken:'+accessToken);
        // 使用access_token生成最终签名
        const signature = this.generateSignature(this.appKey, nonce, timestamp, accessToken);
        
        // 构建签名数据
        const signatureData = {
          appKey: this.appKey,
          nonce: nonce,
          timestamp: timestamp,
          signature: signature,
        };
        
        // 返回签名数据，不保存到数据库
        return signatureData;
      } catch (error) {
        console.error('生成新签名失败:', error);
        
        // 如果生成失败，先从数据库获取作为备选
        console.log('生成失败，尝试从数据库获取最新签名');
        const latestSignature = await this.getLatestSignatureFromDB();
        
        if (latestSignature) {
          console.log('使用数据库中的签名，创建时间:', latestSignature.createTime);
          return {
            appKey: latestSignature.appKey,
            signature: latestSignature.signature,
            timestamp: latestSignature.timestamp,
            nonce: latestSignature.nonce
          };
        }
        
        // 数据库也没有，最后尝试从外部API获取
        console.log('数据库中无有效签名，尝试从外部API获取签名');
        const apiSignature = await this.getSignatureFromExternalAPI();
        
        if (apiSignature) {
          return apiSignature;
        }
        
        // 所有方法都失败，重新抛出原始错误
        throw error;
      }
    } catch (error) {
      console.error('获取小红书分享签名失败:', error);
      throw error;
    }
  }

  /**
   * 从外部API获取签名
   */
  private async getSignatureFromExternalAPI(): Promise<SignatureDto | null> {
    try {
      // 参考app.py中的签名获取方式，使用相同的API
      const response = await axios.post(
        'https://red-sever-pnfbxjccci.cn-hangzhou.fcapp.run/signature',
        {},
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('外部API签名响应:', response.data);
      
      if (response.data) {
        const signatureData = {
          appKey: response.data.appKey || response.data.app_key,
          signature: response.data.signature,
          timestamp: response.data.timestamp,
          nonce: response.data.nonce
        };
        
        // 从外部API获取数据后保存到数据库
        await this.saveSignatureToDB(signatureData);
        
        return signatureData;
      }
      
      return null;
    } catch (error) {
      console.error('从外部API获取签名失败:', error);
      return null;
    }
  }
  
  /**
   * 从数据库获取最新的签名
   */
  private async getLatestSignatureFromDB(): Promise<XhsSignature | null> {
    try {
      // 计算90分钟前的时间
      const ninetyMinutesAgo = new Date();
      ninetyMinutesAgo.setMinutes(ninetyMinutesAgo.getMinutes() - 90);
      
      // 查询最新的签名记录，限制在90分钟内创建的
      const signature = await this.signatureRepository.findOne({
        where: {
          createTime: MoreThanOrEqual(ninetyMinutesAgo)
        },
        order: { createTime: 'DESC' }
      });
      
      return signature;
    } catch (error) {
      console.error('从数据库获取签名失败:', error);
      return null;
    }
  }

  /**
   * 保存签名到数据库
   */
  private async saveSignatureToDB(signatureData: SignatureDto): Promise<void> {
    try {
      // 创建新的签名实体
      const newSignature = new XhsSignature();
      newSignature.appKey = signatureData.appKey;
      newSignature.signature = signatureData.signature;
      newSignature.timestamp = signatureData.timestamp;
      newSignature.nonce = signatureData.nonce;
      newSignature.createTime = new Date();
      
      // 保存到数据库
      await this.signatureRepository.save(newSignature);
      console.log('签名已保存到数据库');
    } catch (error) {
      console.error('保存签名到数据库失败:', error);
      // 不抛出异常，让流程继续
    }
  }

  /**
   * 获取抖音认证参数
   * 从Redis或远程获取认证参数
   */
  private async getDouyinAuthParams(userId: string = '1', activityId: string = '421312321'): Promise<{
    client_key: string;
    nonce_str: string;
    timestamp: string;
    signature: string;
  }> {
    try {
      // 先从Redis获取
      const paramsFromRedis = await this.redisCacheService.get({
        key: this.REDIS_DOUYIN_AUTH_KEY
      });
      
      const expiresAtFromRedis = await this.redisCacheService.get({
        key: this.REDIS_DOUYIN_AUTH_EXPIRES_KEY
      });
      
      if (paramsFromRedis && expiresAtFromRedis && Date.now() < parseInt(expiresAtFromRedis)) {
        console.log('使用Redis缓存的抖音认证参数');
        return JSON.parse(paramsFromRedis);
      }
      
      // 尝试从第一个API获取参数
      try {
        console.log('从第一个API获取抖音认证参数');
        const apiUrl = `https://pyp.jzguai.com/shop/api/get_douyin_schema.php?user_id=${userId}&activity_id=${activityId}`;
        const response = await axios.get(apiUrl);
        
        if (response.data && response.data.schema_url) {
          const authParams = this.extractParamsFromSchemaUrl(response.data.schema_url);
          if (this.validateAuthParams(authParams)) {
            // 保存到Redis
            await this.saveDouyinAuthParamsToRedis(authParams);
            return authParams;
          }
        }
      } catch (error) {
        console.error('从第一个API获取抖音认证参数失败:', error);
        // 继续尝试第二个API
      }
      
      // 尝试从第二个API获取参数
      console.log('从第二个API获取抖音认证参数');
      const secondApiUrl = 'https://nfc.yunmaitui.com/client/touch/douyinPublishNew?uuid=0f53c719-659b-538a-2b09-df869591&id=225683&open_id=null';
      const secondResponse = await axios.get(secondApiUrl);
      
      if (!secondResponse.data || !secondResponse.data.data || !secondResponse.data.data.douyin_publish_scheme) {
        throw new Error('从第二个API获取抖音scheme失败');
      }
      
      const schemaUrl = secondResponse.data.data.douyin_publish_scheme;
      const authParams = this.extractParamsFromSchemaUrl(schemaUrl);
      
      if (!this.validateAuthParams(authParams)) {
        throw new Error('从第二个API获取的认证参数不完整');
      }
      
      // 保存到Redis
      await this.saveDouyinAuthParamsToRedis(authParams);
      return authParams;
    } catch (error) {
      console.error('获取抖音认证参数失败:', error);
      throw error;
    }
  }
  
  /**
   * 将抖音认证参数保存到Redis
   */
  private async saveDouyinAuthParamsToRedis(params: {
    client_key: string;
    nonce_str: string;
    timestamp: string;
    signature: string;
  }): Promise<void> {
    try {
      const expiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1小时过期
      
      // 保存参数到Redis
      await this.redisCacheService.set({
        key: this.REDIS_DOUYIN_AUTH_KEY,
        val: JSON.stringify(params)
      });
      
      // 保存过期时间到Redis
      const ttlInSeconds = Math.floor((expiresAt - Date.now()) / 1000);
      
      await this.redisCacheService.set({
        key: this.REDIS_DOUYIN_AUTH_EXPIRES_KEY,
        val: expiresAt.toString()
      }, ttlInSeconds > 0 ? ttlInSeconds : undefined);
      
      console.log('已保存抖音认证参数到Redis，过期时间:', new Date(expiresAt).toLocaleString());
    } catch (error) {
      console.error('保存抖音认证参数到Redis失败:', error);
    }
  }
  
  /**
   * 从schema URL中提取认证参数
   */
  private extractParamsFromSchemaUrl(schemaUrl: string): {
    client_key: string;
    nonce_str: string;
    timestamp: string;
    signature: string;
  } {
    // 处理URL中的转义字符
    const cleanUrl = schemaUrl.replace(/\\\//g, '/');
    const paramsMatch = cleanUrl.match(/\?(.+)$/);
    
    if (!paramsMatch) {
      throw new Error('无法解析schema_url参数');
    }
    
    // 从URL参数中提取认证参数
    const urlParams = new URLSearchParams(paramsMatch[1]);
    return {
      client_key: urlParams.get('client_key') || '',
      nonce_str: urlParams.get('nonce_str') || '',
      timestamp: urlParams.get('timestamp') || '',
      signature: urlParams.get('signature') || ''
    };
  }
  
  /**
   * 验证认证参数是否完整
   */
  private validateAuthParams(params: {
    client_key: string;
    nonce_str: string;
    timestamp: string;
    signature: string;
  }): boolean {
    return !!(params.client_key && params.nonce_str && params.timestamp && params.signature);
  }

  /**
   * 获取抖音跳转链接
   * @param id 笔记ID
   * @param userId 用户ID
   * @param activityId 活动ID
   */
  async getDouyinSchema(id: string, userId: string = '1', activityId: string = '421312321'): Promise<any> {
    try {
      // 1. 获取笔记详情
      const noteId = parseInt(id, 10);
      const noteRepository = this.signatureRepository.manager.getRepository('xhs_posts');
      const note = await noteRepository.findOne({ where: { id: noteId } });
      
      if (!note) {
        throw new Error('笔记不存在');
      }
      
      // 2. 获取抖音认证参数（从Redis或API）
      const authParams = await this.getDouyinAuthParams(userId, activityId);
      
      // 3. 构建分享参数
      try {
        // 基础URL
        const baseSchema = "snssdk1128://openplatform/share";
        
        // 解析参数
        const params = new URLSearchParams();
        
        // 添加基础参数
        params.append('share_type', 'h5');
        
        // 添加认证参数
        params.append('client_key', authParams.client_key);
        params.append('nonce_str', authParams.nonce_str);
        params.append('timestamp', authParams.timestamp);
        params.append('signature', authParams.signature);
        
        // 添加笔记内容相关参数
        // 1. 媒体文件(图片或视频)
        if (note.type === 'video' && note.video) {
          // 视频笔记
          params.append('video_path', note.video);
        } else if (note.images && note.images.length > 0) {
          if (note.images.length === 1) {
            // 单图
            params.append('image_path', note.images[0]);
          } else {
            // 多图
            params.append('image_list_path', JSON.stringify(note.images));
          }
          params.append('feature', 'note');
        }
        
        // 2. 处理笔记内容和标题
        let content = note.content || '';
        let title = note.title || '';
        
        // 3. 从内容中提取标签
        // 匹配所有#开头的标签
        const hashtagRegex = /#([^\s#]+)/g;
        const matches = content.match(hashtagRegex) || [];
        const extractedHashtags = matches.map(tag => tag.substring(1)); // 去掉#号
        
        // 只使用从内容中提取的标签
        const finalHashtags = [...new Set(extractedHashtags)]; // 去重
        
        // 4. 移除内容结尾的标签部分
        if (extractedHashtags.length > 0 && content) {
          // 找到最后一个#标签的位置
          const lastHashtagIndex = content.lastIndexOf('#');
          if (lastHashtagIndex > 0) {
            // 检查前面是否有连续的标签
            let startTrimIndex = lastHashtagIndex;
            let currentIndex = lastHashtagIndex;
            
            // 向前查找所有连续的标签
            while (currentIndex > 0) {
              // 找到上一个标签
              const prevHashtagIndex = content.lastIndexOf('#', currentIndex - 1);
              if (prevHashtagIndex < 0) break;
              
              // 检查两个标签之间是否只有空格、换行等
              const textBetween = content.substring(prevHashtagIndex, currentIndex).trim();
              if (textBetween.startsWith('#') && !textBetween.includes('\n\n')) {
                startTrimIndex = prevHashtagIndex;
                currentIndex = prevHashtagIndex;
              } else {
                break;
              }
            }
            
            // 移除结尾的标签部分
            content = content.substring(0, startTrimIndex).trim();
          }
        }
        
        // 5. 添加标题和标签参数
        if (content) {
          params.append('title', content);
        }

        // 6. 标题
        if (note.title) {
          params.append('short_title', note.title);
        }
        
        // 添加标签列表
        if (finalHashtags.length > 0) {
          params.append('hashtag_list', JSON.stringify(finalHashtags));
        }
        
        // 7. 设置分享参数
        params.append('share_to_publish', '1');
        params.append('share_to_type', '0'); // 0:投稿 1:转发到日常
        params.append('state', noteId.toString());
        
        // 组装最终的schema URL
        const finalSchemaUrl = `${baseSchema}?${params.toString()}`;
        
        console.log('生成的抖音schema:', {
          title,
          content_preview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          hashtags: finalHashtags,
          schema_url_preview: finalSchemaUrl.substring(0, 100) + '...'
        });
        
        // 返回结果
        return finalSchemaUrl;
      } catch (parseError) {
        console.error('构建抖音schema失败:', parseError);
        throw parseError;
      }
    } catch (error) {
      console.error('获取抖音跳转链接失败:', error);
      throw error;
    }
  }
} 