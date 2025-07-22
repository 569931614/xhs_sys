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
exports.PromptLibController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const adminAuth_guard_1 = require("../../common/auth/adminAuth.guard");
const superAuth_guard_1 = require("../../common/auth/superAuth.guard");
const promptlib_service_1 = require("./promptlib.service");
const promptlib_dto_1 = require("./dto/promptlib.dto");
let PromptLibController = class PromptLibController {
    constructor(promptLibService) {
        this.promptLibService = promptLibService;
    }
    async queryPromptTemplates(query) {
        return this.promptLibService.queryPromptTemplates(query);
    }
    async getPromptTemplate(id) {
        return this.promptLibService.getPromptTemplate(id);
    }
    async createPromptTemplate(dto) {
        return this.promptLibService.createPromptTemplate(dto);
    }
    async updatePromptTemplate(dto) {
        return this.promptLibService.updatePromptTemplate(dto);
    }
    async deletePromptTemplate(dto) {
        return this.promptLibService.deletePromptTemplate(dto);
    }
};
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '查询提示词模板列表' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [promptlib_dto_1.QueryPromptTemplateDto]),
    __metadata("design:returntype", Promise)
], PromptLibController.prototype, "queryPromptTemplates", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取单个提示词模板' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PromptLibController.prototype, "getPromptTemplate", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '创建提示词模板' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(superAuth_guard_1.SuperAuthGuard),
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [promptlib_dto_1.CreatePromptTemplateDto]),
    __metadata("design:returntype", Promise)
], PromptLibController.prototype, "createPromptTemplate", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '更新提示词模板' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(superAuth_guard_1.SuperAuthGuard),
    (0, common_1.Post)('update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [promptlib_dto_1.UpdatePromptTemplateDto]),
    __metadata("design:returntype", Promise)
], PromptLibController.prototype, "updatePromptTemplate", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '删除提示词模板' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(superAuth_guard_1.SuperAuthGuard),
    (0, common_1.Post)('delete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [promptlib_dto_1.DeletePromptTemplateDto]),
    __metadata("design:returntype", Promise)
], PromptLibController.prototype, "deletePromptTemplate", null);
PromptLibController = __decorate([
    (0, swagger_1.ApiTags)('提示词模板'),
    (0, common_1.Controller)('promptlib'),
    __metadata("design:paramtypes", [promptlib_service_1.PromptLibService])
], PromptLibController);
exports.PromptLibController = PromptLibController;
