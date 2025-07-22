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
var XhsTemplateController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.XhsTemplateController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const template_dto_1 = require("./dto/template.dto");
const template_service_1 = require("./template.service");
const swagger_1 = require("@nestjs/swagger");
const adminAuth_guard_1 = require("../../common/auth/adminAuth.guard");
const path = require("path");
const fs = require("fs");
let XhsTemplateController = XhsTemplateController_1 = class XhsTemplateController {
    constructor(templateService) {
        this.templateService = templateService;
        this.logger = new common_1.Logger(XhsTemplateController_1.name);
    }
    async findAll(page = 1, pageSize = 10, keyword = '') {
        try {
            const data = await this.templateService.findAll(Number(page), Number(pageSize), keyword);
            return {
                success: true,
                data
            };
        }
        catch (error) {
            this.logger.error(`获取模板列表失败: ${error.message}`);
            return {
                success: false,
                message: error.message || '获取模板列表失败'
            };
        }
    }
    async findOne(id) {
        try {
            const data = await this.templateService.findOne(Number(id));
            return {
                success: true,
                data
            };
        }
        catch (error) {
            this.logger.error(`获取模板详情失败: ${error.message}`);
            return {
                success: false,
                message: error.message || '获取模板详情失败'
            };
        }
    }
    async uploadFile(file) {
        try {
            this.logger.log(`接收到文件上传请求: ${(file === null || file === void 0 ? void 0 : file.originalname) || '未知文件'}`);
            if (!file) {
                this.logger.error('未检测到上传文件');
                return {
                    success: false,
                    message: '未检测到上传文件'
                };
            }
            this.logger.log(`文件信息: 名称=${file.originalname}, 大小=${file.size}字节, 类型=${file.mimetype}`);
            if (!file.buffer || file.buffer.length === 0) {
                this.logger.error(`文件buffer无效: ${file.originalname}`);
                return {
                    success: false,
                    message: '文件内容为空或已损坏'
                };
            }
            const filePath = await this.templateService.uploadTemplateFile(file);
            this.logger.log(`文件上传成功: ${filePath}`);
            return {
                success: true,
                data: {
                    filePath,
                    fileSize: Math.round(file.size / 1024),
                    fileName: file.originalname
                }
            };
        }
        catch (error) {
            const errorMessage = error instanceof common_1.HttpException
                ? error.message
                : error.message || '上传模板文件失败';
            this.logger.error(`上传模板文件失败: ${errorMessage}`, error.stack);
            return {
                success: false,
                message: errorMessage
            };
        }
    }
    async create(createDto) {
        try {
            const fileInfo = await this.getFileInfo(createDto['filePath']);
            const data = await this.templateService.create(createDto, createDto['filePath'], fileInfo.fileSize || 0);
            return {
                success: true,
                data
            };
        }
        catch (error) {
            this.logger.error(`创建模板失败: ${error.message}`);
            return {
                success: false,
                message: error.message || '创建模板失败'
            };
        }
    }
    async update(updateDto) {
        try {
            let fileInfo = null;
            if (updateDto['filePath']) {
                fileInfo = await this.getFileInfo(updateDto['filePath']);
            }
            const data = await this.templateService.update(updateDto, updateDto['filePath'], fileInfo === null || fileInfo === void 0 ? void 0 : fileInfo.fileSize);
            return {
                success: true,
                data
            };
        }
        catch (error) {
            this.logger.error(`更新模板失败: ${error.message}`);
            return {
                success: false,
                message: error.message || '更新模板失败'
            };
        }
    }
    async updateStatus(updateStatusDto) {
        try {
            const data = await this.templateService.updateStatus(updateStatusDto);
            return {
                success: true,
                data
            };
        }
        catch (error) {
            this.logger.error(`更新模板状态失败: ${error.message}`);
            return {
                success: false,
                message: error.message || '更新模板状态失败'
            };
        }
    }
    async delete(deleteDto) {
        try {
            const data = await this.templateService.delete(deleteDto);
            return {
                success: true,
                data
            };
        }
        catch (error) {
            this.logger.error(`删除模板失败: ${error.message}`);
            return {
                success: false,
                message: error.message || '删除模板失败'
            };
        }
    }
    async download(id, res) {
        try {
            const template = await this.templateService.findOne(Number(id));
            if (!template) {
                return res.status(common_1.HttpStatus.NOT_FOUND).json({
                    success: false,
                    message: '模板不存在'
                });
            }
            const filePath = path.join(process.cwd(), template.filePath);
            if (!fs.existsSync(filePath)) {
                return res.status(common_1.HttpStatus.NOT_FOUND).json({
                    success: false,
                    message: '文件不存在'
                });
            }
            await this.templateService.incrementUsageCount(Number(id));
            const fileName = path.basename(template.filePath);
            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
            });
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        }
        catch (error) {
            this.logger.error(`下载模板失败: ${error.message}`);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || '下载模板失败'
            });
        }
    }
    async getFileInfo(filePath) {
        try {
            const fullPath = path.join(process.cwd(), filePath);
            if (fs.existsSync(fullPath)) {
                const stats = fs.statSync(fullPath);
                return {
                    fileSize: Math.round(stats.size / 1024)
                };
            }
            return { fileSize: 0 };
        }
        catch (error) {
            this.logger.error(`获取文件信息失败: ${error.message}`);
            return { fileSize: 0 };
        }
    }
};
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('keyword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], XhsTemplateController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('detail'),
    __param(0, (0, common_1.Query)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], XhsTemplateController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: {
            fileSize: 20 * 1024 * 1024,
        },
        fileFilter: (req, file, callback) => {
            const allowedExtensions = ['.ppt', '.pptx'];
            const ext = path.extname(file.originalname).toLowerCase();
            if (!allowedExtensions.includes(ext)) {
                return callback(new common_1.HttpException('只支持PPT格式文件(.ppt, .pptx)', common_1.HttpStatus.BAD_REQUEST), false);
            }
            callback(null, true);
        }
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], XhsTemplateController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [template_dto_1.CreateTemplateDto]),
    __metadata("design:returntype", Promise)
], XhsTemplateController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [template_dto_1.UpdateTemplateDto]),
    __metadata("design:returntype", Promise)
], XhsTemplateController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('update-status'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [template_dto_1.UpdateTemplateStatusDto]),
    __metadata("design:returntype", Promise)
], XhsTemplateController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)('delete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [template_dto_1.DeleteTemplateDto]),
    __metadata("design:returntype", Promise)
], XhsTemplateController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)('download'),
    __param(0, (0, common_1.Query)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], XhsTemplateController.prototype, "download", null);
XhsTemplateController = XhsTemplateController_1 = __decorate([
    (0, common_1.Controller)('template'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(adminAuth_guard_1.AdminAuthGuard),
    __metadata("design:paramtypes", [template_service_1.XhsTemplateService])
], XhsTemplateController);
exports.XhsTemplateController = XhsTemplateController;
