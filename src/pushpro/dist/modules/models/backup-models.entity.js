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
exports.BackupModelsEntity = void 0;
const baseEntity_1 = require("../../common/entity/baseEntity");
const typeorm_1 = require("typeorm");
let BackupModelsEntity = class BackupModelsEntity extends baseEntity_1.BaseEntity {
};
__decorate([
    (0, typeorm_1.Column)({ comment: '模型名称' }),
    __metadata("design:type", String)
], BackupModelsEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '请求地址', length: 500 }),
    __metadata("design:type", String)
], BackupModelsEntity.prototype, "baseUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: 'API Key', length: 500 }),
    __metadata("design:type", String)
], BackupModelsEntity.prototype, "apiKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '模型类型: text(文字), image(图文), video(视频)', default: 'text' }),
    __metadata("design:type", String)
], BackupModelsEntity.prototype, "modelType", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '使用的模型', length: 100, default: 'gpt-4o-image' }),
    __metadata("design:type", String)
], BackupModelsEntity.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '状态: 0-禁用, 1-启用', default: 1 }),
    __metadata("design:type", Number)
], BackupModelsEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '优先级：数字越小优先级越高', default: 10 }),
    __metadata("design:type", Number)
], BackupModelsEntity.prototype, "priority", void 0);
BackupModelsEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'backup_models' })
], BackupModelsEntity);
exports.BackupModelsEntity = BackupModelsEntity;
