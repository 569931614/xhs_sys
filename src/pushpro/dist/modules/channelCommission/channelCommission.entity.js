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
exports.ChannelCommissionEntity = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
const order_entity_1 = require("../order/order.entity");
let ChannelCommissionEntity = class ChannelCommissionEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ChannelCommissionEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ChannelCommissionEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ChannelCommissionEntity.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ChannelCommissionEntity.prototype, "inviteeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '佣金金额' }),
    __metadata("design:type", Number)
], ChannelCommissionEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '订单金额' }),
    __metadata("design:type", Number)
], ChannelCommissionEntity.prototype, "orderAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0, comment: '佣金比例' }),
    __metadata("design:type", Number)
], ChannelCommissionEntity.prototype, "commissionRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1, comment: '佣金等级: 1-一级, 2-二级, 3-三级' }),
    __metadata("design:type", Number)
], ChannelCommissionEntity.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0, comment: '状态: 0-未结算, 1-已结算, -1-已取消' }),
    __metadata("design:type", Number)
], ChannelCommissionEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, comment: '结算时间' }),
    __metadata("design:type", Date)
], ChannelCommissionEntity.prototype, "settledAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ChannelCommissionEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ChannelCommissionEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.UserEntity)
], ChannelCommissionEntity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'inviteeId' }),
    __metadata("design:type", user_entity_1.UserEntity)
], ChannelCommissionEntity.prototype, "invitee", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_entity_1.OrderEntity),
    (0, typeorm_1.JoinColumn)({ name: 'orderId' }),
    __metadata("design:type", order_entity_1.OrderEntity)
], ChannelCommissionEntity.prototype, "order", void 0);
ChannelCommissionEntity = __decorate([
    (0, typeorm_1.Entity)('channel_commission')
], ChannelCommissionEntity);
exports.ChannelCommissionEntity = ChannelCommissionEntity;
