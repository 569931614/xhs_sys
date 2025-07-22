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
exports.ChannelLevelQueryDto = exports.UpdateChannelLevelDto = exports.CreateChannelLevelDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateChannelLevelDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '渠道等级名称', example: '普通代理' }),
    (0, class_validator_1.IsNotEmpty)({ message: '渠道等级名称不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChannelLevelDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '返佣比例（百分比）', example: 10 }),
    (0, class_validator_1.IsNotEmpty)({ message: '返佣比例不能为空' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0, { message: '返佣比例不能小于0%' }),
    (0, class_validator_1.Max)(100, { message: '返佣比例不能大于100%' }),
    __metadata("design:type", Number)
], CreateChannelLevelDto.prototype, "commissionRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序', example: 1, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateChannelLevelDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '备注说明', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChannelLevelDto.prototype, "remark", void 0);
exports.CreateChannelLevelDto = CreateChannelLevelDto;
class UpdateChannelLevelDto extends CreateChannelLevelDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否启用', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateChannelLevelDto.prototype, "isActive", void 0);
exports.UpdateChannelLevelDto = UpdateChannelLevelDto;
class ChannelLevelQueryDto {
    constructor() {
        this.page = 1;
        this.size = 10;
    }
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页码', required: false, default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ChannelLevelQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每页条数', required: false, default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ChannelLevelQueryDto.prototype, "size", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '渠道等级名称', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChannelLevelQueryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否启用', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ChannelLevelQueryDto.prototype, "isActive", void 0);
exports.ChannelLevelQueryDto = ChannelLevelQueryDto;
