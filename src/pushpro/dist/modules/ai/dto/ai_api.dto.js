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
exports.ApiRequestOptionsDto = exports.GetTaskResultDto = exports.CreateTaskByTemplateDto = exports.CreateTaskDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateTaskDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '**--- 用户输入区 ---**\n1.  **`{{BRAND_PRODUCT}}`**: [{{string1}}]\n2.  **`{{TOPIC}}`**: [{{string2}}]',
        description: '提示词模板，可以包含{{stringN}}格式的变量',
        required: true
    }),
    (0, class_validator_1.IsNotEmpty)({ message: '提示词不能为空' }),
    (0, class_validator_1.IsString)({ message: '提示词必须是字符串' }),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "prompt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['产品名称', '主题描述'],
        description: '用于替换模板中{{stringN}}的变量值',
        required: false,
        type: [String]
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: '变量必须是数组' }),
    __metadata("design:type", Array)
], CreateTaskDto.prototype, "variables", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        description: '图片URL列表，可以是单个URL字符串或URL数组',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value === 'string') {
            return [value];
        }
        return value;
    }),
    __metadata("design:type", Object)
], CreateTaskDto.prototype, "image_url", void 0);
exports.CreateTaskDto = CreateTaskDto;
class CreateTaskByTemplateDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '小红书爆款模板',
        description: '提示词模板名称，系统会根据名称从小红书工厂提示词模板库中获取对应的提示词和模型配置',
        required: true
    }),
    (0, class_validator_1.IsNotEmpty)({ message: '提示词模板名称不能为空' }),
    (0, class_validator_1.IsString)({ message: '提示词模板名称必须是字符串' }),
    __metadata("design:type", String)
], CreateTaskByTemplateDto.prototype, "template_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['产品名称', '主题描述'],
        description: '用于替换模板中{{stringN}}的变量值',
        required: false,
        type: [String]
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: '变量必须是数组' }),
    __metadata("design:type", Array)
], CreateTaskByTemplateDto.prototype, "variables", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        description: '图片URL列表，可以是单个URL字符串或URL数组',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value === 'string') {
            return [value];
        }
        return value;
    }),
    __metadata("design:type", Object)
], CreateTaskByTemplateDto.prototype, "image_url", void 0);
exports.CreateTaskByTemplateDto = CreateTaskByTemplateDto;
class GetTaskResultDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: '10', description: '请求超时时间(秒)', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetTaskResultDto.prototype, "timeout", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user123', description: '用户UUID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetTaskResultDto.prototype, "uuid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'platform123', description: '平台ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetTaskResultDto.prototype, "platform_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'feishu123', description: '飞书ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetTaskResultDto.prototype, "feishu_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'bot123', description: '机器人ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetTaskResultDto.prototype, "bot_id", void 0);
exports.GetTaskResultDto = GetTaskResultDto;
class ApiRequestOptionsDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '提示词',
        required: true
    }),
    (0, class_validator_1.IsNotEmpty)({ message: '提示词不能为空' }),
    (0, class_validator_1.IsString)({ message: '提示词必须是字符串' }),
    __metadata("design:type", String)
], ApiRequestOptionsDto.prototype, "prompt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '基础URL地址',
        required: true,
        example: 'https://api.openai.com'
    }),
    (0, class_validator_1.IsNotEmpty)({ message: '基础URL不能为空' }),
    (0, class_validator_1.IsString)({ message: '基础URL必须是字符串' }),
    __metadata("design:type", String)
], ApiRequestOptionsDto.prototype, "baseUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'API密钥',
        required: true,
        example: 'sk-xxxx'
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'API密钥不能为空' }),
    (0, class_validator_1.IsString)({ message: 'API密钥必须是字符串' }),
    __metadata("design:type", String)
], ApiRequestOptionsDto.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '模型名称',
        required: true,
        example: 'gpt-4o-image'
    }),
    (0, class_validator_1.IsNotEmpty)({ message: '模型名称不能为空' }),
    (0, class_validator_1.IsString)({ message: '模型名称必须是字符串' }),
    __metadata("design:type", String)
], ApiRequestOptionsDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '请求方式',
        enum: ['stream', 'sync'],
        default: 'stream',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['stream', 'sync'], { message: '请求方式必须是stream或sync' }),
    __metadata("design:type", String)
], ApiRequestOptionsDto.prototype, "requestMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '请求类型',
        enum: ['chat', 'edit', 'image'],
        default: 'chat',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['chat', 'edit', 'image'], { message: '请求类型必须是chat、edit或image' }),
    __metadata("design:type", String)
], ApiRequestOptionsDto.prototype, "requestType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '图像比例(仅图像请求时有效)',
        example: '2:3',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '比例必须是字符串' }),
    __metadata("design:type", String)
], ApiRequestOptionsDto.prototype, "ratio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '图片URL数组',
        type: [String],
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: '图片URL必须是数组' }),
    __metadata("design:type", Array)
], ApiRequestOptionsDto.prototype, "imageUrls", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'API请求预设值',
        required: false,
        type: 'object'
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ApiRequestOptionsDto.prototype, "presetValues", void 0);
exports.ApiRequestOptionsDto = ApiRequestOptionsDto;
