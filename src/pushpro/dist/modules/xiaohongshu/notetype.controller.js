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
exports.NoteTypeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const notetype_service_1 = require("./notetype.service");
const notetype_dto_1 = require("./dto/notetype.dto");
const notetype_entity_1 = require("./notetype.entity");
let NoteTypeController = class NoteTypeController {
    constructor(noteTypeService) {
        this.noteTypeService = noteTypeService;
    }
    async create(createNoteTypeDto) {
        return {
            code: 0,
            message: '创建成功',
            data: await this.noteTypeService.create(createNoteTypeDto),
        };
    }
    async findAll(query) {
        return await this.noteTypeService.findAll(query);
    }
    async findOne(id) {
        return await this.noteTypeService.findOne(id);
    }
    async update(updateNoteTypeDto) {
        return await this.noteTypeService.update(updateNoteTypeDto.id, updateNoteTypeDto);
    }
    async remove(id) {
        await this.noteTypeService.remove(id);
        return {
            code: 0,
            message: '删除成功',
        };
    }
};
__decorate([
    (0, common_1.Post)('create'),
    (0, swagger_1.ApiOperation)({ summary: '创建笔记类型' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功', type: notetype_entity_1.NoteType }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notetype_dto_1.CreateNoteTypeDto]),
    __metadata("design:returntype", Promise)
], NoteTypeController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, swagger_1.ApiOperation)({ summary: '获取笔记类型列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notetype_dto_1.NoteTypeQueryDto]),
    __metadata("design:returntype", Promise)
], NoteTypeController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取笔记类型详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功', type: notetype_entity_1.NoteType }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], NoteTypeController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('update'),
    (0, swagger_1.ApiOperation)({ summary: '更新笔记类型' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功', type: notetype_entity_1.NoteType }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notetype_dto_1.UpdateNoteTypeDto]),
    __metadata("design:returntype", Promise)
], NoteTypeController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('delete/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '删除笔记类型' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], NoteTypeController.prototype, "remove", null);
NoteTypeController = __decorate([
    (0, swagger_1.ApiTags)('小红书笔记类型'),
    (0, common_1.Controller)('xiaohongshu/notetype'),
    __metadata("design:paramtypes", [notetype_service_1.NoteTypeService])
], NoteTypeController);
exports.NoteTypeController = NoteTypeController;
