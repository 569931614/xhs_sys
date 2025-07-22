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
exports.PointConsumptionRuleController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pointConsumptionRule_service_1 = require("./pointConsumptionRule.service");
const jwtAuth_guard_1 = require("../../common/auth/jwtAuth.guard");
const role_guard_1 = require("../../common/auth/role.guard");
const role_decorator_1 = require("../../common/decorator/role.decorator");
let PointConsumptionRuleController = class PointConsumptionRuleController {
    constructor(pointConsumptionRuleService) {
        this.pointConsumptionRuleService = pointConsumptionRuleService;
    }
    async getAllRules() {
        const rules = await this.pointConsumptionRuleService.getAllRules();
        return {
            success: true,
            message: '获取积分消耗规则成功',
            data: rules
        };
    }
    async getRuleById(id) {
        const rule = await this.pointConsumptionRuleService.getRule(null, null, id);
        return {
            success: !!rule,
            message: rule ? '获取规则成功' : '规则不存在',
            data: rule
        };
    }
    async getRuleByQuery(packageId, functionId) {
        const rule = await this.pointConsumptionRuleService.getRule(packageId, functionId);
        return {
            success: true,
            message: '查询规则成功',
            data: rule
        };
    }
    async createRule(ruleData) {
        const rule = await this.pointConsumptionRuleService.saveRule(ruleData);
        return {
            success: true,
            message: '创建规则成功',
            data: rule
        };
    }
    async updateRule(id, ruleData) {
        try {
            ruleData.id = id;
            const rule = await this.pointConsumptionRuleService.saveRule(ruleData);
            return {
                success: true,
                message: '更新规则成功',
                data: rule
            };
        }
        catch (error) {
            return {
                success: false,
                message: '更新规则失败: ' + error.message,
                error: error.message
            };
        }
    }
    async deleteRule(id) {
        try {
            const ruleData = { id, status: 0 };
            await this.pointConsumptionRuleService.saveRule(ruleData);
            return {
                success: true,
                message: '删除规则成功'
            };
        }
        catch (error) {
            return {
                success: false,
                message: '删除规则失败',
                error: error.message
            };
        }
    }
};
__decorate([
    (0, common_1.Get)('list'),
    (0, swagger_1.ApiOperation)({ summary: '获取所有积分消耗规则' }),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    (0, role_decorator_1.RequiresRoles)(['admin', 'super']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PointConsumptionRuleController.prototype, "getAllRules", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '根据ID获取规则' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'number', description: '规则ID' }),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    (0, role_decorator_1.RequiresRoles)(['admin', 'super']),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PointConsumptionRuleController.prototype, "getRuleById", null);
__decorate([
    (0, common_1.Get)('query'),
    (0, swagger_1.ApiOperation)({ summary: '根据套餐ID和功能ID查询规则' }),
    (0, swagger_1.ApiQuery)({ name: 'packageId', type: 'number', description: '套餐ID' }),
    (0, swagger_1.ApiQuery)({ name: 'functionId', type: 'string', description: '功能ID' }),
    __param(0, (0, common_1.Query)('packageId')),
    __param(1, (0, common_1.Query)('functionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], PointConsumptionRuleController.prototype, "getRuleByQuery", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建积分消耗规则' }),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    (0, role_decorator_1.RequiresRoles)(['admin', 'super']),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PointConsumptionRuleController.prototype, "createRule", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新积分消耗规则' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'number', description: '规则ID' }),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    (0, role_decorator_1.RequiresRoles)(['admin', 'super']),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PointConsumptionRuleController.prototype, "updateRule", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除积分消耗规则' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'number', description: '规则ID' }),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    (0, role_decorator_1.RequiresRoles)(['admin', 'super']),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PointConsumptionRuleController.prototype, "deleteRule", null);
PointConsumptionRuleController = __decorate([
    (0, swagger_1.ApiTags)('积分消耗规则'),
    (0, common_1.Controller)('point-consumption-rule'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [pointConsumptionRule_service_1.PointConsumptionRuleService])
], PointConsumptionRuleController);
exports.PointConsumptionRuleController = PointConsumptionRuleController;
