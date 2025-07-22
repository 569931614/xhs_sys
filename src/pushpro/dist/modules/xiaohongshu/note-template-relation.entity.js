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
exports.NoteTemplateRelation = void 0;
const typeorm_1 = require("typeorm");
const note_entity_1 = require("./note.entity");
const htmllib_entity_1 = require("../../modules/htmllib/htmllib.entity");
let NoteTemplateRelation = class NoteTemplateRelation {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], NoteTemplateRelation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', comment: '笔记ID' }),
    __metadata("design:type", Number)
], NoteTemplateRelation.prototype, "noteId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => note_entity_1.Note, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'noteId' }),
    __metadata("design:type", note_entity_1.Note)
], NoteTemplateRelation.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', comment: 'HTML模板ID' }),
    __metadata("design:type", Number)
], NoteTemplateRelation.prototype, "templateId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => htmllib_entity_1.HtmlTemplateEntity, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'templateId' }),
    __metadata("design:type", htmllib_entity_1.HtmlTemplateEntity)
], NoteTemplateRelation.prototype, "template", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, comment: '是否可重复使用' }),
    __metadata("design:type", Boolean)
], NoteTemplateRelation.prototype, "isRepeatable", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ comment: '创建时间' }),
    __metadata("design:type", Date)
], NoteTemplateRelation.prototype, "createTime", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ comment: '更新时间' }),
    __metadata("design:type", Date)
], NoteTemplateRelation.prototype, "updateTime", void 0);
NoteTemplateRelation = __decorate([
    (0, typeorm_1.Entity)('xiaohongshu_note_template_relation')
], NoteTemplateRelation);
exports.NoteTemplateRelation = NoteTemplateRelation;
