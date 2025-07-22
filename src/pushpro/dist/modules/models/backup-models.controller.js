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
exports.BackupModelsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const adminAuth_guard_1 = require("../../common/auth/adminAuth.guard");
const basePage_dto_1 = require("../../common/dto/basePage.dto");
const result_vo_1 = require("../../common/vo/result.vo");
const backup_models_service_1 = require("./backup-models.service");
const backup_models_dto_1 = require("./dto/backup-models.dto");
let BackupModelsController = class BackupModelsController {
    constructor(backupModelsService) {
        this.backupModelsService = backupModelsService;
    }
    async findAll(query) {
        const { page = 1, pageSize = 10 } = query;
        const result = await this.backupModelsService.findAll(page, pageSize);
        return result_vo_1.Result.success(result);
    }
    async findOne(id) {
        const result = await this.backupModelsService.findOne(id);
        return result_vo_1.Result.success(result);
    }
    async create(createDto) {
        const result = await this.backupModelsService.create(createDto);
        return result_vo_1.Result.success(result);
    }
    async update(updateDto) {
        const result = await this.backupModelsService.update(updateDto);
        return result_vo_1.Result.success(result);
    }
    async updateStatus(updateStatusDto) {
        const result = await this.backupModelsService.updateStatus(updateStatusDto);
        return result_vo_1.Result.success(result);
    }
    async delete(deleteDto) {
        const result = await this.backupModelsService.delete(deleteDto);
        return result_vo_1.Result.success(result);
    }
    async findByType(modelType) {
        const result = await this.backupModelsService.findByType(modelType);
        return result_vo_1.Result.success(result);
    }
    async search(keyword, page = 1, pageSize = 10) {
        const result = await this.backupModelsService.search(keyword, page, pageSize);
        return result_vo_1.Result.success(result);
    }
};
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取备用模型列表' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'pageSize', required: false, type: Number }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [basePage_dto_1.BasePage]),
    __metadata("design:returntype", Promise)
], BackupModelsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('detail'),
    (0, swagger_1.ApiOperation)({ summary: '获取备用模型详情' }),
    (0, swagger_1.ApiQuery)({ name: 'id', required: true, type: Number }),
    __param(0, (0, common_1.Query)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], BackupModelsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('create'),
    (0, swagger_1.ApiOperation)({ summary: '创建备用模型' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [backup_models_dto_1.CreateBackupModelDto]),
    __metadata("design:returntype", Promise)
], BackupModelsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('update'),
    (0, swagger_1.ApiOperation)({ summary: '更新备用模型' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [backup_models_dto_1.UpdateBackupModelDto]),
    __metadata("design:returntype", Promise)
], BackupModelsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('update-status'),
    (0, swagger_1.ApiOperation)({ summary: '更新备用模型状态' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [backup_models_dto_1.UpdateBackupModelStatusDto]),
    __metadata("design:returntype", Promise)
], BackupModelsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)('delete'),
    (0, swagger_1.ApiOperation)({ summary: '删除备用模型' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [backup_models_dto_1.DeleteBackupModelDto]),
    __metadata("design:returntype", Promise)
], BackupModelsController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)('by-type'),
    (0, swagger_1.ApiOperation)({ summary: '根据模型类型获取备用模型' }),
    (0, swagger_1.ApiQuery)({ name: 'modelType', required: true, enum: ['text', 'image', 'video'] }),
    __param(0, (0, common_1.Query)('modelType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BackupModelsController.prototype, "findByType", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: '搜索备用模型' }),
    (0, swagger_1.ApiQuery)({ name: 'keyword', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'pageSize', required: false, type: Number }),
    __param(0, (0, common_1.Query)('keyword')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], BackupModelsController.prototype, "search", null);
BackupModelsController = __decorate([
    (0, swagger_1.ApiTags)('备用模型管理'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Controller)('backup/models'),
    __metadata("design:paramtypes", [backup_models_service_1.BackupModelsService])
], BackupModelsController);
exports.BackupModelsController = BackupModelsController;
