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
exports.CustomPageDetailDto = exports.CustomPageListDto = exports.UpdateCustomPageDto = exports.CreateCustomPageDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateCustomPageDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页面标题', example: '我的页面' }),
    (0, class_validator_1.IsNotEmpty)({ message: '页面标题不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCustomPageDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页面路径', example: 'https://www.example.com 或 /mypage' }),
    (0, class_validator_1.IsNotEmpty)({ message: '页面路径不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCustomPageDto.prototype, "path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页面类型（0: 外部链接, 1: 内部页面）', example: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCustomPageDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页面图标', example: 'icon-park:page' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCustomPageDto.prototype, "icon", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '描述信息', example: '这是一个自定义页面' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCustomPageDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序值', example: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCustomPageDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态(0: 禁用, 1: 启用)', example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCustomPageDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '允许访问的用户类型ID数组', example: [1, 2], required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateCustomPageDto.prototype, "userTypes", void 0);
exports.CreateCustomPageDto = CreateCustomPageDto;
class UpdateCustomPageDto extends CreateCustomPageDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID', example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateCustomPageDto.prototype, "id", void 0);
exports.UpdateCustomPageDto = UpdateCustomPageDto;
class CustomPageListDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '当前页数', example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    __metadata("design:type", Number)
], CustomPageListDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每页数量', example: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    __metadata("design:type", Number)
], CustomPageListDto.prototype, "size", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页面标题搜索', example: '首页' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CustomPageListDto.prototype, "title", void 0);
exports.CustomPageListDto = CustomPageListDto;
class CustomPageDetailDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID', example: 1 }),
    (0, class_validator_1.IsNotEmpty)({ message: 'ID不能为空' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CustomPageDetailDto.prototype, "id", void 0);
exports.CustomPageDetailDto = CustomPageDetailDto;
