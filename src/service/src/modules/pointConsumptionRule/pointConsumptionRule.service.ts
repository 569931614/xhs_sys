import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointConsumptionRuleEntity } from './pointConsumptionRule.entity';
import { ConfigEntity } from '../globalConfig/config.entity';

@Injectable()
export class PointConsumptionRuleService {
  private readonly logger = new Logger(PointConsumptionRuleService.name);

  constructor(
    @InjectRepository(PointConsumptionRuleEntity)
    private readonly pointConsumptionRuleRepository: Repository<PointConsumptionRuleEntity>,
    @InjectRepository(ConfigEntity)
    private readonly configEntity: Repository<ConfigEntity>
  ) {
    // 初始化服务时检查规则表是否有数据，如果没有则尝试从配置中迁移
    this.initRulesFromConfig();
  }

  /**
   * 从配置表中迁移数据到规则表
   */
  private async initRulesFromConfig() {
    try {
      // 检查规则表是否已有数据
      const rulesCount = await this.pointConsumptionRuleRepository.count();
      if (rulesCount > 0) {
        this.logger.log('积分消耗规则表已有数据，无需初始化');
        return;
      }

      // 从配置表中获取规则
      const configData = await this.configEntity.findOne({
        where: { configKey: 'packagePointConsumptionRules' },
      });

      if (!configData || !configData.configVal) {
        this.logger.warn('配置表中无积分消耗规则数据，跳过初始化');
        return;
      }

      // 解析配置数据
      const rules = JSON.parse(configData.configVal);
      if (!Array.isArray(rules) || rules.length === 0) {
        this.logger.warn('配置表中的积分消耗规则为空或格式不正确，跳过初始化');
        return;
      }

      // 将配置数据转换为实体并保存
      const ruleEntities = rules.map(rule => {
        const entity = new PointConsumptionRuleEntity();
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

      // 保存实体
      await this.pointConsumptionRuleRepository.save(ruleEntities);
      this.logger.log(`成功从配置迁移了 ${ruleEntities.length} 条积分消耗规则`);
    } catch (error) {
      this.logger.error(`从配置迁移积分消耗规则失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 获取特定套餐和功能的消耗规则
   * @param packageId 套餐ID
   * @param functionId 功能ID
   * @param id 规则ID (可选)
   * @returns 消耗规则实体
   */
  async getRule(packageId: number, functionId: string, id?: number) {
    try {
      // 如果提供了ID，优先通过ID查找
      if (id) {
        return await this.pointConsumptionRuleRepository.findOne({
          where: { id }
        });
      }
      
      // 否则通过套餐ID和功能ID查找
      // 先尝试查找与套餐ID和功能ID都匹配的规则
      let rule = await this.pointConsumptionRuleRepository.findOne({
        where: { 
          packageId, 
          functionId,
          status: 1,
          isAvailable: 1
        }
      });

      // 如果没找到特定功能的规则，尝试查找该套餐的默认规则
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
    } catch (error) {
      this.logger.error(`获取消耗规则失败: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 创建或更新积分消耗规则
   * @param ruleData 规则数据
   * @returns 创建或更新的规则实体
   */
  async saveRule(ruleData: Partial<PointConsumptionRuleEntity>) {
    try {
      // 获取现有规则（如果存在）
      let existingRule;
      
      // 如果提供了ID，尝试查找现有记录
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
        
        // 如果是更新现有规则，且未提供packageId或functionId，则使用现有的值
        if (!ruleData.packageId) {
          ruleData.packageId = existingRule.packageId;
        }
        if (!ruleData.functionId) {
          ruleData.functionId = existingRule.functionId;
        }
        
        // 更新现有实例的属性
        for (const key in ruleData) {
          if (key !== 'id' && key !== 'createTime' && key !== 'updateTime') {
            existingRule[key] = ruleData[key];
          }
        }
        
        // 保存更新后的实体
        this.logger.log(`保存更新的规则: ${JSON.stringify(existingRule)}`);
        return await this.pointConsumptionRuleRepository.save(existingRule);
      } else {
        // 创建新规则时，需要验证packageId和functionId
        if (ruleData.packageId === undefined || ruleData.packageId === null || !ruleData.functionId) {
          throw new Error('套餐ID和功能ID为必填项');
        }
        
        // 检查是否已存在具有相同packageId和functionId的规则
        existingRule = await this.pointConsumptionRuleRepository.findOne({
          where: { 
            packageId: ruleData.packageId,
            functionId: ruleData.functionId
          }
        });
        
        if (existingRule) {
          // 更新现有规则
          this.logger.log(`找到匹配的规则ID=${existingRule.id}，准备更新`);
          for (const key in ruleData) {
            if (key !== 'id' && key !== 'createTime' && key !== 'updateTime') {
              existingRule[key] = ruleData[key];
            }
          }
          return await this.pointConsumptionRuleRepository.save(existingRule);
        } else {
          // 创建新规则
          this.logger.log(`创建新规则: ${JSON.stringify(ruleData)}`);
          const newRule = this.pointConsumptionRuleRepository.create(ruleData);
          return await this.pointConsumptionRuleRepository.save(newRule);
        }
      }
    } catch (error) {
      this.logger.error(`保存消耗规则失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取所有积分消耗规则
   * @returns 规则列表
   */
  async getAllRules() {
    try {
      return await this.pointConsumptionRuleRepository.find({
        order: { packageId: 'ASC', functionId: 'ASC' }
      });
    } catch (error) {
      this.logger.error(`获取所有消耗规则失败: ${error.message}`, error.stack);
      return [];
    }
  }
} 