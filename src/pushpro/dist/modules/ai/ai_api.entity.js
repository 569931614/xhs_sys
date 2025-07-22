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
exports.ImageUrlMappingEntity = exports.AiGeneratedImageEntity = exports.AiImageTaskEntity = void 0;
const baseEntity_1 = require("../../common/entity/baseEntity");
const typeorm_1 = require("typeorm");
let AiImageTaskEntity = class AiImageTaskEntity extends baseEntity_1.BaseEntity {
};
__decorate([
    (0, typeorm_1.Column)({ comment: '任务唯一ID', length: 36, unique: true }),
    __metadata("design:type", String)
], AiImageTaskEntity.prototype, "taskId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '任务状态: pending/processing/completed/failed', length: 20 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], AiImageTaskEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '提示词', type: 'text' }),
    __metadata("design:type", String)
], AiImageTaskEntity.prototype, "prompt", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '原始图片URL', type: 'text', nullable: true }),
    __metadata("design:type", String)
], AiImageTaskEntity.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '执行时间', nullable: true }),
    __metadata("design:type", Date)
], AiImageTaskEntity.prototype, "executedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '完成时间', nullable: true }),
    __metadata("design:type", Date)
], AiImageTaskEntity.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '生成的图片URLs', type: 'text', nullable: true }),
    __metadata("design:type", String)
], AiImageTaskEntity.prototype, "imageUrls", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '错误信息', type: 'text', nullable: true }),
    __metadata("design:type", String)
], AiImageTaskEntity.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '完整响应', type: 'text', nullable: true }),
    __metadata("design:type", String)
], AiImageTaskEntity.prototype, "fullResponse", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '进度信息', length: 50, nullable: true }),
    __metadata("design:type", String)
], AiImageTaskEntity.prototype, "progressMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '当前内容', type: 'text', nullable: true }),
    __metadata("design:type", String)
], AiImageTaskEntity.prototype, "currentContent", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: 'API请求预设值', type: 'text', nullable: true }),
    __metadata("design:type", String)
], AiImageTaskEntity.prototype, "presetValues", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '用户ID', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], AiImageTaskEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '平台ID', length: 100, nullable: true }),
    __metadata("design:type", String)
], AiImageTaskEntity.prototype, "platformId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '飞书ID', length: 100, nullable: true }),
    __metadata("design:type", String)
], AiImageTaskEntity.prototype, "feishuId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '机器人ID', length: 100, nullable: true }),
    __metadata("design:type", String)
], AiImageTaskEntity.prototype, "botId", void 0);
AiImageTaskEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'ai_image_tasks' })
], AiImageTaskEntity);
exports.AiImageTaskEntity = AiImageTaskEntity;
let AiGeneratedImageEntity = class AiGeneratedImageEntity extends baseEntity_1.BaseEntity {
};
__decorate([
    (0, typeorm_1.Column)({ comment: '关联的任务ID', length: 36 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], AiGeneratedImageEntity.prototype, "taskId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '图片URL', type: 'text' }),
    __metadata("design:type", String)
], AiGeneratedImageEntity.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '图片来源: user/generated', length: 20, default: 'generated' }),
    __metadata("design:type", String)
], AiGeneratedImageEntity.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '图片类型: original/source', length: 20, default: 'original' }),
    __metadata("design:type", String)
], AiGeneratedImageEntity.prototype, "imageType", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '图片宽度', nullable: true }),
    __metadata("design:type", Number)
], AiGeneratedImageEntity.prototype, "width", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '图片高度', nullable: true }),
    __metadata("design:type", Number)
], AiGeneratedImageEntity.prototype, "height", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '图片大小(字节)', nullable: true }),
    __metadata("design:type", Number)
], AiGeneratedImageEntity.prototype, "size", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '文件名', length: 255, nullable: true }),
    __metadata("design:type", String)
], AiGeneratedImageEntity.prototype, "filename", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '图片格式', length: 10, nullable: true }),
    __metadata("design:type", String)
], AiGeneratedImageEntity.prototype, "format", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '处理时间(毫秒)', nullable: true }),
    __metadata("design:type", Number)
], AiGeneratedImageEntity.prototype, "processTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '创建时间戳', nullable: true }),
    __metadata("design:type", Date)
], AiGeneratedImageEntity.prototype, "timestamp", void 0);
AiGeneratedImageEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'ai_generated_images' })
], AiGeneratedImageEntity);
exports.AiGeneratedImageEntity = AiGeneratedImageEntity;
let ImageUrlMappingEntity = class ImageUrlMappingEntity extends baseEntity_1.BaseEntity {
};
__decorate([
    (0, typeorm_1.Column)({ comment: '清理后的URL', type: 'text' }),
    __metadata("design:type", String)
], ImageUrlMappingEntity.prototype, "cleanedUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '上传后的URL', type: 'text' }),
    __metadata("design:type", String)
], ImageUrlMappingEntity.prototype, "uploadedUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '映射创建时间', nullable: true }),
    __metadata("design:type", Date)
], ImageUrlMappingEntity.prototype, "mappingCreatedAt", void 0);
ImageUrlMappingEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'ai_image_url_mappings' })
], ImageUrlMappingEntity);
exports.ImageUrlMappingEntity = ImageUrlMappingEntity;
