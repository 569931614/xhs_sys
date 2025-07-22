"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AiTopicService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiTopicService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_entity_1 = require("../globalConfig/config.entity");
const aiTopic_entity_1 = require("./entities/aiTopic.entity");
const openaiChat_service_1 = require("../ai/openaiChat.service");
const models_service_1 = require("../models/models.service");
const globalConfig_service_1 = require("../globalConfig/globalConfig.service");
const app_entity_1 = require("../app/app.entity");
let AiTopicService = AiTopicService_1 = class AiTopicService {
    constructor(aiTopicRepository, configRepository, appEntity, openAIChatService, modelsService, globalConfigService) {
        this.aiTopicRepository = aiTopicRepository;
        this.configRepository = configRepository;
        this.appEntity = appEntity;
        this.openAIChatService = openAIChatService;
        this.modelsService = modelsService;
        this.globalConfigService = globalConfigService;
        this.logger = new common_1.Logger(AiTopicService_1.name);
    }
    async getUserTopicSettings(userId) {
        const userSettings = await this.aiTopicRepository.findOne({
            where: { userId },
        });
        if (!userSettings) {
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
    async saveUserTopicSettings(userId, config) {
        let userSettings = await this.aiTopicRepository.findOne({
            where: { userId },
        });
        if (!userSettings) {
            userSettings = this.aiTopicRepository.create({
                userId,
                industry: config.industry,
                audience: config.audience,
                product: config.product,
                location: config.location,
                painPoint: config.painPoint,
                createdAt: new Date(),
            });
        }
        else {
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
    async getConversationConfig(appName) {
        try {
            const appConfig = await this.appEntity.findOne({
                where: { name: appName }
            });
            let aiTopicModelName = appConfig.appModel;
            let aiTopicSystemPrompt = appConfig.preset;
            let aiTopicTemperature = '0.7';
            const modelName = aiTopicModelName;
            this.logger.log(`使用模型${modelName}生成小红书选题，使用应用配置`);
            return {
                systemPrompt: aiTopicSystemPrompt,
                model: modelName,
                temperature: parseFloat(aiTopicTemperature) || 0.7,
            };
        }
        catch (error) {
            this.logger.error(`获取模型配置失败: ${error.message}`);
            return null;
        }
    }
    async generateTopic(config, count = 3) {
        try {
            const { industry, audience, product, location, painPoint } = config;
            let prompt = ``;
            if (industry)
                prompt += `行业/领域：${industry}\n`;
            if (audience)
                prompt += `目标受众：${audience}\n`;
            if (product)
                prompt += `核心产品/服务：${product}\n`;
            if (location)
                prompt += `地区：${location}\n`;
            if (painPoint)
                prompt += `痛点/卖点：${painPoint}\n`;
            try {
                const conversationConfig = await this.getConversationConfig("AI选题");
                let aiResponse;
                if (conversationConfig) {
                    const systemMessage = conversationConfig.systemPrompt;
                    const messagesHistory = [
                        { role: 'system', content: systemMessage },
                        { role: 'user', content: prompt }
                    ];
                    const abortController = new AbortController();
                    const { openaiBaseUrl = '', openaiBaseKey = '' } = await this.globalConfigService.getConfigs([
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
                }
                else {
                    aiResponse = await this.openAIChatService.chatFree(prompt);
                }
                this.logger.log(`成功生成回复：${aiResponse}`);
                if (!aiResponse || !aiResponse.trim()) {
                    throw new Error('AI生成的选题为空');
                }
                let topicList = [];
                let jsonData = null;
                try {
                    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
                    const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
                    jsonData = JSON.parse(jsonString);
                    if (Array.isArray(jsonData)) {
                        topicList = jsonData.map(item => item.title || item.toString());
                        jsonData = jsonData.map(item => {
                            if (!item.desc && item.title) {
                                item.desc = `选题: ${item.title}`;
                            }
                            return item;
                        });
                    }
                    else if (typeof jsonData === 'object') {
                        if (!jsonData.desc && jsonData.title) {
                            jsonData.desc = `选题: ${jsonData.title}`;
                        }
                        topicList = [jsonData.title || JSON.stringify(jsonData)];
                    }
                }
                catch (jsonError) {
                    this.logger.warn('无法解析JSON，尝试使用文本处理:', jsonError);
                    const lines = aiResponse.split('\n');
                    topicList = lines
                        .filter(line => line.trim().length > 0)
                        .map(line => line.replace(/^\d+\.\s*/, '').trim());
                    jsonData = topicList.map(title => ({
                        title,
                        desc: `选题: ${title}`
                    }));
                }
                if (topicList.length === 0) {
                    throw new Error('未能从AI回复中提取有效选题');
                }
                this.logger.log(`成功处理，共${topicList.length}个选题`);
                return {
                    topic: topicList[0],
                    topicList: topicList,
                    success: true,
                    data: jsonData
                };
            }
            catch (aiError) {
                this.logger.error('AI选题生成失败:', aiError);
                return {
                    topic: '',
                    topicList: [],
                    success: false,
                    message: '生成选题失败，请重试'
                };
            }
        }
        catch (error) {
            this.logger.error('生成选题时发生错误:', error);
            return {
                topic: '',
                topicList: [],
                success: false,
                message: '生成选题失败，请重试'
            };
        }
    }
};
AiTopicService = AiTopicService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(aiTopic_entity_1.AiTopicEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(config_entity_1.ConfigEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(app_entity_1.AppEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        openaiChat_service_1.OpenAIChatService,
        models_service_1.ModelsService,
        globalConfig_service_1.GlobalConfigService])
], AiTopicService);
exports.AiTopicService = AiTopicService;
