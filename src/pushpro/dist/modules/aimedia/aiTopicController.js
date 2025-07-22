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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiTopicController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const aiTopicService_1 = require("./aiTopicService");
const aiTopicConfig_dto_1 = require("./dto/aiTopicConfig.dto");
const topicGenerateResponse_dto_1 = require("./dto/topicGenerateResponse.dto");
const jwtAuth_guard_1 = require("../../common/auth/jwtAuth.guard");
let AiTopicController = class AiTopicController {
    constructor(aiTopicService) {
        this.aiTopicService = aiTopicService;
    }
    async getAiTopicSettings(req) {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 0;
        return this.aiTopicService.getUserTopicSettings(userId);
    }
    async saveAiTopicSettings(topicConfig, req) {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 0;
        return this.aiTopicService.saveUserTopicSettings(userId, topicConfig);
    }
    async generateTopic(topicConfig, count = 5) {
        return this.aiTopicService.generateTopic(topicConfig, count);
    }
};
__decorate([
    (0, common_1.Get)('user/ai-topic-settings'),
    (0, swagger_1.ApiOperation)({ summary: '获取用户AI选题配置' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiTopicController.prototype, "getAiTopicSettings", null);
__decorate([
    (0, common_1.Post)('user/ai-topic-settings'),
    (0, swagger_1.ApiOperation)({ summary: '保存用户AI选题配置' }),
    (0, swagger_1.ApiBody)({ type: aiTopicConfig_dto_1.AiTopicConfig }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [aiTopicConfig_dto_1.AiTopicConfig, Object]),
    __metadata("design:returntype", Promise)
], AiTopicController.prototype, "saveAiTopicSettings", null);
__decorate([
    (0, common_1.Post)('chatgpt/generate-topic'),
    (0, swagger_1.ApiOperation)({ summary: '生成选题' }),
    (0, swagger_1.ApiBody)({ type: aiTopicConfig_dto_1.AiTopicConfig }),
    (0, swagger_1.ApiQuery)({ name: 'count', description: '要生成的选题数量', type: Number, required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '返回生成的选题', type: topicGenerateResponse_dto_1.TopicGenerateResponse }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('count')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [aiTopicConfig_dto_1.AiTopicConfig, Number]),
    __metadata("design:returntype", Promise)
], AiTopicController.prototype, "generateTopic", null);
AiTopicController = __decorate([
    (0, swagger_1.ApiTags)('AI选题助手'),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [aiTopicService_1.AiTopicService])
], AiTopicController);
exports.AiTopicController = AiTopicController;
