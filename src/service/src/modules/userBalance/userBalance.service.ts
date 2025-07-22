import { RechargeType } from '@/common/constants/balance.constant';
import { createRandomUid, hideString } from '@/common/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { In, LessThan, Repository } from 'typeorm';
import { CramiPackageEntity } from '../crami/cramiPackage.entity';
import { ConfigEntity } from '../globalConfig/config.entity';
import { GlobalConfigService } from './../globalConfig/globalConfig.service';
import { AccountLogEntity } from './accountLog.entity';
import { BalanceEntity } from './balance.entity';
import { UserBalanceEntity } from './userBalance.entity';
// import * as dayjs from 'dayjs';
import dayjs, {
  formatCreateOrUpdateDate,
  formatDate,
} from '@/common/utils/date';
import { ChatGroupEntity } from '../chatGroup/chatGroup.entity';
import { ChatLogEntity } from '../chatLog/chatLog.entity';
import { UserEntity } from '../user/user.entity';
import { FingerprintLogEntity } from './fingerprint.entity';
import { PointConsumptionRuleEntity } from '../pointConsumptionRule/pointConsumptionRule.entity';
import { DataSource } from 'typeorm';

interface LogInfo {
  userId: number;
  rechargeType: number;
  model3Count?: number;
  model4Count?: number;
  drawMjCount?: number;
  days?: number;
  pkgName?: string;
  extent?: string;
}

interface UserBalanceInfo {
  model3Count?: number;
  model4Count?: number;
  drawMjCount?: number;
}

@Injectable()
export class UserBalanceService {
  constructor(
    @InjectRepository(BalanceEntity)
    private readonly balanceEntity: Repository<BalanceEntity>,
    @InjectRepository(UserBalanceEntity)
    private readonly userBalanceEntity: Repository<UserBalanceEntity>,
    @InjectRepository(AccountLogEntity)
    private readonly accountLogEntity: Repository<AccountLogEntity>,
    @InjectRepository(CramiPackageEntity)
    private readonly cramiPackageEntity: Repository<CramiPackageEntity>,
    @InjectRepository(ConfigEntity)
    private readonly configEntity: Repository<ConfigEntity>,
    @InjectRepository(UserEntity)
    private readonly userEntity: Repository<UserEntity>,
    @InjectRepository(FingerprintLogEntity)
    private readonly fingerprintLogEntity: Repository<FingerprintLogEntity>,
    @InjectRepository(ChatGroupEntity)
    private readonly chatGroupEntity: Repository<ChatGroupEntity>,
    @InjectRepository(ChatLogEntity)
    private readonly chatLogEntity: Repository<ChatLogEntity>,
    private readonly globalConfigService: GlobalConfigService,
    private readonly dataSource: DataSource
  ) {}

