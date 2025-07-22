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
exports.RenderTemplateToImageDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const htmllib_render_dto_1 = require("./dto/htmllib-render.dto");
class RenderTemplateToImageDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'pic_4_1', description: '模板名称' }),
    (0, class_validator_1.IsNotEmpty)({ message: '模板名称不能为空' }),
    (0, class_validator_1.IsString)({ message: '模板名称必须是字符串' }),
    __metadata("design:type", String)
], RenderTemplateToImageDto.prototype, "templateName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        description: '替换图片的URL数组',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: '图片数组必须是数组' }),
    (0, class_validator_1.IsString)({ each: true, message: '图片URL必须是字符串' }),
    __metadata("design:type", Array)
], RenderTemplateToImageDto.prototype, "imageUrls", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [htmllib_render_dto_1.TextReplacementItem],
        example: [
            { placeholder: '可替换文本1', replaceWith: '是一个非常好用的产品' },
            { placeholder: '可替换文本2', replaceWith: '值得购买' }
        ],
        description: '文本替换对照表',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: '文本替换对照表必须是数组' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => htmllib_render_dto_1.TextReplacementItem),
    __metadata("design:type", Array)
], RenderTemplateToImageDto.prototype, "textReplacements", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: false,
        description: '是否通过元素ID进行文本替换，当为true时，placeholder将被视为元素ID',
        required: false,
        default: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'useId必须是布尔值' }),
    __metadata("design:type", Boolean)
], RenderTemplateToImageDto.prototype, "useId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1200, description: '图片宽度（像素）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '宽度必须是数字' }),
    __metadata("design:type", Number)
], RenderTemplateToImageDto.prototype, "width", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '图片高度（像素），0表示自动计算', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '高度必须是数字' }),
    __metadata("design:type", Number)
], RenderTemplateToImageDto.prototype, "height", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 90, description: '图片质量(1-100)', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '质量必须是数字' }),
    __metadata("design:type", Number)
], RenderTemplateToImageDto.prototype, "quality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'png', description: '图片类型', enum: ['jpeg', 'png'], required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['jpeg', 'png'], { message: '图片类型必须是jpeg或png' }),
    __metadata("design:type", String)
], RenderTemplateToImageDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '.main-content', description: '选择器，用于指定转换HTML中的特定元素', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '选择器必须是字符串' }),
    __metadata("design:type", String)
], RenderTemplateToImageDto.prototype, "selector", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: '是否使用AI生成内容', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'generateAiContent必须是布尔值' }),
    __metadata("design:type", Boolean)
], RenderTemplateToImageDto.prototype, "generateAiContent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '这是一段用于生成HTML内容的提示文本', description: '额外的内容，将与HTML模板代码结合作为提示词', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'content必须是字符串' }),
    __metadata("design:type", String)
], RenderTemplateToImageDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: '是否上传到Super图床', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'uploadToSuperbed必须是布尔值' }),
    __metadata("design:type", Boolean)
], RenderTemplateToImageDto.prototype, "uploadToSuperbed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: '是否自动检测HTML宽度', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'useAutoWidth必须是布尔值' }),
    __metadata("design:type", Boolean)
], RenderTemplateToImageDto.prototype, "useAutoWidth", void 0);
exports.RenderTemplateToImageDto = RenderTemplateToImageDto;
