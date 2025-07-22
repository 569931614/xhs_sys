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
var HtmlRenderController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlRenderController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const html_render_service_1 = require("./html-render.service");
const htmllib_render_dto_1 = require("./dto/htmllib-render.dto");
const public_decorator_1 = require("../../decorators/public.decorator");
const renderTemplateToImage_dto_1 = require("./renderTemplateToImage.dto");
const async_render_dto_1 = require("./dto/async-render.dto");
const QRCode = require("qrcode");
let HtmlRenderController = HtmlRenderController_1 = class HtmlRenderController {
    constructor(htmlRenderService) {
        this.htmlRenderService = htmlRenderService;
        this.logger = new common_1.Logger(HtmlRenderController_1.name);
    }
    async getHtmlCode(renderDto, response) {
        return await this.getHtmlCodeWithRetry(renderDto, response, 0);
    }
    async getHtmlCodeWithRetry(renderDto, response, retryCount) {
        var _a, _b, _c, _d, _e;
        try {
            const textMode = renderDto.textMode === true;
            const generateAiContent = renderDto.generateAiContent === true;
            const content = renderDto.content || '';
            const convertToImage = renderDto.convertToImage === true;
            const useId = renderDto.useId === true;
            const result = await this.htmlRenderService.renderTemplateToHtml(renderDto.templateName || '', renderDto.imageUrls || [], renderDto.textReplacements || [], renderDto.wrapHtml !== undefined ? renderDto.wrapHtml : false, generateAiContent, content, useId);
            let htmlContent = result.html;
            if (convertToImage) {
                try {
                    const imageResult = await this.htmlRenderService.htmlToImage(htmlContent, {
                        width: (_a = renderDto.imageOptions) === null || _a === void 0 ? void 0 : _a.width,
                        height: (_b = renderDto.imageOptions) === null || _b === void 0 ? void 0 : _b.height,
                        quality: (_c = renderDto.imageOptions) === null || _c === void 0 ? void 0 : _c.quality,
                        type: (_d = renderDto.imageOptions) === null || _d === void 0 ? void 0 : _d.type,
                        uploadToSuperbed: (_e = renderDto.imageOptions) === null || _e === void 0 ? void 0 : _e.uploadToSuperbed
                    });
                    return response.json({
                        success: true,
                        data: {
                            templateName: result.templateName,
                            imageUrl: imageResult.superImageUrl || imageResult.url,
                            localUrl: imageResult.url,
                            fileName: imageResult.fileName
                        }
                    });
                }
                catch (error) {
                    if (retryCount < 3) {
                        this.logger.error(`HTML转图片失败，将在${Math.pow(2, retryCount) * 5}秒后重试 (尝试 ${retryCount + 1}/4): ${error.message}`);
                        const delaySeconds = Math.pow(2, retryCount) * 5;
                        return new Promise((resolve) => {
                            setTimeout(() => {
                                resolve(this.getHtmlCodeWithRetry(renderDto, response, retryCount + 1));
                            }, delaySeconds * 1000);
                        });
                    }
                    return response.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: `HTML转图片失败 (已重试${retryCount}次): ${error.message}`
                    });
                }
            }
            if (textMode || renderDto.rawHtml === true) {
                response.setHeader('Content-Type', textMode ? 'text/plain; charset=utf-8' : 'text/html; charset=utf-8');
                return response.send(htmlContent);
            }
            const responseData = {
                success: true,
                data: {
                    html: htmlContent
                }
            };
            if (result.templateName) {
                responseData.data.templateName = result.templateName;
            }
            return response.json(responseData);
        }
        catch (error) {
            if (retryCount < 3) {
                this.logger.error(`HTML生成失败，将在${Math.pow(2, retryCount) * 5}秒后重试 (尝试 ${retryCount + 1}/4): ${error.message}`);
                const delaySeconds = Math.pow(2, retryCount) * 5;
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(this.getHtmlCodeWithRetry(renderDto, response, retryCount + 1));
                    }, delaySeconds * 1000);
                });
            }
            const statusCode = error instanceof common_1.HttpException
                ? error.getStatus()
                : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            const errorMessage = error instanceof common_1.HttpException
                ? error.message
                : `HTML生成失败 (已重试${retryCount}次): ${error.message}`;
            return response.status(statusCode).json({
                success: false,
                message: errorMessage
            });
        }
    }
    async getTemplateDetails(templateName) {
        try {
            const template = await this.htmlRenderService.getTemplateByName(templateName);
            let textDetailsArray = [];
            if (template.textDetails) {
                try {
                    textDetailsArray = JSON.parse(template.textDetails);
                }
                catch (error) {
                    console.error(`解析模板${templateName}的textDetails失败:`, error.message);
                }
            }
            return {
                success: true,
                data: {
                    id: template.id,
                    name: template.name,
                    htmlCode: template.htmlCode,
                    imageCount: template.imageCount,
                    textDetails: textDetailsArray,
                    status: template.status
                }
            };
        }
        catch (error) {
            const statusCode = error instanceof common_1.HttpException
                ? error.getStatus()
                : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            const errorMessage = error instanceof common_1.HttpException
                ? error.message
                : '获取模板详情失败';
            throw new common_1.HttpException({
                success: false,
                message: errorMessage
            }, statusCode);
        }
    }
    async htmlToImage(body) {
        try {
            if (!body.html) {
                throw new common_1.HttpException('HTML内容不能为空', common_1.HttpStatus.BAD_REQUEST);
            }
            const useAutoDetect = body.useAutoDetect !== false;
            this.logger.log(`将HTML转换为图片，自动检测宽高: ${useAutoDetect}`);
            const result = await this.htmlRenderService.htmlToImage(body.html, {
                width: body.width,
                height: body.height,
                quality: body.quality,
                type: body.type,
                selector: body.selector,
                uploadToSuperbed: body.uploadToSuperbed,
                useAutoWidth: useAutoDetect
            });
            return {
                success: true,
                data: result
            };
        }
        catch (error) {
            const statusCode = error instanceof common_1.HttpException
                ? error.getStatus()
                : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            throw new common_1.HttpException({
                success: false,
                message: error.message || 'HTML转图片失败'
            }, statusCode);
        }
    }
    async renderTemplateToImage(dto) {
        try {
            this.logger.log(`接收到渲染模板请求: ${dto.templateName}, 自动宽度检测: ${dto.useAutoWidth !== false}`);
            const result = await this.htmlRenderService.renderTemplateToImage(dto.templateName, dto.imageUrls, dto.textReplacements, {
                width: dto.width,
                height: dto.height,
                quality: dto.quality,
                type: dto.type,
                selector: dto.selector,
                generateAiContent: dto.generateAiContent,
                content: dto.content,
                uploadToSuperbed: dto.uploadToSuperbed,
                useAutoWidth: dto.useAutoWidth !== false,
                useId: dto.useId === true
            });
            return { code: 200, msg: '渲染成功', data: result };
        }
        catch (error) {
            this.logger.error(`渲染模板为图片失败: ${error.message}`);
            throw new common_1.HttpException(error.message, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async deleteHtmlImage(fileName) {
        try {
            const result = await this.htmlRenderService.deleteHtmlImage(fileName);
            return {
                success: true,
                data: {
                    deleted: result
                },
                message: result ? '删除成功' : '文件不存在或删除失败'
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message || '删除图片失败'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createAsyncHtmlRenderTask(renderDto) {
        try {
            const task = await this.htmlRenderService.createRenderTask(renderDto);
            return {
                taskId: task.taskId,
                status: task.status,
                createdAt: task.createdAt
            };
        }
        catch (error) {
            const statusCode = error instanceof common_1.HttpException
                ? error.getStatus()
                : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            throw new common_1.HttpException({
                success: false,
                message: error.message || '创建异步渲染任务失败'
            }, statusCode);
        }
    }
    async getTaskResult(params) {
        try {
            const task = await this.htmlRenderService.getTaskById(params.taskId);
            return {
                taskId: task.taskId,
                status: task.status,
                result: task.status === 'completed' ? task.result : null,
                htmlContent: task.status === 'completed' ? task.htmlContent : null,
                errorMessage: task.status === 'failed' ? task.errorMessage : null,
                createdAt: task.createdAt,
                completedAt: task.completedAt
            };
        }
        catch (error) {
            const statusCode = error instanceof common_1.HttpException
                ? error.getStatus()
                : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            throw new common_1.HttpException({
                success: false,
                message: error.message || '获取任务结果失败'
            }, statusCode);
        }
    }
    async getTemplateElementsWithId(templateName) {
        try {
            const elements = await this.htmlRenderService.getTemplateElementsWithId(templateName);
            return {
                success: true,
                data: elements
            };
        }
        catch (error) {
            const statusCode = error instanceof common_1.HttpException
                ? error.getStatus()
                : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            const errorMessage = error instanceof common_1.HttpException
                ? error.message
                : '获取模板元素ID失败';
            throw new common_1.HttpException({
                success: false,
                message: errorMessage
            }, statusCode);
        }
    }
    async getIdReplacementExample(templateName) {
        try {
            const elements = await this.htmlRenderService.getTemplateElementsWithId(templateName);
            const filteredElements = elements.filter(element => element.id !== 'root');
            this.logger.log(`获取到${filteredElements.length}个带ID的元素（已过滤root元素）`);
            const replacements = filteredElements.map(element => ({
                placeholder: element.id,
                replaceWith: element.text
            }));
            return {
                success: true,
                data: replacements
            };
        }
        catch (error) {
            const statusCode = error instanceof common_1.HttpException
                ? error.getStatus()
                : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            const errorMessage = error instanceof common_1.HttpException
                ? error.message
                : '生成文本替换示例失败';
            throw new common_1.HttpException({
                success: false,
                message: errorMessage
            }, statusCode);
        }
    }
    async getAllTemplateNames() {
        try {
            const templateNames = await this.htmlRenderService.getAllTemplateNames();
            return {
                success: true,
                data: templateNames
            };
        }
        catch (error) {
            const statusCode = error instanceof common_1.HttpException
                ? error.getStatus()
                : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            const errorMessage = error instanceof common_1.HttpException
                ? error.message
                : '获取模板名称列表失败';
            throw new common_1.HttpException({
                success: false,
                message: errorMessage
            }, statusCode);
        }
    }
    async getRandomTemplateWithElements() {
        try {
            const result = await this.htmlRenderService.getRandomTemplateWithElements();
            return {
                success: true,
                data: result
            };
        }
        catch (error) {
            const statusCode = error instanceof common_1.HttpException
                ? error.getStatus()
                : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            const errorMessage = error instanceof common_1.HttpException
                ? error.message
                : '获取随机模板及其元素失败';
            throw new common_1.HttpException({
                success: false,
                message: errorMessage
            }, statusCode);
        }
    }
    async generateQRCode(data, size, response) {
        try {
            if (!data) {
                throw new common_1.HttpException('二维码内容不能为空', common_1.HttpStatus.BAD_REQUEST);
            }
            const decodedData = decodeURIComponent(data);
            this.logger.log(`生成二维码，原始内容: ${data}, 解码后内容: ${decodedData}`);
            const qrSize = size ? parseInt(size, 10) : 300;
            response.setHeader('Content-Type', 'image/png');
            QRCode.toFileStream(response, decodedData, {
                type: 'png',
                width: qrSize,
                margin: 1,
                errorCorrectionLevel: 'H'
            });
        }
        catch (error) {
            this.logger.error(`生成二维码失败: ${error.message}`);
            if (!response.headersSent) {
                response.setHeader('Content-Type', 'application/json');
                const statusCode = error instanceof common_1.HttpException
                    ? error.getStatus()
                    : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                response.status(statusCode).json({
                    success: false,
                    message: error.message || '生成二维码失败'
                });
            }
            else {
                response.end();
            }
        }
    }
};
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '返回替换后的HTML代码或将其转换为图片' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '模板未找到' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: '服务器内部错误' }),
    (0, common_1.Post)('html-code'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [htmllib_render_dto_1.HtmlRenderDto, Object]),
    __metadata("design:returntype", Promise)
], HtmlRenderController.prototype, "getHtmlCode", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取模板详情，包括可替换的文本列表' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '返回模板详情',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', example: 'pic_4_1' },
                        htmlCode: { type: 'string', example: '<!DOCTYPE html>...' },
                        imageCount: { type: 'number', example: 4 },
                        textDetails: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['可替换文本1', '超级好用的产品']
                        }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '模板未找到' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: '服务器内部错误' }),
    (0, swagger_1.ApiParam)({ name: 'name', description: '模板名称' }),
    (0, common_1.Get)('template-details/:name'),
    __param(0, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HtmlRenderController.prototype, "getTemplateDetails", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '将HTML字符串转换为图片' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '返回图片URL和信息',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        url: { type: 'string', example: '/uploads/html-images/abc123.png' },
                        fileName: { type: 'string', example: 'abc123.png' },
                        filePath: { type: 'string', example: '/app/uploads/html-images/abc123.png' },
                        superImageUrl: { type: 'string', example: 'https://pic1.superbed.cn/abc123.png', description: '上传到Super图床后的URL' }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: '服务器内部错误' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['html'],
            properties: {
                html: { type: 'string', description: 'HTML字符串' },
                width: { type: 'number', description: '图片宽度（可选，未指定时自动从HTML识别）' },
                height: { type: 'number', description: '图片高度（可选，未指定时自动计算）' },
                quality: { type: 'number', description: '图片质量(1-100)' },
                type: { type: 'string', enum: ['jpeg', 'png'], description: '图片类型' },
                selector: { type: 'string', description: '选择器，用于指定转换HTML中的特定元素' },
                uploadToSuperbed: { type: 'boolean', description: '是否上传到Super图床（默认为true）' },
                useAutoDetect: { type: 'boolean', description: '是否自动检测HTML宽高（默认为true）' }
            },
        },
    }),
    (0, common_1.Post)('to-image'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HtmlRenderController.prototype, "htmlToImage", null);
