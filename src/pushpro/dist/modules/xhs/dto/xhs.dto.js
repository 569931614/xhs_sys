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
exports.XhsPostListDto = exports.UpdateXhsPostDto = exports.CreateXhsPostDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateXhsPostDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ description: '类型', example: 'normal' }),
    __metadata("design:type", String)
], CreateXhsPostDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '标题', example: '这是一篇小红书笔记', required: false }),
    __metadata("design:type", String)
], CreateXhsPostDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '内容', example: '这是笔记内容', required: false }),
    __metadata("design:type", String)
], CreateXhsPostDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, swagger_1.ApiProperty)({ description: '图片URL', type: [String], example: [] }),
    __metadata("design:type", Array)
], CreateXhsPostDto.prototype, "images", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '视频URL', required: false }),
    __metadata("design:type", String)
], CreateXhsPostDto.prototype, "video", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '封面URL', required: false }),
    __metadata("design:type", String)
], CreateXhsPostDto.prototype, "cover", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '标识符', required: false }),
    __metadata("design:type", String)
], CreateXhsPostDto.prototype, "identifier", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '是否已使用', default: false, required: false }),
    __metadata("design:type", Boolean)
], CreateXhsPostDto.prototype, "isUsed", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '用户ID', required: false }),
    __metadata("design:type", Number)
], CreateXhsPostDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '活动ID', required: false }),
    __metadata("design:type", String)
], CreateXhsPostDto.prototype, "activityId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '供应商', required: false }),
    __metadata("design:type", String)
], CreateXhsPostDto.prototype, "supplier", void 0);
exports.CreateXhsPostDto = CreateXhsPostDto;
class UpdateXhsPostDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '类型', example: 'normal', required: false }),
    __metadata("design:type", String)
], UpdateXhsPostDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '标题', example: '这是一篇小红书笔记', required: false }),
    __metadata("design:type", String)
], UpdateXhsPostDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '内容', example: '这是笔记内容', required: false }),
    __metadata("design:type", String)
], UpdateXhsPostDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '图片URL', type: [String], example: [], required: false }),
    __metadata("design:type", Array)
], UpdateXhsPostDto.prototype, "images", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '视频URL', required: false }),
    __metadata("design:type", String)
], UpdateXhsPostDto.prototype, "video", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '封面URL', required: false }),
    __metadata("design:type", String)
], UpdateXhsPostDto.prototype, "cover", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '标识符', required: false }),
    __metadata("design:type", String)
], UpdateXhsPostDto.prototype, "identifier", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '是否已使用', default: false, required: false }),
    __metadata("design:type", Boolean)
], UpdateXhsPostDto.prototype, "isUsed", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '用户ID', required: false }),
    __metadata("design:type", Number)
], UpdateXhsPostDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '活动ID', required: false }),
    __metadata("design:type", String)
], UpdateXhsPostDto.prototype, "activityId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ description: '供应商', required: false }),
    __metadata("design:type", String)
], UpdateXhsPostDto.prototype, "supplier", void 0);
exports.UpdateXhsPostDto = UpdateXhsPostDto;
class XhsPostListDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Object)
], XhsPostListDto.prototype, "isUsed", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, swagger_1.ApiProperty)({ description: '用户ID', required: false }),
    __metadata("design:type", Number)
], XhsPostListDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, swagger_1.ApiProperty)({ description: '只查询自己的笔记', required: false, default: false }),
    __metadata("design:type", Boolean)
], XhsPostListDto.prototype, "selfOnly", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ description: '笔记标题', required: false }),
    __metadata("design:type", String)
], XhsPostListDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ description: '平台', required: false, enum: ['xhs', 'douyin'] }),
    __metadata("design:type", String)
], XhsPostListDto.prototype, "platform", void 0);
exports.XhsPostListDto = XhsPostListDto;
