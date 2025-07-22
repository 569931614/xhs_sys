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
exports.SignatureDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class SignatureDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'App Key' }),
    __metadata("design:type", String)
], SignatureDto.prototype, "appKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '签名数据' }),
    __metadata("design:type", String)
], SignatureDto.prototype, "signature", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '时间戳' }),
    __metadata("design:type", String)
], SignatureDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '随机数' }),
    __metadata("design:type", String)
], SignatureDto.prototype, "nonce", void 0);
exports.SignatureDto = SignatureDto;
