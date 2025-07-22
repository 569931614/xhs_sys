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
exports.CreateFontDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateFontDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '字体名称' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateFontDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '字体代码' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateFontDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '预览图URL' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateFontDto.prototype, "preview", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '字体文件URL' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateFontDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '字体类型', default: 'ttf' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateFontDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态', default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateFontDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序', default: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateFontDto.prototype, "sort", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '来源', default: 'api' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateFontDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '备注' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateFontDto.prototype, "remark", void 0);
exports.CreateFontDto = CreateFontDto;
