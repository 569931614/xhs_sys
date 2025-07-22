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
exports.FontEntity = void 0;
const typeorm_1 = require("typeorm");
let FontEntity = class FontEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], FontEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '字体名称', length: 100 }),
    __metadata("design:type", String)
], FontEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '字体代码', length: 100 }),
    __metadata("design:type", String)
], FontEntity.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '预览图URL', length: 500, nullable: true }),
    __metadata("design:type", String)
], FontEntity.prototype, "preview", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '字体文件URL', length: 500 }),
    __metadata("design:type", String)
], FontEntity.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '字体类型', length: 50, default: 'ttf' }),
    __metadata("design:type", String)
], FontEntity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '状态', default: true }),
    __metadata("design:type", Boolean)
], FontEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '排序', default: 0 }),
    __metadata("design:type", Number)
], FontEntity.prototype, "sort", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '来源', length: 50, default: 'api' }),
    __metadata("design:type", String)
], FontEntity.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '备注', length: 500, nullable: true }),
    __metadata("design:type", String)
], FontEntity.prototype, "remark", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ comment: '创建时间' }),
    __metadata("design:type", Date)
], FontEntity.prototype, "createTime", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ comment: '更新时间' }),
    __metadata("design:type", Date)
], FontEntity.prototype, "updateTime", void 0);
FontEntity = __decorate([
    (0, typeorm_1.Entity)('font')
], FontEntity);
exports.FontEntity = FontEntity;
