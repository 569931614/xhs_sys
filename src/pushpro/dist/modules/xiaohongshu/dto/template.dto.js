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
exports.UpdateTemplateStatusDto = exports.DeleteTemplateDto = exports.UpdateTemplateDto = exports.CreateTemplateDto = void 0;
const class_validator_1 = require("class-validator");
class CreateTemplateDto {
}
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: '模板名称不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: '文件路径不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "filePath", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: '图片数量不能为空' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTemplateDto.prototype, "imageCount", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: '文本数量不能为空' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTemplateDto.prototype, "textCount", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: '文本详情不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "textDetails", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateTemplateDto.prototype, "fileSize", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateTemplateDto.prototype, "status", void 0);
exports.CreateTemplateDto = CreateTemplateDto;
class UpdateTemplateDto {
}
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'ID不能为空' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateTemplateDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTemplateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTemplateDto.prototype, "filePath", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateTemplateDto.prototype, "fileSize", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateTemplateDto.prototype, "imageCount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateTemplateDto.prototype, "textCount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTemplateDto.prototype, "textDetails", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateTemplateDto.prototype, "status", void 0);
exports.UpdateTemplateDto = UpdateTemplateDto;
class DeleteTemplateDto {
}
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'ID不能为空' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], DeleteTemplateDto.prototype, "id", void 0);
exports.DeleteTemplateDto = DeleteTemplateDto;
class UpdateTemplateStatusDto {
}
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'ID不能为空' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateTemplateStatusDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: '状态不能为空' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateTemplateStatusDto.prototype, "status", void 0);
exports.UpdateTemplateStatusDto = UpdateTemplateStatusDto;
