import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigEntity } from '../globalConfig/config.entity';
import { AiTopicConfig } from './dto/aiTopicConfig.dto';
import { TopicGenerateResponse } from './dto/topicGenerateResponse.dto';
import { AiTopicEntity } from './entities/aiTopic.entity';
import { OpenAIChatService } from '../ai/openaiChat.service';
import { ModelsService } from '../models/models.service';
import { GlobalConfigService } from '../globalConfig/globalConfig.service';
import { AppEntity } from '../app/app.entity';

@Injectable()
export class AiTopicService {
  private readonly logger = new Logger(AiTopicService.name);

  constructor(
    @InjectRepository(AiTopicEntity)
    private aiTopicRepository: Repository<AiTopicEntity>,
    @InjectRepository(ConfigEntity)
    private configRepository: Repository<ConfigEntity>,
    @InjectRepository(AppEntity)
    private appEntity: Repository<AppEntity>,
    private readonly openAIChatService: OpenAIChatService,
    private readonly modelsService: ModelsService,
    private readonly globalConfigService: GlobalConfigService,
  ) {}

  /**
   * 获取用户AI选题配置
   * @param userId 用户ID
   */
  async getUserTopicSettings(userId: number): Promise<AiTopicConfig> {
    const userSettings = await this.aiTopicRepository.findOne({
      where: { userId },
    });

    if (!userSettings) {
      // 如果用户没有保存过设置，返回空配置
      return {
        industry: '',
        audience: '',
        product: '',
        location: '',
        painPoint: '',
      };
    }

    return {
      industry: userSettings.industry || '',
      audience: userSettings.audience || '',
      product: userSettings.product || '',
      location: userSettings.location || '',
      painPoint: userSettings.painPoint || '',
    };
  }

  /**
   * 保存用户AI选题配置
   * @param userId 用户ID
   * @param config 选题配置
   */
  async saveUserTopicSettings(
    userId: number,
    config: AiTopicConfig,
  ): Promise<AiTopicConfig> {
    let userSettings = await this.aiTopicRepository.findOne({
      where: { userId },
    });

    if (!userSettings) {
      // 如果用户没有保存过设置，创建新记录
      userSettings = this.aiTopicRepository.create({
        userId,
        industry: config.industry,
        audience: config.audience,
        product: config.product,
        location: config.location,
        painPoint: config.painPoint,
        createdAt: new Date(),
      });
    } else {
      // 更新现有记录
      userSettings.industry = config.industry;
      userSettings.audience = config.audience;
      userSettings.product = config.product;
      userSettings.location = config.location;
      userSettings.painPoint = config.painPoint;
      userSettings.updatedAt = new Date();
    }

    await this.aiTopicRepository.save(userSettings);

    return config;
  }
  
