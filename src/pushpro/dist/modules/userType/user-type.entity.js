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
exports.UserTypeEntity = void 0;
const typeorm_1 = require("typeorm");
let UserTypeEntity = class UserTypeEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserTypeEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '类型名称', length: 50 }),
    __metadata("design:type", String)
], UserTypeEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '类型描述', length: 200, default: '' }),
    __metadata("design:type", String)
], UserTypeEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '状态 0-禁用 1-启用', default: 1 }),
    __metadata("design:type", Number)
], UserTypeEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ comment: '创建时间' }),
    __metadata("design:type", Date)
], UserTypeEntity.prototype, "createTime", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ comment: '更新时间' }),
    __metadata("design:type", Date)
], UserTypeEntity.prototype, "updateTime", void 0);
UserTypeEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'user_type' })
], UserTypeEntity);
exports.UserTypeEntity = UserTypeEntity;
