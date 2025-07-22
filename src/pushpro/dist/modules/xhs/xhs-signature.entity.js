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
exports.XhsSignature = void 0;
const typeorm_1 = require("typeorm");
let XhsSignature = class XhsSignature {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], XhsSignature.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: 'App Key' }),
    __metadata("design:type", String)
], XhsSignature.prototype, "appKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '签名数据' }),
    __metadata("design:type", String)
], XhsSignature.prototype, "signature", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '时间戳', type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], XhsSignature.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '随机数', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], XhsSignature.prototype, "nonce", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '创建时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], XhsSignature.prototype, "createTime", void 0);
XhsSignature = __decorate([
    (0, typeorm_1.Entity)('xhs_signatures')
], XhsSignature);
exports.XhsSignature = XhsSignature;
