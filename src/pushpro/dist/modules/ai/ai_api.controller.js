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
var AiApiController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiApiController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../decorators/public.decorator");
const ai_api_service_1 = require("./ai_api.service");
const ai_api_dto_1 = require("./dto/ai_api.dto");
let AiApiController = AiApiController_1 = class AiApiController {
    constructor(aiApiService) {
        this.aiApiService = aiApiService;
        this.logger = new common_1.Logger(AiApiController_1.name);
        this.logger.log('AI API控制器初始化');
    }
    async createTask(createTaskDto) {
        this.logger.log(`接收到创建任务请求: ${JSON.stringify(createTaskDto)}`);
        try {
            const { prompt, variables, image_url } = createTaskDto;
            this.logger.debug(`处理任务参数: prompt=${prompt}, variables=${JSON.stringify(variables)}`);
            const imageUrls = this.validateAndProcessImageUrls(image_url);
            this.logger.log(`开始创建任务: 提示词长度=${prompt.length}, 图片数量=${imageUrls.length}`);
            const result = await this.aiApiService.createTemplateTask({
                templateContent: prompt,
                variables: variables || [],
                imageUrls
            });
            if (!result.success) {
                this.logger.error(`任务创建失败: ${result.message}`);
                throw new common_1.HttpException({
                    error: result.message
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.log(`任务创建成功: ${result.taskId}`);
            return {
                task_id: result.taskId,
                message: '任务创建成功',
                usage_count: 999
            };
        }
        catch (error) {
            this.logger.error(`创建任务时发生错误: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                error: `创建任务失败: ${error.message}`
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createTaskByTemplate(createTaskDto) {
        this.logger.log(`接收到通过提示词模板名称创建任务请求: ${JSON.stringify(createTaskDto)}`);
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 10000;
        let retryCount = 0;
        let lastError = null;
        while (retryCount <= MAX_RETRIES) {
            try {
                const { template_name, variables, image_url } = createTaskDto;
                this.logger.debug(`处理任务参数: template_name=${template_name}, variables=${JSON.stringify(variables)}`);
                const imageUrls = this.validateAndProcessImageUrls(image_url);
                this.logger.log(`开始根据提示词模板创建任务: template_name=${template_name}, 图片数量=${imageUrls.length}`);
                if (retryCount > 0) {
                    this.logger.log(`第${retryCount}次重试创建任务: template_name=${template_name}`);
                }
                const result = await this.aiApiService.createTemplateTask({
                    templateName: template_name,
                    variables: variables || [],
                    imageUrls
                });
                if (!result.success) {
                    if (retryCount < MAX_RETRIES) {
                        retryCount++;
                        lastError = new common_1.HttpException({
                            error: result.message
                        }, common_1.HttpStatus.BAD_REQUEST);
                        this.logger.warn(`任务创建失败，准备第${retryCount}次重试: ${result.message}`);
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                        continue;
                    }
                    else {
                        this.logger.error(`任务创建失败，已达到最大重试次数: ${result.message}`);
                        throw new common_1.HttpException({
                            error: result.message
                        }, common_1.HttpStatus.BAD_REQUEST);
                    }
                }
                this.logger.log(`任务创建成功: ${result.taskId}`);
                return {
                    task_id: result.taskId,
                    message: '任务创建成功',
                    usage_count: 999
                };
            }
            catch (error) {
                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    lastError = error;
                    this.logger.warn(`创建任务时发生错误，准备第${retryCount}次重试: ${error.message}`, error.stack);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                }
                else {
                    this.logger.error(`创建任务失败，已达到最大重试次数: ${error.message}`, error.stack);
                    throw new common_1.HttpException({
                        error: `创建任务失败: ${error.message}`,
                        retryCount: retryCount
                    }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                }
            }
        }
        if (lastError) {
            throw lastError;
        }
    }
    async getResult(task_id, query) {
        this.logger.log(`接收到获取任务结果请求: task_id=${task_id}, timeout=${query.timeout || 10}`);
        try {
            const timeout = parseInt(query.timeout) || 10;
            this.logger.debug(`设置超时时间: ${timeout}秒`);
            this.logger.log(`开始查询任务: ${task_id}`);
            const result = await this.aiApiService.getTaskResult(task_id, timeout);
            this.logger.log(`获取任务结果完成: task_id=${task_id}, 状态=${result.status}`);
            return result;
        }
        catch (error) {
            this.logger.error(`获取任务结果时发生错误: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                error: `获取任务结果失败: ${error.message}`,
                status: 'error'
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async sendApiRequest(requestOptions) {
        this.logger.log(`接收到直接API请求: 模型=${requestOptions.model}, 请求方式=${requestOptions.requestMethod || 'stream'}`);
        try {
            const taskId = await this.aiApiService.createDirectApiRequestTask(requestOptions);
            this.logger.log(`创建直接API请求任务成功: taskId=${taskId}`);
            return {
                success: true,
                task_id: taskId,
                message: '请求已提交，请使用task_id查询结果'
            };
        }
        catch (error) {
            this.logger.error(`发送API请求时发生错误: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                error: `发送API请求失败: ${error.message}`,
                status: 'error'
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    validateAndProcessImageUrls(image_url) {
        let imageUrls = [];
        if (image_url) {
            imageUrls = Array.isArray(image_url) ? image_url : [image_url];
            this.logger.log(`图片URL数量: ${imageUrls.length}`);
            for (const url of imageUrls) {
                this.logger.debug(`验证图片URL: ${url}`);
                if (!(url.startsWith('http://') || url.startsWith('https://'))) {
                    this.logger.error(`图片URL格式不正确: ${url}`);
                    throw new common_1.HttpException({
                        error: `图片URL格式不正确: ${url}，必须以http://或https://开头`
                    }, common_1.HttpStatus.BAD_REQUEST);
                }
            }
        }
        return imageUrls;
    }
};
__decorate([
    (0, common_1.Post)('create_task'),
    (0, swagger_1.ApiOperation)({ summary: '创建AI图像生成任务' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_api_dto_1.CreateTaskDto]),
    __metadata("design:returntype", Promise)
], AiApiController.prototype, "createTask", null);
__decorate([
    (0, common_1.Post)('create_task_by_template'),
    (0, swagger_1.ApiOperation)({ summary: '通过提示词模板名称创建AI图像生成任务' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_api_dto_1.CreateTaskByTemplateDto]),
    __metadata("design:returntype", Promise)
], AiApiController.prototype, "createTaskByTemplate", null);
__decorate([
    (0, common_1.Get)('get_result/:task_id'),
    (0, swagger_1.ApiOperation)({ summary: '获取任务结果' }),
    __param(0, (0, common_1.Param)('task_id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_api_dto_1.GetTaskResultDto]),
    __metadata("design:returntype", Promise)
], AiApiController.prototype, "getResult", null);
__decorate([
    (0, common_1.Post)('request'),
    (0, swagger_1.ApiOperation)({ summary: '直接发送API请求' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_api_dto_1.ApiRequestOptionsDto]),
    __metadata("design:returntype", Promise)
], AiApiController.prototype, "sendApiRequest", null);
AiApiController = AiApiController_1 = __decorate([
    (0, swagger_1.ApiTags)('ai_api'),
    (0, common_1.Controller)('ai_api'),
    (0, public_decorator_1.Public)(),
    __metadata("design:paramtypes", [ai_api_service_1.AiApiService])
], AiApiController);
exports.AiApiController = AiApiController;
