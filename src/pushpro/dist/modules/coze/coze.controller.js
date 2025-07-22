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
var CozeController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CozeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const coze_service_1 = require("./coze.service");
const coze_dto_1 = require("./dto/coze.dto");
const adminAuth_guard_1 = require("../../common/auth/adminAuth.guard");
const public_decorator_1 = require("../../decorators/public.decorator");
const platform_express_1 = require("@nestjs/platform-express");
const jwtAuth_guard_1 = require("../../common/auth/jwtAuth.guard");
let CozeController = CozeController_1 = class CozeController {
    constructor(cozeService) {
        this.cozeService = cozeService;
        this.logger = new common_1.Logger(CozeController_1.name);
        this.logger.log('CozeController initialized');
    }
    create(cozeCreateDto) {
        this.logger.log(`Creating Coze config: ${JSON.stringify(cozeCreateDto)}`);
        return this.cozeService.create(cozeCreateDto);
    }
    findAll(query) {
        this.logger.log(`Getting Coze list with query: ${JSON.stringify(query)}`);
        return this.cozeService.findAll(query);
    }
    findOne(id) {
        this.logger.log(`Getting Coze detail with id: ${id}`);
        return this.cozeService.findOne(+id);
    }
    update(id, cozeUpdateDto) {
        this.logger.log(`Updating Coze config with id: ${id}, data: ${JSON.stringify(cozeUpdateDto)}`);
        return this.cozeService.update(+id, cozeUpdateDto);
    }
    delete(id) {
        this.logger.log(`Deleting Coze config with id: ${id}`);
        return this.cozeService.delete(+id);
    }
    chat(cozeChatDto) {
        this.logger.log(`Chat with Coze: ${JSON.stringify(cozeChatDto)}`);
        return this.cozeService.chat(cozeChatDto);
    }
    getBotList() {
        this.logger.log('Getting Coze bot list');
        return this.cozeService.getBotList();
    }
    async runWorkflow(parameters) {
        this.logger.log(`触发工作流，参数: ${JSON.stringify(parameters)}`);
        return this.cozeService.runWorkflow(parameters);
    }
    async streamSpecificWorkflow(parameters) {
        this.logger.log(`流式触发工作流，参数: ${JSON.stringify(parameters)}`);
        return this.cozeService.streamWorkflow(parameters);
    }
    async getWorkflowHistory(executeId, workflowId) {
        this.logger.log(`获取工作流执行历史，workflowId: ${workflowId}, executeId: ${executeId}`);
        return this.cozeService.getWorkflowHistory(workflowId, executeId);
    }
    getWorkflowList() {
        this.logger.log('获取工作流列表');
        return this.cozeService.getWorkflowList();
    }
    async getWorkflowHistoryByStatus(workflowId, status, page, pageSize) {
        this.logger.log(`获取工作流执行历史列表, workflowId=${workflowId}, status=${status || '全部'}`);
        return this.cozeService.getWorkflowHistoryByStatus(workflowId, status, page ? Number(page) : 1, pageSize ? Number(pageSize) : 10);
    }
    async uploadFile(file, mimeType) {
        this.logger.log(`上传文件, filename=${file.originalname}`);
        const result = await this.cozeService.uploadFile(file.buffer, file.originalname, mimeType || file.mimetype);
        return result.file_id;
    }
    async getWorkflowResult(workflowId, executeId, extractField) {
        this.logger.log(`获取工作流执行结果, workflowId=${workflowId}, executeId=${executeId}${extractField ? ', 提取字段=' + extractField : ''}`);
        return this.cozeService.getWorkflowResult(workflowId, executeId, extractField);
    }
};
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '创建Coze配置' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coze_dto_1.CozeCreateDto]),
    __metadata("design:returntype", void 0)
], CozeController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取Coze配置列表' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coze_dto_1.CozeListDto]),
    __metadata("design:returntype", void 0)
], CozeController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取Coze配置详情' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CozeController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '更新Coze配置' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, coze_dto_1.CozeUpdateDto]),
    __metadata("design:returntype", void 0)
], CozeController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '删除Coze配置' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CozeController.prototype, "delete", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Coze聊天API' }),
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('chat'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coze_dto_1.CozeChatDto]),
    __metadata("design:returntype", void 0)
], CozeController.prototype, "chat", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取Coze机器人列表' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Get)('bot/list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CozeController.prototype, "getBotList", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '触发指定工作流' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Post)('workflow/run'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CozeController.prototype, "runWorkflow", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '流式触发工作流' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Post)('workflow/stream'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CozeController.prototype, "streamSpecificWorkflow", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取工作流执行历史' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Get)('workflow/history/:executeId'),
    __param(0, (0, common_1.Param)('executeId')),
    __param(1, (0, common_1.Query)('workflowId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CozeController.prototype, "getWorkflowHistory", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取工作流列表' }),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('workflow/list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CozeController.prototype, "getWorkflowList", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '按状态获取工作流执行历史列表' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Get)('workflow/history/list'),
    __param(0, (0, common_1.Query)('workflowId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], CozeController.prototype, "getWorkflowHistoryByStatus", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '上传文件并获取file_id' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('file/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('mimeType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CozeController.prototype, "uploadFile", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取工作流执行结果' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Get)('workflow/result'),
    __param(0, (0, common_1.Query)('workflowId')),
    __param(1, (0, common_1.Query)('executeId')),
    __param(2, (0, common_1.Query)('extractField')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CozeController.prototype, "getWorkflowResult", null);
CozeController = CozeController_1 = __decorate([
    (0, swagger_1.ApiTags)('Coze'),
    (0, common_1.Controller)('coze'),
    __metadata("design:paramtypes", [coze_service_1.CozeService])
], CozeController);
exports.CozeController = CozeController;
