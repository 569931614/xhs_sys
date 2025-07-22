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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Note = void 0;
const typeorm_1 = require("typeorm");
const notetype_entity_1 = require("./notetype.entity");
let Note = class Note {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Note.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, comment: '笔记标题' }),
    __metadata("design:type", String)
], Note.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', comment: '笔记类型ID' }),
    __metadata("design:type", Number)
], Note.prototype, "typeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => notetype_entity_1.NoteType),
    (0, typeorm_1.JoinColumn)({ name: 'typeId' }),
    __metadata("design:type", notetype_entity_1.NoteType)
], Note.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, comment: '封面图URL' }),
    __metadata("design:type", String)
], Note.prototype, "coverImage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', comment: '笔记内容' }),
    __metadata("design:type", String)
], Note.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, comment: '排序' }),
    __metadata("design:type", Number)
], Note.prototype, "sort", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, comment: '状态：true-启用，false-禁用' }),
    __metadata("design:type", Boolean)
], Note.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true, comment: '笔记ID，用于外部系统关联' }),
    __metadata("design:type", String)
], Note.prototype, "noteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true, comment: 'Coze Bot ID' }),
    __metadata("design:type", String)
], Note.prototype, "botId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true, comment: '工作流参数类型' }),
    __metadata("design:type", String)
], Note.prototype, "paramsType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, comment: '点赞次数' }),
    __metadata("design:type", Number)
], Note.prototype, "likesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, comment: '预览次数' }),
    __metadata("design:type", Number)
], Note.prototype, "viewsCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ comment: '创建时间' }),
    __metadata("design:type", Date)
], Note.prototype, "createTime", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ comment: '更新时间' }),
    __metadata("design:type", Date)
], Note.prototype, "updateTime", void 0);
Note = __decorate([
    (0, typeorm_1.Entity)('xiaohongshu_note')
], Note);
exports.Note = Note;
