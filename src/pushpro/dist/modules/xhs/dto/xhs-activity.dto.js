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
exports.XhsActivityStatsDto = exports.AddPostToActivityDto = exports.UpdateXhsActivityDto = exports.QueryXhsActivityDto = exports.CreateXhsActivityDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var ActivityStatus;
(function (ActivityStatus) {
    ActivityStatus["ACTIVE"] = "active";
    ActivityStatus["PAUSED"] = "paused";
    ActivityStatus["COMPLETED"] = "completed";
})(ActivityStatus || (ActivityStatus = {}));
class CreateXhsActivityDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '活动ID', example: 'a_abc123', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateXhsActivityDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '活动名称', example: '美食分享活动' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateXhsActivityDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '素材类型', example: 'food', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateXhsActivityDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态', enum: ActivityStatus, default: ActivityStatus.ACTIVE, required: false }),
    (0, class_validator_1.IsEnum)(ActivityStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateXhsActivityDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否默认活动', default: false, required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateXhsActivityDto.prototype, "isDefault", void 0);
exports.CreateXhsActivityDto = CreateXhsActivityDto;
class QueryXhsActivityDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '活动名称', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryXhsActivityDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '素材类型', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryXhsActivityDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态', enum: ActivityStatus, required: false }),
    (0, class_validator_1.IsEnum)(ActivityStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryXhsActivityDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否默认活动', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], QueryXhsActivityDto.prototype, "isDefault", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户ID', required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QueryXhsActivityDto.prototype, "userId", void 0);
exports.QueryXhsActivityDto = QueryXhsActivityDto;
class UpdateXhsActivityDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '活动名称', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateXhsActivityDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '素材类型', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateXhsActivityDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态', enum: ActivityStatus, required: false }),
    (0, class_validator_1.IsEnum)(ActivityStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateXhsActivityDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否默认活动', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateXhsActivityDto.prototype, "isDefault", void 0);
exports.UpdateXhsActivityDto = UpdateXhsActivityDto;
class AddPostToActivityDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '活动ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddPostToActivityDto.prototype, "activityId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '笔记ID' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AddPostToActivityDto.prototype, "postId", void 0);
exports.AddPostToActivityDto = AddPostToActivityDto;
class XhsActivityStatsDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '活动ID' }),
    __metadata("design:type", String)
], XhsActivityStatsDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '活动名称' }),
    __metadata("design:type", String)
], XhsActivityStatsDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '素材类型' }),
    __metadata("design:type", String)
], XhsActivityStatsDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态' }),
    __metadata("design:type", String)
], XhsActivityStatsDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否默认活动' }),
    __metadata("design:type", Boolean)
], XhsActivityStatsDto.prototype, "isDefault", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '笔记总数' }),
    __metadata("design:type", Number)
], XhsActivityStatsDto.prototype, "totalNotes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '可发布笔记数' }),
    __metadata("design:type", Number)
], XhsActivityStatsDto.prototype, "availableNotes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '已发布笔记数' }),
    __metadata("design:type", Number)
], XhsActivityStatsDto.prototype, "publishedNotes", void 0);
exports.XhsActivityStatsDto = XhsActivityStatsDto;
