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
exports.PromptTemplateEntity = void 0;
const baseEntity_1 = require("../../common/entity/baseEntity");
const typeorm_1 = require("typeorm");
let PromptTemplateEntity = class PromptTemplateEntity extends baseEntity_1.BaseEntity {
};
__decorate([
    (0, typeorm_1.Column)({ length: 50, comment: '提示词标识' }),
    __metadata("design:type", String)
], PromptTemplateEntity.prototype, "identifier", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', comment: '提示词内容' }),
    __metadata("design:type", String)
], PromptTemplateEntity.prototype, "prompt", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, comment: '使用的模型名称' }),
    __metadata("design:type", String)
], PromptTemplateEntity.prototype, "modelName", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1, comment: '模板状态：1-启用，0-禁用' }),
    __metadata("design:type", Number)
], PromptTemplateEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, comment: 'API请求预设值JSON' }),
    __metadata("design:type", String)
], PromptTemplateEntity.prototype, "presetValues", void 0);
PromptTemplateEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'prompt_templates' })
], PromptTemplateEntity);
exports.PromptTemplateEntity = PromptTemplateEntity;
