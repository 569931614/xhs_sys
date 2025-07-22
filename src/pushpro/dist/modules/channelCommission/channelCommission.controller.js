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
exports.ChannelCommissionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const channelCommission_service_1 = require("./channelCommission.service");
const jwtAuth_guard_1 = require("../../common/auth/jwtAuth.guard");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let ChannelCommissionController = class ChannelCommissionController {
    constructor(channelCommissionService) {
        this.channelCommissionService = channelCommissionService;
    }
    async getMyCommissions(req, paginationDto) {
        const userId = req.user.id;
        return this.channelCommissionService.getUserCommissions(userId, paginationDto);
    }
    async getCommissionSummary(req) {
        const userId = req.user.id;
        return this.channelCommissionService.getUserCommissionSummary(userId);
    }
};
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '获取我的佣金记录' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取佣金记录' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], ChannelCommissionController.prototype, "getMyCommissions", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '获取我的佣金统计' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取佣金统计' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChannelCommissionController.prototype, "getCommissionSummary", null);
ChannelCommissionController = __decorate([
    (0, swagger_1.ApiTags)('渠道佣金'),
    (0, common_1.Controller)('channel-commission'),
    __metadata("design:paramtypes", [channelCommission_service_1.ChannelCommissionService])
], ChannelCommissionController);
exports.ChannelCommissionController = ChannelCommissionController;
