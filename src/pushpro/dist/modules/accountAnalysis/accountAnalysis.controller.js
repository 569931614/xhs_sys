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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountAnalysisController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwtAuth_guard_1 = require("../../common/auth/jwtAuth.guard");
const accountAnalysis_service_1 = require("./accountAnalysis.service");
const create_task_dto_1 = require("./dto/create-task.dto");
const result_1 = require("../../common/result");
const fs = require("fs");
const path = require("path");
const typeorm_1 = require("typeorm");
let AccountAnalysisController = class AccountAnalysisController {
    constructor(accountAnalysisService, connection) {
        this.accountAnalysisService = accountAnalysisService;
        this.connection = connection;
    }
    async createTask(createTaskDto, req) {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || createTaskDto.user_id || 1;
        createTaskDto.user_id = userId;
        return this.accountAnalysisService.createTask(createTaskDto);
    }
    async getTasks(req) {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 1;
        const result = await this.accountAnalysisService.getTasksWithoutContent(userId);
        return result;
    }
    async getResult(taskId, id) {
        if (!taskId && !id) {
            return result_1.Result.fail(common_1.HttpStatus.BAD_REQUEST, '参数不完整');
        }
        return this.accountAnalysisService.getTaskResult(taskId, id);
    }
    async refreshTask(body, req) {
        var _a;
        const { task_id, id } = body;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 1;
        if (!task_id || !id) {
            return result_1.Result.fail(400, '参数不完整');
        }
        return this.accountAnalysisService.refreshTask(id, task_id, userId);
    }
    async migrateFxUrl() {
        try {
            const sqlPath = path.join(__dirname, 'fx-url-length.sql');
            const sql = fs.readFileSync(sqlPath, 'utf8');
            await this.connection.query(sql);
            return {
                code: 200,
                message: '数据库迁移执行成功：fx_url字段长度已修改为500'
            };
        }
        catch (error) {
            console.error('数据库迁移执行失败:', error);
            return {
                code: 500,
                message: `数据库迁移执行失败: ${error.message}`
            };
        }
    }
};
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: '创建分析任务',
        description: '根据链接分析账号，支持抖音和小红书。系统会自动根据链接域名判断平台，无需手动指定platform。'
    }),
    (0, common_1.Post)('create-task'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_task_dto_1.CreateTaskDto, Object]),
    __metadata("design:returntype", Promise)
], AccountAnalysisController.prototype, "createTask", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取分析任务列表' }),
    (0, common_1.Get)('tasks'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountAnalysisController.prototype, "getTasks", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取分析任务结果' }),
    (0, common_1.Get)('result'),
    __param(0, (0, common_1.Query)('task_id')),
    __param(1, (0, common_1.Query)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], AccountAnalysisController.prototype, "getResult", null);
__decorate([
    (0, common_1.Post)('refresh-task'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AccountAnalysisController.prototype, "refreshTask", null);
__decorate([
    (0, common_1.Post)('migrate-fx-url'),
    (0, swagger_1.ApiOperation)({ summary: '执行数据库迁移，修改fx_url字段长度' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '执行成功',
        schema: {
            type: 'object',
            properties: {
                code: { type: 'number', example: 200 },
                message: { type: 'string', example: '数据库迁移执行成功' }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccountAnalysisController.prototype, "migrateFxUrl", null);
AccountAnalysisController = __decorate([
    (0, swagger_1.ApiTags)('账号分析'),
    (0, common_1.Controller)('account-analysis'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [accountAnalysis_service_1.AccountAnalysisService,
        typeorm_1.Connection])
], AccountAnalysisController);
exports.AccountAnalysisController = AccountAnalysisController;
