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
exports.NoteController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const note_service_1 = require("./note.service");
const note_dto_1 = require("./dto/note.dto");
const note_entity_1 = require("./note.entity");
let NoteController = class NoteController {
    constructor(noteService) {
        this.noteService = noteService;
    }
    async create(createNoteDto) {
        try {
            console.log('接收到创建笔记请求，数据:', JSON.stringify(createNoteDto));
            if (createNoteDto.htmlTemplates && createNoteDto.htmlTemplates.length > 0) {
                console.log(`请求包含${createNoteDto.htmlTemplates.length}个HTML模板:`, JSON.stringify(createNoteDto.htmlTemplates));
            }
            const note = await this.noteService.create(createNoteDto);
            if (createNoteDto.htmlTemplates && createNoteDto.htmlTemplates.length > 0) {
                try {
                    const relations = await this.noteService.getNoteHtmlTemplates(note.id);
                    console.log(`笔记创建后验证: ID=${note.id}关联了${relations.length}个HTML模板`);
                }
                catch (error) {
                    console.error(`验证HTML模板关联失败:`, error);
                }
            }
            return {
                code: 0,
                message: '创建成功',
                data: note
            };
        }
        catch (error) {
            console.error('创建笔记失败:', error);
            throw new common_1.HttpException(error.message || '创建笔记失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findAll(query) {
        return {
            code: 0,
            message: '获取成功',
            data: await this.noteService.findAll(query),
        };
    }
    async findOne(id) {
        return {
            code: 0,
            message: '获取成功',
            data: await this.noteService.findOne(id),
        };
    }
    async getNoteTemplates(id) {
        return {
            code: 0,
            message: '获取成功',
            data: await this.noteService.getNoteTemplates(id),
        };
    }
    async update(updateNoteDto) {
        var _a;
        try {
            console.log('接收到更新笔记请求，数据:', JSON.stringify(updateNoteDto));
            if (updateNoteDto.htmlTemplates !== undefined) {
                console.log(`更新请求包含${((_a = updateNoteDto.htmlTemplates) === null || _a === void 0 ? void 0 : _a.length) || 0}个HTML模板:`, JSON.stringify(updateNoteDto.htmlTemplates));
            }
            const note = await this.noteService.update(updateNoteDto.id, updateNoteDto);
            if (updateNoteDto.htmlTemplates !== undefined) {
                try {
                    const relations = await this.noteService.getNoteHtmlTemplates(note.id);
                    console.log(`笔记更新后验证: ID=${note.id}关联了${relations.length}个HTML模板`);
                    if (relations.length > 0) {
                        console.log(`关联的模板ID:`, relations.map(rel => rel.id).join(', '));
                    }
                }
                catch (error) {
                    console.error(`验证HTML模板关联失败:`, error);
                }
            }
            return {
                code: 0,
                message: '更新成功',
                data: note
            };
        }
        catch (error) {
            console.error('更新笔记失败:', error);
            throw new common_1.HttpException(error.message || '更新笔记失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async remove(id) {
        await this.noteService.remove(id);
        return {
            code: 0,
            message: '删除成功',
        };
    }
};
__decorate([
    (0, common_1.Post)('create'),
    (0, swagger_1.ApiOperation)({ summary: '创建笔记' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '创建成功' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [note_dto_1.CreateNoteDto]),
    __metadata("design:returntype", Promise)
], NoteController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, swagger_1.ApiOperation)({ summary: '获取笔记列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [note_dto_1.NoteQueryDto]),
    __metadata("design:returntype", Promise)
], NoteController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取笔记详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功', type: note_entity_1.Note }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], NoteController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/templates'),
    (0, swagger_1.ApiOperation)({ summary: '获取笔记关联的模板列表（已弃用）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], NoteController.prototype, "getNoteTemplates", null);
__decorate([
    (0, common_1.Post)('update'),
    (0, swagger_1.ApiOperation)({ summary: '更新笔记' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [note_dto_1.UpdateNoteDto]),
    __metadata("design:returntype", Promise)
], NoteController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('delete/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '删除笔记' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], NoteController.prototype, "remove", null);
NoteController = __decorate([
    (0, swagger_1.ApiTags)('小红书笔记'),
    (0, common_1.Controller)('xiaohongshu/note'),
    __metadata("design:paramtypes", [note_service_1.NoteService])
], NoteController);
exports.NoteController = NoteController;
