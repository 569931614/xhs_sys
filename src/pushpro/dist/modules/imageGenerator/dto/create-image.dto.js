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
exports.CreateImageDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateImageDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '主标题内容', example: '0基础小白如何做自媒体' }),
    (0, class_validator_1.IsNotEmpty)({ message: '主标题不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateImageDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '智能ID', example: 267 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateImageDto.prototype, "intellectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '请求ID', example: '用户ID_智能ID_时间戳' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateImageDto.prototype, "requestId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '当前页码，用于继续生成功能', example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateImageDto.prototype, "pageNo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '前一次任务的ID，用于继续生成功能', example: 12345 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateImageDto.prototype, "previousTaskId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '额外字段，用于不同模式的额外输入',
        example: {
            subtitle: '副标题',
            paragraph1Title: '段落1标题',
            paragraph1Content: '段落1内容'
        },
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateImageDto.prototype, "additionalFields", void 0);
exports.CreateImageDto = CreateImageDto;
