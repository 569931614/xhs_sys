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
exports.XhsActivity = void 0;
const typeorm_1 = require("typeorm");
let XhsActivity = class XhsActivity {
};
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], XhsActivity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '活动名称' }),
    __metadata("design:type", String)
], XhsActivity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '素材类型', default: 'normal' }),
    __metadata("design:type", String)
], XhsActivity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '状态', default: 'active' }),
    __metadata("design:type", String)
], XhsActivity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '是否默认活动', default: false }),
    __metadata("design:type", Boolean)
], XhsActivity.prototype, "isDefault", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '用户ID', nullable: true }),
    __metadata("design:type", Number)
], XhsActivity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '创建时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], XhsActivity.prototype, "createTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '更新时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], XhsActivity.prototype, "updateTime", void 0);
XhsActivity = __decorate([
    (0, typeorm_1.Entity)('xhs_activities')
], XhsActivity);
exports.XhsActivity = XhsActivity;
