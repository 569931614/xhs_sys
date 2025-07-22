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
exports.ImageDownloadUrl = void 0;
const typeorm_1 = require("typeorm");
let ImageDownloadUrl = class ImageDownloadUrl {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ImageDownloadUrl.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '图片任务ID', length: 100, nullable: true }),
    __metadata("design:type", String)
], ImageDownloadUrl.prototype, "taskId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '下载链接', length: 800 }),
    __metadata("design:type", String)
], ImageDownloadUrl.prototype, "downloadUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '文件名', length: 200, nullable: true }),
    __metadata("design:type", String)
], ImageDownloadUrl.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ comment: '创建时间' }),
    __metadata("design:type", Date)
], ImageDownloadUrl.prototype, "createTime", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ comment: '更新时间' }),
    __metadata("design:type", Date)
], ImageDownloadUrl.prototype, "updateTime", void 0);
ImageDownloadUrl = __decorate([
    (0, typeorm_1.Entity)('image_download_url')
], ImageDownloadUrl);
exports.ImageDownloadUrl = ImageDownloadUrl;
