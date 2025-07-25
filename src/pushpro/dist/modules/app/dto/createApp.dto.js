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
exports.CreateAppDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateAppDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: '前端助手', description: 'app名称', required: true }),
    (0, class_validator_1.IsDefined)({ message: 'app名称是必传参数' }),
    __metadata("design:type", String)
], CreateAppDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'app分类Id', required: true }),
    (0, class_validator_1.IsDefined)({ message: 'app分类Id必传参数' }),
    __metadata("design:type", Number)
], CreateAppDto.prototype, "catId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '适用于编程编码、期望成为您的编程助手',
        description: 'app名称详情描述',
        required: false,
    }),
    (0, class_validator_1.IsDefined)({ message: 'app名称描述是必传参数' }),
    __metadata("design:type", String)
], CreateAppDto.prototype, "des", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '你现在是一个翻译官。接下来我说的所有话帮我翻译成中文', description: '预设的prompt', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAppDto.prototype, "preset", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'GPTs 的调用ID', description: 'GPTs 使用的 ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAppDto.prototype, "gizmoID", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否GPTs', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateAppDto.prototype, "isGPTs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://xxxx.png', description: '套餐封面图片', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAppDto.prototype, "coverImg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100, description: '套餐排序、数字越大越靠前', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateAppDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '套餐状态 0：禁用 1：启用', required: true }),
    (0, class_validator_1.IsNumber)({}, { message: '套餐状态必须是Number' }),
    (0, class_validator_1.IsIn)([0, 1, 3, 4, 5], { message: '套餐状态错误' }),
    __metadata("design:type", Number)
], CreateAppDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '这是一句示例数据', description: 'app示例数据', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAppDto.prototype, "demoData", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'system', description: '创建的角色', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAppDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'App应用是否是固定使用模型', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateAppDto.prototype, "isFixedModel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'gpt-3.5-turbo', description: 'App应用使用的模型', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAppDto.prototype, "appModel", void 0);
exports.CreateAppDto = CreateAppDto;
