import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { URL } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { ImageUrlMappingEntity } from './ai_api.entity';

@Injectable()
export class ImageUploadService {
  private readonly logger = new Logger(ImageUploadService.name);
  private readonly superbedToken = '9ae5bd6bfd964c45893cd7e45561da26';
  private readonly superbedApiUrl = 'https://api.superbed.cc/upload';

  constructor(
    @InjectRepository(ImageUrlMappingEntity)
    private readonly imageUrlMappingRepository: Repository<ImageUrlMappingEntity>
  ) {
    this.logger.log('ImageUploadService 初始化');
  }

  /**
   * 清理URL，移除查询参数并确保不会过长
   * @param url 需要清理的URL
   * @returns 清理后的URL
   */
  private cleanUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      // 只保留协议、主机名和路径部分
      let cleanedUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`;
      
      // 如果路径非常长，可能需要进一步截断
      if (cleanedUrl.length > 1000) {
        const urlHash = require('crypto').createHash('md5').update(cleanedUrl).digest('hex');
        this.logger.warn(`URL过长(${cleanedUrl.length}字符)，使用哈希值替代: ${urlHash}`);
        
        // 保留域名和哈希值组合
        cleanedUrl = `${parsedUrl.protocol}//${parsedUrl.host}/hash_${urlHash}`;
      }
      
      return cleanedUrl;
    } catch (error) {
      this.logger.error(`清理URL时出错: ${error.message}`);
      
      // 如果无法解析，但仍然过长，则使用哈希值
      if (url.length > 1000) {
        const urlHash = require('crypto').createHash('md5').update(url).digest('hex');
        this.logger.warn(`无法解析的URL过长(${url.length}字符)，使用哈希值替代: ${urlHash}`);
        return `hash_${urlHash}`;
      }
      
      return url; // 如果解析失败，返回原始URL
    }
  }

  /**
   * 通过URL映射获取已上传的图片URL
   * @param url 原始URL
   * @returns 已上传的URL或null
   */
  public async getImageUrlMapping(url: string): Promise<string | null> {
    try {
      const cleanedUrl = this.cleanUrl(url);
      const mapping = await this.imageUrlMappingRepository.findOne({
        where: { cleanedUrl }
      });
      
      return mapping ? mapping.uploadedUrl : null;
    } catch (error) {
      this.logger.error(`获取URL映射时出错: ${error.message}`);
      return null;
    }
  }

  /**
   * 添加URL映射
   * @param originalUrl 原始URL
   * @param uploadedUrl 上传后的URL
   */
  private async addImageUrlMapping(originalUrl: string, uploadedUrl: string): Promise<void> {
    try {
      const cleanedUrl = this.cleanUrl(originalUrl);
      
      // 检查是否已经存在
      const existingMapping = await this.imageUrlMappingRepository.findOne({
        where: { cleanedUrl }
      });
      
      if (existingMapping) {
        // 更新现有映射
        existingMapping.uploadedUrl = uploadedUrl;
        existingMapping.updatedAt = new Date();
        await this.imageUrlMappingRepository.save(existingMapping);
        this.logger.log(`更新URL映射: ${cleanedUrl} -> ${uploadedUrl}`);
      } else {
        // 创建新映射
        const mapping = new ImageUrlMappingEntity();
        mapping.cleanedUrl = cleanedUrl;
        mapping.uploadedUrl = uploadedUrl;
        mapping.mappingCreatedAt = new Date();
        mapping.createdAt = new Date();
        mapping.updatedAt = new Date();
        
        await this.imageUrlMappingRepository.save(mapping);
        this.logger.log(`添加URL映射: ${cleanedUrl} -> ${uploadedUrl}`);
      }
    } catch (error) {
      this.logger.error(`保存URL映射时出错: ${error.message}`);
    }
  }

  /**
   * 下载图片到本地
   * @param url 图片URL
   * @returns 保存的本地文件路径或null
   */
  private async downloadImage(url: string): Promise<string | null> {
    try {
      // 创建临时文件路径
      const tempDir = path.join(os.tmpdir(), 'xhs_aiweb_images');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const fileExt = path.extname(url) || '.jpg';
      const fileName = `${uuidv4()}${fileExt}`;
      const savePath = path.join(tempDir, fileName);

      // 下载图片
      this.logger.log(`开始下载图片: ${url}`);
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      
      // 保存图片
      fs.writeFileSync(savePath, response.data);
      this.logger.log(`图片已保存到: ${savePath}`);
      
      return savePath;
    } catch (error) {
      this.logger.error(`下载图片失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 通过URL上传图片到超级图床
   * @param imageUrl 图片URL
   * @returns 上传结果
   */
  public async uploadImageFromUrl(imageUrl: string): Promise<{ original_url: string } | null> {
    try {
      // 验证URL格式
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        this.logger.error(`错误: 无效的URL格式: ${imageUrl}`);
        return { original_url: imageUrl }; // 返回原始URL作为容错
      }

      // 检查URL映射
      const cleanedUrl = this.cleanUrl(imageUrl);
      const existingUrl = await this.getImageUrlMapping(cleanedUrl);
      if (existingUrl) {
        this.logger.log(`找到已存在的图片URL映射: ${cleanedUrl} -> ${existingUrl}`);
        return { original_url: existingUrl };
      }

      this.logger.log(`开始上传图片URL: ${imageUrl}`);

      // 使用FormData对象
      const formData = new FormData();
      formData.append('token', this.superbedToken);
      formData.append('src', imageUrl);

      try {
        // 发送请求
        const response = await axios.post(this.superbedApiUrl, {
          token: this.superbedToken,
          src: imageUrl
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000 // 设置15秒超时
        });

        this.logger.log(`响应状态码: ${response.status}`);
        this.logger.log(`响应内容: ${JSON.stringify(response.data)}`);

        if (response.status === 200) {
          const result = response.data;
          
          // 处理API返回错误的情况
          if (result.err === 1) {
            this.logger.warn(`超级图床API错误: ${result.msg}`);
            this.logger.log('尝试下载图片到本地后再上传');
            
            // 下载图片到本地
            const localFilePath = await this.downloadImage(imageUrl);
            
            if (localFilePath) {
              // 上传本地文件
              const localUploadResult = await this.uploadLocalFile(localFilePath);
              if (localUploadResult && localUploadResult.original_url) {
                this.logger.log(`本地文件上传成功，新URL: ${localUploadResult.original_url}`);
                return localUploadResult;
              }
            }
            
            this.logger.error('本地下载和上传失败，使用原始URL');
            return { original_url: imageUrl };
          }
          
          // 获取图片URL
          const newImageUrl = result.url;

          if (newImageUrl) {
            this.logger.log(`上传成功，图片URL: ${newImageUrl}`);
            // 保存URL映射关系
            await this.addImageUrlMapping(cleanedUrl, newImageUrl);
            return { original_url: newImageUrl };
          } else {
            this.logger.error('上传成功但未返回URL信息，使用原始URL');
            return { original_url: imageUrl };
          }
        } else {
          this.logger.error(`上传失败: ${JSON.stringify(response.data)}，使用原始URL`);
          return { original_url: imageUrl };
        }
      } catch (requestError) {
        this.logger.error(`图床请求失败: ${requestError.message}，尝试下载到本地后上传`);
        
        // 下载图片到本地
        const localFilePath = await this.downloadImage(imageUrl);
        
        if (localFilePath) {
          // 上传本地文件
          const localUploadResult = await this.uploadLocalFile(localFilePath);
          if (localUploadResult && localUploadResult.original_url) {
            this.logger.log(`本地文件上传成功，新URL: ${localUploadResult.original_url}`);
            return localUploadResult;
          }
        }
        
        this.logger.error('本地下载和上传失败，使用原始URL');
        return { original_url: imageUrl };
      }
    } catch (error) {
      this.logger.error(`上传过程中发生错误: ${error.message}，使用原始URL`);
      return { original_url: imageUrl };
    }
  }

  /**
   * 上传本地图片到超级图床
   * @param filePath 图片文件路径
   * @returns 上传结果
   */
  private async uploadLocalFile(filePath: string): Promise<{ original_url: string } | null> {
    try {
      // 检查文件是否存在
      this.logger.log(`[DEBUG] 待上传文件路径: ${filePath}`);
      this.logger.log(`[DEBUG] 文件是否存在: ${fs.existsSync(filePath)}`);
      if (!fs.existsSync(filePath)) {
        this.logger.error(`错误: 文件不存在: ${filePath}`);
        return null;
      }

      // 检查文件大小
      const fileSize = fs.statSync(filePath).size;
      this.logger.log(`[DEBUG] 文件大小: ${fileSize}`);
      if (fileSize === 0) {
        this.logger.error('错误: 文件大小为0');
        return null;
      }

      this.logger.log(`开始上传图片: ${filePath}`);
      this.logger.log(`文件大小: ${fileSize} 字节`);

      // 读取文件
      const fileData = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      this.logger.log(`[DEBUG] 读取文件完成，文件名: ${fileName}`);
      
      // 创建表单数据
      const formData = new FormData();
      formData.append('token', this.superbedToken);
      this.logger.log(`[DEBUG] formData 添加 token: ${this.superbedToken}`);
      
      // 创建Blob并添加到表单
      const blob = new Blob([fileData]);
      formData.append('file', blob, fileName);
      this.logger.log(`[DEBUG] formData 添加 file: ${fileName}`);

      // 发送请求
      this.logger.log(`[DEBUG] 即将向 ${this.superbedApiUrl} 发送 axios 请求...`);
      const response = await axios.post(this.superbedApiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      this.logger.log(`响应状态码: ${response.status}`);
      this.logger.debug(`响应内容: ${JSON.stringify(response.data)}`);

      if (response.status === 200) {
        const result = response.data;
        // 兼容多种返回结构
        let imageUrl = result.url || (result.data && result.data.url) || (Array.isArray(result.data) && result.data[0] && result.data[0].url);
        this.logger.log(`[DEBUG] 提取到 imageUrl: ${imageUrl}`);
        this.logger.log('[DEBUG] superbed完整响应内容: ' + JSON.stringify(result));

        // 只接受 http(s) 开头的外链
        if (imageUrl && /^https?:\/\//.test(imageUrl)) {
          this.logger.log(`上传成功，图片URL: ${imageUrl}`);
          // 添加URL映射关系
          await this.addImageUrlMapping(filePath, imageUrl);
          return { original_url: imageUrl };
        } else {
          this.logger.error('上传成功但未返回有效的super图床外链！');
          this.logger.error('完整响应内容: ' + JSON.stringify(result));
          return null;
        }
      } else {
        this.logger.error(`上传失败: ${JSON.stringify(response.data)}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`上传过程中发生错误: ${error.message}`);
      return null;
    } finally {
      // 删除临时文件
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          this.logger.log(`临时文件已删除: ${filePath}`);
        }
      } catch (error) {
        this.logger.warn(`删除临时文件失败: ${error.message}`);
      }
    }
  }

  /**
   * 上传图片到超级图床，支持本地文件路径或URL
   * @param imagePathOrUrl 图片路径或URL
   * @returns 上传结果
   */
  public async uploadToPicgo(imagePathOrUrl: string): Promise<{ original_url: string } | null> {
    try {
      // 判断输入是URL还是本地文件路径
      if (imagePathOrUrl.startsWith('http://') || imagePathOrUrl.startsWith('https://')) {
        // 清理URL并检查是否已经存在于映射表中
        const cleanedUrl = this.cleanUrl(imagePathOrUrl);
        const originalUrl = await this.getImageUrlMapping(cleanedUrl);
        if (originalUrl) {
          this.logger.log(`找到已存在的图片URL映射: ${cleanedUrl} -> ${originalUrl}`);
          return { original_url: originalUrl };
        }
        return this.uploadImageFromUrl(imagePathOrUrl);
      }

      // 处理本地文件上传
      return this.uploadLocalFile(imagePathOrUrl);
    } catch (error) {
      this.logger.error(`上传过程中发生错误: ${error.message}`);
      return null;
    }
  }

  /**
   * 上传图片到超级图床，支持本地文件路径或URL (uploadToPicgo的别名)
   * @param imagePathOrUrl 图片路径或URL
   * @returns 上传结果
   */
  public async uploadToSuperbed(imagePathOrUrl: string): Promise<{ url: string } | null> {
    try {
      const result = await this.uploadToPicgo(imagePathOrUrl);
      if (result && result.original_url) {
        return { url: result.original_url };
      }
      return null;
    } catch (error) {
      this.logger.error(`上传到超级图床失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 通过URL上传图片到指定目录
   * @param options 上传选项
   * @returns 上传结果
   */
  public async uploadFileFromUrl(options: { url: string; dir?: string }): Promise<{ url: string } | null> {
    try {
      const result = await this.uploadImageFromUrl(options.url);
      if (result) {
        return { url: result.original_url };
      }
      return null;
    } catch (error) {
      this.logger.error(`通过URL上传文件失败: ${error.message}`);
      return null;
    }
  }
  
  /**
   * 通过Buffer上传图片到图床
   * @param file 包含buffer和mimetype的文件对象
   * @param dir 可选的目录名称(仅用于日志记录，不影响上传)
   * @returns 上传后的URL字符串
   */
  public async uploadFile(file: { buffer: Buffer, mimetype: string }, dir?: string): Promise<string | null> {
    try {
      const dirInfo = dir ? `(目录: ${dir})` : '';
      this.logger.log(`开始从Buffer上传图片${dirInfo}`);
      
      // 创建临时文件用于上传
      const tempDir = path.join(os.tmpdir(), 'xhs_aiweb_images');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // 根据mimetype确定扩展名
      let fileExt = '.jpg'; // 默认扩展名
      if (file.mimetype) {
        if (file.mimetype.includes('png')) {
          fileExt = '.png';
        } else if (file.mimetype.includes('jpeg') || file.mimetype.includes('jpg')) {
          fileExt = '.jpg';
        } else if (file.mimetype.includes('gif')) {
          fileExt = '.gif';
        } else if (file.mimetype.includes('webp')) {
          fileExt = '.webp';
        }
      }
      
      // 创建带有扩展名的临时文件路径
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = path.join(tempDir, fileName);
      
      // 写入临时文件
      fs.writeFileSync(filePath, file.buffer);
      this.logger.log(`临时文件已保存: ${filePath}`);
      
      // 上传文件
      const result = await this.uploadLocalFile(filePath);
      
      if (result && result.original_url) {
        this.logger.log(`Buffer上传成功: ${result.original_url}`);
        return result.original_url;
      } else {
        this.logger.error('Buffer上传失败');
        return null;
      }
    } catch (error) {
      this.logger.error(`Buffer上传过程中发生错误: ${error.message}`);
      return null;
    }
  }
} 