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
exports.CustomPageController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const customPage_service_1 = require("./customPage.service");
const customPage_dto_1 = require("./dto/customPage.dto");
let CustomPageController = class CustomPageController {
    constructor(customPageService) {
        this.customPageService = customPageService;
    }
    async create(createCustomPageDto) {
        return {
            code: 200,
            message: '创建成功',
            data: await this.customPageService.create(createCustomPageDto),
        };
    }
    async update(id, updateCustomPageDto) {
        return {
            code: 200,
            message: '更新成功',
            data: await this.customPageService.update(+id, updateCustomPageDto),
        };
    }
    async remove(id) {
        await this.customPageService.remove(+id);
        return {
            code: 200,
            message: '删除成功',
        };
    }
    async findAll(query) {
        return {
            code: 200,
            message: '获取成功',
            data: await this.customPageService.findAll(query),
        };
    }
    async getEnabledPages() {
        return {
            code: 200,
            message: '获取成功',
            data: await this.customPageService.getEnabledPages(),
        };
    }
    async findOne(id) {
        return {
            code: 200,
            message: '获取成功',
            data: await this.customPageService.findById(+id),
        };
    }
};
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '创建自定义页面' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [customPage_dto_1.CreateCustomPageDto]),
    __metadata("design:returntype", Promise)
], CustomPageController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '更新自定义页面' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customPage_dto_1.UpdateCustomPageDto]),
    __metadata("design:returntype", Promise)
], CustomPageController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '删除自定义页面' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomPageController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '获取自定义页面列表' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [customPage_dto_1.CustomPageListDto]),
    __metadata("design:returntype", Promise)
], CustomPageController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('public/list'),
    (0, swagger_1.ApiOperation)({ summary: '获取启用的自定义页面列表（前台展示）' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CustomPageController.prototype, "getEnabledPages", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '获取自定义页面详情' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomPageController.prototype, "findOne", null);
CustomPageController = __decorate([
    (0, swagger_1.ApiTags)('自定义页面'),
    (0, common_1.Controller)('customPage'),
    __metadata("design:paramtypes", [customPage_service_1.CustomPageService])
], CustomPageController);
exports.CustomPageController = CustomPageController;
