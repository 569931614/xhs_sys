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
exports.CustomPage = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
let CustomPage = class CustomPage {
};
__decorate([
    (0, swagger_1.ApiProperty)({ description: '自定义页面ID' }),
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CustomPage.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页面标题' }),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomPage.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页面路径（可以是完整URL或相对路径）' }),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomPage.prototype, "path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页面类型（0: 外部链接, 1: 内部页面）' }),
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], CustomPage.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页面图标' }),
    (0, typeorm_1.Column)({ default: 'icon-park:page' }),
    __metadata("design:type", String)
], CustomPage.prototype, "icon", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '描述信息' }),
    (0, typeorm_1.Column)({ default: '' }),
    __metadata("design:type", String)
], CustomPage.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序值' }),
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], CustomPage.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态(0: 禁用, 1: 启用)' }),
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], CustomPage.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '允许访问的用户类型ID数组，为空则所有用户可访问' }),
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], CustomPage.prototype, "userTypes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CustomPage.prototype, "createTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新时间' }),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CustomPage.prototype, "updateTime", void 0);
CustomPage = __decorate([
    (0, typeorm_1.Entity)()
], CustomPage);
exports.CustomPage = CustomPage;
