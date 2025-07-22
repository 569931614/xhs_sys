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
exports.HtmlLibController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const adminAuth_guard_1 = require("../../common/auth/adminAuth.guard");
const htmllib_service_1 = require("./htmllib.service");
const htmllib_dto_1 = require("./dto/htmllib.dto");
const platform_express_1 = require("@nestjs/platform-express");
const path = require("path");
let HtmlLibController = class HtmlLibController {
    constructor(htmlLibService) {
        this.htmlLibService = htmlLibService;
    }
    async queryHtmlTemplates(query) {
        return this.htmlLibService.queryHtmlTemplates(query);
    }
    async getHtmlTemplate(id) {
        return this.htmlLibService.getHtmlTemplate(id);
    }
    async createHtmlTemplate(dto) {
        return this.htmlLibService.createHtmlTemplate(dto);
    }
    async updateHtmlTemplate(dto) {
        return this.htmlLibService.updateHtmlTemplate(dto);
    }
    async deleteHtmlTemplate(dto) {
        return this.htmlLibService.deleteHtmlTemplate(dto);
    }
    async uploadThumbnail(file) {
        try {
            if (!file) {
                throw new common_1.HttpException('未检测到上传文件', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!file.buffer || !file.originalname) {
                throw new common_1.HttpException('文件数据不完整', common_1.HttpStatus.BAD_REQUEST);
            }
            const thumbnailPath = await this.htmlLibService.uploadThumbnail(file);
            return {
                success: true,
                data: {
                    thumbnailPath,
                    fileSize: Math.round(file.size / 1024),
                    fileName: file.originalname
                }
            };
        }
        catch (error) {
            const errorMessage = error instanceof common_1.HttpException
                ? error.message
                : error.message || '上传模板缩略图失败';
            throw new common_1.HttpException(errorMessage, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '查询HTML模板列表' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [htmllib_dto_1.QueryHtmlTemplateDto]),
    __metadata("design:returntype", Promise)
], HtmlLibController.prototype, "queryHtmlTemplates", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取单个HTML模板' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HtmlLibController.prototype, "getHtmlTemplate", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '创建HTML模板' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [htmllib_dto_1.CreateHtmlTemplateDto]),
    __metadata("design:returntype", Promise)
], HtmlLibController.prototype, "createHtmlTemplate", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '更新HTML模板' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Post)('update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [htmllib_dto_1.UpdateHtmlTemplateDto]),
    __metadata("design:returntype", Promise)
], HtmlLibController.prototype, "updateHtmlTemplate", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '删除HTML模板' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Post)('delete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [htmllib_dto_1.DeleteHtmlTemplateDto]),
    __metadata("design:returntype", Promise)
], HtmlLibController.prototype, "deleteHtmlTemplate", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '上传HTML模板缩略图' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    (0, common_1.Post)('upload-thumbnail'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
        fileFilter: (req, file, callback) => {
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
            const ext = path.extname(file.originalname).toLowerCase();
            if (!allowedExtensions.includes(ext)) {
                return callback(new common_1.HttpException('只支持图片格式文件(.jpg, .jpeg, .png, .gif)', common_1.HttpStatus.BAD_REQUEST), false);
            }
            callback(null, true);
        }
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HtmlLibController.prototype, "uploadThumbnail", null);
HtmlLibController = __decorate([
    (0, swagger_1.ApiTags)('HTML模板'),
    (0, common_1.Controller)('htmllib'),
    __metadata("design:paramtypes", [htmllib_service_1.HtmlLibService])
], HtmlLibController);
exports.HtmlLibController = HtmlLibController;
