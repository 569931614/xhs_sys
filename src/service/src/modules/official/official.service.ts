import { createRandomNonceStr, formatUrl } from '@/common/utils';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { ChatService } from '../chat/chat.service';
import { AuthService } from './../auth/auth.service';
import { AutoreplyService } from './../autoreply/autoreply.service';
import { GlobalConfigService } from './../globalConfig/globalConfig.service';
import { UserService } from './../user/user.service';

@Injectable()
export class OfficialService {
  private readonly logger = new Logger(OfficialService.name);
  
  constructor(
    private readonly autoreplyService: AutoreplyService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly globalConfigService: GlobalConfigService,
    private readonly chatgptService: ChatService
  ) {}
  private sceneStrMap = {};
  private scanedSceneStrMap = {};
  private loginResultCache = {};

  async onModuleInit() {
    this.logger.log('初始化OfficialService，获取微信访问令牌');
    try {
      await this.globalConfigService.getWechatAccessToken(true);
      this.logger.log('成功获取微信访问令牌');
    } catch (error) {
      this.logger.error(`获取微信访问令牌失败: ${error.message}`, error.stack);
    }
  }

  async getQRSceneStr() {
    let sceneStr = createRandomNonceStr(32);
    this.sceneStrMap[sceneStr] = true;
    return sceneStr;
  }

  /* 下发绑定微信的sceneStr */
  async getQRSceneStrByBind(req) {
    const { id } = req.user;
    const sceneStr = `${createRandomNonceStr(32)}/${id}`;
    this.sceneStrMap[sceneStr] = true;
    return sceneStr;
  }

  async getQRCodeTicket(sceneStr: string) {
    return this.fetchQRCodeTicket(sceneStr);
  }

  async getRedirectUrl(url: string) {
    const appId = await this.globalConfigService.getConfigs([
      'wechatOfficialAppId',
    ]);
    const Url = formatUrl(
      process.env.weChatOpenUrl || 'https://open.weixin.qq.com'
    );
    const res = `${Url}/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodeURIComponent(
      url
    )}&response_type=code&scope=snsapi_base&state=weChatLogin#wechat_redirect`;
    console.log('回跳跳转地址: ', res);
    return res;
  }