  /* 新注册用户赠送消费 */
  async addBalanceToNewUser(userId: number) {
    try {
      // TODO 直接从globalConfig中获取配置
      const registerConfigs = await this.configEntity.find({
        where: {
          configKey: In([
            'registerSendStatus', // 开启注册赠送
            'registerSendModel3Count', // 注册赠送模型3聊天次数
            'registerSendModel4Count', // 注册赠送模型4聊天次数
            'registerSendDrawMjCount', // 注册赠送MJ绘画次数
            'firstRegisterSendStatus', // 开启优先注册赠送
            'firstRegisterSendRank', // 优先注册赠送名次
            'firstRregisterSendModel3Count', // 优先注册赠送模型3聊天次数
            'firstRregisterSendModel4Count', // 优先注册赠送模型4聊天次数
            'firstRregisterSendDrawMjCount', // 优先注册赠送MJ绘画次数
          ]),
        },
      });
      const configMap: any = registerConfigs.reduce((pre, cur: any) => {
        const num = Number(cur.configVal);
        const n = Number.isInteger(num) && num > 0 ? num : 0;
        pre[cur.configKey] = n;
        return pre;
      }, {});
      let model3Count = 0;
      let model4Count = 0;
      let drawMjCount = 0;

      /* 开启注册增送 */
      if (configMap.registerSendStatus === 1) {
        model3Count = model3Count + configMap.registerSendModel3Count;
        model4Count = model4Count + configMap.registerSendModel4Count;
        drawMjCount = drawMjCount + configMap.registerSendDrawMjCount;
      }

      /* 开启优先注册赠送并且在赠送范围内 */
      if (
        configMap.registerSendStatus === 1 &&
        configMap.firstRegisterSendStatus === 1 &&
        userId <= configMap.firstRegisterSendRank
      ) {
        model3Count = model3Count + configMap.firstRregisterSendModel3Count;
        model4Count = model4Count + configMap.firstRregisterSendModel4Count;
        drawMjCount = drawMjCount + configMap.firstRregisterSendDrawMjCount;
      }

      /* 受邀人注册赠送日志 */
      await this.saveRecordRechargeLog({
        userId,
        rechargeType: RechargeType.REG_GIFT,
        model3Count,
        drawMjCount,
        model4Count,
      });
      /* 受邀人初次注册 一次领取所有额度 */
      await this.userBalanceEntity.save({
        userId,
        model3Count,
        model4Count,
        drawMjCount,
        useTokens: 0,
      });
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException(
        '注册赠送失败,请联系管理员！',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /* 检查余额 */
  async validateBalance(req, type, amount, functionId = '') {
    const { id: userId, role } = req.user;
    console.log(`[validateBalance-开始] 用户ID: ${userId}, 角色: ${role}, 类型: ${type}, 数量: ${amount}, 功能: ${functionId}`);
    
    let b = await this.userBalanceEntity.findOne({ where: { userId } });
    if (!b) {
      console.log(`[validateBalance-创建] 用户ID: ${userId} 无余额记录，创建基础记录`);
      b = await this.createBaseUserBalance(userId);
    }
    
    console.log(`[validateBalance-余额] 用户ID: ${userId}, 余额信息: ${JSON.stringify(b)}`);
    
    if (role === 'visitor') {
      console.log(`[validateBalance-游客] 用户ID: ${userId} 是游客角色，调用游客余额验证`);
      return this.validateVisitorBalance(req, type, amount);
    }

    // 获取用户当前套餐ID
    const packageId = b.packageId || 0;
    console.log(`[validateBalance-套餐] 用户ID: ${userId}, 套餐ID: ${packageId}`);
    
    // 获取积分消耗规则配置
    let consumptionRule = null;
    try {
      // 从point_consumption_rule表中获取消耗规则
      const ruleQuery = this.dataSource
        .createQueryBuilder(PointConsumptionRuleEntity, 'rule')
        .where('rule.packageId = :packageId', { packageId })
        .andWhere('rule.functionId = :functionId', { functionId })
        .andWhere('rule.status = 1')
        .getOne();

      consumptionRule = await ruleQuery;
        
      // 如果没有找到特定功能的规则，尝试查找该套餐的默认规则
      if (!consumptionRule) {
        console.log(`[validateBalance-规则] 未找到功能${functionId}的特定规则，尝试查找默认规则`);
        
        const defaultRuleQuery = this.dataSource
          .createQueryBuilder(PointConsumptionRuleEntity, 'rule')
          .where('rule.packageId = :packageId', { packageId })
          .andWhere('rule.functionId = :defaultFunctionId', { defaultFunctionId: 'default' })
          .andWhere('rule.status = 1')
          .getOne();
          
        consumptionRule = await defaultRuleQuery;
      }
        
      if (consumptionRule) {
        console.log(`[validateBalance-规则] 找到匹配规则: ${JSON.stringify(consumptionRule)}`);
      } else {
        console.log(`[validateBalance-规则] 未找到任何匹配规则，将使用默认值`);
      }
    } catch (error) {
      // 无法获取规则时，使用默认值
      console.error(`[validateBalance-错误] 获取积分消耗规则失败: ${error.message}`);
    }

    /* 会员扣费key */
    const memberKey =
      type === 1
        ? 'memberModel3Count'
        : type === 2
        ? 'memberModel4Count'
        : type === 3
        ? 'memberDrawMjCount'
        : null;
    /* 非会员扣费key */
    const baseKey =
      type === 1
        ? 'model3Count'
        : type === 2
        ? 'model4Count'
        : type === 3
        ? 'drawMjCount'
        : null;

    console.log(`[validateBalance-Key] 会员扣费key: ${memberKey}, 非会员扣费key: ${baseKey}`);

    // 应用消耗规则计算实际消耗
    let consumeValue = 0;
    if (type === 1 && consumptionRule) {
      consumeValue = consumptionRule.model3Rate;
    } else if (type === 2 && consumptionRule) {
      consumeValue = consumptionRule.model4Rate;
    } else if (type === 3 && consumptionRule) {
      consumeValue = consumptionRule.drawMjRate;
    } else {
      consumeValue = amount; // 默认消耗原始数量
    }

    console.log(`[validateBalance-消耗] 最终消耗值: ${consumeValue}, 原始数量: ${amount}`);

    // 打印到日志
    // Logger.debug(`操作类型type: ${type}`, 'ValidateBalance');
    // Logger.debug(`会员扣费key(memberKey): ${memberKey}`, 'ValidateBalance');
    // Logger.debug(`非会员扣费key(baseKey): ${baseKey}`, 'ValidateBalance');
    /* 如果是会员 */
    if (b.packageId && b[memberKey] + b[baseKey] < consumeValue) {
      if (b[baseKey] < consumeValue) {
        console.log(`[validateBalance-失败] 会员用户积分不足, 会员积分: ${b[memberKey]}, 普通积分: ${b[baseKey]}, 需要: ${consumeValue}`);
        throw new HttpException(
          `积分不足，继续体验服务，请按需选购套餐！`,
          HttpStatus.PAYMENT_REQUIRED
        );
      }
    }
    /* 如果不是会员 */
    if (!b.packageId && b[baseKey] < consumeValue) {
      console.log(`[validateBalance-失败] 普通用户积分不足, 普通积分: ${b[baseKey]}, 需要: ${consumeValue}`);
      throw new HttpException(
        `积分不足，继续体验服务，请按需选购套餐！`,
        HttpStatus.PAYMENT_REQUIRED
      );
    }
    
    console.log(`[validateBalance-成功] 用户ID: ${userId} 验证成功, 会员积分: ${b[memberKey]}, 普通积分: ${b[baseKey]}, 消耗值: ${consumeValue}`);
    return b;
  }

  /* 检查游客的余额 */
  async validateVisitorBalance(req, type, amount) {
    const { id } = req.user;
    const baseKey =
      type === 1
        ? 'model3Count'
        : type === 2
        ? 'model4Count'
        : type === 3
        ? 'drawMjCount'
        : null;
    const now = new Date();
    const log = await this.fingerprintLogEntity.findOne({
      where: { fingerprint: id },
    });
    /* 判断余额 */
    const { visitorModel3Num, visitorModel4Num, visitorMJNum } =
      await this.globalConfigService.getConfigs([
        'visitorModel3Num',
        'visitorModel4Num',
        'visitorMJNum',
      ]);
    const settings = {
      model3Count: visitorModel3Num ? Number(visitorModel3Num) : 0,
      model4Count: visitorModel4Num ? Number(visitorModel4Num) : 0,
      drawMjCount: visitorMJNum ? Number(visitorMJNum) : 0,
    };
    /* 如果没有 */
    if (!log) {
      let data = {
        fingerprint: id,
        model3Count: 0,
        model4Count: 0,
        drawMjCount: 0,
      };
      data[baseKey] = data[baseKey] + amount;
      /* 判断余额 */
      if (data[baseKey] > settings[baseKey]) {
        throw new HttpException(
          `今日体验额度使用完毕，请注册使用完整服务！`,
          HttpStatus.PAYMENT_REQUIRED
        );
      } else {
        await this.fingerprintLogEntity.save(data);
        return true;
      }
    } else {
      const { model3Count, model4Count, drawMjCount } = log;
      let data = {
        model3Count,
        model4Count,
        drawMjCount,
      };
      /* 判断是否是昨天 */
      // const isUpdateLastDay = this.isUpdatedToday(log.updatedAt)
      // const date = Number(new Date(log.updatedAt)) + 8 * 60 * 60 * 1000
      const date = Number(new Date(log.updatedAt));
      const isUpdateLastDay = this.isUpdatedToday(date);
      if (isUpdateLastDay) {
        data[baseKey] = data[baseKey] + amount;
      } else {
        data = {
          model3Count: 0,
          model4Count: 0,
          drawMjCount: 0,
        };
        data[baseKey] = data[baseKey] + amount;
      }
      if (data[baseKey] > settings[baseKey]) {
        throw new HttpException(
          `今日体验额度使用完毕，请注册使用完整服务！`,
          HttpStatus.PAYMENT_REQUIRED
        );
      } else {
        await this.fingerprintLogEntity.update({ fingerprint: id }, data);
        return true;
      }
    }
  }

  /* 判读上次更新是不是今天  */
  isUpdatedToday(date) {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    return date >= todayStart;
  }

  async deductFromBalance(userId, deductionType, amount, UseAmount = 0, functionId = '') {
    console.log(`[deductFromBalance-开始] 用户ID: ${userId}, 类型: ${deductionType}, 数量: ${amount}, 使用量: ${UseAmount}, 功能: ${functionId}`);

    let b = await this.userBalanceEntity.findOne({ where: { userId } });
    if (!b) {
      console.log(`[deductFromBalance-创建] 用户ID: ${userId} 无余额记录，创建基础记录`);
      b = await this.createBaseUserBalance(userId);
    }
    
    console.log(`[deductFromBalance-余额] 当前余额: ${JSON.stringify(b)}`);
    
    // 获取用户当前套餐ID
    const packageId = b.packageId || 0;
    console.log(`[deductFromBalance-套餐] 用户ID: ${userId}, 套餐ID: ${packageId}`);
    
    // 获取积分消耗规则配置
    let consumptionRule = null;
    try {
      // 从point_consumption_rule表中获取消耗规则
      const ruleQuery = this.dataSource
        .createQueryBuilder(PointConsumptionRuleEntity, 'rule')
        .where('rule.packageId = :packageId', { packageId })
        .andWhere('rule.functionId = :functionId', { functionId })
        .andWhere('rule.status = 1')
        .getOne();

      consumptionRule = await ruleQuery;
        
      // 如果没有找到特定功能的规则，尝试查找该套餐的默认规则
      if (!consumptionRule) {
        console.log(`[deductFromBalance-规则] 未找到功能${functionId}的特定规则，尝试查找默认规则`);
        
        const defaultRuleQuery = this.dataSource
          .createQueryBuilder(PointConsumptionRuleEntity, 'rule')
          .where('rule.packageId = :packageId', { packageId })
          .andWhere('rule.functionId = :defaultFunctionId', { defaultFunctionId: 'default' })
          .andWhere('rule.status = 1')
          .getOne();
          
        consumptionRule = await defaultRuleQuery;
      }
        
      if (consumptionRule) {
        console.log(`[deductFromBalance-规则] 找到匹配规则: ${JSON.stringify(consumptionRule)}`);
      } else {
        console.log(`[deductFromBalance-规则] 未找到任何匹配规则，将使用默认值`);
      }
    } catch (error) {
      // 无法获取规则时，使用默认值
      console.error(`[deductFromBalance-错误] 获取积分消耗规则失败: ${error.message}`);
    }
    
    // 应用消耗规则计算实际消耗
    let deductValue = amount;
    
    // 修复bug：不再使用规则固定值替换原始amount，而是以用户传入的amount为准
    // 仅当规则配置不为0且用户传入amount的值为1时才使用规则值
    // 这样批量任务时能正确扣除总积分
    if (amount === 1) {
      if (deductionType === 1 && consumptionRule && consumptionRule.model3Rate > 0) {
        deductValue = consumptionRule.model3Rate;
      } else if (deductionType === 2 && consumptionRule && consumptionRule.model4Rate > 0) {
        deductValue = consumptionRule.model4Rate;
      } else if (deductionType === 3 && consumptionRule && consumptionRule.drawMjRate > 0) {
        deductValue = consumptionRule.drawMjRate;
      }
    } else {
      console.log(`[deductFromBalance-批量] 检测到批量任务，amount=${amount}，使用原始amount值而不使用规则固定值`);
    }
    
    console.log(`[deductFromBalance-消耗] 最终扣除值: ${deductValue}, 原始数量: ${amount}`);
    
    // 积分不足异常处理
    if (deductValue <= 0) {
      console.log(`[deductFromBalance-警告] 扣除值为零或负数: ${deductValue}，无需扣除`);
      return b; // 如果扣除值为0，直接返回，不进行扣除
    }
    
    // 获取对应积分类型的字段名
    const deductKey = 
      deductionType === 1
        ? 'model3Count'
        : deductionType === 2
        ? 'model4Count'
        : deductionType === 3
        ? 'drawMjCount'
        : null;
    
    const memberKey =
      deductionType === 1
        ? 'memberModel3Count'
        : deductionType === 2
        ? 'memberModel4Count'
        : deductionType === 3
        ? 'memberDrawMjCount'
        : null;
        
    console.log(`[deductFromBalance-Key] 普通积分key: ${deductKey}, 会员积分key: ${memberKey}`);
        
    // 开始扣除积分
    try {
      // 如果是会员，优先使用会员积分
      if (b.packageId && b[memberKey] > 0) {
        if (b[memberKey] >= deductValue) {
          // 会员积分足够，直接扣除
          console.log(`[deductFromBalance-会员] 会员积分足够，从会员积分扣除: ${deductValue}`);
          b[memberKey] = b[memberKey] - deductValue;
        } else {
          // 会员积分不足，先扣除全部会员积分，再扣除普通积分
          const remainDeduct = deductValue - b[memberKey];
          console.log(`[deductFromBalance-会员] 会员积分不足，会员积分扣除: ${b[memberKey]}, 普通积分需扣除: ${remainDeduct}`);
          b[deductKey] = b[deductKey] - remainDeduct;
          b[memberKey] = 0;
        }
      } else {
        // 不是会员或没有会员积分，直接扣除普通积分
        console.log(`[deductFromBalance-普通] 从普通积分扣除: ${deductValue}, 当前普通积分: ${b[deductKey]}`);
        b[deductKey] = b[deductKey] - deductValue;
      }
      
      // 更新useTokens
      if (UseAmount > 0) {
        if ('useTokens' in b) {
          (b as any).useTokens = ((b as any).useTokens || 0) + UseAmount;
          console.log(`[deductFromBalance-使用量] 更新使用量: ${(b as any).useTokens}`);
        } else {
          console.log(`[deductFromBalance-使用量] 实体不支持useTokens字段，跳过使用量更新`);
        }
      }

      // 保存更新后的积分
      await this.userBalanceEntity.save(b);
      console.log(`[deductFromBalance-成功] 积分扣除成功，更新后余额: ${JSON.stringify(b)}`);
      
      return b;
    } catch (error) {
      console.error(`[deductFromBalance-失败] 扣除积分时出错: ${error.message}`);
      throw new HttpException(
        `扣除积分失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /* 查询用户余额 */
  async queryUserBalance(userId: number) {
    try {
      const res: any = await this.userBalanceEntity.findOne({
        where: { userId },
        select: [
          'packageId',
          'model3Count',
          'model4Count',
          'drawMjCount',
          'memberModel3Count',
          'memberModel4Count',
          'memberDrawMjCount',
          'useModel3Count',
          'useModel4Count',
          'useModel3Token',
          'useModel4Token',
          'useDrawMjToken',
          'expirationTime',
        ],
      });
      if (!res) {
        const user = await this.createBaseUserBalance(userId);
        if (user) {
          return await this.queryUserBalance(userId);
        } else {
          throw new HttpException(
            '查询当前用户余额失败！',
            HttpStatus.BAD_REQUEST
          );
        }
      }
      res.sumModel3Count = res.packageId
        ? res.model3Count + res.memberModel3Count
        : res.model3Count;
      res.sumModel4Count = res.packageId
        ? res.model4Count + res.memberModel4Count
        : res.model4Count;
      res.sumDrawMjCount = res.packageId
        ? res.drawMjCount + res.memberDrawMjCount
        : res.drawMjCount;
      res.expirationTime = res.expirationTime
        ? formatDate(res.expirationTime, 'YYYY-MM-DD')
        : null;
      return res;
    } catch (error) {
      console.log('error: ', error);
    }
  }

  /* 记录充值日志 */
  async saveRecordRechargeLog(logInfo: LogInfo) {
    const {
      userId,
      rechargeType,
      model3Count,
      model4Count,
      drawMjCount,
      days = -1,
      pkgName = '',
      extent = '',
    } = logInfo;
    if (!userId) {
      throw new HttpException(
        '当前用户不存在,记录充值日志异常',
        HttpStatus.BAD_REQUEST
      );
    }
    const uid = createRandomUid();
    return await this.accountLogEntity.save({
      userId,
      rechargeType,
      model3Count,
      model4Count,
      drawMjCount,
      days,
      extent,
      uid,
      pkgName,
    });
  }

  /* 创建一条基础的用户余额记录 */
  async createBaseUserBalance(
    userId: number,
    userBalanceInfo: UserBalanceInfo = {}
  ) {
    const {
      model3Count = 0,
      model4Count = 0,
      drawMjCount = 0,
    } = userBalanceInfo;
    const balance = await this.userBalanceEntity.findOne({ where: { userId } });
    if (balance) {
      throw new HttpException(
        '当前用户无需创建账户信息！',
        HttpStatus.BAD_REQUEST
      );
    }
    return await this.userBalanceEntity.save({
      userId,
      model3Count,
      model4Count,
      drawMjCount,
    });
  }

  /* 给用户增加固定次数额度 */
  async addBalanceToUser(userId, balance, days = -1) {
    try {
      const userBalanceInfo =
        (await this.userBalanceEntity.findOne({ where: { userId } })) ||
        (await this.createBaseUserBalance(userId));
      if (!userBalanceInfo) {
        throw new HttpException(
          '查询用户账户信息失败！',
          HttpStatus.BAD_REQUEST
        );
      }
      const {
        model3Count,
        model4Count,
        drawMjCount,
        memberModel3Count,
        memberModel4Count,
        memberDrawMjCount,
      } = userBalanceInfo;
      let params = {};
      /* 是否充值会员套餐 大于0的时间天数都属于套餐 */
      if (days > 0) {
        const { packageId } = balance;
        if (!packageId) {
          throw new HttpException(
            '缺失当前套餐ID、充值失败！',
            HttpStatus.BAD_REQUEST
          );
        }
        const pkgInfo = await this.cramiPackageEntity.findOne({
          where: { id: packageId },
        });
        if (!pkgInfo) {
          throw new HttpException('当前套餐不存在！', HttpStatus.BAD_REQUEST);
        }
        const { weight } = pkgInfo; // 套餐的权重 = 会员等级
        /* 如果不是会员那么则直接充值进入并修改会员信息为会员身份 */
        if (!userBalanceInfo.packageId) {
          params = {
            memberModel3Count: memberModel3Count + balance.model3Count,
            memberModel4Count: memberModel4Count + balance.model4Count,
            memberDrawMjCount: memberDrawMjCount + balance.drawMjCount,
            expirationTime: dayjs()
              .add(days > 0 ? days : 0, 'day')
              .format('YYYY-MM-DD HH:mm:ss'),
            packageId: packageId,
          };
        } else {
          /* 我当前使用的套餐信息 */
          const curPackageInfo = await this.cramiPackageEntity.findOne({
            where: { id: userBalanceInfo.packageId },
          });
          /* 如果是会员则  充值更高或当前等级的套餐会进行时间覆盖充值余额叠加  充值低等级套餐只会叠加次数 不更新到期时间 */
          /* pkgLevel： 我当前的套餐等级 weight： 充值套餐的等级高于或等于当前套餐 则叠加时间并合并额度 */
          if (weight >= curPackageInfo.weight) {
            params = {
              memberModel3Count: memberModel3Count + balance.model3Count,
              memberModel4Count: memberModel4Count + balance.model4Count,
              memberDrawMjCount: memberDrawMjCount + balance.drawMjCount,
              expirationTime: dayjs(userBalanceInfo.expirationTime)
                .add(days > 0 ? days : 0, 'day')
                .format('YYYY-MM-DD HH:mm:ss'),
              packageId: packageId,
            };
          }
          /* 如果充值套餐小于当前套餐等级 只叠加次数 不延长时间 也不变更会员等级 */
          if (weight < curPackageInfo.weight) {
            params = {
              memberModel3Count: memberModel3Count + balance.model3Count,
              memberModel4Count: memberModel4Count + balance.model4Count,
              memberDrawMjCount: memberDrawMjCount + balance.drawMjCount,
            };
          }
        }
      }
      /* 充值不限时卡直接叠加 */
      if (days <= 0) {
        params = {
          model3Count: model3Count + balance.model3Count,
          model4Count: model4Count + balance.model4Count,
          drawMjCount: drawMjCount + balance.drawMjCount,
        };
      }
      const result = await this.userBalanceEntity.update({ userId }, params);
      if (result.affected === 0) {
        throw new HttpException(`${userId}充值失败`, HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException('用户充值失败！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 支付成功给用户充值套餐 */
  async addBalanceToOrder(order) {
    console.log('充值的工单信息:', order);
    try {
      const { userId, goodsId } = order;
      const pkg = await this.cramiPackageEntity.findOne({
        where: { id: order.goodsId, status: 1 },
      });
      if (!pkg) {
        throw new HttpException(
          '非法操作、当前充值套餐暂不存在！',
          HttpStatus.BAD_REQUEST
        );
      }
      const {
        model3Count,
        model4Count,
        drawMjCount,
        days,
        name: pkgName,
      } = pkg;
      const money = {
        model3Count,
        model4Count,
        drawMjCount,
        days,
        packageId: order.goodsId,
      };
      /* 充值进账户 */
      await this.addBalanceToUser(userId, money, days);
      /* 记录充值日志 */
      await this.saveRecordRechargeLog({
        userId,
        rechargeType: RechargeType.SCAN_PAY,
        model3Count,
        model4Count,
        drawMjCount,
        pkgName,
        days,
      });
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException('充值失败！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 查询用户充值日志 */
  async getRechargeLog(req: Request, params) {
    const { page = 1, size = 20 } = params;
    const { id } = req.user;
    const [rows, count] = await this.accountLogEntity.findAndCount({
      where: { userId: id },
      order: { id: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    rows.forEach((item: any) => {
      item.expireDateCn = item.days > 0 ? `${item.days}天` : '永久';
      // item.expireDateCn = item.days > 0 ? `${item.days} Days` : 'Permanent';
    });
    return { rows: formatCreateOrUpdateDate(rows), count };
  }

  /* 管理端查询用户账户变更记录 */
  async getAccountLog(req, params) {
    try {
      const { page = 1, size = 10, userId, rechargeType, packageId } = params;
      const { role } = req.user;
      const where: any = {};
      rechargeType && (where.rechargeType = rechargeType);
      where.userId = userId || LessThan(100000);
      packageId && (where.packageId = { $like: `%${packageId}%` });
      const [rows, count] = await this.accountLogEntity.findAndCount({
        where,
        order: { id: 'DESC' },
        skip: (page - 1) * size,
        take: size,
      });
      const userIds = rows.map((item: any) => item.userId);
      const userInfo = await this.userEntity.find({
        where: { id: In(userIds) },
      });
      rows.forEach((item: any) => {
        const user = userInfo.find((user: any) => user.id === item.userId);
        item.username = user?.username;
        item.email = user?.email;
        item.phone = user?.phone;
        item.status = user?.status;
        item.avatar = user?.avatar;
      });
      if (role !== 'super') {
        rows.forEach((item: any) => {
          item.email = item.email ? hideString(item.email) : '';
          item.phone = item.phone ? hideString(item.phone) : '';
        });
      }
      return { rows, count };
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException('查询用户账户失败！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 通过用户id批量查询用户 */
  async queryUserBalanceByIds(ids: number[]) {
    return await this.userBalanceEntity.find({ where: { userId: In(ids) } });
  }

  /* MJ绘画失败退款 */
  async refundMjBalance(userId, amount) {
    return await this.deductFromBalance(userId, 3, -amount, 0, 'midjourney');
  }

  async inheritVisitorData(req: Request) {
    const { fingerprint } = req.headers;
    const { id: userId } = req.user;
    await this.chatLogEntity.update(
      { userId: Number(fingerprint) },
      { userId }
    );
    await this.chatGroupEntity.update(
      { userId: Number(fingerprint) },
      { userId }
    );
    return 1;
  }

  async getVisitorCount(req) {
    const { fingerprint } = req.headers;
    const countChat = await this.chatLogEntity.count({
      where: { userId: fingerprint },
    });
    const countChatGroup = await this.chatGroupEntity.count({
      where: { userId: fingerprint },
    });

    return countChat || countChatGroup || 0;
  }

  /**
   * 检查用户是否需要进行认证
   * @param userId 用户ID
   */
  async checkUserCertification(userId: number): Promise<void> {
    const userInfo = await this.userEntity.findOne({
      where: { id: userId },
    });
    const userBalance = await this.userBalanceEntity.findOne({
      where: { userId },
    });

    if (!userInfo || !userBalance) {
      return;
      // throw new HttpException(
      //   '用户信息或用户余额信息不存在',
      //   HttpStatus.NOT_FOUND
      // );
    }

    // 获取配置项
    const {
      phoneValidationMessageCount,
      identityVerificationMessageCount,
      openIdentity,
      openPhoneValidation,
    } = await this.globalConfigService.getConfigs([
      'phoneValidationMessageCount',
      'identityVerificationMessageCount',
      'openIdentity',
      'openPhoneValidation',
    ]);

    // 格式化配置项为数字类型
    const phoneValidationCount = Number(phoneValidationMessageCount);
    const identityValidationCount = Number(identityVerificationMessageCount);

    const model3Count = Number(userBalance.useModel3Count) || 0;
    const model4Count = Number(userBalance.useModel4Count) || 0;
    const totalTokens = model3Count + model4Count;

    // 检查是否开启手机号验证并且是否已经绑定手机号
    if (
      openPhoneValidation === '1' &&
      totalTokens >= phoneValidationCount &&
      !userInfo.phone
    ) {
      throw new HttpException('请完成手机号绑定', HttpStatus.BAD_REQUEST);
    }

    // 检查是否开启实名认证并且是否已经完成实名认证
    if (
      openIdentity === '1' &&
      totalTokens >= identityValidationCount &&
      (!userInfo.realName || !userInfo.idCard)
    ) {
      throw new HttpException('请完成实名认证', HttpStatus.BAD_REQUEST);
    }

    // 如果不需要任何认证，方法直接结束，无需返回值
  }

  /**
   * 验证用户使用特定功能的积分
   * 只需传入用户ID和功能ID，即可验证用户是否有足够积分使用该功能
   * @param userId 用户ID
   * @param functionId 功能ID
   * @param amount 可选参数，默认为1，表示使用次数
   * @returns 验证结果对象，包含是否成功、积分类型、消耗值等信息
   */
  async validateUserPointForFunction(userId: number, functionId: string, amount: number = 1) {
    try {
      console.log(`[validateUserPointForFunction-开始] 用户ID: ${userId}, 功能: ${functionId}, 数量: ${amount}`);
      
      // 获取用户信息
      let userInfo = await this.userEntity.findOne({ where: { id: userId } });
      if (!userInfo) {
        console.error(`[validateUserPointForFunction-错误] 用户不存在, ID: ${userId}`);
        return { 
          success: false, 
          message: '用户不存在',
          error: 'USER_NOT_FOUND'
        };
      }
      
      // 获取用户余额和套餐信息
      let userBalance = await this.userBalanceEntity.findOne({ where: { userId } });
      if (!userBalance) {
        console.log(`[validateUserPointForFunction-创建] 用户ID: ${userId} 无余额记录，创建基础记录`);
        userBalance = await this.createBaseUserBalance(userId);
      }
      
      // 获取用户当前套餐ID
      const packageId = userBalance.packageId || 0;
      console.log(`[validateUserPointForFunction-套餐] 用户ID: ${userId}, 套餐ID: ${packageId}, 角色: ${userInfo.role}`);
      
      // 如果是游客角色，使用游客验证逻辑
      if (userInfo.role === 'visitor') {
        try {
          // 创建模拟的请求对象
          const mockReq = { user: { id: userId, role: 'visitor' } };
          // 默认使用高级积分类型
          const defaultType = 2;
          // 验证游客积分
          const visitorResult = await this.validateVisitorBalance(mockReq, defaultType, amount);
          return {
            success: true,
            isVisitor: true,
            deductType: defaultType,
            consumeValue: amount,
            message: '游客积分验证通过'
          };
        } catch (error) {
          return {
            success: false,
            isVisitor: true,
            message: error.message || '游客积分不足',
            error: 'VISITOR_BALANCE_INSUFFICIENT'
          };
        }
      }
      
      // 获取积分消耗规则配置
      let consumptionRule = null;
      let actualDeductType = 2; // 默认使用高级积分类型
      let consumeValue = amount; // 默认消耗原始数量
      
      try {
        // 从point_consumption_rule表中获取消耗规则
        const ruleQuery = this.dataSource
          .createQueryBuilder(PointConsumptionRuleEntity, 'rule')
          .where('rule.packageId = :packageId', { packageId })
          .andWhere('rule.functionId = :functionId', { functionId })
          .andWhere('rule.status = 1')
          .getOne();

        consumptionRule = await ruleQuery;
          
        // 如果没有找到特定功能的规则，尝试查找该套餐的默认规则
        if (!consumptionRule) {
          console.log(`[validateUserPointForFunction-规则] 未找到功能${functionId}的特定规则，尝试查找默认规则`);
          
          const defaultRuleQuery = this.dataSource
            .createQueryBuilder(PointConsumptionRuleEntity, 'rule')
            .where('rule.packageId = :packageId', { packageId })
            .andWhere('rule.functionId = :defaultFunctionId', { defaultFunctionId: 'default' })
            .andWhere('rule.status = 1')
            .getOne();
            
          consumptionRule = await defaultRuleQuery;
        }
          
        if (consumptionRule) {
          console.log(`[validateUserPointForFunction-规则] 找到匹配规则: ${JSON.stringify(consumptionRule)}`);
          
          // 确定实际要扣除的积分类型和数量
          if (consumptionRule.model3Rate > 0) {
            actualDeductType = 1; // 普通积分
            consumeValue = consumptionRule.model3Rate * amount; // 消耗率乘以数量
            console.log(`[validateUserPointForFunction-消耗] 将使用普通积分(model3), 消耗率: ${consumptionRule.model3Rate}, 数量: ${amount}, 总消耗: ${consumeValue}`);
          } else if (consumptionRule.model4Rate > 0) {
            actualDeductType = 2; // 高级积分
            consumeValue = consumptionRule.model4Rate * amount; // 消耗率乘以数量
            console.log(`[validateUserPointForFunction-消耗] 将使用高级积分(model4), 消耗率: ${consumptionRule.model4Rate}, 数量: ${amount}, 总消耗: ${consumeValue}`);
          } else if (consumptionRule.drawMjRate > 0) {
            actualDeductType = 3; // 绘画积分
            consumeValue = consumptionRule.drawMjRate * amount; // 消耗率乘以数量
            console.log(`[validateUserPointForFunction-消耗] 将使用绘画积分(drawMj), 消耗率: ${consumptionRule.drawMjRate}, 数量: ${amount}, 总消耗: ${consumeValue}`);
          } else {
            console.log(`[validateUserPointForFunction-消耗] 规则中所有消耗率均为0，将使用默认值`);
          }
        } else {
          console.log(`[validateUserPointForFunction-规则] 未找到匹配规则，将使用默认值`);
        }
      } catch (error) {
        console.error(`[validateUserPointForFunction-错误] 获取积分规则失败: ${error.message}`);
        // 使用默认值继续
      }
      
      // 获取对应积分类型的字段名
      const memberKey =
        actualDeductType === 1
          ? 'memberModel3Count'
          : actualDeductType === 2
          ? 'memberModel4Count'
          : actualDeductType === 3
          ? 'memberDrawMjCount'
          : null;
          
      const baseKey =
        actualDeductType === 1
          ? 'model3Count'
          : actualDeductType === 2
          ? 'model4Count'
          : actualDeductType === 3
          ? 'drawMjCount'
          : null;
      
      console.log(`[validateUserPointForFunction-Key] 会员扣费key: ${memberKey}, 非会员扣费key: ${baseKey}`);
      
      // 验证会员用户积分
      if (packageId) {
        const memberBalance = userBalance[memberKey] || 0;
        const baseBalance = userBalance[baseKey] || 0;
        const totalBalance = memberBalance + baseBalance;
        
        if (totalBalance < consumeValue) {
          console.log(`[validateUserPointForFunction-失败] 会员用户积分不足, 会员积分: ${memberBalance}, 普通积分: ${baseBalance}, 需要: ${consumeValue}`);
          return {
            success: false,
            isPremium: true,
            deductType: actualDeductType,
            consumeValue: consumeValue,
            availableBalance: totalBalance,
            message: `积分不足，继续体验服务，请按需选购套餐！需要${consumeValue}点，当前仅有${totalBalance}点`,
            error: 'PREMIUM_BALANCE_INSUFFICIENT'
          };
        }
        
        console.log(`[validateUserPointForFunction-成功] 会员用户积分验证通过, 会员积分: ${memberBalance}, 普通积分: ${baseBalance}, 需要: ${consumeValue}`);
        return {
          success: true,
          isPremium: true,
          deductType: actualDeductType,
          consumeValue: consumeValue,
          availableBalance: totalBalance,
          memberBalance: memberBalance,
          baseBalance: baseBalance,
          maxConcurrentTasks: consumptionRule?.maxConcurrentTasks || 1,
          message: '会员用户积分验证通过'
        };
      } 
      // 验证普通用户积分
      else {
        const baseBalance = userBalance[baseKey] || 0;
        
        if (baseBalance < consumeValue) {
          console.log(`[validateUserPointForFunction-失败] 普通用户积分不足, 普通积分: ${baseBalance}, 需要: ${consumeValue}`);
          return {
            success: false,
            isPremium: false,
            deductType: actualDeductType,
            consumeValue: consumeValue,
            availableBalance: baseBalance,
            message: `积分不足，继续体验服务，请按需选购套餐！需要${consumeValue}点，当前仅有${baseBalance}点`,
            error: 'REGULAR_BALANCE_INSUFFICIENT'
          };
        }
        
        console.log(`[validateUserPointForFunction-成功] 普通用户积分验证通过, 普通积分: ${baseBalance}, 需要: ${consumeValue}`);
        return {
          success: true,
          isPremium: false,
          deductType: actualDeductType,
          consumeValue: consumeValue,
          availableBalance: baseBalance,
          baseBalance: baseBalance,
          maxConcurrentTasks: consumptionRule?.maxConcurrentTasks || 1,
          message: '普通用户积分验证通过'
        };
      }
    } catch (error) {
      console.error(`[validateUserPointForFunction-错误] 验证失败: ${error.message}`, error.stack);
      return { 
        success: false, 
        message: error.message || '积分验证过程中出现错误',
        error: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * 使用特定功能并扣除积分
   * @param userId 用户ID
   * @param functionId 功能ID
   * @param amount 可选参数，默认为1，表示使用次数
   * @returns 扣费结果对象
   */
  async useFunction(userId: number, functionId: string, amount: number = 1) {
    try {
      console.log(`[useFunction-开始] 用户ID: ${userId}, 功能: ${functionId}, 数量: ${amount}`);
      
      // 先验证用户积分
      const validationResult = await this.validateUserPointForFunction(userId, functionId, amount);
      
      if (!validationResult.success) {
        return validationResult;
      }
      
      // 验证通过，扣除积分
      try {
        const deductResult = await this.deductFromBalance(
          userId,
          validationResult.deductType,
          validationResult.consumeValue,
          0, // UseAmount
          functionId
        );
        
        console.log(`[useFunction-完成] 用户ID: ${userId} 积分扣除成功`);
        return {
          ...validationResult,
          deducted: true,
          message: '功能使用成功，积分已扣除'
        };
      } catch (error) {
        console.error(`[useFunction-错误] 扣除积分失败: ${error.message}`);
        return {
          ...validationResult,
          success: false,
          deducted: false,
          message: error.message || '扣除积分失败',
          error: 'DEDUCTION_FAILED'
        };
      }
    } catch (error) {
      console.error(`[useFunction-错误] 验证或扣除积分失败: ${error.message}`, error.stack);
      return { 
        success: false, 
        deducted: false,
        message: error.message || '使用功能过程中出现错误',
        error: 'FUNCTION_USE_ERROR'
      };
    }
  }

  /**
   * 退还功能使用的积分
   * @param userId 用户ID
   * @param functionId 功能ID
   * @param deductType 扣除类型
   * @param amount 退还金额
   * @returns 退款结果
   */
  async refundFunctionPoints(
    userId: number,
    functionId: string,
    deductType: number,
    amount: number
  ): Promise<{ success: boolean; refunded: boolean; message: string }> {
    try {
      const userBalance = await this.userBalanceEntity.findOne({
        where: { userId }
      });

      if (!userBalance) {
        console.warn(`退款失败：找不到用户余额记录 [用户ID: ${userId}]`);
        return {
          success: false,
          refunded: false,
          message: '找不到用户余额记录'
        };
      }

      // 根据deductType决定加回到哪个余额
      if (deductType === 1) {
        // 积分
        userBalance.model3Count += amount;
      } else if (deductType === 2) {
        // 使用次数
        userBalance.useModel3Count += amount;
      } else {
        return {
          success: false,
          refunded: false,
          message: `不支持的扣除类型: ${deductType}`
        };
      }

      await this.userBalanceEntity.save(userBalance);

      // 生成随机的uid
      const uid = Math.random().toString(36).substring(2, 15);

      // 记录退款日志
      await this.accountLogEntity.save({
        userId,
        action: `退还${deductType === 1 ? '积分' : '使用次数'}`,
        detail: `功能[${functionId}]退款`,
        changeAmount: amount,
        changeType: deductType,
        balance: deductType === 1 ? userBalance.model3Count : userBalance.useModel3Count,
        remark: `因功能使用失败退还`,
        rechargeType: RechargeType.DRAW_FAIL_REFUND,
        model3Count: deductType === 1 ? amount : 0,  // 根据deductType设置对应字段
        model4Count: 0,
        drawMjCount: 0,
        days: 0,
        uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`成功退还[${deductType === 1 ? '积分' : '使用次数'}]: 用户ID ${userId}, 功能 ${functionId}, 数量 ${amount}`);

      return {
        success: true,
        refunded: true,
        message: '退款成功'
      };
    } catch (error) {
      console.error(`退款过程中出错: ${error.message}`, error.stack);
      return {
        success: false,
        refunded: false,
        message: `退款失败: ${error.message}`
      };
    }
  }
}
