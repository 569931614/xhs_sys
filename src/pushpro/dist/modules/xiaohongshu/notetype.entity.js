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
exports.NoteType = void 0;
const typeorm_1 = require("typeorm");
let NoteType = class NoteType {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], NoteType.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, comment: '类型名称' }),
    __metadata("design:type", String)
], NoteType.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, comment: '类型描述' }),
    __metadata("design:type", String)
], NoteType.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, comment: '排序' }),
    __metadata("design:type", Number)
], NoteType.prototype, "sort", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, comment: '状态：true-启用，false-禁用' }),
    __metadata("design:type", Boolean)
], NoteType.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ comment: '创建时间' }),
    __metadata("design:type", Date)
], NoteType.prototype, "createTime", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ comment: '更新时间' }),
    __metadata("design:type", Date)
], NoteType.prototype, "updateTime", void 0);
NoteType = __decorate([
    (0, typeorm_1.Entity)('xiaohongshu_notetype')
], NoteType);
exports.NoteType = NoteType;
