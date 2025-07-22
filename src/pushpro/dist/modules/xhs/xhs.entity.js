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
exports.XhsPost = void 0;
const typeorm_1 = require("typeorm");
let XhsPost = class XhsPost {
};
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 20, comment: '主键ID' }),
    __metadata("design:type", String)
], XhsPost.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '类型', default: 'normal' }),
    __metadata("design:type", String)
], XhsPost.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '标题' }),
    __metadata("design:type", String)
], XhsPost.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '内容', type: 'text' }),
    __metadata("design:type", String)
], XhsPost.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '图片URL', type: 'simple-array' }),
    __metadata("design:type", Array)
], XhsPost.prototype, "images", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '视频URL', nullable: true }),
    __metadata("design:type", String)
], XhsPost.prototype, "video", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '封面URL', nullable: true }),
    __metadata("design:type", String)
], XhsPost.prototype, "cover", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '标识符', nullable: true }),
    __metadata("design:type", String)
], XhsPost.prototype, "identifier", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '是否已使用', default: false }),
    __metadata("design:type", Boolean)
], XhsPost.prototype, "isUsed", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '抖音是否已使用', default: false }),
    __metadata("design:type", Boolean)
], XhsPost.prototype, "douyinUsed", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '是否已弃用', default: false }),
    __metadata("design:type", Boolean)
], XhsPost.prototype, "isDiscarded", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '用户ID', nullable: true }),
    __metadata("design:type", Number)
], XhsPost.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '活动ID', nullable: true, type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], XhsPost.prototype, "activityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '供应商', nullable: true, type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], XhsPost.prototype, "supplier", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '创建时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], XhsPost.prototype, "createTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '更新时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], XhsPost.prototype, "updateTime", void 0);
XhsPost = __decorate([
    (0, typeorm_1.Entity)('xhs_posts')
], XhsPost);
exports.XhsPost = XhsPost;
