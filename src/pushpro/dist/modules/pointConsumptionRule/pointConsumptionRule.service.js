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
var PointConsumptionRuleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointConsumptionRuleService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pointConsumptionRule_entity_1 = require("./pointConsumptionRule.entity");
const config_entity_1 = require("../globalConfig/config.entity");
let PointConsumptionRuleService = PointConsumptionRuleService_1 = class PointConsumptionRuleService {
    constructor(pointConsumptionRuleRepository, configEntity) {
        this.pointConsumptionRuleRepository = pointConsumptionRuleRepository;
        this.configEntity = configEntity;
        this.logger = new common_1.Logger(PointConsumptionRuleService_1.name);
        this.initRulesFromConfig();
    }
    async initRulesFromConfig() {
        try {
            const rulesCount = await this.pointConsumptionRuleRepository.count();
            if (rulesCount > 0) {
                this.logger.log('积分消耗规则表已有数据，无需初始化');
                return;
            }
            const configData = await this.configEntity.findOne({
                where: { configKey: 'packagePointConsumptionRules' },
            });
            if (!configData || !configData.configVal) {
                this.logger.warn('配置表中无积分消耗规则数据，跳过初始化');
                return;
            }
            const rules = JSON.parse(configData.configVal);
            if (!Array.isArray(rules) || rules.length === 0) {
                this.logger.warn('配置表中的积分消耗规则为空或格式不正确，跳过初始化');
                return;
            }
            const ruleEntities = rules.map(rule => {
                const entity = new pointConsumptionRule_entity_1.PointConsumptionRuleEntity();
                entity.packageId = rule.packageId || 0;
                entity.functionId = rule.functionId || 'default';
                entity.model3Rate = rule.model3Rate || 0;
                entity.model4Rate = rule.model4Rate || 0;
                entity.drawMjRate = rule.drawMjRate || 0;
                entity.status = rule.status || 1;
                entity.isAvailable = rule.isAvailable !== undefined ? rule.isAvailable : 1;
                entity.description = `从配置迁移: ${rule.packageId}-${rule.functionId}`;
                return entity;
            });
            await this.pointConsumptionRuleRepository.save(ruleEntities);
            this.logger.log(`成功从配置迁移了 ${ruleEntities.length} 条积分消耗规则`);
        }
        catch (error) {
            this.logger.error(`从配置迁移积分消耗规则失败: ${error.message}`, error.stack);
        }
    }
    async getRule(packageId, functionId, id) {
        try {
            if (id) {
                return await this.pointConsumptionRuleRepository.findOne({
                    where: { id }
                });
            }
            let rule = await this.pointConsumptionRuleRepository.findOne({
                where: {
                    packageId,
                    functionId,
                    status: 1,
                    isAvailable: 1
                }
            });
            if (!rule) {
                this.logger.log(`未找到功能${functionId}的特定规则，尝试查找默认规则`);
                rule = await this.pointConsumptionRuleRepository.findOne({
                    where: {
                        packageId,
                        functionId: 'default',
                        status: 1,
                        isAvailable: 1
                    }
                });
            }
            return rule;
        }
        catch (error) {
            this.logger.error(`获取消耗规则失败: ${error.message}`, error.stack);
            return null;
        }
    }
    async saveRule(ruleData) {
        try {
            let existingRule;
            if (ruleData.id) {
                this.logger.log(`尝试通过ID=${ruleData.id}查找现有规则`);
                existingRule = await this.pointConsumptionRuleRepository.findOne({
                    where: { id: ruleData.id }
                });
                if (!existingRule) {
                    this.logger.warn(`未找到ID=${ruleData.id}的规则`);
                    throw new Error(`找不到ID为${ruleData.id}的规则`);
                }
                this.logger.log(`找到ID=${ruleData.id}的规则，准备更新`);
                if (!ruleData.packageId) {
                    ruleData.packageId = existingRule.packageId;
                }
                if (!ruleData.functionId) {
                    ruleData.functionId = existingRule.functionId;
                }
                for (const key in ruleData) {
                    if (key !== 'id' && key !== 'createTime' && key !== 'updateTime') {
                        existingRule[key] = ruleData[key];
                    }
                }
                this.logger.log(`保存更新的规则: ${JSON.stringify(existingRule)}`);
                return await this.pointConsumptionRuleRepository.save(existingRule);
            }
            else {
                if (ruleData.packageId === undefined || ruleData.packageId === null || !ruleData.functionId) {
                    throw new Error('套餐ID和功能ID为必填项');
                }
                existingRule = await this.pointConsumptionRuleRepository.findOne({
                    where: {
                        packageId: ruleData.packageId,
                        functionId: ruleData.functionId
                    }
                });
                if (existingRule) {
                    this.logger.log(`找到匹配的规则ID=${existingRule.id}，准备更新`);
                    for (const key in ruleData) {
                        if (key !== 'id' && key !== 'createTime' && key !== 'updateTime') {
                            existingRule[key] = ruleData[key];
                        }
                    }
                    return await this.pointConsumptionRuleRepository.save(existingRule);
                }
                else {
                    this.logger.log(`创建新规则: ${JSON.stringify(ruleData)}`);
                    const newRule = this.pointConsumptionRuleRepository.create(ruleData);
                    return await this.pointConsumptionRuleRepository.save(newRule);
                }
            }
        }
        catch (error) {
            this.logger.error(`保存消耗规则失败: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getAllRules() {
        try {
            return await this.pointConsumptionRuleRepository.find({
                order: { packageId: 'ASC', functionId: 'ASC' }
            });
        }
        catch (error) {
            this.logger.error(`获取所有消耗规则失败: ${error.message}`, error.stack);
            return [];
        }
    }
};
PointConsumptionRuleService = PointConsumptionRuleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(pointConsumptionRule_entity_1.PointConsumptionRuleEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(config_entity_1.ConfigEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PointConsumptionRuleService);
exports.PointConsumptionRuleService = PointConsumptionRuleService;
