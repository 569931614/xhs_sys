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
exports.InvitationEntity = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
let InvitationEntity = class InvitationEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], InvitationEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], InvitationEntity.prototype, "inviterId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], InvitationEntity.prototype, "inviteeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '邀请产生的总消费金额' }),
    __metadata("design:type", Number)
], InvitationEntity.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0, comment: '邀请产生的订单数量' }),
    __metadata("design:type", Number)
], InvitationEntity.prototype, "orderCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1, comment: '层级关系: 1-直属(目前系统只支持一级关系)' }),
    __metadata("design:type", Number)
], InvitationEntity.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '充值金额' }),
    __metadata("design:type", Number)
], InvitationEntity.prototype, "rechargeAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '佣金金额' }),
    __metadata("design:type", Number)
], InvitationEntity.prototype, "commissionAmount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], InvitationEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], InvitationEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'inviterId' }),
    __metadata("design:type", user_entity_1.UserEntity)
], InvitationEntity.prototype, "inviter", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'inviteeId' }),
    __metadata("design:type", user_entity_1.UserEntity)
], InvitationEntity.prototype, "invitee", void 0);
InvitationEntity = __decorate([
    (0, typeorm_1.Entity)('invitation')
], InvitationEntity);
exports.InvitationEntity = InvitationEntity;
