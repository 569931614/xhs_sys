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
exports.UserFunctionController = void 0;
const jwtAuth_guard_1 = require("../../common/auth/jwtAuth.guard");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const userBalance_service_1 = require("../userBalance/userBalance.service");
const pointConsumptionRule_service_1 = require("../pointConsumptionRule/pointConsumptionRule.service");
let UserFunctionController = class UserFunctionController {
    constructor(userBalanceService, pointConsumptionRuleService) {
        this.userBalanceService = userBalanceService;
        this.pointConsumptionRuleService = pointConsumptionRuleService;
    }
    async checkFunctionAccess(req, functionId, amount = 1) {
        try {
            const userId = req.user.id;
            const rule = await this.pointConsumptionRuleService.getRule(null, functionId, null);
            if (!rule) {
                return {
                    success: false,
                    isAvailable: false,
                    message: '该功能规则不存在',
                };
            }
            if (rule.isAvailable !== 1) {
                return {
                    success: true,
                    isAvailable: false,
                    message: '该功能当前不可用，请升级套餐',
                };
            }
            return {
                success: true,
                isAvailable: true,
                rule,
                message: '该功能可用',
            };
        }
        catch (error) {
            console.error('检查功能权限失败:', error);
            return {
                success: false,
                isAvailable: false,
                message: error.message || '检查功能权限失败',
            };
        }
    }
    async checkFunctionPoint(req, functionId, amount = 1) {
        try {
            const userId = req.user.id;
            const result = await this.userBalanceService.validateUserPointForFunction(userId, functionId, amount);
            return {
                success: true,
                hasEnoughPoint: result.success,
                pointInfo: result,
                message: result.message,
            };
        }
        catch (error) {
            console.error('检查功能积分失败:', error);
            return {
                success: false,
                hasEnoughPoint: false,
                message: error.message || '检查功能积分失败',
            };
        }
    }
};
__decorate([
    (0, common_1.Get)('check-access'),
    (0, swagger_1.ApiOperation)({ summary: '检查用户是否有权限使用某个功能' }),
    (0, swagger_1.ApiQuery)({ name: 'functionId', description: '功能ID', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'amount', description: '使用次数', required: false, type: Number }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('functionId')),
    __param(2, (0, common_1.Query)('amount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", Promise)
], UserFunctionController.prototype, "checkFunctionAccess", null);
__decorate([
    (0, common_1.Get)('check-point'),
    (0, swagger_1.ApiOperation)({ summary: '检查用户对某功能的积分是否足够' }),
    (0, swagger_1.ApiQuery)({ name: 'functionId', description: '功能ID', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'amount', description: '使用次数', required: false, type: Number }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('functionId')),
    __param(2, (0, common_1.Query)('amount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", Promise)
], UserFunctionController.prototype, "checkFunctionPoint", null);
UserFunctionController = __decorate([
    (0, swagger_1.ApiTags)('user-function'),
    (0, common_1.Controller)('user-function'),
    __metadata("design:paramtypes", [userBalance_service_1.UserBalanceService,
        pointConsumptionRule_service_1.PointConsumptionRuleService])
], UserFunctionController);
exports.UserFunctionController = UserFunctionController;
