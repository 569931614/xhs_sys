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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XhsAutoController = void 0;
const common_1 = require("@nestjs/common");
const xhs_service_1 = require("./xhs.service");
const xhs_auto_service_1 = require("./xhs-auto.service");
const xhs_auto_dto_1 = require("./dto/xhs-auto.dto");
const xhs_signature_dto_1 = require("./dto/xhs-signature.dto");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../decorators/public.decorator");
const ExcelJS = require("exceljs");
const globalConfig_service_1 = require("../globalConfig/globalConfig.service");
let XhsAutoController = class XhsAutoController {
    constructor(xhsService, xhsAutoService, globalConfigService) {
        this.xhsService = xhsService;
        this.xhsAutoService = xhsAutoService;
        this.globalConfigService = globalConfigService;
    }
    async getSignature() {
        try {
            const signatureData = await this.xhsAutoService.getXhsSignature();
            console.log('获取到的签名数据:', signatureData);
            return {
                code: 200,
                message: 'success',
                data: signatureData
            };
        }
        catch (error) {
            return {
                code: 500,
                message: '获取签名数据失败',
                error: error.message
            };
        }
    }
    async getNotes(query) {
        const { isUsed, limit, page, identifier, id, platform, isSequential } = query;
        if (identifier) {
            const currentId = id || undefined;
            try {
                const notes = await this.xhsService.findNextByIdentifier(identifier, currentId, isUsed, platform, isSequential);
                const processedNotes = notes.map(note => (Object.assign(Object.assign({}, note), { douyinUsed: note.douyinUsed !== undefined ? note.douyinUsed : false })));
                return processedNotes;
            }
            catch (error) {
                return {
                    code: 500,
                    message: '查询失败',
                    error: error.message
                };
            }
        }
    }
    async getNoteDetail(params) {
        try {
            const { id } = params;
            const note = await this.xhsService.findOne(id);
            if (!note) {
                return {
                    code: 404,
                    message: '笔记不存在',
                    data: null
                };
            }
            const result = Object.assign(Object.assign({}, note), { douyinUsed: note.douyinUsed !== undefined ? note.douyinUsed : false });
            return result;
        }
        catch (error) {
            return {
                code: 500,
                message: '获取笔记详情失败',
                error: error.message
            };
        }
    }
    async createNoteBysupplier(body) {
        if (!body.supplier) {
            return {
                code: 400,
                message: '渠道商id不能为空',
                data: null
            };
        }
        const userId = body.userId || 1;
        const { userId: _, isPublish, platform } = body, noteData = __rest(body, ["userId", "isPublish", "platform"]);
        const postData = Object.assign(Object.assign({}, noteData), { type: noteData.type || 'normal' });
        if (postData.type === 'video') {
            if (!postData.video) {
                return {
                    code: 400,
                    message: '视频类型笔记必须提供视频链接',
                    data: null
                };
            }
            if (!postData.cover) {
                return {
                    code: 400,
                    message: '视频类型笔记必须提供封面图片链接',
                    data: null
                };
            }
            postData.images = [];
        }
        const note = await this.xhsService.create(postData, userId);
        const domain = await this.globalConfigService.getConfigs(['domain']) || 'https://xhs.aivip1.top';
        let shareLink = '';
        let acShareLink = '';
        if (note.identifier) {
            acShareLink = `${domain}/chat/#/xhs-auto-api?identifier=${note.identifier}`;
        }
        let baseUrl = `${domain}/chat/#/xhs-auto-api?id=${note.id}`;
        const queryParams = [];
        if (isPublish !== undefined) {
            queryParams.push(`publish=${isPublish}`);
        }
        if (platform) {
            queryParams.push(`platform=${platform}`);
        }
        if (queryParams.length > 0) {
            shareLink = `${baseUrl}&${queryParams.join('&')}`;
        }
        else {
            shareLink = baseUrl;
        }
        const qrcodeLink = `https://xhs.aivip1.top/api/html-render/qrcode?data=${encodeURIComponent(shareLink)}`;
        return {
            code: 200,
            message: 'success',
            data: Object.assign(Object.assign({}, note), { shareLink,
                qrcodeLink,
                acShareLink })
        };
    }
    async createNote(body) {
        const userId = body.userId || 1;
        const { userId: _, isPublish, platform } = body, noteData = __rest(body, ["userId", "isPublish", "platform"]);
        const postData = Object.assign(Object.assign({}, noteData), { type: noteData.type || 'normal' });
        if (postData.type === 'video') {
            if (!postData.video) {
                return {
                    code: 400,
                    message: '视频类型笔记必须提供视频链接',
                    data: null
                };
            }
            if (!postData.cover) {
                return {
                    code: 400,
                    message: '视频类型笔记必须提供封面图片链接',
                    data: null
                };
            }
            postData.images = [];
        }
        const note = await this.xhsService.create(postData, userId);
        const domain = await this.globalConfigService.getConfigs(['domain']) || 'https://xhs.aivip1.top';
        let shareLink = '';
        let acShareLink = '';
        if (note.identifier) {
            acShareLink = `${domain}/chat/#/xhs-auto-api?identifier=${note.identifier}`;
        }
        let baseUrl = `${domain}/chat/#/xhs-auto-api?id=${note.id}`;
        const queryParams = [];
        if (isPublish !== undefined) {
            queryParams.push(`publish=${isPublish}`);
        }
        if (platform) {
            queryParams.push(`platform=${platform}`);
        }
        if (queryParams.length > 0) {
            shareLink = `${baseUrl}&${queryParams.join('&')}`;
        }
        else {
            shareLink = baseUrl;
        }
        const qrcodeLink = `https://xhs.aivip1.top/api/html-render/qrcode?data=${encodeURIComponent(shareLink)}`;
        return {
            code: 200,
            message: 'success',
            data: Object.assign(Object.assign({}, note), { shareLink,
                qrcodeLink,
                acShareLink })
        };
    }
    async updateNote(id, body) {
        const note = await this.xhsService.update(id, body);
        return {
            code: 200,
            message: 'success',
            data: note
        };
    }
    async deleteNote(params) {
        const { id } = params;
        await this.xhsService.remove(id);
        return {
            code: 200,
            message: 'success'
        };
    }
    async markNoteUsed(params, platform) {
        const { id } = params;
        await this.xhsService.markUsed(id, platform);
        return {
            code: 200,
            message: 'success'
        };
    }
    async markNoteDiscarded(params) {
        try {
            const { id } = params;
            await this.xhsService.markDiscarded(id);
            return {
                code: 200,
                message: '标记为弃用成功',
                data: { id }
            };
        }
        catch (error) {
            return {
                code: 500,
                message: '标记为弃用失败',
                error: error.message
            };
        }
    }
    async downloadTemplate(res) {
        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'XHS Auto API';
            workbook.lastModifiedBy = 'XHS Auto API';
            workbook.created = new Date();
            workbook.modified = new Date();
            const worksheet = workbook.addWorksheet('小红书帖子导入模板');
            worksheet.columns = [
                { header: '标题', key: 'title', width: 30 },
                { header: '内容', key: 'content', width: 50 },
                { header: '类型', key: 'type', width: 15 },
                { header: '图片URL1', key: 'image1', width: 50 },
                { header: '图片URL2', key: 'image2', width: 50 },
                { header: '图片URL3', key: 'image3', width: 50 },
                { header: '图片URL4', key: 'image4', width: 50 },
                { header: '图片URL5', key: 'image5', width: 50 },
                { header: '图片URL6', key: 'image6', width: 50 },
                { header: '图片URL7', key: 'image7', width: 50 },
                { header: '图片URL8', key: 'image8', width: 50 },
                { header: '图片URL9', key: 'image9', width: 50 },
                { header: '视频URL', key: 'video', width: 50 },
                { header: '封面URL', key: 'cover', width: 50 },
            ];
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, size: 12 };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.commit();
            worksheet.addRow({
                title: '图文笔记示例标题',
                content: '这是一个图文笔记的内容示例，可以描述产品、分享心得等',
                type: 'normal',
                image1: 'https://example.com/image1.jpg',
                image2: 'https://example.com/image2.jpg',
                image3: 'https://example.com/image3.jpg'
            });
            worksheet.addRow({
                title: '视频笔记示例标题',
                content: '这是一个视频笔记的内容示例，一般只需要一张封面图',
                type: 'video',
                video: 'https://example.com/video.mp4',
                cover: 'https://example.com/video-cover.jpg'
            });
            worksheet.addRow([]);
            const noteRow = worksheet.addRow(['注意事项']);
            noteRow.font = { bold: true, size: 12 };
            noteRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFD700' }
            };
            worksheet.addRow(['1. 类型字段只能填写 normal 或 video，分别对应图文帖子和视频帖子']);
            worksheet.addRow(['2. 图文帖子可以包含1-9张图片，视频帖子必须包含视频URL和封面图片URL']);
            worksheet.addRow(['3. 标题和内容至少填写一项']);
            worksheet.addRow(['4. 所有图片URL必须是有效的图片地址']);
            worksheet.addRow(['5. 视频URL必须是有效的视频文件地址']);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=xhs_note_template.xlsx');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            await workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            res.status(500).json({
                code: 500,
                message: '生成模板失败',
                error: error.message
            });
        }
    }
    async getDouyinSchema(id, userId, activityId) {
        try {
            if (!id) {
                return {
                    code: 400,
                    message: 'id不能为空',
                    data: null
                };
            }
            console.log('接收到的请求参数:', { id, userId, activityId });
            const schemaData = await this.xhsAutoService.getDouyinSchema(id, userId, activityId);
            return {
                code: 200,
                message: 'success',
                data: schemaData
            };
        }
        catch (error) {
            console.error('获取抖音跳转链接失败:', error);
            if (error.message === '笔记不存在') {
                return {
                    code: 404,
                    message: '笔记不存在',
                    error: error.message
                };
            }
            return {
                code: 500,
                message: '获取抖音跳转链接失败',
                error: error.message
            };
        }
    }
};
__decorate([
    (0, common_1.Get)('signature'),
    (0, swagger_1.ApiOperation)({ summary: '获取小红书分享API签名' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取签名', type: xhs_signature_dto_1.SignatureDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], XhsAutoController.prototype, "getSignature", null);
__decorate([
    (0, common_1.Get)('notes'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [xhs_auto_dto_1.XhsAutoNoteListDto]),
    __metadata("design:returntype", Promise)
], XhsAutoController.prototype, "getNotes", null);
__decorate([
    (0, common_1.Get)('notes/:id'),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [xhs_auto_dto_1.XhsAutoNoteDetailDto]),
    __metadata("design:returntype", Promise)
], XhsAutoController.prototype, "getNoteDetail", null);
__decorate([
    (0, common_1.Post)('notesBySupplier'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [xhs_auto_dto_1.XhsAutoCreateNoteDto]),
    __metadata("design:returntype", Promise)
], XhsAutoController.prototype, "createNoteBysupplier", null);
__decorate([
    (0, common_1.Post)('notes'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [xhs_auto_dto_1.XhsAutoCreateNoteDto]),
    __metadata("design:returntype", Promise)
], XhsAutoController.prototype, "createNote", null);
__decorate([
    (0, common_1.Patch)('notes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, xhs_auto_dto_1.XhsAutoUpdateNoteDto]),
    __metadata("design:returntype", Promise)
], XhsAutoController.prototype, "updateNote", null);
__decorate([
    (0, common_1.Delete)('notes/:id'),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [xhs_auto_dto_1.XhsAutoDeleteNoteDto]),
    __metadata("design:returntype", Promise)
], XhsAutoController.prototype, "deleteNote", null);
__decorate([
    (0, common_1.Post)('notes/:id/used'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Query)('platform')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [xhs_auto_dto_1.XhsAutoMarkUsedDto, String]),
    __metadata("design:returntype", Promise)
], XhsAutoController.prototype, "markNoteUsed", null);
__decorate([
    (0, common_1.Post)('notes/:id/discard'),
    (0, swagger_1.ApiOperation)({ summary: '标记小红书帖子为弃用状态' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '标记为弃用成功' }),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [xhs_auto_dto_1.XhsAutoMarkUsedDto]),
    __metadata("design:returntype", Promise)
], XhsAutoController.prototype, "markNoteDiscarded", null);
__decorate([
    (0, common_1.Get)('template'),
    (0, swagger_1.ApiOperation)({ summary: '下载小红书帖子导入模板' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], XhsAutoController.prototype, "downloadTemplate", null);
__decorate([
    (0, common_1.Get)('douyin-schema/:id'),
    (0, swagger_1.ApiOperation)({ summary: '获取抖音分享跳转链接' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取抖音跳转链接' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('userId')),
    __param(2, (0, common_1.Query)('activityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], XhsAutoController.prototype, "getDouyinSchema", null);
XhsAutoController = __decorate([
    (0, swagger_1.ApiTags)('xhs-auto'),
    (0, common_1.Controller)('xhs-auto'),
    (0, public_decorator_1.Public)(),
    __metadata("design:paramtypes", [xhs_service_1.XhsService,
        xhs_auto_service_1.XhsAutoService,
        globalConfig_service_1.GlobalConfigService])
], XhsAutoController);
exports.XhsAutoController = XhsAutoController;
