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
exports.CozeChatDto = exports.CozeListDto = exports.CozeUpdateDto = exports.CozeCreateDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CozeCreateDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Coze Workflow ID' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Workflow ID不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CozeCreateDto.prototype, "workflowId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '名称描述' }),
    (0, class_validator_1.IsNotEmpty)({ message: '名称不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CozeCreateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Coze 公钥' }),
    (0, class_validator_1.IsNotEmpty)({ message: '公钥不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CozeCreateDto.prototype, "publicKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Coze 私钥' }),
    (0, class_validator_1.IsNotEmpty)({ message: '私钥不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CozeCreateDto.prototype, "secretKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '客户端ID' }),
    (0, class_validator_1.IsNotEmpty)({ message: '客户端ID不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CozeCreateDto.prototype, "clientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '空间ID' }),
    (0, class_validator_1.IsNotEmpty)({ message: '空间ID不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CozeCreateDto.prototype, "spaceId", void 0);
exports.CozeCreateDto = CozeCreateDto;
class CozeUpdateDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Coze Workflow ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CozeUpdateDto.prototype, "workflowId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '名称描述' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CozeUpdateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Coze 公钥' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CozeUpdateDto.prototype, "publicKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Coze 私钥' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CozeUpdateDto.prototype, "secretKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '客户端ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CozeUpdateDto.prototype, "clientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '空间ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CozeUpdateDto.prototype, "spaceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态', enum: [0, 1] }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CozeUpdateDto.prototype, "status", void 0);
exports.CozeUpdateDto = CozeUpdateDto;
class CozeListDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页码', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CozeListDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每页数量', default: 10 }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CozeListDto.prototype, "size", void 0);
exports.CozeListDto = CozeListDto;
class CozeChatDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Coze Workflow ID' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Workflow ID不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CozeChatDto.prototype, "workflowId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '消息内容' }),
    (0, class_validator_1.IsNotEmpty)({ message: '消息内容不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CozeChatDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '会话ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CozeChatDto.prototype, "sessionId", void 0);
exports.CozeChatDto = CozeChatDto;
