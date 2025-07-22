import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { RedisCacheService } from '../redisCache/redisCache.service';
import { v4 as uuidv4 } from 'uuid';
import { UploadService } from '../upload/upload.service';
import { AiImageTaskEntity, AiGeneratedImageEntity } from './ai_api.entity';
import { ImageUploadService } from './image-upload.service';
import { PromptTemplateEntity } from '../promptlib/promptlib.entity';
import { BackupModelsService } from '../models/backup-models.service';
import { exec } from 'child_process';
import { ApiRequestOptionsDto } from './dto/ai_api.dto';
import { OpenAIChatService } from './openaiChat.service';
import { GlobalConfigService } from '../globalConfig/globalConfig.service';
import { AppEntity } from '../app/app.entity';

// AI生成内容的配置接口
export interface AIGenerationConfig {
  appName: string;
  prompt: string;
  defaultSystemPrompt?: string;
  defaultModel?: string;
  defaultTemperature?: number;
  chatId?: string;
  timeout?: number;
}

interface MessageContent {
  type: string;
  text?: string;
  image_url?: {
    url: string;
  };
}

@Injectable()
export class AiApiService {
  private readonly logger = new Logger(AiApiService.name);
  private readonly MAX_CONCURRENT_REQUESTS = 3;
  private activeRequests = 0;

  constructor(
    private readonly redisCacheService: RedisCacheService,
    private readonly uploadService: UploadService,
    private readonly imageUploadService: ImageUploadService,
    @InjectRepository(AiImageTaskEntity)
    private readonly taskRepository: Repository<AiImageTaskEntity>,
    @InjectRepository(AiGeneratedImageEntity)
    private readonly imageRepository: Repository<AiGeneratedImageEntity>,
    @InjectRepository(PromptTemplateEntity)
    private readonly promptTemplateRepository: Repository<PromptTemplateEntity>,
    private readonly backupModelsService: BackupModelsService,
    private readonly openAIChatService: OpenAIChatService,
    private readonly globalConfigService: GlobalConfigService,
    @InjectRepository(AppEntity)
    private readonly appEntity: Repository<AppEntity>
  ) {
    this.logger.log('AiApiService initialized');
  }

