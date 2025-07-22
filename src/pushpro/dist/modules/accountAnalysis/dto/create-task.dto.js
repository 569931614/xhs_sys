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
exports.CreateTaskDto = exports.PlatformType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var PlatformType;
(function (PlatformType) {
    PlatformType["DOUYIN"] = "douyin";
    PlatformType["XIAOHONGSHU"] = "xiaohongshu";
})(PlatformType = exports.PlatformType || (exports.PlatformType = {}));
class CreateTaskDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '平台类型，可选，不提供时会自动从链接判断',
        enum: PlatformType,
        required: false
    }),
    (0, class_validator_1.IsEnum)(PlatformType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '平台名称，可选，不提供时会自动设置',
        example: '抖音',
        required: false
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "type_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '账号链接，系统会自动从链接判断是抖音还是小红书',
        example: 'https://www.douyin.com/user/MS4wLjABxxxxxx'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '账号链接不能为空' }),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "link", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '分析模式', example: '10', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "mode", void 0);
exports.CreateTaskDto = CreateTaskDto;
