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
exports.XhsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const xhs_service_1 = require("./xhs.service");
const xhs_dto_1 = require("./dto/xhs.dto");
const jwtAuth_guard_1 = require("../../common/auth/jwtAuth.guard");
const ExcelJS = require("exceljs");
const platform_express_1 = require("@nestjs/platform-express");
let XhsController = class XhsController {
    constructor(xhsService) {
        this.xhsService = xhsService;
    }
    async create(createXhsPostDto, req) {
        const userId = req.user.id;
        createXhsPostDto.userId = userId;
        console.log('创建小红书帖子请求:', {
            body: createXhsPostDto,
            query: req.query,
            hasActivityId: !!createXhsPostDto.activityId
        });
        return {
            code: 200,
            message: '创建成功',
            data: await this.xhsService.create(createXhsPostDto, userId),
        };
    }
    async findAll(query, req) {
        const { isUsed } = query;
        let params = Object.assign({}, query);
        params.userId = req.user.id;
        return {
            code: 200,
            message: '获取成功',
            data: await this.xhsService.findAll(params),
        };
    }
    async importExcel(file, req) {
        try {
            if (!file) {
                return {
                    code: 400,
                    message: '请上传Excel文件',
                    data: null,
                };
            }
            const userId = req.user.id;
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(file.buffer);
            const worksheet = workbook.getWorksheet(1);
            if (!worksheet) {
                return {
                    code: 400,
                    message: 'Excel文件格式错误：找不到工作表',
                    data: null,
                };
            }
            const posts = [];
            const validationErrors = [];
            let totalRows = 0;
            let validRows = 0;
            const activityId = req.query.activityId ? String(req.query.activityId) : null;
            worksheet.eachRow({ includeEmpty: false }, (row, rowIndex) => {
                if (rowIndex === 1)
                    return;
                totalRows++;
                let isRowValid = true;
                const rowData = {
                    title: row.getCell(1).text.trim(),
                    content: row.getCell(2).text.trim(),
                    type: row.getCell(3).text.trim(),
                    image1: row.getCell(4).text.trim(),
                    image2: row.getCell(5).text.trim(),
                    image3: row.getCell(6).text.trim(),
                    image4: row.getCell(7).text.trim(),
                    image5: row.getCell(8).text.trim(),
                    image6: row.getCell(9).text.trim(),
                    image7: row.getCell(10).text.trim(),
                    image8: row.getCell(11).text.trim(),
                    image9: row.getCell(12).text.trim(),
                };
                const validPost = {
                    title: '',
                    content: '',
                    type: 'normal',
                    images: [],
                    userId: userId,
                };
                if (activityId) {
                    validPost['activityId'] = activityId;
                }
                if (!rowData.title && !rowData.content) {
                    validationErrors.push(`第${rowIndex}行: 标题和内容至少填写一项`);
                    isRowValid = false;
                }
                else {
                    validPost.title = rowData.title || '';
                    validPost.content = rowData.content || '';
                }
                if (!rowData.type || (rowData.type !== 'normal' && rowData.type !== 'video')) {
                    validationErrors.push(`第${rowIndex}行: 类型必须是 "normal"(图文) 或 "video"(视频)`);
                    isRowValid = false;
                }
                else {
                    validPost.type = rowData.type;
                }
                const imageUrls = [
                    rowData.image1, rowData.image2, rowData.image3, rowData.image4,
                    rowData.image5, rowData.image6, rowData.image7, rowData.image8, rowData.image9
                ].filter(url => url && url.trim() !== '');
                if (rowData.type === 'normal') {
                    if (imageUrls.length === 0) {
                        validationErrors.push(`第${rowIndex}行: 图文帖子至少需要1张图片`);
                        isRowValid = false;
                    }
                    else if (imageUrls.length > 9) {
                        validationErrors.push(`第${rowIndex}行: 图文帖子最多只能有9张图片`);
                        isRowValid = false;
                    }
                    else {
                        validPost.images = imageUrls;
                    }
                }
                else if (rowData.type === 'video') {
                    if (imageUrls.length !== 1) {
                        validationErrors.push(`第${rowIndex}行: 视频帖子只能有1张封面图`);
                        isRowValid = false;
                    }
                    else {
                        validPost.images = imageUrls;
                    }
                }
                if (isRowValid) {
                    validRows++;
                    posts.push(validPost);
                }
            });
            if (posts.length === 0) {
                return {
                    code: 400,
                    message: '导入失败：没有有效的帖子数据',
                    data: {
                        total: totalRows,
                        success: 0,
                        fail: totalRows,
                        errors: validationErrors
                    },
                };
            }
            const createdPosts = [];
            const createErrors = [];
            for (const post of posts) {
                try {
                    const createdPost = await this.xhsService.create(post, userId);
                    createdPosts.push(createdPost);
                }
                catch (error) {
                    console.error('创建帖子失败:', error);
                    createErrors.push(`创建失败: ${error.message || JSON.stringify(error)}`);
                }
            }
            return {
                code: 200,
                message: createdPosts.length > 0 ? '导入成功' : '导入部分成功',
                data: {
                    total: totalRows,
                    success: createdPosts.length,
                    fail: totalRows - createdPosts.length,
                    errors: [...validationErrors, ...createErrors]
                },
            };
        }
        catch (error) {
            console.error('导入Excel出错:', error);
            return {
                code: 500,
                message: '导入失败: ' + (error.message || '服务器错误'),
                data: null,
            };
        }
    }
    async findOne(id) {
        return {
            code: 200,
            message: '获取成功',
            data: await this.xhsService.findOne(id),
        };
    }
    async update(id, updateXhsPostDto, req) {
        var _a, _b, _c;
        const userId = req.user.id;
        console.log('更新小红书帖子请求:', {
            id,
            userId,
            updateData: {
                title: updateXhsPostDto.title,
                contentPreview: updateXhsPostDto.content ? updateXhsPostDto.content.substring(0, 50) + '...' : null,
                hasContent: !!updateXhsPostDto.content,
                imageCount: ((_a = updateXhsPostDto.images) === null || _a === void 0 ? void 0 : _a.length) || 0,
                imageUrls: ((_b = updateXhsPostDto.images) === null || _b === void 0 ? void 0 : _b.slice(0, 2).map(url => url.substring(0, 30) + '...')) || []
            },
            headers: req.headers
        });
        try {
            console.log(`[1] 开始处理更新请求，ID: ${id}`);
            console.log(`[2] 获取原始笔记信息，ID: ${id}`);
            const originalPost = await this.xhsService.findOne(id);
            console.log(`[3] 获取原始笔记成功:`, {
                id: originalPost.id,
                userId: originalPost.userId,
                title: originalPost.title,
                hasImages: originalPost.images && originalPost.images.length > 0
            });
            if (originalPost.userId !== userId) {
                console.warn(`[4] 权限验证失败: 笔记所有者(${originalPost.userId}) 不匹配请求用户(${userId})`);
                return {
                    code: 403,
                    message: '无权修改此笔记',
                    data: null
                };
            }
            console.log(`[5] 权限验证通过`);
            if (!updateXhsPostDto.images && originalPost.images && originalPost.images.length > 0) {
                console.log(`[6] 保留原始图片:`, originalPost.images.length);
                updateXhsPostDto.images = originalPost.images;
            }
            console.log(`[7] 开始执行更新操作`);
            try {
                const updatedPost = await this.xhsService.update(id, updateXhsPostDto);
                console.log(`[8] 更新成功:`, {
                    id: updatedPost.id,
                    title: updatedPost.title,
                    imageCount: ((_c = updatedPost.images) === null || _c === void 0 ? void 0 : _c.length) || 0
                });
                return {
                    code: 200,
                    message: '更新成功',
                    data: updatedPost,
                };
            }
            catch (updateError) {
                console.error(`[8-Error] 更新操作失败:`, updateError);
                if (updateError instanceof Error) {
                    console.error(`[8-Error-Detail] 错误名称: ${updateError.name}, 错误消息: ${updateError.message}, 堆栈: ${updateError.stack}`);
                }
                throw updateError;
            }
        }
        catch (error) {
            console.error('[Error] 更新笔记失败:', error);
            if (error instanceof Error) {
                console.error(`[Error-Detail] 错误名称: ${error.name}, 错误消息: ${error.message}`);
                console.error(`[Error-Stack] ${error.stack}`);
            }
            else {
                console.error(`[Error-Unknown] 未知错误类型:`, error);
            }
            return {
                code: 500,
                message: `更新失败: ${error.message || '服务器错误'}`,
                data: null
            };
        }
    }
    async remove(id, req) {
        const userId = req.user.id;
        await this.xhsService.remove(id);
        return {
            code: 200,
            message: '删除成功',
            data: null,
        };
    }
    async markUsed(id) {
        return {
            code: 200,
            message: '标记成功',
            data: await this.xhsService.markUsed(id),
        };
    }
    async markDiscarded(id) {
        return {
            code: 200,
            message: '标记为弃用成功',
            data: await this.xhsService.markDiscarded(id),
        };
    }
    async markDouyinUsed(id) {
        return {
            code: 200,
            message: '标记为抖音已使用成功',
            data: await this.xhsService.markUsed(id, 'douyin'),
        };
    }
};
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建小红书帖子' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [xhs_dto_1.CreateXhsPostDto, Object]),
    __metadata("design:returntype", Promise)
], XhsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取小红书帖子列表' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [xhs_dto_1.XhsPostListDto, Object]),
    __metadata("design:returntype", Promise)
], XhsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, swagger_1.ApiOperation)({ summary: '导入Excel批量创建小红书帖子' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], XhsController.prototype, "importExcel", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取小红书帖子详情' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], XhsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '更新小红书帖子',
        description: '修改已生成的笔记，支持更新标题、正文内容和图片'
    }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiBody)({
        description: '可以更新笔记的标题、内容和图片',
        type: xhs_dto_1.UpdateXhsPostDto,
        examples: {
            '修改标题和内容': {
                value: {
                    title: '新的笔记标题',
                    content: '新的笔记内容'
                }
            },
            '修改图片': {
                value: {
                    images: ['http://example.com/image1.jpg', 'http://example.com/image2.jpg']
                }
            },
            '全部修改': {
                value: {
                    title: '新的笔记标题',
                    content: '新的笔记内容',
                    images: ['http://example.com/image1.jpg', 'http://example.com/image2.jpg']
                }
            }
        }
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, xhs_dto_1.UpdateXhsPostDto, Object]),
    __metadata("design:returntype", Promise)
], XhsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除小红书帖子' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], XhsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/used'),
    (0, swagger_1.ApiOperation)({ summary: '标记小红书帖子为已使用' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], XhsController.prototype, "markUsed", null);
__decorate([
    (0, common_1.Post)(':id/discard'),
    (0, swagger_1.ApiOperation)({ summary: '标记小红书帖子为弃用' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], XhsController.prototype, "markDiscarded", null);
__decorate([
    (0, common_1.Post)(':id/douyin-used'),
    (0, swagger_1.ApiOperation)({ summary: '标记小红书帖子为抖音已使用' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], XhsController.prototype, "markDouyinUsed", null);
XhsController = __decorate([
    (0, swagger_1.ApiTags)('小红书'),
    (0, common_1.Controller)('xhs'),
    __metadata("design:paramtypes", [xhs_service_1.XhsService])
], XhsController);
exports.XhsController = XhsController;
