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
exports.ImageGeneratorTask = void 0;
const typeorm_1 = require("typeorm");
let ImageGeneratorTask = class ImageGeneratorTask {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ImageGeneratorTask.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '用户ID' }),
    __metadata("design:type", String)
], ImageGeneratorTask.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '任务ID列表', type: 'text', nullable: true }),
    __metadata("design:type", String)
], ImageGeneratorTask.prototype, "taskIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '模板ID', nullable: true }),
    __metadata("design:type", Number)
], ImageGeneratorTask.prototype, "templateId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '生成的提示词', nullable: true }),
    __metadata("design:type", String)
], ImageGeneratorTask.prototype, "prompt", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '图片URL', length: 800, nullable: true }),
    __metadata("design:type", String)
], ImageGeneratorTask.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '图片宽度', nullable: true }),
    __metadata("design:type", String)
], ImageGeneratorTask.prototype, "width", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '图片高度', nullable: true }),
    __metadata("design:type", String)
], ImageGeneratorTask.prototype, "height", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '所有图片URL列表', type: 'text', nullable: true }),
    __metadata("design:type", String)
], ImageGeneratorTask.prototype, "allImageUrls", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '任务状态', default: 'pending' }),
    __metadata("design:type", String)
], ImageGeneratorTask.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '错误信息', nullable: true }),
    __metadata("design:type", String)
], ImageGeneratorTask.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ comment: '创建时间' }),
    __metadata("design:type", Date)
], ImageGeneratorTask.prototype, "createTime", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ comment: '更新时间' }),
    __metadata("design:type", Date)
], ImageGeneratorTask.prototype, "updateTime", void 0);
ImageGeneratorTask = __decorate([
    (0, typeorm_1.Entity)('image_generator_task')
], ImageGeneratorTask);
exports.ImageGeneratorTask = ImageGeneratorTask;
