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
var MaterialController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const material_service_1 = require("./material.service");
const jwtAuth_guard_1 = require("../../common/auth/jwtAuth.guard");
const common_2 = require("@nestjs/common");
let MaterialController = MaterialController_1 = class MaterialController {
    constructor(materialService) {
        this.materialService = materialService;
        this.logger = new common_2.Logger(MaterialController_1.name);
    }
    async createFolder({ name }, req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        return this.materialService.createFolder(name, userId);
    }
    async getFolders(req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        this.logger.log(`获取文件夹列表，用户ID: ${userId || '未登录'}`);
        return this.materialService.getFolders(userId);
    }
    async getMaterials(req, folderId) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        return this.materialService.getMaterials(folderId, userId);
    }
    async uploadMaterial(file, folderId, req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        this.logger.log(`上传素材, 文件夹ID: ${folderId}, 用户ID: ${userId || '未登录'}`);
        return this.materialService.uploadMaterial(file, folderId, userId);
    }
    async deleteMaterial({ id }, req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        return this.materialService.deleteMaterial(id);
    }
    async deleteFolder(body, req) {
        var _a;
        this.logger.log(`删除文件夹请求体: ${JSON.stringify(body)}`);
        const id = body === null || body === void 0 ? void 0 : body.id;
        if (!id) {
            this.logger.error('请求中没有提供文件夹ID');
            throw new common_1.BadRequestException('请求中必须包含文件夹ID');
        }
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        this.logger.log(`开始删除文件夹，ID: ${id}, 用户ID: ${userId || '未登录'}`);
        try {
            const result = await this.materialService.deleteFolder(id, userId);
            this.logger.log(`文件夹删除结果: ${JSON.stringify(result)}`);
            return result;
        }
        catch (error) {
            this.logger.error(`删除文件夹失败: ${error.message}`, error.stack);
            throw error;
        }
    }
    async selectMaterials({ folderIds, count }, req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        return this.materialService.selectMaterials(folderIds, count, userId);
    }
    async checkMaterialValidity(materialId, req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        return this.materialService.checkMaterialValidity(materialId, userId);
    }
};
__decorate([
    (0, common_1.Post)('folders'),
    (0, swagger_1.ApiOperation)({ summary: '创建素材文件夹' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MaterialController.prototype, "createFolder", null);
__decorate([
    (0, common_1.Get)('folders'),
    (0, swagger_1.ApiOperation)({ summary: '获取所有素材文件夹' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MaterialController.prototype, "getFolders", null);
__decorate([
    (0, common_1.Get)('files'),
    (0, swagger_1.ApiOperation)({ summary: '获取素材文件列表' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('folderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MaterialController.prototype, "getMaterials", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, swagger_1.ApiOperation)({ summary: '上传素材' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('folderId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MaterialController.prototype, "uploadMaterial", null);
__decorate([
    (0, common_1.Post)('files/delete'),
    (0, swagger_1.ApiOperation)({ summary: '删除素材' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MaterialController.prototype, "deleteMaterial", null);
__decorate([
    (0, common_1.Post)('folders/delete'),
    (0, swagger_1.ApiOperation)({ summary: '删除素材文件夹' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MaterialController.prototype, "deleteFolder", null);
__decorate([
    (0, common_1.Post)('select'),
    (0, swagger_1.ApiOperation)({ summary: '从素材库选择素材' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MaterialController.prototype, "selectMaterials", null);
__decorate([
    (0, common_1.Get)('check/:materialId'),
    (0, swagger_1.ApiOperation)({ summary: '检查素材是否有效，如果过期则刷新' }),
    __param(0, (0, common_1.Param)('materialId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MaterialController.prototype, "checkMaterialValidity", null);
MaterialController = MaterialController_1 = __decorate([
    (0, swagger_1.ApiTags)('material'),
    (0, common_1.Controller)('material'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [material_service_1.MaterialService])
], MaterialController);
exports.MaterialController = MaterialController;
