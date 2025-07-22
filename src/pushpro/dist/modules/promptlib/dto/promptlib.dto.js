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
exports.DeletePromptTemplateDto = exports.QueryPromptTemplateDto = exports.UpdatePromptTemplateDto = exports.CreatePromptTemplateDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreatePromptTemplateDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'xhs_title_gen', description: '提示词标识' }),
    (0, class_validator_1.IsNotEmpty)({ message: '提示词标识不能为空' }),
    (0, class_validator_1.IsString)({ message: '提示词标识必须是字符串' }),
    __metadata("design:type", String)
], CreatePromptTemplateDto.prototype, "identifier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '请根据以下内容生成一个吸引人的小红书标题，字数在15字以内：{{content}}', description: '提示词内容' }),
    (0, class_validator_1.IsNotEmpty)({ message: '提示词内容不能为空' }),
    (0, class_validator_1.IsString)({ message: '提示词内容必须是字符串' }),
    __metadata("design:type", String)
], CreatePromptTemplateDto.prototype, "prompt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'gpt-3.5-turbo', description: '使用的模型名称' }),
    (0, class_validator_1.IsNotEmpty)({ message: '模型名称不能为空' }),
    (0, class_validator_1.IsString)({ message: '模型名称必须是字符串' }),
    __metadata("design:type", String)
], CreatePromptTemplateDto.prototype, "modelName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '模板状态：1-启用，0-禁用', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '状态必须是数字' }),
    __metadata("design:type", Number)
], CreatePromptTemplateDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '你是一个专业的图像生成助手，需要严格按照我的要求生成图片', description: 'API请求预设值', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'API请求预设值必须是字符串' }),
    __metadata("design:type", String)
], CreatePromptTemplateDto.prototype, "presetValues", void 0);
exports.CreatePromptTemplateDto = CreatePromptTemplateDto;
class UpdatePromptTemplateDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '模板ID' }),
    (0, class_validator_1.IsNotEmpty)({ message: '模板ID不能为空' }),
    (0, class_validator_1.IsNumber)({}, { message: '模板ID必须是数字' }),
    __metadata("design:type", Number)
], UpdatePromptTemplateDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'xhs_title_gen', description: '提示词标识' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '提示词标识必须是字符串' }),
    __metadata("design:type", String)
], UpdatePromptTemplateDto.prototype, "identifier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '请根据以下内容生成一个吸引人的小红书标题，字数在15字以内：{{content}}', description: '提示词内容' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '提示词内容必须是字符串' }),
    __metadata("design:type", String)
], UpdatePromptTemplateDto.prototype, "prompt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'gpt-3.5-turbo', description: '使用的模型名称' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '模型名称必须是字符串' }),
    __metadata("design:type", String)
], UpdatePromptTemplateDto.prototype, "modelName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '模板状态：1-启用，0-禁用' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '状态必须是数字' }),
    __metadata("design:type", Number)
], UpdatePromptTemplateDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '你是一个专业的图像生成助手，需要严格按照我的要求生成图片', description: 'API请求预设值', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'API请求预设值必须是字符串' }),
    __metadata("design:type", String)
], UpdatePromptTemplateDto.prototype, "presetValues", void 0);
exports.UpdatePromptTemplateDto = UpdatePromptTemplateDto;
class QueryPromptTemplateDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页码', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: '页码必须是数字' }),
    __metadata("design:type", Number)
], QueryPromptTemplateDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每页数量', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: '每页数量必须是数字' }),
    __metadata("design:type", Number)
], QueryPromptTemplateDto.prototype, "pageSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '提示词标识', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '提示词标识必须是字符串' }),
    __metadata("design:type", String)
], QueryPromptTemplateDto.prototype, "identifier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '模型名称', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '模型名称必须是字符串' }),
    __metadata("design:type", String)
], QueryPromptTemplateDto.prototype, "modelName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态：1-启用，0-禁用', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: '状态必须是数字' }),
    __metadata("design:type", Number)
], QueryPromptTemplateDto.prototype, "status", void 0);
exports.QueryPromptTemplateDto = QueryPromptTemplateDto;
class DeletePromptTemplateDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '模板ID' }),
    (0, class_validator_1.IsNotEmpty)({ message: '模板ID不能为空' }),
    (0, class_validator_1.IsNumber)({}, { message: '模板ID必须是数字' }),
    __metadata("design:type", Number)
], DeletePromptTemplateDto.prototype, "id", void 0);
exports.DeletePromptTemplateDto = DeletePromptTemplateDto;
