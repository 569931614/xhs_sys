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
exports.FontController = void 0;
const common_1 = require("@nestjs/common");
const font_service_1 = require("./font.service");
const create_font_dto_1 = require("./dto/create-font.dto");
const update_font_dto_1 = require("./dto/update-font.dto");
const query_font_dto_1 = require("./dto/query-font.dto");
const swagger_1 = require("@nestjs/swagger");
const adminAuth_guard_1 = require("../../common/auth/adminAuth.guard");
let FontController = class FontController {
    constructor(fontService) {
        this.fontService = fontService;
    }
    create(createFontDto) {
        return this.fontService.create(createFontDto);
    }
    findAll(query) {
        return this.fontService.findAll(query);
    }
    getAllAvailableFonts() {
        return this.fontService.getAllAvailableFonts();
    }
    fetchFontsFromApi() {
        return this.fontService.fetchFontsFromApi();
    }
    findOne(id) {
        return this.fontService.findOne(+id);
    }
    update(id, updateFontDto) {
        return this.fontService.update(+id, updateFontDto);
    }
    toggleStatus(id) {
        return this.fontService.toggleStatus(+id);
    }
    remove(id) {
        return this.fontService.remove(+id);
    }
    batchRemove(ids) {
        return this.fontService.batchRemove(ids);
    }
};
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建字体' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_font_dto_1.CreateFontDto]),
    __metadata("design:returntype", void 0)
], FontController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '查询字体列表' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_font_dto_1.QueryFontDto]),
    __metadata("design:returntype", void 0)
], FontController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('available'),
    (0, swagger_1.ApiOperation)({ summary: '获取所有可用字体' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FontController.prototype, "getAllAvailableFonts", null);
__decorate([
    (0, common_1.Get)('fetch-from-api'),
    (0, swagger_1.ApiOperation)({ summary: '从API获取字体数据' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FontController.prototype, "fetchFontsFromApi", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '查询单个字体' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FontController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新字体' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_font_dto_1.UpdateFontDto]),
    __metadata("design:returntype", void 0)
], FontController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/toggle-status'),
    (0, swagger_1.ApiOperation)({ summary: '切换字体状态' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FontController.prototype, "toggleStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除字体' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FontController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('batch-remove'),
    (0, swagger_1.ApiOperation)({ summary: '批量删除字体' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], FontController.prototype, "batchRemove", null);
FontController = __decorate([
    (0, swagger_1.ApiTags)('字体管理'),
    (0, common_1.Controller)('font'),
    __metadata("design:paramtypes", [font_service_1.FontService])
], FontController);
exports.FontController = FontController;
