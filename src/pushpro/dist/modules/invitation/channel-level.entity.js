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
exports.ChannelLevel = void 0;
const typeorm_1 = require("typeorm");
let ChannelLevel = class ChannelLevel {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ChannelLevel.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, comment: '渠道等级名称' }),
    __metadata("design:type", String)
], ChannelLevel.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 10, comment: '返佣比例，百分比' }),
    __metadata("design:type", Number)
], ChannelLevel.prototype, "commissionRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0, comment: '等级排序' }),
    __metadata("design:type", Number)
], ChannelLevel.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true, comment: '备注说明' }),
    __metadata("design:type", String)
], ChannelLevel.prototype, "remark", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true, comment: '是否启用' }),
    __metadata("design:type", Boolean)
], ChannelLevel.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ChannelLevel.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ChannelLevel.prototype, "updatedAt", void 0);
ChannelLevel = __decorate([
    (0, typeorm_1.Entity)('invitation_channel_level')
], ChannelLevel);
exports.ChannelLevel = ChannelLevel;
