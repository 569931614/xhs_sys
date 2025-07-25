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
exports.AcceptInvitationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AcceptInvitationDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '邀请码' }),
    (0, class_validator_1.IsNotEmpty)({ message: '邀请码不能为空' }),
    (0, class_validator_1.IsString)({ message: '邀请码必须是字符串' }),
    __metadata("design:type", String)
], AcceptInvitationDto.prototype, "inviteCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '新用户ID' }),
    (0, class_validator_1.IsNotEmpty)({ message: '用户ID不能为空' }),
    (0, class_validator_1.IsNumber)({}, { message: '用户ID必须是数字' }),
    __metadata("design:type", Number)
], AcceptInvitationDto.prototype, "userId", void 0);
exports.AcceptInvitationDto = AcceptInvitationDto;
