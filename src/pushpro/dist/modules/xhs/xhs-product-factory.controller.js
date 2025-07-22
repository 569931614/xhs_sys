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
var XhsProductFactoryController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.XhsProductFactoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const xhs_product_factory_service_1 = require("./xhs-product-factory.service");
const jwtAuth_guard_1 = require("../../common/auth/jwtAuth.guard");
const material_service_1 = require("../material/material.service");
let XhsProductFactoryController = XhsProductFactoryController_1 = class XhsProductFactoryController {
    constructor(xhsProductFactoryService, materialService) {
        this.xhsProductFactoryService = xhsProductFactoryService;
        this.materialService = materialService;
        this.logger = new common_1.Logger(XhsProductFactoryController_1.name);
    }
    async generateProduct(req, generateDto) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const batchCount = generateDto.batchCount !== undefined ? generateDto.batchCount : 1;
        this.logger.log(`用户 ${userId} 请求生成产品内容: ${JSON.stringify(generateDto)}, batchCount: ${batchCount}, 类型: ${typeof batchCount}`);
        const numericBatchCount = typeof batchCount === 'string' ? parseInt(batchCount) : batchCount;
        this.logger.log(`转换后的batchCount: ${numericBatchCount}, 类型: ${typeof numericBatchCount}`);
        return this.xhsProductFactoryService.generateProduct(userId.toString(), generateDto.brandProduct, generateDto.title, generateDto.activityId, generateDto.fileIds, req, numericBatchCount, generateDto.titleList, generateDto.useMaterialLibrary, generateDto.materialIds, generateDto.materialCount, generateDto.useFolders, generateDto.folderIds, generateDto.folderMaterialCount, generateDto.templateIds, generateDto.information);
    }
    async getGenerationResult(req, taskId) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        this.logger.log(`用户 ${userId} 获取任务 ${taskId} 的生成结果`);
        return this.xhsProductFactoryService.getGenerationResult(userId.toString(), taskId);
    }
    async checkRunningTasks(secretKey) {
        if (secretKey !== this.xhsProductFactoryService['configService'].get('TASK_SECRET_KEY')) {
            return { success: false, message: '无权限执行此操作' };
        }
        this.logger.log('定时任务：检查运行中的任务状态');
        return this.xhsProductFactoryService.checkRunningTasks();
    }
    async getUserTasks(req, status) {
        var _a;
        console.log('getUserTasks：', req.user);
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        this.logger.log(`用户 ${userId} 获取任务列表, 状态: ${status || '全部'}`);
        return this.xhsProductFactoryService.getUserTasks(userId.toString(), status);
    }
    async getBatchGenerationResults(taskIds, req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!taskIds) {
            return {
                success: false,
                message: '未提供任务ID列表',
                results: []
            };
        }
        const taskIdArray = taskIds.split(',').filter(id => id.trim().length > 0);
        if (taskIdArray.length === 0) {
            return {
                success: false,
                message: '任务ID列表为空',
                results: []
            };
        }
        try {
            this.logger.log(`用户 ${userId} 批量获取 ${taskIdArray.length} 个任务的状态`);
            const resultsPromises = taskIdArray.map(taskId => this.xhsProductFactoryService.getGenerationResult(userId.toString(), taskId));
            const results = await Promise.all(resultsPromises);
            const mappedResults = results.map((result, index) => (Object.assign({ id: taskIdArray[index] }, result)));
            return {
                success: true,
                message: `已获取 ${mappedResults.length} 个任务的状态`,
                results: mappedResults
            };
        }
        catch (error) {
            this.logger.error(`批量获取任务状态失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: '批量获取任务状态失败',
                error: error.message,
                results: []
            };
        }
    }
    async retryTask(req, retryDto) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        this.logger.log(`用户 ${userId} 重试任务 ${retryDto.taskId}`);
        return this.xhsProductFactoryService.retryTask(userId.toString(), retryDto.taskId);
    }
};
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '生成小红书产品内容' }),
    (0, common_1.Post)('generate'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], XhsProductFactoryController.prototype, "generateProduct", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取生成结果' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('result'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], XhsProductFactoryController.prototype, "getGenerationResult", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '运行定时任务检查所有运行中任务状态' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('check-tasks'),
    __param(0, (0, common_1.Query)('secretKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], XhsProductFactoryController.prototype, "checkRunningTasks", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取用户的所有任务' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('tasks'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], XhsProductFactoryController.prototype, "getUserTasks", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '批量获取任务状态' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('/batch-results'),
    __param(0, (0, common_1.Query)('taskIds')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], XhsProductFactoryController.prototype, "getBatchGenerationResults", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '重试失败的任务' }),
    (0, common_1.Post)('retry'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], XhsProductFactoryController.prototype, "retryTask", null);
XhsProductFactoryController = XhsProductFactoryController_1 = __decorate([
    (0, swagger_1.ApiTags)('小红书产品工厂'),
    (0, common_1.Controller)('xhs/product-factory'),
    __metadata("design:paramtypes", [xhs_product_factory_service_1.XhsProductFactoryService,
        material_service_1.MaterialService])
], XhsProductFactoryController);
exports.XhsProductFactoryController = XhsProductFactoryController;
