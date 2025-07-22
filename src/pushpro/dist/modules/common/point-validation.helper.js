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
var PointValidationHelper_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointValidationHelper = void 0;
const common_1 = require("@nestjs/common");
const userBalance_service_1 = require("../userBalance/userBalance.service");
let PointValidationHelper = PointValidationHelper_1 = class PointValidationHelper {
    constructor(userBalanceService) {
        this.userBalanceService = userBalanceService;
        this.logger = new common_1.Logger(PointValidationHelper_1.name);
    }
    async validatePoint(userId, functionId, requestType) {
        try {
            this.logger.log(`开始验证积分 [用户:${userId}, 功能:${functionId}]`);
            const validationResult = await this.userBalanceService.validateBalance(userId, functionId, requestType);
            if (validationResult === false) {
                this.logger.warn(`积分验证失败 [用户:${userId}, 功能:${functionId}]`);
                return {
                    success: false,
                    validationResult,
                    message: '积分不足',
                };
            }
            this.logger.log(`积分验证成功 [用户:${userId}, 功能:${functionId}]`);
            return {
                success: true,
                validationResult,
                message: '积分验证通过',
            };
        }
        catch (error) {
            this.logger.error(`积分验证过程出错 [用户:${userId}, 功能:${functionId}]: ${error.message}`, error.stack);
            return {
                success: false,
                validationResult: null,
                message: `验证过程出错: ${error.message}`,
            };
        }
    }
    async deductPoint(userId, functionId, deductInfo) {
        try {
            const { deductType, amount, requestType = 0 } = deductInfo;
            this.logger.log(`开始扣除积分 [用户:${userId}, 功能:${functionId}, 类型:${deductType}, 数量:${amount}]`);
            const deductResult = await this.userBalanceService.deductFromBalance(userId, deductType, amount, requestType, functionId);
            if (!deductResult) {
                this.logger.warn(`积分扣除失败 [用户:${userId}, 功能:${functionId}]: 未返回有效结果`);
                return {
                    success: false,
                    deducted: false,
                    message: '积分扣除失败：系统返回无效结果',
                    deductResult,
                };
            }
            this.logger.log(`积分扣除成功 [用户:${userId}, 功能:${functionId}, 类型:${deductType}, 数量:${amount}]`);
            return {
                success: true,
                deducted: true,
                message: '积分扣除成功',
                deductResult,
            };
        }
        catch (error) {
            this.logger.error(`积分扣除过程出错 [用户:${userId}, 功能:${functionId}]: ${error.message}`, error.stack);
            return {
                success: false,
                deducted: false,
                message: `扣除过程出错: ${error.message}`,
            };
        }
    }
    async refundPoint(userId, functionId, refundInfo) {
        try {
            const { deductType, amount } = refundInfo;
            this.logger.log(`开始退还积分 [用户:${userId}, 功能:${functionId}, 类型:${deductType}, 数量:${amount}]`);
            const refundResult = await this.userBalanceService.refundFunctionPoints(userId, functionId, deductType, amount);
            if (!refundResult || !refundResult.success) {
                this.logger.warn(`积分退还失败 [用户:${userId}, 功能:${functionId}]: ${(refundResult === null || refundResult === void 0 ? void 0 : refundResult.message) || '未知错误'}`);
                return {
                    success: false,
                    refunded: false,
                    message: (refundResult === null || refundResult === void 0 ? void 0 : refundResult.message) || '积分退还失败',
                };
            }
            this.logger.log(`积分退还成功 [用户:${userId}, 功能:${functionId}, 类型:${deductType}, 数量:${amount}]`);
            return {
                success: true,
                refunded: true,
                message: '积分退还成功',
            };
        }
        catch (error) {
            this.logger.error(`积分退还过程出错 [用户:${userId}, 功能:${functionId}]: ${error.message}`, error.stack);
            return {
                success: false,
                refunded: false,
                message: `退还过程出错: ${error.message}`,
            };
        }
    }
    async executeWithPointValidation(userId, functionId, deductInfo, task) {
        try {
            const validateResult = await this.validatePoint(userId, functionId, deductInfo.requestType);
            if (!validateResult.success) {
                return {
                    success: false,
                    message: validateResult.message,
                };
            }
            try {
                this.logger.log(`开始执行任务 [用户:${userId}, 功能:${functionId}]`);
                const taskResult = await task();
                const deductResult = await this.deductPoint(userId, functionId, deductInfo);
                if (!deductResult.success) {
                    this.logger.warn(`任务成功但积分扣除失败 [用户:${userId}, 功能:${functionId}]: ${deductResult.message}`);
                    return {
                        success: true,
                        data: taskResult,
                        message: '操作成功，但积分扣除失败',
                    };
                }
                return {
                    success: true,
                    data: taskResult,
                    message: '操作成功',
                };
            }
            catch (taskError) {
                this.logger.error(`任务执行失败 [用户:${userId}, 功能:${functionId}]: ${taskError.message}`, taskError.stack);
                return {
                    success: false,
                    message: `操作失败: ${taskError.message}`,
                };
            }
        }
        catch (error) {
            this.logger.error(`带积分验证的任务执行过程出错 [用户:${userId}, 功能:${functionId}]: ${error.message}`, error.stack);
            return {
                success: false,
                message: `执行过程出错: ${error.message}`,
            };
        }
    }
};
PointValidationHelper = PointValidationHelper_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [userBalance_service_1.UserBalanceService])
], PointValidationHelper);
exports.PointValidationHelper = PointValidationHelper;
