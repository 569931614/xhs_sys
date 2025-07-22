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
exports.XhsTemplateEntity = void 0;
const baseEntity_1 = require("../../common/entity/baseEntity");
const typeorm_1 = require("typeorm");
let XhsTemplateEntity = class XhsTemplateEntity extends baseEntity_1.BaseEntity {
};
__decorate([
    (0, typeorm_1.Column)({ comment: '模板名称', length: 100 }),
    __metadata("design:type", String)
], XhsTemplateEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '模板文件路径', length: 255 }),
    __metadata("design:type", String)
], XhsTemplateEntity.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '文件大小(KB)', default: 0 }),
    __metadata("design:type", Number)
], XhsTemplateEntity.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '可替换图片数量', default: 0 }),
    __metadata("design:type", Number)
], XhsTemplateEntity.prototype, "imageCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '可替换文本数量', default: 0 }),
    __metadata("design:type", Number)
], XhsTemplateEntity.prototype, "textCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '可替换文本详情(JSON格式)', type: 'text', nullable: true }),
    __metadata("design:type", String)
], XhsTemplateEntity.prototype, "textDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '状态: 0-禁用, 1-启用', default: 1 }),
    __metadata("design:type", Number)
], XhsTemplateEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '使用次数', default: 0 }),
    __metadata("design:type", Number)
], XhsTemplateEntity.prototype, "usageCount", void 0);
XhsTemplateEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'xhs_templates' })
], XhsTemplateEntity);
exports.XhsTemplateEntity = XhsTemplateEntity;