  /**
   * 获取对话参数配置
   * @returns 对话配置信息
   */
  private async getConversationConfig(appName:string) {
    try {
      // 从应用配置获取小红书选题模型配置，而不是全局配置
      // 应用配置的键名
      
      // 查询当前应用的配置，从app表中获取
      const appConfig = await this.appEntity.findOne({
        where: { name: appName }
      });
      
      // 如果存在应用配置则使用应用配置，否则使用默认值
      let aiTopicModelName = appConfig.appModel
      let aiTopicSystemPrompt = appConfig.preset
      let aiTopicTemperature = '0.7';

      
      // 使用指定的模型名称
      const modelName = aiTopicModelName;

      
      this.logger.log(`使用模型${modelName}生成小红书选题，使用应用配置`);
      
      return {
        systemPrompt: aiTopicSystemPrompt,
        model: modelName,
        temperature: parseFloat(aiTopicTemperature) || 0.7,
      };
    } catch (error) {
      this.logger.error(`获取模型配置失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 生成选题
   * @param config 选题配置
   * @param count 要生成的选题数量，默认为3
   */
  async generateTopic(config: AiTopicConfig, count: number = 3): Promise<TopicGenerateResponse> {
    try {
      const { industry, audience, product, location, painPoint } = config;
      
      // 构建用户输入参数内容
      let prompt = ``;
      if (industry) prompt += `行业/领域：${industry}\n`;
      if (audience) prompt += `目标受众：${audience}\n`;
      if (product) prompt += `核心产品/服务：${product}\n`;
      if (location) prompt += `地区：${location}\n`;
      if (painPoint) prompt += `痛点/卖点：${painPoint}\n`;
      
      try {
        // 获取对话配置
        const conversationConfig = await this.getConversationConfig("AI选题");
        
        // 尝试调用AI服务生成选题
        let aiResponse;
        
        if (conversationConfig) {
          // 使用配置的系统提示词
          const systemMessage = conversationConfig.systemPrompt;
          
          // 使用配置的模型
          const messagesHistory = [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ];
          
          // 创建中止控制器
          const abortController = new AbortController();
          const {
            openaiBaseUrl = '',
            openaiBaseKey = ''
          } = await this.globalConfigService.getConfigs([
            'openaiBaseKey',
            'openaiBaseUrl'
          ]);
          
          const result = await this.openAIChatService.openAIChat(messagesHistory, {
            chatId: 'ai-topic-gen', 
            apiKey: openaiBaseKey,
            model: conversationConfig.model,
            modelName: conversationConfig.model,
            temperature: conversationConfig.temperature,
            isFileUpload: 0,
            timeout: 30000,
            proxyUrl: openaiBaseUrl,
            abortController: abortController
          });
          
          aiResponse = result.answer;
        } else {
          // 回退到默认方法
          aiResponse = await this.openAIChatService.chatFree(prompt);
        }
        
        this.logger.log(`成功生成回复：${aiResponse}`);
        
        if (!aiResponse || !aiResponse.trim()) {
          throw new Error('AI生成的选题为空');
        }
        
        // 尝试解析JSON响应
        let topicList: string[] = [];
        let jsonData = null;
        
        try {
          // 提取JSON字符串
          const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
          const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
          
          // 解析JSON
          jsonData = JSON.parse(jsonString);
          
          if (Array.isArray(jsonData)) {
            // 如果是数组，提取标题和描述
            topicList = jsonData.map(item => item.title || item.toString());
            
            // 确保每个选题项都有desc字段
            jsonData = jsonData.map(item => {
              if (!item.desc && item.title) {
                item.desc = `选题: ${item.title}`;
              }
              return item;
            });
          } else if (typeof jsonData === 'object') {
            // 如果是单个对象，确保有desc字段
            if (!jsonData.desc && jsonData.title) {
              jsonData.desc = `选题: ${jsonData.title}`;
            }
            topicList = [jsonData.title || JSON.stringify(jsonData)];
          }
        } catch (jsonError) {
          this.logger.warn('无法解析JSON，尝试使用文本处理:', jsonError);
          
          // 如果JSON解析失败，回退到文本处理
          const lines = aiResponse.split('\n');
          topicList = lines
            .filter(line => line.trim().length > 0) // 过滤空行
            .map(line => line.replace(/^\d+\.\s*/, '').trim()); // 移除可能的序号
            
          // 创建基本的结构化数据
          jsonData = topicList.map(title => ({
            title,
            desc: `选题: ${title}`
          }));
        }
        
        // 确保至少有一个选题
        if (topicList.length === 0) {
          throw new Error('未能从AI回复中提取有效选题');
        }
        
        this.logger.log(`成功处理，共${topicList.length}个选题`);
        
        return {
          topic: topicList[0], // 主选题为第一个
          topicList: topicList, // 所有选题
          success: true,
          data: jsonData // 返回完整的JSON数据
        };
      } catch (aiError) {
        // AI调用失败
        this.logger.error('AI选题生成失败:', aiError);
        return {
          topic: '',
          topicList: [],
          success: false,
          message: '生成选题失败，请重试'
        };
      }
    } catch (error) {
      this.logger.error('生成选题时发生错误:', error);
      return {
        topic: '',
        topicList: [],
        success: false,
        message: '生成选题失败，请重试'
      };
    }
  }
} 