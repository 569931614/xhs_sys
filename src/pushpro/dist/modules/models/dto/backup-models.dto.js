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
exports.DeleteBackupModelDto = exports.UpdateBackupModelStatusDto = exports.UpdateBackupModelDto = exports.CreateBackupModelDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateBackupModelDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '模型名称' }),
    (0, class_validator_1.IsNotEmpty)({ message: '模型名称不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBackupModelDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '请求地址' }),
    (0, class_validator_1.IsNotEmpty)({ message: '请求地址不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBackupModelDto.prototype, "baseUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'API Key' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'API Key不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBackupModelDto.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '模型类型', enum: ['text', 'image', 'video'], default: 'text' }),
    (0, class_validator_1.IsNotEmpty)({ message: '模型类型不能为空' }),
    (0, class_validator_1.IsEnum)(['text', 'image', 'video'], { message: '模型类型不正确' }),
    __metadata("design:type", String)
], CreateBackupModelDto.prototype, "modelType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '使用的模型', default: 'gpt-4o-image' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBackupModelDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态：0-禁用, 1-启用', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateBackupModelDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '优先级：数字越小优先级越高', default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateBackupModelDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '请求方式', enum: ['stream', 'sync'], default: 'stream' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['stream', 'sync'], { message: '请求方式不正确' }),
    __metadata("design:type", String)
], CreateBackupModelDto.prototype, "requestMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '请求类型', enum: ['chat', 'edit', 'image'], default: 'chat' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['chat', 'edit', 'image'], { message: '请求类型不正确' }),
    __metadata("design:type", String)
], CreateBackupModelDto.prototype, "requestType", void 0);
exports.CreateBackupModelDto = CreateBackupModelDto;
class UpdateBackupModelDto extends CreateBackupModelDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '模型ID' }),
    (0, class_validator_1.IsNotEmpty)({ message: '模型ID不能为空' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateBackupModelDto.prototype, "id", void 0);
exports.UpdateBackupModelDto = UpdateBackupModelDto;
class UpdateBackupModelStatusDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '模型ID' }),
    (0, class_validator_1.IsNotEmpty)({ message: '模型ID不能为空' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateBackupModelStatusDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态：0-禁用, 1-启用' }),
    (0, class_validator_1.IsNotEmpty)({ message: '状态不能为空' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateBackupModelStatusDto.prototype, "status", void 0);
exports.UpdateBackupModelStatusDto = UpdateBackupModelStatusDto;
class DeleteBackupModelDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '模型ID' }),
    (0, class_validator_1.IsNotEmpty)({ message: '模型ID不能为空' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], DeleteBackupModelDto.prototype, "id", void 0);
exports.DeleteBackupModelDto = DeleteBackupModelDto;
