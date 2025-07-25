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
exports.UpdateUserTypeDto = void 0;
const class_validator_1 = require("class-validator");
class UpdateUserTypeDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '类型名称必须是字符串' }),
    (0, class_validator_1.Length)(1, 50, { message: '类型名称长度在1-50之间' }),
    __metadata("design:type", String)
], UpdateUserTypeDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '类型描述必须是字符串' }),
    (0, class_validator_1.Length)(0, 200, { message: '类型描述长度不能超过200' }),
    __metadata("design:type", String)
], UpdateUserTypeDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '状态必须是数字' }),
    __metadata("design:type", Number)
], UpdateUserTypeDto.prototype, "status", void 0);
exports.UpdateUserTypeDto = UpdateUserTypeDto;
