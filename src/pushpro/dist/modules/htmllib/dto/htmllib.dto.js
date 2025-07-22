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
exports.DeleteHtmlTemplateDto = exports.QueryHtmlTemplateDto = exports.UpdateHtmlTemplateDto = exports.CreateHtmlTemplateDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateHtmlTemplateDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: '商品详情页', description: '模板名称' }),
    (0, class_validator_1.IsNotEmpty)({ message: '模板名称不能为空' }),
    (0, class_validator_1.IsString)({ message: '模板名称必须是字符串' }),
    __metadata("design:type", String)
], CreateHtmlTemplateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '<div>HTML模板代码</div>', description: 'HTML代码' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'HTML代码不能为空' }),
    (0, class_validator_1.IsString)({ message: 'HTML代码必须是字符串' }),
    __metadata("design:type", String)
], CreateHtmlTemplateDto.prototype, "htmlCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, description: '可替换的图片数量' }),
    (0, class_validator_1.IsNotEmpty)({ message: '可替换的图片数量不能为空' }),
    (0, class_validator_1.IsNumber)({}, { message: '可替换的图片数量必须是数字' }),
    __metadata("design:type", Number)
], CreateHtmlTemplateDto.prototype, "imageCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['标题', '描述', '价格'],
        description: '可替换的文本内容列表',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: '可替换文本必须是数组' }),
    (0, class_validator_1.IsString)({ each: true, message: '文本项必须是字符串' }),
    __metadata("design:type", Array)
], CreateHtmlTemplateDto.prototype, "textDetails", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '/uploads/thumbnails/template1.jpg', description: '缩略图路径', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '缩略图路径必须是字符串' }),
    __metadata("design:type", String)
], CreateHtmlTemplateDto.prototype, "thumbnailPath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '使用应用工作流：1-启用，0-禁用', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '状态必须是数字' }),
    __metadata("design:type", Number)
], CreateHtmlTemplateDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: '是否需要AI补充文案', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: '是否需要AI补充文案必须是布尔值' }),
    __metadata("design:type", Boolean)
], CreateHtmlTemplateDto.prototype, "needAiContent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['https://example.com/bg1.jpg', 'https://example.com/bg2.jpg'],
        description: '背景图片URL列表',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: '背景图片URL必须是数组' }),
    (0, class_validator_1.IsString)({ each: true, message: '背景图片URL必须是字符串' }),
    __metadata("design:type", Array)
], CreateHtmlTemplateDto.prototype, "backgroundImages", void 0);
exports.CreateHtmlTemplateDto = CreateHtmlTemplateDto;
class UpdateHtmlTemplateDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '模板ID' }),
    (0, class_validator_1.IsNotEmpty)({ message: '模板ID不能为空' }),
    (0, class_validator_1.IsNumber)({}, { message: '模板ID必须是数字' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateHtmlTemplateDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '商品详情页', description: '模板名称', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '模板名称必须是字符串' }),
    __metadata("design:type", String)
], UpdateHtmlTemplateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '<div>更新后的HTML模板代码</div>', description: 'HTML代码', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'HTML代码必须是字符串' }),
    __metadata("design:type", String)
], UpdateHtmlTemplateDto.prototype, "htmlCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, description: '可替换的图片数量', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '可替换的图片数量必须是数字' }),
    __metadata("design:type", Number)
], UpdateHtmlTemplateDto.prototype, "imageCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['标题', '描述', '价格'],
        description: '可替换的文本内容列表',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: '可替换文本必须是数组' }),
    (0, class_validator_1.IsString)({ each: true, message: '文本项必须是字符串' }),
    __metadata("design:type", Array)
], UpdateHtmlTemplateDto.prototype, "textDetails", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '/uploads/thumbnails/template1-new.jpg', description: '缩略图路径', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '缩略图路径必须是字符串' }),
    __metadata("design:type", String)
], UpdateHtmlTemplateDto.prototype, "thumbnailPath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '使用应用工作流：1-启用，0-禁用', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '状态必须是数字' }),
    __metadata("design:type", Number)
], UpdateHtmlTemplateDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: '是否需要AI补充文案', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: '是否需要AI补充文案必须是布尔值' }),
    __metadata("design:type", Boolean)
], UpdateHtmlTemplateDto.prototype, "needAiContent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['https://example.com/bg1.jpg', 'https://example.com/bg2.jpg'],
        description: '背景图片URL列表',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: '背景图片URL必须是数组' }),
    (0, class_validator_1.IsString)({ each: true, message: '背景图片URL必须是字符串' }),
    __metadata("design:type", Array)
], UpdateHtmlTemplateDto.prototype, "backgroundImages", void 0);
exports.UpdateHtmlTemplateDto = UpdateHtmlTemplateDto;
class QueryHtmlTemplateDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '页码', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '页码必须是数字' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryHtmlTemplateDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10, description: '每页条数', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '每页条数必须是数字' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryHtmlTemplateDto.prototype, "pageSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '商品', description: '模板名称关键词', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '模板名称必须是字符串' }),
    __metadata("design:type", String)
], QueryHtmlTemplateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '使用应用工作流：1-启用，0-禁用', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '状态必须是数字' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryHtmlTemplateDto.prototype, "status", void 0);
exports.QueryHtmlTemplateDto = QueryHtmlTemplateDto;
class DeleteHtmlTemplateDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '模板ID' }),
    (0, class_validator_1.IsNotEmpty)({ message: '模板ID不能为空' }),
    (0, class_validator_1.IsNumber)({}, { message: '模板ID必须是数字' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], DeleteHtmlTemplateDto.prototype, "id", void 0);
exports.DeleteHtmlTemplateDto = DeleteHtmlTemplateDto;
