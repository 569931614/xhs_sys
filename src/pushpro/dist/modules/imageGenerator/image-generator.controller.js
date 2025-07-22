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
exports.ImageGeneratorController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const image_generator_service_1 = require("./image-generator.service");
const create_image_dto_1 = require("./dto/create-image.dto");
const jwtAuth_guard_1 = require("../../common/auth/jwtAuth.guard");
const platform_express_1 = require("@nestjs/platform-express");
let ImageGeneratorController = class ImageGeneratorController {
    constructor(imageGeneratorService) {
        this.imageGeneratorService = imageGeneratorService;
    }
    async generateImage(createImageDto, req) {
        var _a, _b;
        const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || '';
        return this.imageGeneratorService.generateImage(createImageDto, userId);
    }
    async getUserImageTasks(req, page = 1, limit = 10) {
        var _a, _b;
        const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || '';
        return this.imageGeneratorService.getUserImageTasks(userId, +page, +limit);
    }
    async getUserHistory(req, page = 1, limit = 20) {
        var _a, _b;
        const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || '';
        console.log(`获取用户${userId}的历史记录，该操作会自动清理1天前的数据`);
        return this.imageGeneratorService.getUserHistoryTasks(userId, +page, +limit);
    }
    async getTaskDetail(taskId, req) {
        var _a, _b;
        const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) || '';
        return this.imageGeneratorService.getTaskDetail(+taskId, userId);
    }
    async downloadImage(taskId) {
        return this.imageGeneratorService.downloadImage(taskId);
    }
    async uploadImage(file, body, req) {
        try {
            if (!file) {
                return {
                    code: 400,
                    data: null,
                    message: '未检测到上传的文件'
                };
            }
            const fileName = body.fileName || file.originalname || 'upload.png';
            const contentType = file.mimetype || 'image/png';
            return this.imageGeneratorService.uploadImage(file.buffer, fileName, contentType);
        }
        catch (error) {
            console.error('上传图片控制器出错:', error);
            return {
                code: 500,
                data: null,
                message: error.message || '上传图片失败'
            };
        }
    }
};
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '生成图片' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '生成成功',
        schema: {
            type: 'object',
            properties: {
                code: { type: 'number', example: 200 },
                data: {
                    type: 'object',
                    properties: {
                        keyword: { type: 'string', example: '0基础小白如何做自媒体' },
                        type: { type: 'string', example: 'theme' },
                        urls: {
                            type: 'array',
                            items: { type: 'string' },
                            example: [
                                'https://pri-cdn-oss.chuangkit.com/svg_build/render_result/example1',
                                'https://pri-cdn-oss.chuangkit.com/svg_build/render_result/example2'
                            ]
                        }
                    }
                },
                message: { type: 'string', example: '创建AI封面成功' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.BAD_REQUEST, description: '参数错误' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_image_dto_1.CreateImageDto, Object]),
    __metadata("design:returntype", Promise)
], ImageGeneratorController.prototype, "generateImage", null);
__decorate([
    (0, common_1.Get)('tasks'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '获取用户的图片生成任务列表' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: '页码', type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: '每页数量', type: Number }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: '获取成功' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ImageGeneratorController.prototype, "getUserImageTasks", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '获取用户的历史生成记录（自动清理1天前的数据）' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: '页码', type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: '每页数量', type: Number }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '获取成功',
        schema: {
            type: 'object',
            properties: {
                code: { type: 'number', example: 200 },
                data: {
                    type: 'object',
                    properties: {
                        history: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'number', example: 1 },
                                    prompt: { type: 'string', example: '0基础小白如何做自媒体' },
                                    createTime: { type: 'string', example: '2023-06-02T10:30:00.000Z' },
                                    mainImageUrl: { type: 'string', example: 'https://example.com/image.jpg' },
                                    imageCount: { type: 'number', example: 10 },
                                    imageUrls: {
                                        type: 'array',
                                        items: { type: 'string' }
                                    }
                                }
                            }
                        },
                        total: { type: 'number', example: 50 },
                        page: { type: 'number', example: 1 },
                        limit: { type: 'number', example: 20 }
                    }
                },
                message: { type: 'string', example: '获取历史生成记录成功' }
            }
        }
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ImageGeneratorController.prototype, "getUserHistory", null);
__decorate([
    (0, common_1.Get)('task'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '获取任务详情' }),
    (0, swagger_1.ApiQuery)({ name: 'taskId', required: true, description: '任务ID', type: Number }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: '获取成功' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: '任务不存在' }),
    __param(0, (0, common_1.Query)('taskId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ImageGeneratorController.prototype, "getTaskDetail", null);
__decorate([
    (0, common_1.Get)('download'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '获取图片下载链接' }),
    (0, swagger_1.ApiQuery)({ name: 'taskId', required: true, description: '任务ID', type: String }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '获取下载链接成功',
        schema: {
            type: 'object',
            properties: {
                code: { type: 'number', example: 200 },
                data: {
                    type: 'object',
                    properties: {
                        downloadUrl: { type: 'string', example: 'https://example.com/download/image.jpg' }
                    }
                },
                message: { type: 'string', example: '获取下载链接成功' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.BAD_REQUEST, description: '获取下载链接失败' }),
    __param(0, (0, common_1.Query)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ImageGeneratorController.prototype, "downloadImage", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '上传图片' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: '要上传的图片文件'
                },
                fileName: {
                    type: 'string',
                    description: '文件名'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '上传成功',
        schema: {
            type: 'object',
            properties: {
                code: { type: 'number', example: 200 },
                data: {
                    type: 'object',
                    properties: {
                        imageId: { type: 'string', example: '12345678' },
                        url: { type: 'string', example: 'https://pri-cdn-oss.chuangkit.com/svg_build/render_result/12345678' }
                    }
                },
                message: { type: 'string', example: '图片上传成功' }
            }
        }
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ImageGeneratorController.prototype, "uploadImage", null);
ImageGeneratorController = __decorate([
    (0, swagger_1.ApiTags)('图片生成'),
    (0, common_1.Controller)('image-generator'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [image_generator_service_1.ImageGeneratorService])
], ImageGeneratorController);
exports.ImageGeneratorController = ImageGeneratorController;
