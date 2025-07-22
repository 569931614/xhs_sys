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
exports.NoteTypeQueryDto = exports.UpdateNoteTypeDto = exports.CreateNoteTypeDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreateNoteTypeDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型名称' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNoteTypeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型描述', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateNoteTypeDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序', required: false, default: 0 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateNoteTypeDto.prototype, "sort", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态', required: false, default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateNoteTypeDto.prototype, "status", void 0);
exports.CreateNoteTypeDto = CreateNoteTypeDto;
class UpdateNoteTypeDto extends CreateNoteTypeDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型ID' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateNoteTypeDto.prototype, "id", void 0);
exports.UpdateNoteTypeDto = UpdateNoteTypeDto;
class NoteTypeQueryDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页码', required: false, default: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NoteTypeQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每页数量', required: false, default: 10 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NoteTypeQueryDto.prototype, "pageSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型名称', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], NoteTypeQueryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        return value;
    }),
    __metadata("design:type", Boolean)
], NoteTypeQueryDto.prototype, "status", void 0);
exports.NoteTypeQueryDto = NoteTypeQueryDto;
