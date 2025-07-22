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
var AiApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiApiService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("axios");
const redisCache_service_1 = require("../redisCache/redisCache.service");
const uuid_1 = require("uuid");
const upload_service_1 = require("../upload/upload.service");
const ai_api_entity_1 = require("./ai_api.entity");
const image_upload_service_1 = require("./image-upload.service");
const promptlib_entity_1 = require("../promptlib/promptlib.entity");
const backup_models_service_1 = require("../models/backup-models.service");
const openaiChat_service_1 = require("./openaiChat.service");
const globalConfig_service_1 = require("../globalConfig/globalConfig.service");
const app_entity_1 = require("../app/app.entity");
let AiApiService = AiApiService_1 = class AiApiService {
    constructor(redisCacheService, uploadService, imageUploadService, taskRepository, imageRepository, promptTemplateRepository, backupModelsService, openAIChatService, globalConfigService, appEntity) {
        this.redisCacheService = redisCacheService;
        this.uploadService = uploadService;
        this.imageUploadService = imageUploadService;
        this.taskRepository = taskRepository;
        this.imageRepository = imageRepository;
        this.promptTemplateRepository = promptTemplateRepository;
        this.backupModelsService = backupModelsService;
        this.openAIChatService = openAIChatService;
        this.globalConfigService = globalConfigService;
        this.appEntity = appEntity;
        this.logger = new common_1.Logger(AiApiService_1.name);
        this.MAX_CONCURRENT_REQUESTS = 3;
        this.activeRequests = 0;
        this.logger.log('AiApiService initialized');
    }
    async generateAIContent(config) {
        try {
            const { appName, prompt, defaultSystemPrompt = "你是一名专业的分析师，擅长分析各类数据和信息。请基于提供的数据进行分析，回答要专业、详细、有洞察力。", defaultModel = "gpt-3.5-turbo", defaultTemperature = 0.7, chatId = `ai-generation-${Date.now()}`, timeout = 600000 } = config;
            let systemPrompt = defaultSystemPrompt;
            let modelName = defaultModel;
            let temperature = defaultTemperature;
            try {
                const appConfig = await this.appEntity.findOne({
                    where: { name: appName }
                });
                if (appConfig) {
                    modelName = appConfig.appModel || defaultModel;
                    systemPrompt = appConfig.preset || defaultSystemPrompt;
                    this.logger.log(`使用模型${modelName}生成内容，使用应用配置`);
                }
                else {
                    this.logger.warn(`未找到应用配置: ${appName}，使用默认值`);
                }
            }
            catch (error) {
                this.logger.error(`获取模型配置失败: ${error.message}`);
            }
            const { openaiBaseUrl = '', openaiBaseKey = '' } = await this.globalConfigService.getConfigs([
                'openaiBaseKey',
                'openaiBaseUrl'
            ]);
            const messagesHistory = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ];
            const abortController = new AbortController();
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
            }
            else {
                this.logger.warn(`AI未返回有效内容`);
                return null;
            }
        }
        catch (error) {
            this.logger.error(`生成AI内容出错: ${error.message}`);
            throw error;
        }
    }
    async createImageTask(prompt, imageUrls = [], apiConfig) {
        const taskId = (0, uuid_1.v4)();
        this.logger.log(`创建新任务: ${taskId}, 提示词长度: ${prompt.length}`);
        try {
            const task = new ai_api_entity_1.AiImageTaskEntity();
            task.taskId = taskId;
            task.status = 'pending';
            task.prompt = prompt;
            task.imageUrl = imageUrls.join(',');
            task.createdAt = new Date();
            task.updatedAt = new Date();
            if (apiConfig && apiConfig.presetValues) {
                task.presetValues = apiConfig.presetValues;
                this.logger.log(`为任务 ${taskId} 保存预设值，长度: ${apiConfig.presetValues.length}`);
            }
            await this.taskRepository.save(task);
            this.logger.log(`任务记录已保存到数据库: ${taskId}`);
            if (imageUrls && imageUrls.length > 0) {
                for (const imageUrl of imageUrls) {
                    try {
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
                        const image = new ai_api_entity_1.AiGeneratedImageEntity();
                        image.taskId = taskId;
                        image.imageUrl = imageUrl;
                        image.source = 'user';
                        image.imageType = 'original';
                        image.timestamp = new Date();
                        await this.imageRepository.save(image);
                        this.logger.log(`用户提供图片已保存: ${imageUrl}`);
                    }
                    catch (error) {
                        this.logger.error(`保存用户提供图片失败: ${error.message}`);
                    }
                }
            }
            this.processTask(taskId, prompt, imageUrls, apiConfig);
            return taskId;
        }
        catch (error) {
            this.logger.error(`创建任务失败: ${error.message}`, error.stack);
            throw new Error(`创建任务失败: ${error.message}`);
        }
    }
    async getTaskResult(taskId, timeout = 10) {
        this.logger.log(`获取任务结果: taskId=${taskId}, timeout=${timeout}秒`);
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
        if (task.status !== 'completed' && task.status !== 'failed') {
            this.logger.log(`任务 ${taskId} 未完成，等待${timeout}秒...`);
            await this.sleep(timeout * 1000);
            task = await this.taskRepository.findOne({
                where: { taskId }
            });
            this.logger.debug(`等待后任务状态: ${(task === null || task === void 0 ? void 0 : task.status) || '未知'}`);
        }
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
        }
        else if (task.status === 'completed') {
            result['image_urls'] = task.imageUrls || '';
            result['full_response'] = task.fullResponse || '';
            const images = await this.imageRepository.find({ where: { taskId, source: 'generated' } });
            if (images && images.length > 0) {
                this.logger.log(`任务完成: 生成图片数量=${images.length}`);
                result['images'] = images.map(img => ({
                    url: img.imageUrl,
                    width: img.width,
                    height: img.height,
                    format: img.format,
                    process_time: img.processTime
                }));
            }
            else {
                this.logger.log(`任务完成: 生成图片数量=${task.imageUrls ? task.imageUrls.split(',').length : 0}`);
            }
        }
        this.logger.log(`返回任务结果: taskId=${taskId}, status=${result.status}, success=${result.success}`);
        return result;
    }
    async processTask(taskId, prompt, imageUrls = [], apiConfig) {
        var _a;
        this.logger.log(`开始处理任务 ${taskId}`);
        const startTime = new Date().getTime();
        let timeoutHandler = null;
        let isTimedOut = false;
        try {
            await this.updateTaskStatus(taskId, 'processing', undefined, undefined, ' 0%', '任务开始处理...');
            const taskEntity = await this.taskRepository.findOne({ where: { taskId } });
            let presetValues;
            if (taskEntity && taskEntity.presetValues) {
                presetValues = taskEntity.presetValues;
                this.logger.log(`从任务记录中获取预设值，长度: ${presetValues.length}`);
            }
            else if (apiConfig && apiConfig.presetValues) {
                presetValues = apiConfig.presetValues;
                this.logger.log(`从apiConfig中获取预设值，长度: ${presetValues.length}`);
            }
            const timeoutPromise = new Promise((resolve, reject) => {
                timeoutHandler = setTimeout(async () => {
                    isTimedOut = true;
                    const elapsedTimeMinutes = (new Date().getTime() - startTime) / (1000 * 60);
                    this.logger.warn(`任务 ${taskId} 处理超时 (已执行${elapsedTimeMinutes.toFixed(1)}分钟)，设置为失败状态`);
                    await this.updateTaskStatus(taskId, 'failed', '处理超时，已执行超过10分钟', undefined);
                    reject(new Error('处理超时，已执行超过20分钟'));
                }, 20 * 60 * 1000);
            });
            let processedImageUrls = [];
            const processingPromise = (async () => {
                try {
                    if (imageUrls && imageUrls.length > 0) {
                        for (const imageUrl of imageUrls) {
                            try {
                                const uploadResult = await this.imageUploadService.uploadToPicgo(imageUrl);
                                if (uploadResult && uploadResult.original_url) {
                                    processedImageUrls.push(uploadResult.original_url);
                                    this.logger.log(`图片上传成功: ${imageUrl} -> ${uploadResult.original_url}`);
                                }
                                else {
                                    processedImageUrls.push(imageUrl);
                                    this.logger.warn(`图片上传失败，使用原始URL: ${imageUrl}`);
                                }
                            }
                            catch (error) {
                                processedImageUrls.push(imageUrl);
                                this.logger.error(`图片上传错误: ${error.message}`);
                            }
                        }
                        if (isTimedOut) {
                            return;
                        }
                        return;
                    }
                }
                catch (processingError) {
                    this.logger.error(`任务处理过程中发生错误: ${processingError.message}`);
                    throw processingError;
                }
            })();
            try {
                await Promise.race([processingPromise, timeoutPromise]);
            }
            catch (raceError) {
                if (raceError.message === '处理超时，已执行超过10分钟') {
                    this.logger.warn(`任务 ${taskId} 因超时而中断`);
                    return;
                }
                throw raceError;
            }
            let apiConfigs = [];
            try {
                let backupModels = [];
                try {
                    backupModels = await this.backupModelsService.findByType('image');
                }
                catch (error) {
                    if (error.message && error.message.includes('Property "priority" was not found')) {
                        this.logger.warn('备用模型实体缺少priority字段，尝试不排序获取');
                        backupModels = await this.backupModelsService.findByTypeWithoutPriority('image');
                    }
                    else {
                        throw error;
                    }
                }
                if (backupModels && backupModels.length > 0) {
                    apiConfigs = backupModels.map(model => ({
                        apiKey: model.apiKey,
                        baseUrl: model.baseUrl,
                        model: model.model || "gpt-4o-image",
                        requestMethod: model.requestMethod || "stream",
                        requestType: model.requestType || "image"
                    }));
                    this.logger.log(`从备用模型库获取到${apiConfigs.length}个图文模型配置，将全部用于重试`);
                }
                else {
                    this.logger.warn('未找到图文类型的备用模型，将使用默认配置');
                }
            }
            catch (configError) {
                this.logger.error(`获取备用模型失败: ${configError.message}，将使用默认配置`);
            }
            let apiGeneratedUrls = [];
            let uploadedImages = [];
            let fullResponse = '';
            const MAX_RETRY_COUNT = apiConfigs.length;
            const RETRY_DELAY = 60000;
            let retryCount = 0;
            let apiRequestSuccess = false;
            const errorMessages = [];
            while (retryCount < MAX_RETRY_COUNT && !apiRequestSuccess) {
                if (retryCount > 0) {
                    this.logger.log(`第 ${retryCount} 次重试任务 ${taskId}，等待 ${RETRY_DELAY / 1000} 秒后重试...`);
                    await this.updateTaskStatus(taskId, 'processing', undefined, undefined, ` 0%`, `第 ${retryCount} 次重试任务...`);
                    await this.sleep(RETRY_DELAY);
                }
                const config = apiConfigs[retryCount % apiConfigs.length];
                this.logger.log(`[尝试 ${retryCount + 1}/${MAX_RETRY_COUNT}] 使用API配置: ${config.baseUrl}, 模型: ${config.model}`);
                try {
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
                    if (response.data && response.data.choices && response.data.choices.length > 0) {
                        const content = ((_a = response.data.choices[0].message) === null || _a === void 0 ? void 0 : _a.content) || '';
                        fullResponse = content;
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
                        if (apiGeneratedUrls.length > 0) {
                            apiRequestSuccess = true;
                            break;
                        }
                        else {
                            this.logger.warn(`同步响应中未找到图片URL，响应内容: ${content.substring(0, 200)}...`);
                        }
                    }
                    else {
                        this.logger.warn(`响应中没有有效的数据: ${JSON.stringify(response.data)}`);
                    }
                }
                catch (error) {
                    this.logger.error(`API请求失败: ${error.message}`);
                    let errorDetails = `错误信息: ${error.message}`;
                    if (error.response) {
                        const responseData = error.response.data || '无响应数据';
                        const responseStatus = error.response.status;
                        const responseStatusText = error.response.statusText;
                        errorDetails += `，状态码: ${responseStatus} ${responseStatusText}，详情: ${JSON.stringify(responseData)}`;
                        this.logger.error(`API错误响应详情: 状态=${responseStatus} ${responseStatusText}, 响应体=${JSON.stringify(responseData)}`);
                    }
                    errorMessages.push(`[尝试 ${retryCount + 1}/${MAX_RETRY_COUNT}] ${config.baseUrl} (${config.model}): ${errorDetails}`);
                    await this.updateTaskStatus(taskId, 'processing', errorDetails, undefined, ` ${retryCount + 1}/${MAX_RETRY_COUNT}`, `API请求失败 [${config.baseUrl}]，将尝试其他备用模型...`);
                    await this.sleep(3000);
                    this.markServerAsUnavailable(config.baseUrl);
                }
                retryCount++;
            }
            const task = await this.taskRepository.findOne({ where: { taskId } });
            if (task) {
                task.executedAt = new Date();
                await this.taskRepository.save(task);
            }
            if (!apiRequestSuccess) {
                this.logger.error(`任务 ${taskId} 在 ${MAX_RETRY_COUNT} 次尝试后生成失败，请重新尝试！`);
                const fullErrorMessage = `经过 ${MAX_RETRY_COUNT} 次尝试后生成失败，请重新尝试！\n\n详细错误信息:\n${errorMessages.join('\n')}`;
                await this.updateTaskStatus(taskId, 'failed', fullErrorMessage, fullResponse);
                return;
            }
            apiGeneratedUrls = [...new Set(apiGeneratedUrls)];
            if (apiGeneratedUrls.length > 0) {
                const firstUrl = apiGeneratedUrls[0];
                this.logger.log(`去重后有${apiGeneratedUrls.length}个唯一的图片URL，只使用第一个: ${firstUrl}`);
                apiGeneratedUrls = [firstUrl];
                try {
                    let uploadedUrl = firstUrl;
                    try {
                        const uploadResult = await Promise.race([
                            this.imageUploadService.uploadToPicgo(firstUrl),
                            new Promise((resolve) => setTimeout(() => {
                                this.logger.warn(`上传图片超时: ${firstUrl}，将使用原始URL`);
                                resolve({ original_url: firstUrl });
                            }, 30000))
                        ]);
                        if (uploadResult && uploadResult.original_url) {
                            uploadedUrl = uploadResult.original_url;
                            this.logger.log(`生成图片上传成功: ${firstUrl} -> ${uploadedUrl}`);
                        }
                        else {
                            this.logger.warn(`上传没有返回有效结果，使用原始URL: ${firstUrl}`);
                        }
                    }
                    catch (uploadError) {
                        this.logger.error(`生成图片上传失败: ${uploadError.message}`);
                        this.logger.warn(`将使用原始URL继续处理: ${firstUrl}`);
                    }
                    const existingImage = await this.imageRepository.findOne({
                        where: { imageUrl: uploadedUrl }
                    });
                    if (existingImage) {
                        this.logger.log(`图片URL已存在于数据库中: ${uploadedUrl}，关联到任务 ${existingImage.taskId}`);
                        const existingSourceImage = await this.imageRepository.findOne({
                            where: { imageUrl: firstUrl, imageType: 'source' }
                        });
                        if (!existingSourceImage && firstUrl !== uploadedUrl) {
                            await this.saveGeneratedImage(taskId, firstUrl, 'generated', 'source');
                        }
                        uploadedImages.push({
                            original_url: uploadedUrl,
                            source_url: firstUrl
                        });
                    }
                    else {
                        await this.saveGeneratedImage(taskId, firstUrl, 'generated', 'source');
                        await this.saveGeneratedImage(taskId, uploadedUrl, 'generated', 'original');
                        uploadedImages.push({
                            original_url: uploadedUrl,
                            source_url: firstUrl
                        });
                    }
                }
                catch (error) {
                    this.logger.error(`处理图片时发生错误: ${error.message}`);
                    uploadedImages.push({
                        original_url: firstUrl,
                        source_url: firstUrl
                    });
                    this.logger.warn(`尝试使用原始URL继续: ${firstUrl}`);
                }
            }
            else {
                this.logger.log(`去重后没有图片URL`);
            }
            if (uploadedImages.length === 0) {
                if (apiGeneratedUrls.length > 0) {
                    const originalUrl = apiGeneratedUrls[0];
                    this.logger.warn(`没有成功上传的图片，将使用原始URL: ${originalUrl}`);
                    uploadedImages.push({
                        original_url: originalUrl,
                        source_url: originalUrl
                    });
                }
                else {
                    this.logger.error(`任务 ${taskId} 所有图片处理失败`);
                    await this.updateTaskStatus(taskId, 'failed', '所有图片处理失败', fullResponse);
                    return;
                }
            }
            const uploadedUrls = uploadedImages.map(img => img.original_url);
            await this.updateTaskStatus(taskId, 'completed', undefined, fullResponse, ' 100%', '任务处理完成', uploadedUrls.join(','));
            this.logger.log(`任务 ${taskId} 处理完成，共生成 ${uploadedImages.length} 张图片`);
            if (apiGeneratedUrls && apiGeneratedUrls.length > 0) {
                const task = await this.taskRepository.findOne({ where: { taskId } });
                if (task) {
                    const savedImages = [];
                    for (let i = 0; i < uploadedImages.length; i++) {
                        const uploadedImage = uploadedImages[i];
                        try {
                            const existingImage = await this.imageRepository.findOne({
                                where: {
                                    imageUrl: uploadedImage.original_url,
                                    imageType: 'original'
                                }
                            });
                            if (existingImage) {
                                this.logger.log(`图片已存在，跳过保存: ${uploadedImage.original_url}`);
                                savedImages.push(existingImage);
                            }
                            else {
                                const savedImage = await this.saveGeneratedImage(taskId, uploadedImage.original_url, 'generated', 'original', new Date().getTime() - startTime);
                                savedImages.push(savedImage);
                                this.logger.debug(`保存生成图片信息: index=${i}, url=${uploadedImage.original_url}`);
                            }
                        }
                        catch (error) {
                            this.logger.error(`保存生成图片信息失败: ${error.message}`);
                        }
                    }
                }
            }
        }
        catch (error) {
            this.logger.error(`处理任务失败: ${error.message}`, error.stack);
            await this.updateTaskStatus(taskId, 'failed', error.message || '处理任务时发生未知错误');
        }
        finally {
            if (timeoutHandler) {
                clearTimeout(timeoutHandler);
            }
        }
    }
    async updateTaskStatus(taskId, status, errorMessage, fullResponse, progressMessage, currentContent, imageUrls) {
        this.logger.log(`更新任务状态: taskId=${taskId}, status=${status}, progressMessage=${progressMessage || '无'}`);
        try {
            const task = await this.taskRepository.findOne({ where: { taskId } });
            if (!task) {
                this.logger.error(`更新状态失败: 找不到任务 ${taskId}`);
                return;
            }
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
            if (status === 'processing' && !task.executedAt) {
                task.executedAt = new Date();
            }
            else if (status === 'completed' || status === 'failed') {
                task.completedAt = new Date();
            }
            task.updatedAt = new Date();
            await this.taskRepository.save(task);
            this.logger.debug(`任务状态已更新: ${taskId}`);
        }
        catch (error) {
            this.logger.error(`更新任务状态失败: ${error.message}`, error.stack);
        }
    }
    async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    processPromptTemplate(template, variables = []) {
        let processedPrompt = template;
        for (let i = 0; i < variables.length; i++) {
            const placeholder = `{{string${i + 1}}}`;
            processedPrompt = processedPrompt.replace(new RegExp(placeholder, 'g'), variables[i]);
        }
        if (variables.length === 1) {
            processedPrompt = processedPrompt.replace(/{{content}}/g, variables[0]);
        }
        return processedPrompt;
    }
    async createTemplateTask(options) {
        try {
            const { templateId, templateName, templateContent, variables = [], imageUrls = [], apiConfig: initialApiConfig } = options;
            let { modelName } = options;
            this.logger.log(`创建模板任务: ${templateName || templateId || '直接内容'}, 变量数量=${variables.length}, 图片数量=${imageUrls.length}`);
            let prompt;
            let presetValues;
            if (templateContent) {
                prompt = this.processPromptTemplate(templateContent, variables);
                this.logger.log(`使用提供的模板内容，处理后长度: ${prompt.length}`);
            }
            else if (templateName || templateId) {
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
                if (!modelName && promptTemplate.modelName) {
                    modelName = promptTemplate.modelName;
                    this.logger.log(`使用模板中的模型: ${modelName}`);
                }
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
            const taskId = await this.createImageTask(prompt, imageUrls, { presetValues });
            this.logger.log(`成功创建模板任务: ${taskId}`);
            return { taskId, success: true };
        }
        catch (error) {
            this.logger.error(`创建模板任务失败: ${error.message}`, error.stack);
            return {
                taskId: '',
                success: false,
                message: `创建任务失败: ${error.message}`
            };
        }
    }
    async createImageTaskByTemplateName(templateName, variables = [], imageUrls = []) {
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
    async createImageTaskWithTemplate(promptTemplate, variables = [], imageUrls = []) {
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
    async getPromptTemplateByName(templateName) {
        this.logger.log(`从提示词模板库获取提示词模板: ${templateName}`);
        try {
            const promptTemplate = await this.promptTemplateRepository.findOne({
                where: { identifier: templateName, status: 1 }
            });
            if (!promptTemplate) {
                this.logger.warn(`未找到名称/ID为 "${templateName}" 的提示词模板`);
                return null;
            }
            return {
                id: promptTemplate.id,
                content: promptTemplate.prompt,
                name: promptTemplate.identifier,
                modelName: promptTemplate.modelName,
                createdAt: promptTemplate.createdAt,
                presetValues: promptTemplate.presetValues
            };
        }
        catch (error) {
            this.logger.error(`获取提示词模板失败: ${error.message}`, error.stack);
            throw new Error(`获取提示词模板失败: ${error.message}`);
        }
    }
    async getModelConfigByTemplateName(templateName) {
        this.logger.log(`获取模型配置: 模板名称=${templateName}`);
        try {
            const promptTemplate = await this.promptTemplateRepository.findOne({
                where: { identifier: templateName, status: 1 }
            });
            if (!promptTemplate) {
                this.logger.warn(`未找到名称为 "${templateName}" 的模型配置，将使用默认配置`);
                return {
                    templateName: templateName,
                    model: 'gpt-4o-image-vip',
                    temperature: 0.7,
                    maxTokens: 2000
                };
            }
            return {
                templateName,
                model: promptTemplate.modelName,
                temperature: 0.7,
                maxTokens: 2000
            };
        }
        catch (error) {
            this.logger.error(`获取模型配置失败: ${error.message}`, error.stack);
            this.logger.warn('使用默认模型配置');
            return {
                templateName: templateName,
                model: 'gpt-4o-image',
                temperature: 0.7,
                maxTokens: 2000
            };
        }
    }
    async saveGeneratedImage(taskId, imageUrl, source = 'generated', imageType = 'original', processTime) {
        try {
            const image = new ai_api_entity_1.AiGeneratedImageEntity();
            image.taskId = taskId;
            image.imageUrl = imageUrl;
            image.source = source;
            image.imageType = imageType;
            image.timestamp = new Date();
            if (processTime) {
                image.processTime = processTime;
            }
            try {
                const imgResponse = await axios_1.default.head(imageUrl, {
                    timeout: 5000,
                    validateStatus: function (status) {
                        return status >= 200 && status < 500;
                    }
                });
                if (imgResponse.headers['content-length']) {
                    image.size = parseInt(imgResponse.headers['content-length']);
                }
                if (imgResponse.headers['content-type']) {
                    const contentType = imgResponse.headers['content-type'];
                    const formatFull = contentType.split('/')[1] || '';
                    image.format = formatFull.split(';')[0].substring(0, 10);
                    this.logger.log(`设置图片格式: ${image.format} (原始值: ${formatFull})`);
                }
            }
            catch (error) {
                this.logger.warn(`获取图片信息失败: ${error.message}`);
                const format = imageUrl.toLowerCase().endsWith('.png') ? 'png' :
                    imageUrl.toLowerCase().endsWith('.gif') ? 'gif' :
                        imageUrl.toLowerCase().endsWith('.webp') ? 'webp' : 'jpg';
                image.format = format.substring(0, 10);
            }
            try {
                const savedImage = await this.imageRepository.save(image);
                return savedImage;
            }
            catch (dbError) {
                this.logger.error(`保存图片到数据库失败: ${dbError.message}`);
                if (dbError.message && dbError.message.includes('Data too long for column')) {
                    this.logger.warn('尝试修复字段长度问题并重新保存');
                    if (image.format && image.format.length > 10) {
                        image.format = image.format.substring(0, 10);
                    }
                    try {
                        const savedImage = await this.imageRepository.save(image);
                        return savedImage;
                    }
                    catch (retryError) {
                        this.logger.error(`二次尝试保存仍然失败: ${retryError.message}`);
                    }
                }
                return image;
            }
        }
        catch (error) {
            this.logger.error(`保存图片信息失败: ${error.message}`);
            const fallbackImage = new ai_api_entity_1.AiGeneratedImageEntity();
            fallbackImage.taskId = taskId;
            fallbackImage.imageUrl = imageUrl;
            fallbackImage.source = source;
            fallbackImage.imageType = imageType;
            fallbackImage.timestamp = new Date();
            fallbackImage.format = 'unknown';
            return fallbackImage;
        }
    }
    handleFirstUrlFound(response, currentContent, apiGeneratedUrls) {
        try {
            this.logger.log(`找到第一个图片URL: ${apiGeneratedUrls[0]}，立即结束流处理`);
            if (apiGeneratedUrls.length > 1) {
                apiGeneratedUrls.splice(1);
            }
            response._urlFound = true;
            response._foundUrls = [...apiGeneratedUrls];
            response._currentContent = currentContent;
            response.data.emit('end');
        }
        catch (error) {
            this.logger.error(`处理第一个URL时发生错误: ${error.message}`);
        }
    }
    markServerAsUnavailable(serverUrl) {
        try {
            this.logger.warn(`标记服务器为不可用: ${serverUrl}`);
        }
        catch (error) {
            this.logger.error(`标记服务器状态失败: ${error.message}`);
        }
    }
    async sendApiRequest(options) {
        const { prompt, baseUrl, apiKey, model, requestMethod, requestType, ratio = "2:3", imageUrls = [], presetValues } = options;
        let apiUrl = '/v1/chat/completions';
        const headers = {
            "Accept": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "User-Agent": "Apifox/1.0.0 (https://apifox.com)",
            "Content-Type": "application/json"
        };
        const content = [];
        if (baseUrl.includes('api.gptgod.online')) {
            let promptObject = { prompt };
            if (requestType === 'image') {
                promptObject.ratio = ratio;
            }
            this.logger.log('检测到gptgod接口，添加特殊参数前缀');
            content.push({
                type: "text",
                text: JSON.stringify(promptObject)
            });
        }
        else {
            content.push({
                type: "text",
                text: prompt
            });
        }
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
        };
        this.logger.log(`发送API请求: ${baseUrl}${apiUrl}, 模型: ${model}, 请求方式: ${requestMethod}, 请求类型: ${requestType}，请求数据: ${JSON.stringify(data)}`);
        try {
            const response = await axios_1.default.post(`${baseUrl}${apiUrl}`, data, {
                headers: headers,
                timeout: 600000,
                responseType: 'json',
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                validateStatus: function (status) {
                    return status >= 200 && status < 300;
                }
            });
            return response;
        }
        catch (error) {
            if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                this.logger.error(`API连接超时: ${baseUrl}, 错误代码: ${error.code}, 超时时间: ${error.timeout || '未知'}ms`);
            }
            else if (error.code === 'ECONNREFUSED') {
                this.logger.error(`API连接被拒绝: ${baseUrl}, 错误代码: ${error.code}`);
            }
            else if (error.code === 'ENOTFOUND') {
                this.logger.error(`API域名解析失败: ${baseUrl}, 错误代码: ${error.code}`);
            }
            else {
                this.logger.error(`API请求失败: ${error.message}, 错误代码: ${error.code || '未知'}`);
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
    async createDirectApiRequestTask(options) {
        this.logger.log(`创建直接API请求任务: 模型=${options.model}, 请求方式=${options.requestMethod || 'stream'}`);
        try {
            const imageUrls = options.imageUrls || [];
            const taskId = await this.createImageTask(options.prompt, imageUrls);
            this.logger.log(`直接API请求任务创建成功: ${taskId}`);
            return taskId;
        }
        catch (error) {
            this.logger.error(`创建直接API请求任务失败: ${error.message}`, error.stack);
            throw new Error(`创建直接API请求任务失败: ${error.message}`);
        }
    }
};
AiApiService = AiApiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, typeorm_1.InjectRepository)(ai_api_entity_1.AiImageTaskEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(ai_api_entity_1.AiGeneratedImageEntity)),
    __param(5, (0, typeorm_1.InjectRepository)(promptlib_entity_1.PromptTemplateEntity)),
    __param(9, (0, typeorm_1.InjectRepository)(app_entity_1.AppEntity)),
    __metadata("design:paramtypes", [redisCache_service_1.RedisCacheService,
        upload_service_1.UploadService,
        image_upload_service_1.ImageUploadService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        backup_models_service_1.BackupModelsService,
        openaiChat_service_1.OpenAIChatService,
        globalConfig_service_1.GlobalConfigService,
        typeorm_2.Repository])
], AiApiService);
exports.AiApiService = AiApiService;
