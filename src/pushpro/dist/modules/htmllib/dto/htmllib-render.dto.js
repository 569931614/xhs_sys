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
exports.HtmlRenderDto = exports.ImageOptions = exports.TextReplacementItem = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class TextReplacementItem {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: '可替换文本1', description: '模板中需要替换的原始文本' }),
    (0, class_validator_1.IsNotEmpty)({ message: '占位符不能为空' }),
    (0, class_validator_1.IsString)({ message: '占位符必须是字符串' }),
    __metadata("design:type", String)
], TextReplacementItem.prototype, "placeholder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '这是一个非常好用的产品', description: '要替换成的内容' }),
    (0, class_validator_1.IsNotEmpty)({ message: '替换内容不能为空' }),
    (0, class_validator_1.IsString)({ message: '替换内容必须是字符串' }),
    __metadata("design:type", String)
], TextReplacementItem.prototype, "replaceWith", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: '是否使用正则表达式匹配', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'useRegex必须是布尔值' }),
    __metadata("design:type", Boolean)
], TextReplacementItem.prototype, "useRegex", void 0);
exports.TextReplacementItem = TextReplacementItem;
class ImageOptions {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1024, description: '图片宽度（像素）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '宽度必须是数字' }),
    __metadata("design:type", Number)
], ImageOptions.prototype, "width", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '图片高度（像素），0表示自动计算', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '高度必须是数字' }),
    __metadata("design:type", Number)
], ImageOptions.prototype, "height", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 80, description: '图片质量(1-100)', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '质量必须是数字' }),
    __metadata("design:type", Number)
], ImageOptions.prototype, "quality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'png', description: '图片类型', enum: ['jpeg', 'png'], required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['jpeg', 'png'], { message: '图片类型必须是jpeg或png' }),
    __metadata("design:type", String)
], ImageOptions.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: '是否上传到Super图床', required: false, default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'uploadToSuperbed必须是布尔值' }),
    __metadata("design:type", Boolean)
], ImageOptions.prototype, "uploadToSuperbed", void 0);
exports.ImageOptions = ImageOptions;
class HtmlRenderDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: '商品详情页', description: '模板名称，如未提供则随机选择一个模板', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '模板名称必须是字符串' }),
    __metadata("design:type", String)
], HtmlRenderDto.prototype, "templateName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        description: '替换图片的URL数组，按照顺序替换模板中的图片',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: '图片数组必须是数组' }),
    (0, class_validator_1.IsString)({ each: true, message: '图片URL必须是字符串' }),
    __metadata("design:type", Array)
], HtmlRenderDto.prototype, "imageUrls", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [TextReplacementItem],
        example: [
            { placeholder: '可替换文本1', replaceWith: '是一个非常好用的产品' },
            { placeholder: '可替换文本2', replaceWith: '值得购买' }
        ],
        description: '文本替换对照表，直接指定模板中的文本及其替换内容',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: '文本替换对照表必须是数组' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TextReplacementItem),
    __metadata("design:type", Array)
], HtmlRenderDto.prototype, "textReplacements", void 0);
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
], HtmlRenderDto.prototype, "useId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: false,
        description: '是否包装HTML为完整页面，包含head和body标签等',
        required: false,
        default: true
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'wrapHtml必须是布尔值' }),
    __metadata("design:type", Boolean)
], HtmlRenderDto.prototype, "wrapHtml", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: false,
        description: '是否直接返回原始HTML内容（不包装为JSON）',
        required: false,
        default: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'rawHtml必须是布尔值' }),
    __metadata("design:type", Boolean)
], HtmlRenderDto.prototype, "rawHtml", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: false,
        description: '是否返回JSON格式但使用手动序列化HTML（避免转义）',
        required: false,
        default: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'rawJsonHtml必须是布尔值' }),
    __metadata("design:type", Boolean)
], HtmlRenderDto.prototype, "rawJsonHtml", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: true,
        description: '是否清理输出中的转义字符',
        required: false,
        default: true
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'cleanOutput必须是布尔值' }),
    __metadata("design:type", Boolean)
], HtmlRenderDto.prototype, "cleanOutput", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: true,
        description: '是否使用紧凑格式输出HTML（移除换行和多余空格）',
        required: false,
        default: true
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'compactOutput必须是布尔值' }),
    __metadata("design:type", Boolean)
], HtmlRenderDto.prototype, "compactOutput", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: false,
        description: '是否使用纯文本模式返回HTML（完全避免JSON序列化）',
        required: false,
        default: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'textMode必须是布尔值' }),
    __metadata("design:type", Boolean)
], HtmlRenderDto.prototype, "textMode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: false,
        description: '是否使用AI生成内容（忽略模板设置）',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'generateAiContent必须是布尔值' }),
    __metadata("design:type", Boolean)
], HtmlRenderDto.prototype, "generateAiContent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "这是一段用于生成HTML内容的提示文本",
        description: '额外的内容，将与HTML模板代码结合作为提示词',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HtmlRenderDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: false,
        description: '是否将HTML转换为图片并返回图片URL',
        required: false,
        default: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'convertToImage必须是布尔值' }),
    __metadata("design:type", Boolean)
], HtmlRenderDto.prototype, "convertToImage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: ImageOptions,
        description: '图片转换选项，当convertToImage=true时使用',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'imageOptions必须是对象' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ImageOptions),
    __metadata("design:type", ImageOptions)
], HtmlRenderDto.prototype, "imageOptions", void 0);
exports.HtmlRenderDto = HtmlRenderDto;
