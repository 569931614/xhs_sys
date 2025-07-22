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
exports.AsyncRenderDto = exports.TaskQueryDto = exports.AsyncRenderResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const htmllib_render_dto_1 = require("./htmllib-render.dto");
class AsyncRenderResponseDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '异步任务ID' }),
    __metadata("design:type", String)
], AsyncRenderResponseDto.prototype, "taskId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '任务状态', enum: ['pending', 'processing', 'completed', 'failed'] }),
    __metadata("design:type", String)
], AsyncRenderResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '任务创建时间' }),
    __metadata("design:type", Date)
], AsyncRenderResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '任务结果', required: false }),
    __metadata("design:type", Object)
], AsyncRenderResponseDto.prototype, "result", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '生成的HTML内容', required: false }),
    __metadata("design:type", String)
], AsyncRenderResponseDto.prototype, "htmlContent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '错误信息', required: false }),
    __metadata("design:type", String)
], AsyncRenderResponseDto.prototype, "errorMessage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '任务完成时间', required: false }),
    __metadata("design:type", Date)
], AsyncRenderResponseDto.prototype, "completedAt", void 0);
exports.AsyncRenderResponseDto = AsyncRenderResponseDto;
class TaskQueryDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '异步任务ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "taskId", void 0);
exports.TaskQueryDto = TaskQueryDto;
class AsyncRenderDto extends htmllib_render_dto_1.HtmlRenderDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否立即返回任务ID', default: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], AsyncRenderDto.prototype, "async", void 0);
exports.AsyncRenderDto = AsyncRenderDto;