  /**
   * 通用的AI内容生成方法
   * @param config AI生成配置
   * @returns 生成的内容
   */
  async generateAIContent(config: AIGenerationConfig): Promise<string> {
    try {
      const {
        appName,
        prompt,
        defaultSystemPrompt = "你是一名专业的分析师，擅长分析各类数据和信息。请基于提供的数据进行分析，回答要专业、详细、有洞察力。",
        defaultModel = "gpt-3.5-turbo",
        defaultTemperature = 0.7,
        chatId = `ai-generation-${Date.now()}`,
        timeout = 600000 // 默认10分钟超时
      } = config;
      
      // 获取应用配置
      let systemPrompt = defaultSystemPrompt;
      let modelName = defaultModel;
      let temperature = defaultTemperature;
      
      try {
        // 查询当前应用的配置，从app表中获取
        const appConfig = await this.appEntity.findOne({
          where: { name: appName }
        });
        
        if (appConfig) {
          // 从应用配置获取模型和提示词
          modelName = appConfig.appModel || defaultModel;
          systemPrompt = appConfig.preset || defaultSystemPrompt;
          
          this.logger.log(`使用模型${modelName}生成内容，使用应用配置`);
        } else {
          this.logger.warn(`未找到应用配置: ${appName}，使用默认值`);
        }
      } catch (error) {
        this.logger.error(`获取模型配置失败: ${error.message}`);
      }
      
      // 获取OpenAI配置
      const { 
        openaiBaseUrl = '', 
        openaiBaseKey = '' 
      } = await this.globalConfigService.getConfigs([
        'openaiBaseKey',
        'openaiBaseUrl'
      ]);
      
      // 创建消息历史
      const messagesHistory = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ];
      
      // 创建中止控制器
      const abortController = new AbortController();
      
      // 使用OpenAI服务生成内容
      const result = await this.openAIChatService.openAIChat(messagesHistory, {
        chatId: chatId,
        apiKey: openaiBaseKey,
        model: modelName,
        modelName: modelName,
        temperature: temperature,
        isFileUpload: 0,
        timeout: timeout,
        proxyUrl: openaiBaseUrl,
        abortController: abortController
      });
      
      if (result && result.answer) {
        this.logger.log(`AI生成内容成功: 长度=${result.answer.length}`);
        return result.answer;
      } else {
        this.logger.warn(`AI未返回有效内容`);
        return null;
      }
    } catch (error) {
      this.logger.error(`生成AI内容出错: ${error.message}`);
      throw error;
    }
  }

  /**
   * 创建新的图片生成任务
   * @param prompt 提示词
   * @param imageUrls 图片URL数组
   * @param apiConfig 可选的API配置
   * @returns 任务ID
   */
  async createImageTask(prompt: string, imageUrls: string[] = [], apiConfig?: any): Promise<string> {
    // 创建任务ID
    const taskId = uuidv4();
    this.logger.log(`创建新任务: ${taskId}, 提示词长度: ${prompt.length}`);
    
    try {
      // 创建任务记录
      const task = new AiImageTaskEntity();
      task.taskId = taskId;
      task.status = 'pending';
      task.prompt = prompt;
      task.imageUrl = imageUrls.join(','); // 将多个URL合并为字符串存储
      task.createdAt = new Date();
      task.updatedAt = new Date();
      
      // 如果apiConfig包含presetValues，保存到任务中
      if (apiConfig && apiConfig.presetValues) {
        task.presetValues = apiConfig.presetValues;
        this.logger.log(`为任务 ${taskId} 保存预设值，长度: ${apiConfig.presetValues.length}`);
      }
      
      // 保存任务到数据库
      await this.taskRepository.save(task);
      this.logger.log(`任务记录已保存到数据库: ${taskId}`);
      
      // 如果用户传入了图片链接，记录到图片表
      if (imageUrls && imageUrls.length > 0) {
        for (const imageUrl of imageUrls) {
          try {
            // 检查图片是否已存在
            const existingImage = await this.imageRepository.findOne({
              where: { 
                imageUrl: imageUrl,
                source: 'user'
              }
            });
            
            if (existingImage) {
              this.logger.log(`用户提供的图片已存在于数据库中: ${imageUrl}，跳过保存`);
              continue;
            }
            
            // 创建用户提供的图片记录
            const image = new AiGeneratedImageEntity();
            image.taskId = taskId;  // 直接设置taskId
            image.imageUrl = imageUrl;
            image.source = 'user';
            image.imageType = 'original';
            image.timestamp = new Date();
            
            // 保存图片记录
            await this.imageRepository.save(image);
            this.logger.log(`用户提供图片已保存: ${imageUrl}`);
          } catch (error) {
            this.logger.error(`保存用户提供图片失败: ${error.message}`);
          }
        }
      }
      
      // 启动异步处理
      this.processTask(taskId, prompt, imageUrls, apiConfig);
      
      return taskId;
    } catch (error) {
      this.logger.error(`创建任务失败: ${error.message}`, error.stack);
      throw new Error(`创建任务失败: ${error.message}`);
    }
  }

  /**
   * 获取任务结果
   * @param taskId 任务ID
   * @param timeout 超时时间（秒）
   * @returns 任务结果
   */
  async getTaskResult(taskId: string, timeout: number = 10): Promise<any> {
    this.logger.log(`获取任务结果: taskId=${taskId}, timeout=${timeout}秒`);
    
    // 从数据库获取任务信息
    let task = await this.taskRepository.findOne({ 
      where: { taskId }
    });
    
    if (!task) {
      this.logger.warn(`任务不存在: ${taskId}`);
      return {
        success: false,
        error: '任务不存在',
        status: 'false'
      };
    }
    
    this.logger.debug(`找到任务记录: id=${task.id}, status=${task.status}`);
    
    // 如果任务未完成，等待一段时间
    if (task.status !== 'completed' && task.status !== 'failed') {
      this.logger.log(`任务 ${taskId} 未完成，等待${timeout}秒...`);
      await this.sleep(timeout * 1000);
      
      // 重新获取任务状态
      task = await this.taskRepository.findOne({ 
        where: { taskId }
      });
      this.logger.debug(`等待后任务状态: ${task?.status || '未知'}`);
    }
    
    // 构建基本结果
    const result = {
      success: task.status === 'completed',
      task_id: taskId,
      status: task.status,
      progress_message: task.progressMessage || ''
    };
    
    this.logger.debug(`构建结果响应: status=${task.status}`);
    
    if (task.status === 'failed') {
      result['error'] = task.errorMessage || '未知错误';
      this.logger.warn(`任务失败: ${task.errorMessage || '未知错误'}`);
    } else if (task.status === 'completed') {
      // 获取生成的图片URL
      result['image_urls'] = task.imageUrls || '';
      result['full_response'] = task.fullResponse || '';
      
      // 直接查询关联图片
      const images = await this.imageRepository.find({ where: { taskId, source: 'generated' } });
      if (images && images.length > 0) {
        this.logger.log(`任务完成: 生成图片数量=${images.length}`);
        
        // 如果需要，可以添加详细的图片信息
        result['images'] = images.map(img => ({
          url: img.imageUrl,
          width: img.width,
          height: img.height,
          format: img.format,
          process_time: img.processTime
        }));
      } else {
        this.logger.log(`任务完成: 生成图片数量=${task.imageUrls ? task.imageUrls.split(',').length : 0}`);
      }
    }
    
    this.logger.log(`返回任务结果: taskId=${taskId}, status=${result.status}, success=${result.success}`);
    return result;
  }

  /**
   * 异步处理任务
   * @param taskId 任务ID
   * @param prompt 提示词
   * @param imageUrls 图片URL数组
   * @param apiConfig 可选的API配置
   */
  private async processTask(taskId: string, prompt: string, imageUrls: string[] = [], apiConfig?: any): Promise<void> {
    this.logger.log(`开始处理任务 ${taskId}`);
    const startTime = new Date().getTime();
    
    // 定义超时相关变量在函数顶部
    let timeoutHandler: NodeJS.Timeout | null = null;
    let isTimedOut = false;
    
    try {
      // 更新任务状态为处理中，进度为0%
      await this.updateTaskStatus(
        taskId,
        'processing',
        undefined,
        undefined,
        ' 0%',
        '任务开始处理...'
      );
      
      // 获取任务记录，获取presetValues
      const taskEntity = await this.taskRepository.findOne({ where: { taskId } });
      let presetValues: string | undefined;
      
      if (taskEntity && taskEntity.presetValues) {
        presetValues = taskEntity.presetValues;
        this.logger.log(`从任务记录中获取预设值，长度: ${presetValues.length}`);
      } else if (apiConfig && apiConfig.presetValues) {
        // 如果任务没有预设值，但apiConfig中有
        presetValues = apiConfig.presetValues;
        this.logger.log(`从apiConfig中获取预设值，长度: ${presetValues.length}`);
      }
      
      // 添加一个超时检查，当处理时间超过5分钟时终止处理
      const timeoutPromise = new Promise<void>((resolve, reject) => {
        timeoutHandler = setTimeout(async () => {
          isTimedOut = true;
          const elapsedTimeMinutes = (new Date().getTime() - startTime) / (1000 * 60);
          this.logger.warn(`任务 ${taskId} 处理超时 (已执行${elapsedTimeMinutes.toFixed(1)}分钟)，设置为失败状态`);
          await this.updateTaskStatus(
            taskId, 
            'failed', 
            '处理超时，已执行超过10分钟',
            undefined
          );
          reject(new Error('处理超时，已执行超过20分钟'));
        }, 20 * 60 * 1000); // 20分钟超时
      });
      
      // 处理用户提供的图片URL
      let processedImageUrls: string[] = [];
      
      // 包装所有处理逻辑为一个Promise
      const processingPromise = (async () => {
        try {
          if (imageUrls && imageUrls.length > 0) {
            // 上传图片到图床
            for (const imageUrl of imageUrls) {
              try {
                // 使用ImageUploadService上传到图床
                const uploadResult = await this.imageUploadService.uploadToPicgo(imageUrl);
                
                if (uploadResult && uploadResult.original_url) {
                  processedImageUrls.push(uploadResult.original_url);
                  this.logger.log(`图片上传成功: ${imageUrl} -> ${uploadResult.original_url}`);
                } else {
                  // 如果上传失败，使用原始URL
                  processedImageUrls.push(imageUrl);
                  this.logger.warn(`图片上传失败，使用原始URL: ${imageUrl}`);
                }
              } catch (error) {
                // 上传失败，继续使用原始URL
                processedImageUrls.push(imageUrl);
                this.logger.error(`图片上传错误: ${error.message}`);
              }
            }

            // 检查是否已经超时，如果超时则直接返回
            if (isTimedOut) {
              return;
            }
            return;
          }
        } catch (processingError) {
          // 如果处理过程中发生错误，记录日志并重新抛出
          this.logger.error(`任务处理过程中发生错误: ${processingError.message}`);
          throw processingError;
        }
      })();
      
      // 使用Promise.race竞争两个Promise
      try {
        await Promise.race([processingPromise, timeoutPromise]);
      } catch (raceError) {
        // 处理竞争中的错误，通常是超时错误或处理错误
        if (raceError.message === '处理超时，已执行超过10分钟') {
          this.logger.warn(`任务 ${taskId} 因超时而中断`);
          return; // 直接返回，因为状态已在timeoutPromise中更新
        }
        throw raceError; // 重新抛出其他错误
      }
      
      // 直接从备用模型中获取图文类型(image)的模型列表
      let apiConfigs = [];
      try {
        let backupModels = [];
        try {
          // 尝试获取备用模型
          backupModels = await this.backupModelsService.findByType('image');
        } catch (error) {
          // 处理可能的特定字段错误
          if (error.message && error.message.includes('Property "priority" was not found')) {
            this.logger.warn('备用模型实体缺少priority字段，尝试不排序获取');
            // 使用不依赖priority字段的方法
            backupModels = await this.backupModelsService.findByTypeWithoutPriority('image');
          } else {
            // 其他错误直接抛出
            throw error;
          }
        }
        
        if (backupModels && backupModels.length > 0) {
          // 将备用模型转换为API配置格式
          apiConfigs = backupModels.map(model => ({
            apiKey: model.apiKey,
            baseUrl: model.baseUrl,
            model: model.model || "gpt-4o-image", // 使用备用模型中指定的model字段值，若没有则使用默认值
            requestMethod: model.requestMethod || "stream", // 使用备用模型中指定的请求方式，若没有则使用默认值
            requestType: model.requestType || "image" // 使用备用模型中指定的请求类型，若没有则使用默认值
          }));
          this.logger.log(`从备用模型库获取到${apiConfigs.length}个图文模型配置，将全部用于重试`);
        } else {
          this.logger.warn('未找到图文类型的备用模型，将使用默认配置');
        }
      } catch (configError) {
        this.logger.error(`获取备用模型失败: ${configError.message}，将使用默认配置`);
      }
      
      // 存储API生成的图片URL和上传后的URL
      let apiGeneratedUrls: string[] = [];
      let uploadedImages: Array<{original_url: string, source_url: string}> = [];
      let fullResponse: string = '';
      
      // 设置最大重试次数和重试间隔
      const MAX_RETRY_COUNT = apiConfigs.length; // 根据获取到的模型数量设置重试次数
      const RETRY_DELAY = 60000; // 1分钟
      let retryCount = 0;
      let apiRequestSuccess = false;
      
      // 记录每次尝试的错误信息
      const errorMessages = [];
      
      // 尝试请求API，失败后重试
      while (retryCount < MAX_RETRY_COUNT && !apiRequestSuccess) {
        // 如果是重试，添加日志并更新任务状态
        if (retryCount > 0) {
          this.logger.log(`第 ${retryCount} 次重试任务 ${taskId}，等待 ${RETRY_DELAY / 1000} 秒后重试...`);
          await this.updateTaskStatus(
            taskId,
            'processing',
            undefined,
            undefined,
            ` 0%`,
            `第 ${retryCount} 次重试任务...`
          );
          
          // 等待重试间隔
          await this.sleep(RETRY_DELAY);
        }
        
        // 选择当前重试次数对应的API配置
        const config = apiConfigs[retryCount % apiConfigs.length];
        
        this.logger.log(`[尝试 ${retryCount + 1}/${MAX_RETRY_COUNT}] 使用API配置: ${config.baseUrl}, 模型: ${config.model}`);
        
        try {
          // 使用独立的API请求方法发送请求
          const response = await this.sendApiRequest({
            prompt: prompt,
            baseUrl: config.baseUrl,
            apiKey: config.apiKey,
            model: config.model,
            requestMethod: config.requestMethod || 'sync',
            requestType: config.requestType || 'image',
            ratio: "2:3",
            imageUrls: processedImageUrls,
            presetValues: presetValues
          });
          
          // 处理响应
          if (response.data && response.data.choices && response.data.choices.length > 0) {
            const content = response.data.choices[0].message?.content || '';
            fullResponse = content;
            
            // 提取响应中的图片URL
            const imgUrls = content.match(/!\[.*?\]\((.*?)\)/g);
            if (imgUrls) {
              for (const imgUrl of imgUrls) {
                const urlMatch = imgUrl.match(/!\[.*?\]\((.*?)\)/);
                if (urlMatch && urlMatch[1]) {
                  apiGeneratedUrls.push(urlMatch[1]);
                  this.logger.log(`提取到图片链接: ${urlMatch[1]}`);
                }
              }
            }
            
            // 提取"点击这里"格式的下载链接
            const clickHereUrls = content.match(/\[点击这里\]\((.*?)\)/g);
            if (clickHereUrls) {
              for (const clickUrl of clickHereUrls) {
                const urlMatch = clickUrl.match(/\[点击这里\]\((.*?)\)/);
                if (urlMatch && urlMatch[1]) {
                  apiGeneratedUrls.push(urlMatch[1]);
                  this.logger.log(`提取到"点击这里"链接: ${urlMatch[1]}`);
                }
              }
            }
            
            // 提取所有Markdown链接格式 [任意文本](url)
            const markdownLinkUrls = content.match(/\[(.*?)\]\((https?:\/\/.*?)\)/g);
            if (markdownLinkUrls) {
              for (const linkUrl of markdownLinkUrls) {
                const urlMatch = linkUrl.match(/\[(.*?)\]\((https?:\/\/.*?)\)/);
                if (urlMatch && urlMatch[2]) {
                  apiGeneratedUrls.push(urlMatch[2]);
                  this.logger.log(`提取到Markdown链接: [${urlMatch[1]}](${urlMatch[2]})`);
                }
              }
            }
            
            // 检查是否有图片URL
            if (apiGeneratedUrls.length > 0) {
              apiRequestSuccess = true;
              break;
            } else {
              this.logger.warn(`同步响应中未找到图片URL，响应内容: ${content.substring(0, 200)}...`);
            }
          } else {
            this.logger.warn(`响应中没有有效的数据: ${JSON.stringify(response.data)}`);
          }
        } catch (error) {
          this.logger.error(`API请求失败: ${error.message}`);
          
          // 记录错误响应详情（如果存在）
          let errorDetails = `错误信息: ${error.message}`;
          if (error.response) {
            const responseData = error.response.data || '无响应数据';
            const responseStatus = error.response.status;
            const responseStatusText = error.response.statusText;
            
            errorDetails += `，状态码: ${responseStatus} ${responseStatusText}，详情: ${JSON.stringify(responseData)}`;
            this.logger.error(`API错误响应详情: 状态=${responseStatus} ${responseStatusText}, 响应体=${JSON.stringify(responseData)}`);
          }
          
          // 记录此次尝试的错误信息
          errorMessages.push(`[尝试 ${retryCount+1}/${MAX_RETRY_COUNT}] ${config.baseUrl} (${config.model}): ${errorDetails}`);
          
          // 更新任务状态，包含详细的错误信息
          await this.updateTaskStatus(
            taskId,
            'processing',
            errorDetails,
            undefined,
            ` ${retryCount+1}/${MAX_RETRY_COUNT}`,
            `API请求失败 [${config.baseUrl}]，将尝试其他备用模型...`
          );
          
          // 等待短暂时间后继续重试
          await this.sleep(3000);
          
          // 将失败的服务器标记为不可用
          this.markServerAsUnavailable(config.baseUrl);
        }
        
        // 增加重试计数
        retryCount++;
      }
      
      // 更新任务执行时间
      const task = await this.taskRepository.findOne({ where: { taskId } });
      if (task) {
        task.executedAt = new Date();
        await this.taskRepository.save(task);
      }
      
      // 如果达到最大重试次数后仍然失败，标记任务失败
      if (!apiRequestSuccess) {
        this.logger.error(`任务 ${taskId} 在 ${MAX_RETRY_COUNT} 次尝试后生成失败，请重新尝试！`);
        
        // 合并所有错误信息
        const fullErrorMessage = `经过 ${MAX_RETRY_COUNT} 次尝试后生成失败，请重新尝试！\n\n详细错误信息:\n${errorMessages.join('\n')}`;
        
        await this.updateTaskStatus(
          taskId,
          'failed',
          fullErrorMessage,
          fullResponse
        );
        return;
      }
      
      // 去重URL后只保留第一个
      apiGeneratedUrls = [...new Set(apiGeneratedUrls)];
      if (apiGeneratedUrls.length > 0) {
        // 确保只保留第一个URL
        const firstUrl = apiGeneratedUrls[0];
        this.logger.log(`去重后有${apiGeneratedUrls.length}个唯一的图片URL，只使用第一个: ${firstUrl}`);
        apiGeneratedUrls = [firstUrl];
        
        // 将生成的图片保存到数据库并上传到图床
        try {
          // 使用ImageUploadService上传到图床
          let uploadedUrl = firstUrl;
          try {
            // 尝试上传图片，增加超时处理
            const uploadResult = await Promise.race([
              this.imageUploadService.uploadToPicgo(firstUrl),
              new Promise<{ original_url: string }>((resolve) => 
                setTimeout(() => {
                  this.logger.warn(`上传图片超时: ${firstUrl}，将使用原始URL`);
                  resolve({ original_url: firstUrl });
                }, 30000) // 30秒超时
              )
            ]);
            
            if (uploadResult && uploadResult.original_url) {
              uploadedUrl = uploadResult.original_url;
              this.logger.log(`生成图片上传成功: ${firstUrl} -> ${uploadedUrl}`);
            } else {
              // 如果没有返回结果，使用原始URL
              this.logger.warn(`上传没有返回有效结果，使用原始URL: ${firstUrl}`);
            }
          } catch (uploadError) {
            this.logger.error(`生成图片上传失败: ${uploadError.message}`);
            // 即使上传失败，也使用原始URL继续，确保至少有一个URL可用
            this.logger.warn(`将使用原始URL继续处理: ${firstUrl}`);
          }
          
          // 检查是否已存在相同URL的图片记录
          const existingImage = await this.imageRepository.findOne({
            where: { imageUrl: uploadedUrl }
          });
          
          if (existingImage) {
            this.logger.log(`图片URL已存在于数据库中: ${uploadedUrl}，关联到任务 ${existingImage.taskId}`);
            
            // 保存源图片URL（仅当不存在时）
            const existingSourceImage = await this.imageRepository.findOne({
              where: { imageUrl: firstUrl, imageType: 'source' }
            });
            
            if (!existingSourceImage && firstUrl !== uploadedUrl) {
              await this.saveGeneratedImage(taskId, firstUrl, 'generated', 'source');
            }
            
            // 添加到上传图片列表，但使用已存在的记录
            uploadedImages.push({
              original_url: uploadedUrl,
              source_url: firstUrl
            });
          } else {
            // 保存源图片URL
            await this.saveGeneratedImage(taskId, firstUrl, 'generated', 'source');
            
            // 保存处理后图片URL
            await this.saveGeneratedImage(taskId, uploadedUrl, 'generated', 'original');
            
            // 添加到上传图片列表
            uploadedImages.push({
              original_url: uploadedUrl,
              source_url: firstUrl
            });
          }
        } catch (error) {
          this.logger.error(`处理图片时发生错误: ${error.message}`);
          // 添加额外容错，即使处理图片失败，也添加原始URL，确保任务不会因图片处理失败而整体失败
          uploadedImages.push({
            original_url: firstUrl,
            source_url: firstUrl
          });
          this.logger.warn(`尝试使用原始URL继续: ${firstUrl}`);
        }
      } else {
        this.logger.log(`去重后没有图片URL`);
      }
      
      if (uploadedImages.length === 0) {
        // 如果API生成的URL存在，但上传的图片列表为空，则使用原始URL
        if (apiGeneratedUrls.length > 0) {
          const originalUrl = apiGeneratedUrls[0];
          this.logger.warn(`没有成功上传的图片，将使用原始URL: ${originalUrl}`);
          uploadedImages.push({
            original_url: originalUrl,
            source_url: originalUrl
          });
        } else {
          this.logger.error(`任务 ${taskId} 所有图片处理失败`);
          await this.updateTaskStatus(
            taskId,
            'failed',
            '所有图片处理失败',
            fullResponse
          );
          return;
        }
      }
      
      // 保存上传后的图片URL
      const uploadedUrls = uploadedImages.map(img => img.original_url);
      
      // 更新任务状态为完成，进度为100%
      await this.updateTaskStatus(
        taskId,
        'completed',
        undefined,
        fullResponse,
        ' 100%',
        '任务处理完成',
        uploadedUrls.join(',')
      );
      
      this.logger.log(`任务 ${taskId} 处理完成，共生成 ${uploadedImages.length} 张图片`);
      
      // 保存每张生成图片的详细信息
      if (apiGeneratedUrls && apiGeneratedUrls.length > 0) {
        // 先获取任务实体
        const task = await this.taskRepository.findOne({ where: { taskId } });
        
        if (task) {
          const savedImages = [];
          
          for (let i = 0; i < uploadedImages.length; i++) {
            const uploadedImage = uploadedImages[i];
            
            try {
              // 检查图片是否已存在
              const existingImage = await this.imageRepository.findOne({
                where: { 
                  imageUrl: uploadedImage.original_url,
                  imageType: 'original'
                }
              });
              
              if (existingImage) {
                this.logger.log(`图片已存在，跳过保存: ${uploadedImage.original_url}`);
                savedImages.push(existingImage);
              } else {
                const savedImage = await this.saveGeneratedImage(
                  taskId, 
                  uploadedImage.original_url, 
                  'generated', 
                  'original', 
                  new Date().getTime() - startTime
                );
                savedImages.push(savedImage);
                
                this.logger.debug(`保存生成图片信息: index=${i}, url=${uploadedImage.original_url}`);
              }
            } catch (error) {
              this.logger.error(`保存生成图片信息失败: ${error.message}`);
            }
          }
          
          // 不再尝试更新任务的images关系
          // task.images = savedImages;
          // await this.taskRepository.save(task);
        }
      }
      
    } catch (error) {
      this.logger.error(`处理任务失败: ${error.message}`, error.stack);
      
      // 更新任务状态为失败
      await this.updateTaskStatus(
        taskId, 
        'failed', 
        error.message || '处理任务时发生未知错误'
      );
    } finally {
      // 无论处理成功还是失败，都清除超时定时器
      if (timeoutHandler) {
        clearTimeout(timeoutHandler);
      }
    }
  }

  /**
   * 更新任务状态
   * @param taskId 任务ID
   * @param status 状态
   * @param errorMessage 错误信息
   * @param fullResponse 完整响应
   * @param progressMessage 进度信息
   * @param currentContent 当前内容
   * @param imageUrls 图片URL
   */
  private async updateTaskStatus(
    taskId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string,
    fullResponse?: string,
    progressMessage?: string,
    currentContent?: string,
    imageUrls?: string
  ): Promise<void> {
    this.logger.log(`更新任务状态: taskId=${taskId}, status=${status}, progressMessage=${progressMessage || '无'}`);
    
    try {
      // 查找任务记录
      const task = await this.taskRepository.findOne({ where: { taskId } });
      
      if (!task) {
        this.logger.error(`更新状态失败: 找不到任务 ${taskId}`);
        return;
      }
      
      // 更新任务记录
      task.status = status;
      
      if (errorMessage !== undefined) {
        task.errorMessage = errorMessage;
      }
      
      if (fullResponse !== undefined) {
        task.fullResponse = fullResponse;
      }
      
      if (progressMessage !== undefined) {
        task.progressMessage = progressMessage;
      }
      
      if (currentContent !== undefined) {
        task.currentContent = currentContent;
      }
      
      if (imageUrls !== undefined) {
        task.imageUrls = imageUrls;
      }
      
      // 记录执行和完成时间
      if (status === 'processing' && !task.executedAt) {
        task.executedAt = new Date();
      } else if (status === 'completed' || status === 'failed') {
        task.completedAt = new Date();
      }
      
      task.updatedAt = new Date();
      
      // 保存更新
      await this.taskRepository.save(task);
      this.logger.debug(`任务状态已更新: ${taskId}`);
      
    } catch (error) {
      this.logger.error(`更新任务状态失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 等待指定时间
   * @param ms 毫秒
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 处理Prompt模板，替换变量
   * @param template Prompt模板
   * @param variables 变量数组
   * @returns 处理后的Prompt
   */
  private processPromptTemplate(template: string, variables: string[] = []): string {
    let processedPrompt = template;
    
    // 替换{{stringN}}格式的变量
    for (let i = 0; i < variables.length; i++) {
      const placeholder = `{{string${i+1}}}`;
      processedPrompt = processedPrompt.replace(new RegExp(placeholder, 'g'), variables[i]);
    }
    
    // 替换{{content}}格式的变量
    if (variables.length === 1) {
      processedPrompt = processedPrompt.replace(/{{content}}/g, variables[0]);
    }
    
    return processedPrompt;
  }

  /**
   * 根据提示词模板创建图像生成任务
   * @param options 创建任务的选项
   * @returns 任务ID和状态
   */
  async createTemplateTask(options: {
    templateId?: string;
    templateName?: string;
    templateContent?: string;
    variables?: string[];
    imageUrls?: string[];
    modelName?: string;
    apiConfig?: any;
  }): Promise<{ taskId: string; success: boolean; message?: string }> {
    try {
      const { 
        templateId, 
        templateName, 
        templateContent, 
        variables = [], 
        imageUrls = [],
        apiConfig: initialApiConfig
      } = options;
      
      // 使用let声明可变变量
      let { modelName } = options;
      
      this.logger.log(`创建模板任务: ${templateName || templateId || '直接内容'}, 变量数量=${variables.length}, 图片数量=${imageUrls.length}`);
      
      let prompt: string;
      let presetValues: string | undefined;
      
      // 1. 处理提示词内容
      if (templateContent) {
        // 直接使用提供的模板内容
        prompt = this.processPromptTemplate(templateContent, variables);
        this.logger.log(`使用提供的模板内容，处理后长度: ${prompt.length}`);
      } 
      else if (templateName || templateId) {
        // 从数据库获取模板
        const identifier = templateName || templateId;
        const promptTemplate = await this.getPromptTemplateByName(identifier);
        
        if (!promptTemplate || !promptTemplate.content) {
          return { 
            taskId: '', 
            success: false, 
            message: `未找到有效的提示词模板: ${identifier}` 
          };
        }
        
        prompt = this.processPromptTemplate(promptTemplate.content, variables);
        this.logger.log(`使用数据库模板[${identifier}]，处理后长度: ${prompt.length}`);
        
        // 如果没有明确指定模型，使用模板中的模型
        if (!modelName && promptTemplate.modelName) {
          modelName = promptTemplate.modelName;
          this.logger.log(`使用模板中的模型: ${modelName}`);
        }
        
        // 获取预设值
        presetValues = promptTemplate.presetValues;
        if (presetValues) {
          this.logger.log(`使用模板中的预设值，长度: ${presetValues.length}`);
        }
      } 
      else {
        return { 
          taskId: '', 
          success: false, 
          message: '必须提供templateId、templateName或templateContent之一' 
        };
      }
      
      // 直接创建任务，不需要获取备用模型作为配置
      const taskId = await this.createImageTask(prompt, imageUrls, { presetValues });
      
      this.logger.log(`成功创建模板任务: ${taskId}`);
      return { taskId, success: true };
    } catch (error) {
      this.logger.error(`创建模板任务失败: ${error.message}`, error.stack);
      return { 
        taskId: '', 
        success: false, 
        message: `创建任务失败: ${error.message}` 
      };
    }
  }

  /**
   * 根据提示词模板名称创建图像生成任务 (兼容旧API)
   * @param templateName 提示词模板名称
   * @param variables 变量数组
   * @param imageUrls 图片URL数组
   * @returns 任务ID
   */
  async createImageTaskByTemplateName(templateName: string, variables: string[] = [], imageUrls: string[] = []): Promise<string> {
    const result = await this.createTemplateTask({
      templateName,
      variables,
      imageUrls
    });
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    return result.taskId;
  }

  /**
   * 创建带模板替换的图片生成任务 (兼容旧API)
   * @param promptTemplate 提示词模板
   * @param variables 变量数组
   * @param imageUrls 图片URL数组
   * @returns 任务ID
   */
  async createImageTaskWithTemplate(promptTemplate: string, variables: string[] = [], imageUrls: string[] = []): Promise<string> {
    this.logger.log(`创建直接模板任务: 模板长度=${promptTemplate.length}, 变量数量=${variables.length}`);
    
    const result = await this.createTemplateTask({
      templateContent: promptTemplate,
      variables,
      imageUrls
    });
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    return result.taskId;
  }

  /**
   * 根据模板名称获取提示词模板
   * @param templateName 提示词模板名称或ID
   * @returns 提示词模板对象
   */
  private async getPromptTemplateByName(templateName: string): Promise<any> {
    this.logger.log(`从提示词模板库获取提示词模板: ${templateName}`);
    
    try {
      // 使用TypeORM的Repository来查询提示词模板
      const promptTemplate = await this.promptTemplateRepository.findOne({
        where: 
          { identifier: templateName, status: 1 }
      });
      
      if (!promptTemplate) {
        this.logger.warn(`未找到名称/ID为 "${templateName}" 的提示词模板`);
        return null;
      }
      
      // 将实体转换为所需格式
      return {
        id: promptTemplate.id,
        content: promptTemplate.prompt, 
        name: promptTemplate.identifier,
        modelName: promptTemplate.modelName,
        createdAt: promptTemplate.createdAt,
        presetValues: promptTemplate.presetValues
      };
    } catch (error) {
      this.logger.error(`获取提示词模板失败: ${error.message}`, error.stack);
      throw new Error(`获取提示词模板失败: ${error.message}`);
    }
  }
  
  /**
   * 根据模板名称获取模型配置 (兼容旧API，建议使用createTaskByTemplate)
   * @param templateName 提示词模板名称
   * @returns 模型配置对象
   */
  private async getModelConfigByTemplateName(templateName: string): Promise<any> {
    this.logger.log(`获取模型配置: 模板名称=${templateName}`);
    
    try {
      // 从提示词模板获取模型信息
      const promptTemplate = await this.promptTemplateRepository.findOne({
        where: { identifier: templateName, status: 1 } // 只查询启用状态的模板
      });
      
      if (!promptTemplate) {
        this.logger.warn(`未找到名称为 "${templateName}" 的模型配置，将使用默认配置`);
        
        // 如果找不到配置，使用默认值
        return {
          templateName: templateName,
          model: 'gpt-4o-image-vip',
          temperature: 0.7,
          maxTokens: 2000
        };
      }
      
      // 返回模型配置
      return { 
        templateName,
        model: promptTemplate.modelName,
        temperature: 0.7, // 因为实体中没有这个字段，使用默认值
        maxTokens: 2000   // 因为实体中没有这个字段，使用默认值
      };
    } catch (error) {
      this.logger.error(`获取模型配置失败: ${error.message}`, error.stack);
      
      // 如果数据库查询失败，返回默认配置
      this.logger.warn('使用默认模型配置');
      return {
        templateName: templateName,
        model: 'gpt-4o-image',
        temperature: 0.7,
        maxTokens: 2000
      };
    }
  }

  /**
   * 保存生成图片的详细信息
   * @param taskId 任务ID
   * @param imageUrl 图片URL
   * @param source 图片来源
   * @param imageType 图片类型
   * @param processTime 处理时间
   */
  private async saveGeneratedImage(
    taskId: string,
    imageUrl: string,
    source: string = 'generated',
    imageType: string = 'original',
    processTime?: number
  ): Promise<AiGeneratedImageEntity> {
    try {
      const image = new AiGeneratedImageEntity();
      image.taskId = taskId;
      image.imageUrl = imageUrl;
      image.source = source;
      image.imageType = imageType;
      image.timestamp = new Date();
      
      if (processTime) {
        image.processTime = processTime;
      }

      // 尝试获取图片信息
      try {
        const imgResponse = await axios.head(imageUrl, {
          timeout: 5000, // 设置5秒超时
          validateStatus: function (status) {
            return status >= 200 && status < 500; // 只有5xx错误才会触发异常
          }
        });
        
        if (imgResponse.headers['content-length']) {
          image.size = parseInt(imgResponse.headers['content-length']);
        }
        if (imgResponse.headers['content-type']) {
          const contentType = imgResponse.headers['content-type'];
          // 从content-type中提取格式，并确保长度不超过10个字符
          const formatFull = contentType.split('/')[1] || '';
          // 只保留格式名称的前10个字符，避免数据库字段长度限制问题
          image.format = formatFull.split(';')[0].substring(0, 10);
          this.logger.log(`设置图片格式: ${image.format} (原始值: ${formatFull})`);
        }
      } catch (error) {
        this.logger.warn(`获取图片信息失败: ${error.message}`);
        // 设置默认值，确保格式字段不会太长
        const format = imageUrl.toLowerCase().endsWith('.png') ? 'png' : 
                      imageUrl.toLowerCase().endsWith('.gif') ? 'gif' : 
                      imageUrl.toLowerCase().endsWith('.webp') ? 'webp' : 'jpg';
        image.format = format.substring(0, 10); // 限制长度
      }

      // 保存图片记录
      try {
        const savedImage = await this.imageRepository.save(image);
        return savedImage;
      } catch (dbError) {
        this.logger.error(`保存图片到数据库失败: ${dbError.message}`);
        // 检查是否是字段长度问题，如果是则尝试修复
        if (dbError.message && dbError.message.includes('Data too long for column')) {
          this.logger.warn('尝试修复字段长度问题并重新保存');
          // 限制可能导致问题的字段长度
          if (image.format && image.format.length > 10) {
            image.format = image.format.substring(0, 10);
          }
          // 再次尝试保存
          try {
            const savedImage = await this.imageRepository.save(image);
            return savedImage;
          } catch (retryError) {
            this.logger.error(`二次尝试保存仍然失败: ${retryError.message}`);
          }
        }
        // 返回原始对象，避免中断流程
        return image;
      }
    } catch (error) {
      this.logger.error(`保存图片信息失败: ${error.message}`);
      // 创建一个基本对象并返回，避免抛出异常
      const fallbackImage = new AiGeneratedImageEntity();
      fallbackImage.taskId = taskId;
      fallbackImage.imageUrl = imageUrl;
      fallbackImage.source = source;
      fallbackImage.imageType = imageType;
      fallbackImage.timestamp = new Date();
      // 设置安全的默认格式值
      fallbackImage.format = 'unknown';
      return fallbackImage;
    }
  }

  // 处理发现第一个URL的情况
  private handleFirstUrlFound(response: any, currentContent: string, apiGeneratedUrls: string[]): void {
    try {
      this.logger.log(`找到第一个图片URL: ${apiGeneratedUrls[0]}，立即结束流处理`);
      // 确保只保留第一个URL
      if (apiGeneratedUrls.length > 1) {
        apiGeneratedUrls.splice(1);
      }
      
      // 通过变量存储信息，无需添加到response对象
      (response as any)._urlFound = true;
      (response as any)._foundUrls = [...apiGeneratedUrls];
      (response as any)._currentContent = currentContent;
      
      // 发送end事件以结束流处理
      response.data.emit('end');
    } catch (error) {
      this.logger.error(`处理第一个URL时发生错误: ${error.message}`);
    }
  }

  /**
   * 标记服务器为不可用
   */
  private markServerAsUnavailable(serverUrl: string): void {
    try {
      this.logger.warn(`标记服务器为不可用: ${serverUrl}`);
      // 实际项目中可以将此服务器添加到Redis缓存或数据库中的黑名单
    } catch (error) {
      this.logger.error(`标记服务器状态失败: ${error.message}`);
    }
  }

  /**
   * 发送API请求
   * 将API调用逻辑抽象为单独的方法，便于管理和重用
   * @param options 请求选项
   * @returns API响应结果
   */
  private async sendApiRequest(options: ApiRequestOptionsDto): Promise<any> {
    const { prompt, baseUrl, apiKey, model, requestMethod, requestType, ratio = "2:3", imageUrls = [], presetValues } = options;
    
    // API URL路径
    let apiUrl = '/v1/chat/completions';
    
    // 构建请求头
    const headers = {
      "Accept": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "User-Agent": "Apifox/1.0.0 (https://apifox.com)",
      "Content-Type": "application/json"
    };
    
    // 构建消息内容
    const content: MessageContent[] = [];
    
    // 根据不同的baseUrl构建不同的消息内容
    if (baseUrl.includes('api.gptgod.online')) {
      // 构建提示词对象
      let promptObject: any = { prompt };

      // 根据请求类型设置不同参数
      if (requestType === 'image') {
        promptObject.ratio = ratio; // 图像请求添加比例参数
      }

      // 为gptgod接口添加特殊前缀
      this.logger.log('检测到gptgod接口，添加特殊参数前缀');
      content.push({
        type: "text",
        text: JSON.stringify(promptObject)
      });
    } else {
      // 其他接口使用默认方式
      content.push({
        type: "text",
        text: prompt
      });
    }
    
    // 添加图片URL到请求内容中
    if (imageUrls && imageUrls.length > 0) {
      for (const imageUrl of imageUrls) {
        content.push({
          type: "image_url",
          image_url: {
            url: imageUrl
          }
        });
      }
    }
    
    // 构建请求体
    const data = {
      model: model,
      messages: [
        {
          role: "system",
          content: presetValues
        },
        {
          role: "user",
          content: content
        }
      ]
      // 不使用流式请求
    };
    
    this.logger.log(`发送API请求: ${baseUrl}${apiUrl}, 模型: ${model}, 请求方式: ${requestMethod}, 请求类型: ${requestType}，请求数据: ${JSON.stringify(data)}`);
    
    try {
      // 发送请求
      const response = await axios.post(`${baseUrl}${apiUrl}`, data, {
        headers: headers,
        timeout: 600000, // 5分钟超时
        responseType: 'json', // 始终使用json响应类型，不使用流
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: function (status) {
          return status >= 200 && status < 300;
        }
      });
      
      return response;
    } catch (error) {
      // 提供更详细的错误日志
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        this.logger.error(`API连接超时: ${baseUrl}, 错误代码: ${error.code}, 超时时间: ${error.timeout || '未知'}ms`);
      } else if (error.code === 'ECONNREFUSED') {
        this.logger.error(`API连接被拒绝: ${baseUrl}, 错误代码: ${error.code}`);
      } else if (error.code === 'ENOTFOUND') {
        this.logger.error(`API域名解析失败: ${baseUrl}, 错误代码: ${error.code}`);
      } else {
        // 记录完整的错误信息
        this.logger.error(`API请求失败: ${error.message}, 错误代码: ${error.code || '未知'}`);
        
        // 记录错误响应体（如果存在）
        if (error.response) {
          const responseData = error.response.data || '无响应数据';
          const responseStatus = error.response.status;
          const responseStatusText = error.response.statusText;
          
          this.logger.error(`API错误响应详情: 状态=${responseStatus} ${responseStatusText}, 响应体=${JSON.stringify(responseData)}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * 创建直接API请求任务
   * 使用传入的配置直接创建一个API请求任务
   * @param options API请求选项
   * @returns 任务ID
   */
  async createDirectApiRequestTask(options: ApiRequestOptionsDto): Promise<string> {
    this.logger.log(`创建直接API请求任务: 模型=${options.model}, 请求方式=${options.requestMethod || 'stream'}`);
    
    try {
      // 使用createImageTask创建任务
      // 将图片URL数组转换为标准格式
      const imageUrls = options.imageUrls || [];
      
      // 创建任务，只传入提示词和图片URL
      const taskId = await this.createImageTask(options.prompt, imageUrls);
      
      this.logger.log(`直接API请求任务创建成功: ${taskId}`);
      return taskId;
    } catch (error) {
      this.logger.error(`创建直接API请求任务失败: ${error.message}`, error.stack);
      throw new Error(`创建直接API请求任务失败: ${error.message}`);
    }
  }
} 