__decorate([
    (0, common_1.Post)('render-to-image'),
    (0, swagger_1.ApiOperation)({ summary: '渲染HTML模板并转换为图片' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [renderTemplateToImage_dto_1.RenderTemplateToImageDto]),
    __metadata("design:returntype", Promise)
], HtmlRenderController.prototype, "renderTemplateToImage", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '删除生成的HTML图片' }),
    (0, swagger_1.ApiParam)({ name: 'fileName', description: '图片文件名' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除结果' }),
    (0, common_1.Delete)('image/:fileName'),
    __param(0, (0, common_1.Param)('fileName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HtmlRenderController.prototype, "deleteHtmlImage", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '异步渲染HTML模板（创建任务）' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '返回任务ID和状态',
        type: async_render_dto_1.AsyncRenderResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: '服务器内部错误' }),
    (0, common_1.Post)('async-html-code'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [async_render_dto_1.AsyncRenderDto]),
    __metadata("design:returntype", Promise)
], HtmlRenderController.prototype, "createAsyncHtmlRenderTask", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取异步渲染任务结果' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '任务不存在' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: '服务器内部错误' }),
    (0, common_1.Get)('task/:taskId'),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [async_render_dto_1.TaskQueryDto]),
    __metadata("design:returntype", Promise)
], HtmlRenderController.prototype, "getTaskResult", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取模板中所有带ID的元素及其文本内容' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '返回模板中所有带ID的元素及其文本内容',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: '7512475873321435154' },
                            text: { type: 'string', example: '大标题' }
                        }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '模板未找到' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: '服务器内部错误' }),
    (0, swagger_1.ApiParam)({ name: 'name', description: '模板名称' }),
    (0, common_1.Get)('template-elements/:name'),
    __param(0, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HtmlRenderController.prototype, "getTemplateElementsWithId", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '生成带ID元素的文本替换示例' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '返回文本替换示例',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            placeholder: { type: 'string', example: '7512475873321435154' },
                            replaceWith: { type: 'string', example: '大标题' }
                        }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '模板未找到' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: '服务器内部错误' }),
    (0, swagger_1.ApiParam)({ name: 'name', description: '模板名称' }),
    (0, common_1.Get)('id-replacements/:name'),
    __param(0, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HtmlRenderController.prototype, "getIdReplacementExample", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取所有模板名称列表' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '返回所有模板名称列表',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['模板1', '模板2', '模板3']
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 500, description: '服务器内部错误' }),
    (0, common_1.Get)('template-names'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HtmlRenderController.prototype, "getAllTemplateNames", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '随机选择一个模板并获取其中所有带ID的元素及其文本内容' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '返回随机模板名称和带ID的元素列表',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        templateName: { type: 'string', example: 'pic_4_1' },
                        elements: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', example: '7512475873321435154' },
                                    text: { type: 'string', example: '大标题' }
                                }
                            }
                        },
                        textReplacements: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    placeholder: { type: 'string', example: '7512475873321435154' },
                                    replaceWith: { type: 'string', example: '大标题' }
                                }
                            },
                            description: '文本替换格式，可直接用于请求参数'
                        }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '没有可用的模板' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: '服务器内部错误' }),
    (0, common_1.Get)('random-template-elements'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HtmlRenderController.prototype, "getRandomTemplateWithElements", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '生成二维码' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '返回二维码图片' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: '服务器内部错误' }),
    (0, swagger_1.ApiQuery)({ name: 'data', description: '需要转换为二维码的内容，需要进行encodeURIComponent编码', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'size', description: '二维码尺寸，默认为200', required: false }),
    (0, common_1.Get)('qrcode'),
    __param(0, (0, common_1.Query)('data')),
    __param(1, (0, common_1.Query)('size')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], HtmlRenderController.prototype, "generateQRCode", null);
HtmlRenderController = HtmlRenderController_1 = __decorate([
    (0, swagger_1.ApiTags)('HTML模板渲染'),
    (0, common_1.Controller)('html-render'),
    (0, public_decorator_1.Public)(),
    __metadata("design:paramtypes", [html_render_service_1.HtmlRenderService])
], HtmlRenderController);
exports.HtmlRenderController = HtmlRenderController;
