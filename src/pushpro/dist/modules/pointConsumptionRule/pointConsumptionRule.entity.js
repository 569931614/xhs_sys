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
exports.PointConsumptionRuleEntity = void 0;
const typeorm_1 = require("typeorm");
let PointConsumptionRuleEntity = class PointConsumptionRuleEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PointConsumptionRuleEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '套餐ID', default: 0 }),
    __metadata("design:type", Number)
], PointConsumptionRuleEntity.prototype, "packageId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '功能ID', length: 50 }),
    __metadata("design:type", String)
], PointConsumptionRuleEntity.prototype, "functionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '普通对话模型(model3)消耗率', default: 0 }),
    __metadata("design:type", Number)
], PointConsumptionRuleEntity.prototype, "model3Rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '高级对话模型(model4)消耗率', default: 0 }),
    __metadata("design:type", Number)
], PointConsumptionRuleEntity.prototype, "model4Rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '绘画模型消耗率', default: 0 }),
    __metadata("design:type", Number)
], PointConsumptionRuleEntity.prototype, "drawMjRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '规则状态 0:禁用 1:启用', default: 1 }),
    __metadata("design:type", Number)
], PointConsumptionRuleEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '是否可用 0:不可用 1:可用', default: 1 }),
    __metadata("design:type", Number)
], PointConsumptionRuleEntity.prototype, "isAvailable", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '最大同时执行任务数', default: 1 }),
    __metadata("design:type", Number)
], PointConsumptionRuleEntity.prototype, "maxConcurrentTasks", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '规则描述', nullable: true, length: 255 }),
    __metadata("design:type", String)
], PointConsumptionRuleEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '创建时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], PointConsumptionRuleEntity.prototype, "createTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '更新时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], PointConsumptionRuleEntity.prototype, "updateTime", void 0);
PointConsumptionRuleEntity = __decorate([
    (0, typeorm_1.Entity)('point_consumption_rule')
], PointConsumptionRuleEntity);
exports.PointConsumptionRuleEntity = PointConsumptionRuleEntity;
