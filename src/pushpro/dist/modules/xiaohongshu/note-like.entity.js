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
exports.NoteLike = void 0;
const typeorm_1 = require("typeorm");
const note_entity_1 = require("./note.entity");
let NoteLike = class NoteLike {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], NoteLike.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', comment: '笔记ID' }),
    __metadata("design:type", Number)
], NoteLike.prototype, "noteId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => note_entity_1.Note, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'noteId' }),
    __metadata("design:type", note_entity_1.Note)
], NoteLike.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, comment: '用户ID' }),
    __metadata("design:type", String)
], NoteLike.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ comment: '创建时间' }),
    __metadata("design:type", Date)
], NoteLike.prototype, "createTime", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ comment: '更新时间' }),
    __metadata("design:type", Date)
], NoteLike.prototype, "updateTime", void 0);
NoteLike = __decorate([
    (0, typeorm_1.Entity)('xiaohongshu_note_like'),
    (0, typeorm_1.Unique)(['noteId', 'userId'])
], NoteLike);
exports.NoteLike = NoteLike;
