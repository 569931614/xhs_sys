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
exports.ChannelLevelEntity = void 0;
const typeorm_1 = require("typeorm");
let ChannelLevelEntity = class ChannelLevelEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ChannelLevelEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '渠道等级: 1-普通用户, 2-代理商, 3-高级代理商', default: 1 }),
    __metadata("design:type", Number)
], ChannelLevelEntity.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '等级名称' }),
    __metadata("design:type", String)
], ChannelLevelEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0, comment: '一级佣金比例' }),
    __metadata("design:type", Number)
], ChannelLevelEntity.prototype, "levelOneRatio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0, comment: '二级佣金比例' }),
    __metadata("design:type", Number)
], ChannelLevelEntity.prototype, "levelTwoRatio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0, comment: '三级佣金比例' }),
    __metadata("design:type", Number)
], ChannelLevelEntity.prototype, "levelThreeRatio", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0, comment: '升级所需下级人数' }),
    __metadata("design:type", Number)
], ChannelLevelEntity.prototype, "requiredInvites", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '升级所需销售额' }),
    __metadata("design:type", Number)
], ChannelLevelEntity.prototype, "requiredSales", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '状态: 1-启用, 0-禁用', default: 1 }),
    __metadata("design:type", Number)
], ChannelLevelEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ChannelLevelEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ChannelLevelEntity.prototype, "updatedAt", void 0);
ChannelLevelEntity = __decorate([
    (0, typeorm_1.Entity)('channel_level')
], ChannelLevelEntity);
exports.ChannelLevelEntity = ChannelLevelEntity;
