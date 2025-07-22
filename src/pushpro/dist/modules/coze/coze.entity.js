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
exports.CozeEntity = void 0;
const typeorm_1 = require("typeorm");
const baseEntity_1 = require("../../common/entity/baseEntity");
let CozeEntity = class CozeEntity extends baseEntity_1.BaseEntity {
};
__decorate([
    (0, typeorm_1.Column)({ comment: 'Coze Workflow ID', length: 255, unique: true }),
    __metadata("design:type", String)
], CozeEntity.prototype, "workflowId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '名称描述', length: 255 }),
    __metadata("design:type", String)
], CozeEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: 'Coze 公钥', length: 512 }),
    __metadata("design:type", String)
], CozeEntity.prototype, "publicKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: 'Coze 私钥', length: 2048 }),
    __metadata("design:type", String)
], CozeEntity.prototype, "secretKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '客户端ID', length: 255, nullable: true }),
    __metadata("design:type", String)
], CozeEntity.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '空间ID', length: 255, nullable: true }),
    __metadata("design:type", String)
], CozeEntity.prototype, "spaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '状态', type: 'tinyint', default: 1 }),
    __metadata("design:type", Number)
], CozeEntity.prototype, "status", void 0);
CozeEntity = __decorate([
    (0, typeorm_1.Entity)('coze')
], CozeEntity);
exports.CozeEntity = CozeEntity;
