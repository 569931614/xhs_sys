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
exports.NoteTemplateController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const notetemplate_service_1 = require("./notetemplate.service");
const notetemplate_dto_1 = require("./dto/notetemplate.dto");
const notetemplate_entity_1 = require("./notetemplate.entity");
let NoteTemplateController = class NoteTemplateController {
    constructor(noteTemplateService) {
        this.noteTemplateService = noteTemplateService;
    }
    async create(createNoteTemplateDto) {
        return {
            code: 0,
            message: '创建成功',
            data: await this.noteTemplateService.create(createNoteTemplateDto),
        };
    }
    async findAll(query) {
        return await this.noteTemplateService.findAll(query);
    }
    async findOne(id) {
        return await this.noteTemplateService.findOne(id);
    }
    async update(updateNoteTemplateDto) {
        return await this.noteTemplateService.update(updateNoteTemplateDto.id, updateNoteTemplateDto);
    }
    async remove(id) {
        await this.noteTemplateService.remove(id);
        return {
            code: 0,
            message: '删除成功',
        };
    }
};
__decorate([
    (0, common_1.Post)('create'),
    (0, swagger_1.ApiOperation)({ summary: '创建笔记页面模板' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功', type: notetemplate_entity_1.NoteTemplate }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notetemplate_dto_1.CreateNoteTemplateDto]),
    __metadata("design:returntype", Promise)
], NoteTemplateController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, swagger_1.ApiOperation)({ summary: '获取笔记页面模板列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notetemplate_dto_1.NoteTemplateQueryDto]),
    __metadata("design:returntype", Promise)
], NoteTemplateController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取笔记页面模板详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功', type: notetemplate_entity_1.NoteTemplate }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], NoteTemplateController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('update'),
    (0, swagger_1.ApiOperation)({ summary: '更新笔记页面模板' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功', type: notetemplate_entity_1.NoteTemplate }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notetemplate_dto_1.UpdateNoteTemplateDto]),
    __metadata("design:returntype", Promise)
], NoteTemplateController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('delete/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '删除笔记页面模板' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], NoteTemplateController.prototype, "remove", null);
NoteTemplateController = __decorate([
    (0, swagger_1.ApiTags)('小红书笔记页面模板'),
    (0, common_1.Controller)('xiaohongshu/notetemplate'),
    __metadata("design:paramtypes", [notetemplate_service_1.NoteTemplateService])
], NoteTemplateController);
exports.NoteTemplateController = NoteTemplateController;
