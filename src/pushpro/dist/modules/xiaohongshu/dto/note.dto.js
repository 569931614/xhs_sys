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
exports.NoteQueryDto = exports.UpdateNoteDto = exports.CreateNoteDto = exports.NoteTemplateDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class NoteTemplateDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '模板ID' }),
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NoteTemplateDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否可重复使用', default: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NoteTemplateDto.prototype, "isRepeatable", void 0);
exports.NoteTemplateDto = NoteTemplateDto;
class CreateNoteDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '笔记标题', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateNoteDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '笔记类型ID' }),
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateNoteDto.prototype, "typeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '封面图URL', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateNoteDto.prototype, "coverImage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '笔记内容', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateNoteDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序', required: false, default: 0 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateNoteDto.prototype, "sort", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态', required: false, default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateNoteDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '笔记ID，用于外部系统关联', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateNoteDto.prototype, "noteId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Coze Bot ID', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateNoteDto.prototype, "botId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '工作流参数类型', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateNoteDto.prototype, "paramsType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '关联的模板列表', required: false, type: [NoteTemplateDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => NoteTemplateDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateNoteDto.prototype, "htmlTemplates", void 0);
exports.CreateNoteDto = CreateNoteDto;
class UpdateNoteDto extends CreateNoteDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '笔记ID' }),
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateNoteDto.prototype, "id", void 0);
exports.UpdateNoteDto = UpdateNoteDto;
class NoteQueryDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页码', required: false, default: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NoteQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每页数量', required: false, default: 10 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NoteQueryDto.prototype, "pageSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '笔记标题', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], NoteQueryDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '笔记类型ID', required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NoteQueryDto.prototype, "typeId", void 0);
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
], NoteQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Coze Bot ID', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], NoteQueryDto.prototype, "botId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '工作流参数类型', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], NoteQueryDto.prototype, "paramsType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序字段', required: false, enum: ['createTime', 'updateTime', 'likesCount', 'viewsCount', 'title'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], NoteQueryDto.prototype, "orderBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序方向', required: false, enum: ['ASC', 'DESC'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], NoteQueryDto.prototype, "orderDirection", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否包含用户状态（收藏和点赞）', required: false }),
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
], NoteQueryDto.prototype, "withUserStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否只显示用户已收藏的笔记', required: false }),
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
], NoteQueryDto.prototype, "favoriteOnly", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '关联的模板列表', required: false, type: [NoteTemplateDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => NoteTemplateDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], NoteQueryDto.prototype, "htmlTemplates", void 0);
exports.NoteQueryDto = NoteQueryDto;
