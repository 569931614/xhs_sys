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
exports.TopicGenerateResponse = void 0;
const swagger_1 = require("@nestjs/swagger");
class TopicGenerateResponse {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '生成的选题', example: '7天见效！这款英语学习法让孩子爱上背单词' }),
    __metadata("design:type", String)
], TopicGenerateResponse.prototype, "topic", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '可选的多个选题列表', type: [String], required: false, example: ['7天见效！这款英语学习法让孩子爱上背单词', '英语启蒙不再难，3步让孩子爱上学习'] }),
    __metadata("design:type", Array)
], TopicGenerateResponse.prototype, "topicList", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否成功', example: true }),
    __metadata("design:type", Boolean)
], TopicGenerateResponse.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '错误信息（如果有）', example: '生成选题失败，请重试', required: false }),
    __metadata("design:type", String)
], TopicGenerateResponse.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '返回的结构化JSON数据', required: false, type: 'object' }),
    __metadata("design:type", Object)
], TopicGenerateResponse.prototype, "data", void 0);
exports.TopicGenerateResponse = TopicGenerateResponse;