  async getJsapiTicket(url: string) {
    const nonceStr = createRandomNonceStr(32);
    const timestamp = (Date.now() / 1000).toFixed(0);
    const jsapiTicket = await this.globalConfigService.getConfigs([
      'wechatJsapiTicket',
    ]);
    console.log('jsapiTicket: ', jsapiTicket);
    const appId = await this.globalConfigService.getConfigs([
      'wechatOfficialAppId',
    ]);
    console.log('appId: ', appId);
    const str = `jsapi_ticket=${jsapiTicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
    console.log('str: ', str);
    const signature = this.sha1(str);
    return { appId, nonceStr, timestamp, signature };
  }

  async fetchQRCodeTicket(sceneStr: string) {
    const accessToken = await this.globalConfigService.getConfigs([
      'wechatAccessToken',
    ]);
    
    // 检查accessToken是否存在和有效
    if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
      this.logger.error('获取微信二维码失败: access_token missing');
      throw new HttpException('access_token missing', HttpStatus.BAD_REQUEST);
    }
    
    const Url = formatUrl(
      process.env.weChatApiUrl || 'https://api.weixin.qq.com'
    );
    const params = {
      action_name: 'QR_STR_SCENE',
      action_info: { scene: { scene_str: sceneStr } },
    };
    
    try {
    const res = await axios.post(
      `${Url}/cgi-bin/qrcode/create?access_token=${accessToken}`,
      params
    );
    const {
      data: { errmsg, ticket },
    } = res;
      
      if (errmsg) {
        this.logger.error(`获取微信二维码失败: ${errmsg}`);
        throw new HttpException(errmsg, HttpStatus.BAD_REQUEST);
      }
      
    return ticket;
    } catch (error) {
      this.logger.error(`获取微信二维码失败: ${error.message || '未知错误'}`);
      
      // 如果是HttpException直接抛出，否则包装为BAD_REQUEST
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(
          error.message || '获取微信二维码失败',
          HttpStatus.BAD_REQUEST
        );
      }
    }
  }

  async loginByCode(req, code: string) {
    const appId = await this.globalConfigService.getConfigs([
      'wechatOfficialAppId',
    ]);
    const secret = await this.globalConfigService.getConfigs([
      'wechatOfficialAppSecret',
    ]);
    const Url = formatUrl(
      process.env.weChatApiUrl || 'https://api.weixin.qq.com'
    );
    const res = await axios.get(
      `${Url}/sns/oauth2/access_token?appid=${appId}&secret=${secret}&code=${code}&grant_type=authorization_code`
    );
    const {
      data: { errmsg, openid },
    } = res;
    if (errmsg) throw new HttpException(errmsg, HttpStatus.BAD_REQUEST);
    let user;
    user = await this.userService.getUserOpenId(openid);
    if (!user) {
      user = await this.userService.getUserFromOpenId(openid);
    }
    return this.authService.loginByOpenId(user, req);
  }

  /* 扫码事件 初次扫码关注 或者二次扫码都一样 */
  async scan(openID: string, sceneStr: string) {
    this.logger.log(`处理普通扫码 - OpenID: ${openID}, SceneStr: ${sceneStr}`);
    try {
      // 检查 sceneStr 是否有效
      if (!this.sceneStrMap[sceneStr]) {
        this.logger.error(`非法参数: 未找到的 sceneStr ${sceneStr}`);
        throw new HttpException('非法参数', HttpStatus.BAD_REQUEST);
      }

      // 获取用户信息
      const user = await this.userService.getUserFromOpenId(openID, sceneStr);

      this.logger.log(
        `User found: ${user ? user.id : 'No user found'}`,
        'OfficialService'
      );

      // 记录扫描事件
      this.scanedSceneStrMap[sceneStr] = user.id;
      this.logger.log(`已将扫码信息保存到scanedSceneStrMap, 当前map大小: ${Object.keys(this.scanedSceneStrMap).length}`);
    } catch (error) {
      // 捕获并处理错误
      this.logger.error('Error in scan method:', error.message);
      this.logger.error('Stack trace:', error.stack);
      throw new HttpException(
        '处理扫码事件时发生错误',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /* 轮询扫码登录响应 */
  async loginBySceneStr(req, body) {
    const { sceneStr } = body;
    
    // 检查场景字符串是否有效
    if (!this.sceneStrMap[sceneStr]) return;
    
    // 获取用户ID
    const userId = this.scanedSceneStrMap[sceneStr];
    if (!userId) return '';
    
    // 记录最后查询时间和结果的缓存，避免频繁查询数据库
    if (!this.loginResultCache) {
      this.loginResultCache = {};
    }
    
    // 如果已存在缓存且未过期（30秒内），直接返回缓存的结果
    const cacheKey = `${sceneStr}_${userId}`;
    const now = Date.now();
    if (this.loginResultCache[cacheKey] && now - this.loginResultCache[cacheKey].timestamp < 30000) {
      return this.loginResultCache[cacheKey].result;
    }
    
    // 缓存不存在或已过期，查询数据库
    this.logger.log(`查询用户信息 - 用户ID: ${userId}, SceneStr: ${sceneStr}`);
    const user = await this.userService.getUserById(userId);
    
    // 成功获取用户信息后，清除扫码记录，防止重复登录
    delete this.scanedSceneStrMap[sceneStr];
    
    // 生成登录信息
    const result = await this.authService.loginByOpenId(user, req);
    
    // 缓存查询结果
    this.loginResultCache[cacheKey] = {
      timestamp: now,
      result: result
    };
    
    // 设置缓存过期清理（30秒后自动删除）
    setTimeout(() => {
      delete this.loginResultCache[cacheKey];
    }, 30000);
    
    return result;
  }

  /* 扫码事件 绑定微信 */
  async scanBindWx(openId: string, sceneStr) {
    this.logger.log(`处理绑定微信扫码 - OpenID: ${openId}, SceneStr: ${sceneStr}`);
    try {
      if (!this.sceneStrMap[sceneStr])
        throw new HttpException('非法参数', HttpStatus.BAD_REQUEST);
      const userId = sceneStr.split('/')[1];
      const bindRes = await this.userService.bindWx(openId, userId);
      this.scanedSceneStrMap[sceneStr] = bindRes;
      this.logger.log(`已将绑定状态保存到scanedSceneStrMap, 当前map大小: ${Object.keys(this.scanedSceneStrMap).length}`);
    } catch (error) {
      this.logger.error(`处理绑定微信扫码时出错: ${error.message}`, error.stack);
    }
  }

  /* 轮询绑定结果 */
  async bindWxBySceneStr(req, sceneStr: string) {
    if (!this.sceneStrMap[sceneStr])
      throw new HttpException('非法参数', HttpStatus.BAD_REQUEST);
    const { id } = req.user;
    const res = this.scanedSceneStrMap[sceneStr];
    if (!res) return '';
    delete this.scanedSceneStrMap[sceneStr];
    return res;
  }

  async verify(signature: string, nonce: string, timestamp: string) {
    this.logger.log(`验证微信签名 - signature: ${signature}, nonce: ${nonce}, timestamp: ${timestamp}`);
    try {
      const token = await this.globalConfigService.getConfigs(['wechatOfficialToken']);
      
      if (!token) {
        this.logger.warn('未找到wechatOfficialToken配置');
        return false;
      }
      
      this.logger.log(`获取到token: ${token.substring(0, 2)}...${token.slice(-2)}`);
      
      // 构建验证字符串
      const str = [token, nonce, timestamp].sort().join('');
      this.logger.log(`排序后的字符串: ${str.substring(0, 10)}...`);
      
      // 计算签名
      const calculatedSignature = await this.sha1(str);
      this.logger.log(`计算的签名: ${calculatedSignature}`);
      
      const isValid = calculatedSignature === signature;
      this.logger.log(`签名验证结果: ${isValid ? '有效' : '无效'}`);
      
      return isValid;
    } catch (error) {
      this.logger.error(`验证签名时出错: ${error.message}`, error.stack);
      return false;
    }
  }

  sha1(data: string) {
    this.logger.debug(`计算SHA1哈希值 - 数据长度: ${data.length}`);
    return crypto.createHash('sha1').update(data).digest('hex');
  }

  async genXmlMsgByConfig(xmlData, msgKey) {
    this.logger.log(`生成XML消息，使用配置键: ${msgKey}`);
    try {
      const msg = await this.globalConfigService.getConfigs([msgKey]);
      this.logger.log(`获取到消息配置: ${msgKey} = ${msg ? (msg.length > 30 ? msg.substring(0, 30) + '...' : msg) : '未找到'}`);
      return this.genXmlMsg(xmlData, msg);
    } catch (error) {
      this.logger.error(`生成XML消息配置时出错: ${error.message}`, error.stack);
      return this.genXmlMsg(xmlData, '系统繁忙，请稍后再试');
    }
  }

  async genXmlMsg(xmlData, msg) {
    this.logger.log(`生成回复XML消息 - 目标用户: ${xmlData.fromusername ? xmlData.fromusername[0] : '未知'}`);
    
    const xmlTemplate = `
    <xml>
        <ToUserName><![CDATA[${xmlData.fromusername[0]}]]></ToUserName>
        <FromUserName><![CDATA[${xmlData.tousername[0]}]]></FromUserName>
        <CreateTime>${new Date().getTime()}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[${msg}]]></Content>
    </xml>`;
    
    this.logger.debug(`生成的XML消息: ${xmlTemplate.length > 100 ? xmlTemplate.substring(0, 100) + '...' : xmlTemplate}`);
    return xmlTemplate;
  }

  async aotoPlay(msg) {
    this.logger.log(`处理自动回复请求 - 消息内容: ${msg}`);
    
    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        this.logger.warn('自动回复请求超时');
        reject(new Error('请求超时'));
      }, 4800);
    });
    
    try {
      // 获取配置的自动回复文本
      this.logger.log('获取officialAutoReplyText配置');
      const configValue = await this.globalConfigService.getConfigs(['officialAutoReplyText']);
      
      if (!configValue) {
        this.logger.warn('未找到officialAutoReplyText配置，使用默认回复文本');
      }
      
      let question = configValue || 
        '由于公众号的回复限制、过长的问题我们可能无法回复、您可以前往我们的官方站点享受更加完善的服务、如果您有更多问题、欢迎像我提问！';
      
      this.logger.log(`返回自动回复: ${question.length > 30 ? question.substring(0, 30) + '...' : question}`);
      
      // 注释掉的代码，保留但添加日志说明
      /*
      // 这里是原来可能调用外部API的代码
      this.logger.log('来自公众号的询问问题 =======> ', msg);
      // const response = await Promise.race([this.chatgptService.chatSyncFree(msg), timeoutPromise]);
      // question = await this.autoreplyService.checkAutoReply(msg);
      */
      
      return question;
    } catch (error) {
      this.logger.error(`自动回复处理出错: ${error.message}`, error.stack);
      return '系统繁忙，请稍后再试';
    }
  }
}
