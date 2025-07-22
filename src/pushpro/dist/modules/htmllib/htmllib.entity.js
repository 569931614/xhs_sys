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
exports.HtmlTemplateEntity = void 0;
const baseEntity_1 = require("../../common/entity/baseEntity");
const typeorm_1 = require("typeorm");
let HtmlTemplateEntity = class HtmlTemplateEntity extends baseEntity_1.BaseEntity {
};
__decorate([
    (0, typeorm_1.Column)({ length: 100, comment: '模板名称' }),
    __metadata("design:type", String)
], HtmlTemplateEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', comment: 'HTML代码' }),
    __metadata("design:type", String)
], HtmlTemplateEntity.prototype, "htmlCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, comment: '可替换的图片数量' }),
    __metadata("design:type", Number)
], HtmlTemplateEntity.prototype, "imageCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true, comment: '可替换的文本内容列表，存储为字符串数组' }),
    __metadata("design:type", String)
], HtmlTemplateEntity.prototype, "textDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true, comment: '缩略图路径' }),
    __metadata("design:type", String)
], HtmlTemplateEntity.prototype, "thumbnailPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1, comment: '使用应用工作流：1-启用，0-禁用' }),
    __metadata("design:type", Number)
], HtmlTemplateEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false, comment: '是否需要AI补充文案' }),
    __metadata("design:type", Boolean)
], HtmlTemplateEntity.prototype, "needAiContent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true, comment: '背景图片URL列表，存储为字符串数组' }),
    __metadata("design:type", String)
], HtmlTemplateEntity.prototype, "backgroundImages", void 0);
HtmlTemplateEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'html_templates' })
], HtmlTemplateEntity);
exports.HtmlTemplateEntity = HtmlTemplateEntity;
