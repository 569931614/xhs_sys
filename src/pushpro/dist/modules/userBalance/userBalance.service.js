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
exports.UserBalanceService = void 0;
const balance_constant_1 = require("../../common/constants/balance.constant");
const utils_1 = require("../../common/utils");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cramiPackage_entity_1 = require("../crami/cramiPackage.entity");
const config_entity_1 = require("../globalConfig/config.entity");
const globalConfig_service_1 = require("./../globalConfig/globalConfig.service");
const accountLog_entity_1 = require("./accountLog.entity");
const balance_entity_1 = require("./balance.entity");
const userBalance_entity_1 = require("./userBalance.entity");
const date_1 = require("../../common/utils/date");
const chatGroup_entity_1 = require("../chatGroup/chatGroup.entity");
const chatLog_entity_1 = require("../chatLog/chatLog.entity");
const user_entity_1 = require("../user/user.entity");
const fingerprint_entity_1 = require("./fingerprint.entity");
const pointConsumptionRule_entity_1 = require("../pointConsumptionRule/pointConsumptionRule.entity");
const typeorm_3 = require("typeorm");
let UserBalanceService = class UserBalanceService {
    constructor(balanceEntity, userBalanceEntity, accountLogEntity, cramiPackageEntity, configEntity, userEntity, fingerprintLogEntity, chatGroupEntity, chatLogEntity, globalConfigService, dataSource) {
        this.balanceEntity = balanceEntity;
        this.userBalanceEntity = userBalanceEntity;
        this.accountLogEntity = accountLogEntity;
        this.cramiPackageEntity = cramiPackageEntity;
        this.configEntity = configEntity;
        this.userEntity = userEntity;
        this.fingerprintLogEntity = fingerprintLogEntity;
        this.chatGroupEntity = chatGroupEntity;
        this.chatLogEntity = chatLogEntity;
        this.globalConfigService = globalConfigService;
        this.dataSource = dataSource;
    }
    async addBalanceToNewUser(userId) {
        try {
            const registerConfigs = await this.configEntity.find({
                where: {
                    configKey: (0, typeorm_2.In)([
                        'registerSendStatus',
                        'registerSendModel3Count',
                        'registerSendModel4Count',
                        'registerSendDrawMjCount',
                        'firstRegisterSendStatus',
                        'firstRegisterSendRank',
                        'firstRregisterSendModel3Count',
                        'firstRregisterSendModel4Count',
                        'firstRregisterSendDrawMjCount',
                    ]),
                },
            });
            const configMap = registerConfigs.reduce((pre, cur) => {
                const num = Number(cur.configVal);
                const n = Number.isInteger(num) && num > 0 ? num : 0;
                pre[cur.configKey] = n;
                return pre;
            }, {});
            let model3Count = 0;
            let model4Count = 0;
            let drawMjCount = 0;
            if (configMap.registerSendStatus === 1) {
                model3Count = model3Count + configMap.registerSendModel3Count;
                model4Count = model4Count + configMap.registerSendModel4Count;
                drawMjCount = drawMjCount + configMap.registerSendDrawMjCount;
            }
            if (configMap.registerSendStatus === 1 &&
                configMap.firstRegisterSendStatus === 1 &&
                userId <= configMap.firstRegisterSendRank) {
                model3Count = model3Count + configMap.firstRregisterSendModel3Count;
                model4Count = model4Count + configMap.firstRregisterSendModel4Count;
                drawMjCount = drawMjCount + configMap.firstRregisterSendDrawMjCount;
            }
            await this.saveRecordRechargeLog({
                userId,
                rechargeType: balance_constant_1.RechargeType.REG_GIFT,
                model3Count,
                drawMjCount,
                model4Count,
            });
            await this.userBalanceEntity.save({
                userId,
                model3Count,
                model4Count,
                drawMjCount,
                useTokens: 0,
            });
        }
        catch (error) {
            console.log('error: ', error);
            throw new common_1.HttpException('注册赠送失败,请联系管理员！', common_1.HttpStatus.BAD_REQUEST);
        }
    }
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
        const packageId = b.packageId || 0;
        console.log(`[validateBalance-套餐] 用户ID: ${userId}, 套餐ID: ${packageId}`);
        let consumptionRule = null;
        try {
            const ruleQuery = this.dataSource
                .createQueryBuilder(pointConsumptionRule_entity_1.PointConsumptionRuleEntity, 'rule')
                .where('rule.packageId = :packageId', { packageId })
                .andWhere('rule.functionId = :functionId', { functionId })
                .andWhere('rule.status = 1')
                .getOne();
            consumptionRule = await ruleQuery;
            if (!consumptionRule) {
                console.log(`[validateBalance-规则] 未找到功能${functionId}的特定规则，尝试查找默认规则`);
                const defaultRuleQuery = this.dataSource
                    .createQueryBuilder(pointConsumptionRule_entity_1.PointConsumptionRuleEntity, 'rule')
                    .where('rule.packageId = :packageId', { packageId })
                    .andWhere('rule.functionId = :defaultFunctionId', { defaultFunctionId: 'default' })
                    .andWhere('rule.status = 1')
                    .getOne();
                consumptionRule = await defaultRuleQuery;
            }
            if (consumptionRule) {
                console.log(`[validateBalance-规则] 找到匹配规则: ${JSON.stringify(consumptionRule)}`);
            }
            else {
                console.log(`[validateBalance-规则] 未找到任何匹配规则，将使用默认值`);
            }
        }
        catch (error) {
            console.error(`[validateBalance-错误] 获取积分消耗规则失败: ${error.message}`);
        }
        const memberKey = type === 1
            ? 'memberModel3Count'
            : type === 2
                ? 'memberModel4Count'
                : type === 3
                    ? 'memberDrawMjCount'
                    : null;
        const baseKey = type === 1
            ? 'model3Count'
            : type === 2
                ? 'model4Count'
                : type === 3
                    ? 'drawMjCount'
                    : null;
        console.log(`[validateBalance-Key] 会员扣费key: ${memberKey}, 非会员扣费key: ${baseKey}`);
        let consumeValue = 0;
        if (type === 1 && consumptionRule) {
            consumeValue = consumptionRule.model3Rate;
        }
        else if (type === 2 && consumptionRule) {
            consumeValue = consumptionRule.model4Rate;
        }
        else if (type === 3 && consumptionRule) {
            consumeValue = consumptionRule.drawMjRate;
        }
        else {
            consumeValue = amount;
        }
        console.log(`[validateBalance-消耗] 最终消耗值: ${consumeValue}, 原始数量: ${amount}`);
        if (b.packageId && b[memberKey] + b[baseKey] < consumeValue) {
            if (b[baseKey] < consumeValue) {
                console.log(`[validateBalance-失败] 会员用户积分不足, 会员积分: ${b[memberKey]}, 普通积分: ${b[baseKey]}, 需要: ${consumeValue}`);
                throw new common_1.HttpException(`积分不足，继续体验服务，请按需选购套餐！`, common_1.HttpStatus.PAYMENT_REQUIRED);
            }
        }
        if (!b.packageId && b[baseKey] < consumeValue) {
            console.log(`[validateBalance-失败] 普通用户积分不足, 普通积分: ${b[baseKey]}, 需要: ${consumeValue}`);
            throw new common_1.HttpException(`积分不足，继续体验服务，请按需选购套餐！`, common_1.HttpStatus.PAYMENT_REQUIRED);
        }
        console.log(`[validateBalance-成功] 用户ID: ${userId} 验证成功, 会员积分: ${b[memberKey]}, 普通积分: ${b[baseKey]}, 消耗值: ${consumeValue}`);
        return b;
    }
    async validateVisitorBalance(req, type, amount) {
        const { id } = req.user;
        const baseKey = type === 1
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
        const { visitorModel3Num, visitorModel4Num, visitorMJNum } = await this.globalConfigService.getConfigs([
            'visitorModel3Num',
            'visitorModel4Num',
            'visitorMJNum',
        ]);
        const settings = {
            model3Count: visitorModel3Num ? Number(visitorModel3Num) : 0,
            model4Count: visitorModel4Num ? Number(visitorModel4Num) : 0,
            drawMjCount: visitorMJNum ? Number(visitorMJNum) : 0,
        };
        if (!log) {
            let data = {
                fingerprint: id,
                model3Count: 0,
                model4Count: 0,
                drawMjCount: 0,
            };
            data[baseKey] = data[baseKey] + amount;
            if (data[baseKey] > settings[baseKey]) {
                throw new common_1.HttpException(`今日体验额度使用完毕，请注册使用完整服务！`, common_1.HttpStatus.PAYMENT_REQUIRED);
            }
            else {
                await this.fingerprintLogEntity.save(data);
                return true;
            }
        }
        else {
            const { model3Count, model4Count, drawMjCount } = log;
            let data = {
                model3Count,
                model4Count,
                drawMjCount,
            };
            const date = Number(new Date(log.updatedAt));
            const isUpdateLastDay = this.isUpdatedToday(date);
            if (isUpdateLastDay) {
                data[baseKey] = data[baseKey] + amount;
            }
            else {
                data = {
                    model3Count: 0,
                    model4Count: 0,
                    drawMjCount: 0,
                };
                data[baseKey] = data[baseKey] + amount;
            }
            if (data[baseKey] > settings[baseKey]) {
                throw new common_1.HttpException(`今日体验额度使用完毕，请注册使用完整服务！`, common_1.HttpStatus.PAYMENT_REQUIRED);
            }
            else {
                await this.fingerprintLogEntity.update({ fingerprint: id }, data);
                return true;
            }
        }
    }
    isUpdatedToday(date) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
        const packageId = b.packageId || 0;
        console.log(`[deductFromBalance-套餐] 用户ID: ${userId}, 套餐ID: ${packageId}`);
        let consumptionRule = null;
        try {
            const ruleQuery = this.dataSource
                .createQueryBuilder(pointConsumptionRule_entity_1.PointConsumptionRuleEntity, 'rule')
                .where('rule.packageId = :packageId', { packageId })
                .andWhere('rule.functionId = :functionId', { functionId })
                .andWhere('rule.status = 1')
                .getOne();
            consumptionRule = await ruleQuery;
            if (!consumptionRule) {
                console.log(`[deductFromBalance-规则] 未找到功能${functionId}的特定规则，尝试查找默认规则`);
                const defaultRuleQuery = this.dataSource
                    .createQueryBuilder(pointConsumptionRule_entity_1.PointConsumptionRuleEntity, 'rule')
                    .where('rule.packageId = :packageId', { packageId })
                    .andWhere('rule.functionId = :defaultFunctionId', { defaultFunctionId: 'default' })
                    .andWhere('rule.status = 1')
                    .getOne();
                consumptionRule = await defaultRuleQuery;
            }
            if (consumptionRule) {
                console.log(`[deductFromBalance-规则] 找到匹配规则: ${JSON.stringify(consumptionRule)}`);
            }
            else {
                console.log(`[deductFromBalance-规则] 未找到任何匹配规则，将使用默认值`);
            }
        }
        catch (error) {
            console.error(`[deductFromBalance-错误] 获取积分消耗规则失败: ${error.message}`);
        }
        let deductValue = amount;
        if (amount === 1) {
            if (deductionType === 1 && consumptionRule && consumptionRule.model3Rate > 0) {
                deductValue = consumptionRule.model3Rate;
            }
            else if (deductionType === 2 && consumptionRule && consumptionRule.model4Rate > 0) {
                deductValue = consumptionRule.model4Rate;
            }
            else if (deductionType === 3 && consumptionRule && consumptionRule.drawMjRate > 0) {
                deductValue = consumptionRule.drawMjRate;
            }
        }
        else {
            console.log(`[deductFromBalance-批量] 检测到批量任务，amount=${amount}，使用原始amount值而不使用规则固定值`);
        }
        console.log(`[deductFromBalance-消耗] 最终扣除值: ${deductValue}, 原始数量: ${amount}`);
        if (deductValue <= 0) {
            console.log(`[deductFromBalance-警告] 扣除值为零或负数: ${deductValue}，无需扣除`);
            return b;
        }
        const deductKey = deductionType === 1
            ? 'model3Count'
            : deductionType === 2
                ? 'model4Count'
                : deductionType === 3
                    ? 'drawMjCount'
                    : null;
        const memberKey = deductionType === 1
            ? 'memberModel3Count'
            : deductionType === 2
                ? 'memberModel4Count'
                : deductionType === 3
                    ? 'memberDrawMjCount'
                    : null;
        console.log(`[deductFromBalance-Key] 普通积分key: ${deductKey}, 会员积分key: ${memberKey}`);
        try {
            if (b.packageId && b[memberKey] > 0) {
                if (b[memberKey] >= deductValue) {
                    console.log(`[deductFromBalance-会员] 会员积分足够，从会员积分扣除: ${deductValue}`);
                    b[memberKey] = b[memberKey] - deductValue;
                }
                else {
                    const remainDeduct = deductValue - b[memberKey];
                    console.log(`[deductFromBalance-会员] 会员积分不足，会员积分扣除: ${b[memberKey]}, 普通积分需扣除: ${remainDeduct}`);
                    b[deductKey] = b[deductKey] - remainDeduct;
                    b[memberKey] = 0;
                }
            }
            else {
                console.log(`[deductFromBalance-普通] 从普通积分扣除: ${deductValue}, 当前普通积分: ${b[deductKey]}`);
                b[deductKey] = b[deductKey] - deductValue;
            }
            if (UseAmount > 0) {
                if ('useTokens' in b) {
                    b.useTokens = (b.useTokens || 0) + UseAmount;
                    console.log(`[deductFromBalance-使用量] 更新使用量: ${b.useTokens}`);
                }
                else {
                    console.log(`[deductFromBalance-使用量] 实体不支持useTokens字段，跳过使用量更新`);
                }
            }
            await this.userBalanceEntity.save(b);
            console.log(`[deductFromBalance-成功] 积分扣除成功，更新后余额: ${JSON.stringify(b)}`);
            return b;
        }
        catch (error) {
            console.error(`[deductFromBalance-失败] 扣除积分时出错: ${error.message}`);
            throw new common_1.HttpException(`扣除积分失败: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async queryUserBalance(userId) {
        try {
            const res = await this.userBalanceEntity.findOne({
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
                }
                else {
                    throw new common_1.HttpException('查询当前用户余额失败！', common_1.HttpStatus.BAD_REQUEST);
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
                ? (0, date_1.formatDate)(res.expirationTime, 'YYYY-MM-DD')
                : null;
            return res;
        }
        catch (error) {
            console.log('error: ', error);
        }
    }
    async saveRecordRechargeLog(logInfo) {
        const { userId, rechargeType, model3Count, model4Count, drawMjCount, days = -1, pkgName = '', extent = '', } = logInfo;
        if (!userId) {
            throw new common_1.HttpException('当前用户不存在,记录充值日志异常', common_1.HttpStatus.BAD_REQUEST);
        }
        const uid = (0, utils_1.createRandomUid)();
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
    async createBaseUserBalance(userId, userBalanceInfo = {}) {
        const { model3Count = 0, model4Count = 0, drawMjCount = 0, } = userBalanceInfo;
        const balance = await this.userBalanceEntity.findOne({ where: { userId } });
        if (balance) {
            throw new common_1.HttpException('当前用户无需创建账户信息！', common_1.HttpStatus.BAD_REQUEST);
        }
        return await this.userBalanceEntity.save({
            userId,
            model3Count,
            model4Count,
            drawMjCount,
        });
    }
    async addBalanceToUser(userId, balance, days = -1) {
        try {
            const userBalanceInfo = (await this.userBalanceEntity.findOne({ where: { userId } })) ||
                (await this.createBaseUserBalance(userId));
            if (!userBalanceInfo) {
                throw new common_1.HttpException('查询用户账户信息失败！', common_1.HttpStatus.BAD_REQUEST);
            }
            const { model3Count, model4Count, drawMjCount, memberModel3Count, memberModel4Count, memberDrawMjCount, } = userBalanceInfo;
            let params = {};
            if (days > 0) {
                const { packageId } = balance;
                if (!packageId) {
                    throw new common_1.HttpException('缺失当前套餐ID、充值失败！', common_1.HttpStatus.BAD_REQUEST);
                }
                const pkgInfo = await this.cramiPackageEntity.findOne({
                    where: { id: packageId },
                });
                if (!pkgInfo) {
                    throw new common_1.HttpException('当前套餐不存在！', common_1.HttpStatus.BAD_REQUEST);
                }
                const { weight } = pkgInfo;
                if (!userBalanceInfo.packageId) {
                    params = {
                        memberModel3Count: memberModel3Count + balance.model3Count,
                        memberModel4Count: memberModel4Count + balance.model4Count,
                        memberDrawMjCount: memberDrawMjCount + balance.drawMjCount,
                        expirationTime: (0, date_1.default)()
                            .add(days > 0 ? days : 0, 'day')
                            .format('YYYY-MM-DD HH:mm:ss'),
                        packageId: packageId,
                    };
                }
                else {
                    const curPackageInfo = await this.cramiPackageEntity.findOne({
                        where: { id: userBalanceInfo.packageId },
                    });
                    if (weight >= curPackageInfo.weight) {
                        params = {
                            memberModel3Count: memberModel3Count + balance.model3Count,
                            memberModel4Count: memberModel4Count + balance.model4Count,
                            memberDrawMjCount: memberDrawMjCount + balance.drawMjCount,
                            expirationTime: (0, date_1.default)(userBalanceInfo.expirationTime)
                                .add(days > 0 ? days : 0, 'day')
                                .format('YYYY-MM-DD HH:mm:ss'),
                            packageId: packageId,
                        };
                    }
                    if (weight < curPackageInfo.weight) {
                        params = {
                            memberModel3Count: memberModel3Count + balance.model3Count,
                            memberModel4Count: memberModel4Count + balance.model4Count,
                            memberDrawMjCount: memberDrawMjCount + balance.drawMjCount,
                        };
                    }
                }
            }
            if (days <= 0) {
                params = {
                    model3Count: model3Count + balance.model3Count,
                    model4Count: model4Count + balance.model4Count,
                    drawMjCount: drawMjCount + balance.drawMjCount,
                };
            }
            const result = await this.userBalanceEntity.update({ userId }, params);
            if (result.affected === 0) {
                throw new common_1.HttpException(`${userId}充值失败`, common_1.HttpStatus.BAD_REQUEST);
            }
        }
        catch (error) {
            console.log('error: ', error);
            throw new common_1.HttpException('用户充值失败！', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async addBalanceToOrder(order) {
        console.log('充值的工单信息:', order);
        try {
            const { userId, goodsId } = order;
            const pkg = await this.cramiPackageEntity.findOne({
                where: { id: order.goodsId, status: 1 },
            });
            if (!pkg) {
                throw new common_1.HttpException('非法操作、当前充值套餐暂不存在！', common_1.HttpStatus.BAD_REQUEST);
            }
            const { model3Count, model4Count, drawMjCount, days, name: pkgName, } = pkg;
            const money = {
                model3Count,
                model4Count,
                drawMjCount,
                days,
                packageId: order.goodsId,
            };
            await this.addBalanceToUser(userId, money, days);
            await this.saveRecordRechargeLog({
                userId,
                rechargeType: balance_constant_1.RechargeType.SCAN_PAY,
                model3Count,
                model4Count,
                drawMjCount,
                pkgName,
                days,
            });
        }
        catch (error) {
            console.log('error: ', error);
            throw new common_1.HttpException('充值失败！', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getRechargeLog(req, params) {
        const { page = 1, size = 20 } = params;
        const { id } = req.user;
        const [rows, count] = await this.accountLogEntity.findAndCount({
            where: { userId: id },
            order: { id: 'DESC' },
            skip: (page - 1) * size,
            take: size,
        });
        rows.forEach((item) => {
            item.expireDateCn = item.days > 0 ? `${item.days}天` : '永久';
        });
        return { rows: (0, date_1.formatCreateOrUpdateDate)(rows), count };
    }
    async getAccountLog(req, params) {
        try {
            const { page = 1, size = 10, userId, rechargeType, packageId } = params;
            const { role } = req.user;
            const where = {};
            rechargeType && (where.rechargeType = rechargeType);
            where.userId = userId || (0, typeorm_2.LessThan)(100000);
            packageId && (where.packageId = { $like: `%${packageId}%` });
            const [rows, count] = await this.accountLogEntity.findAndCount({
                where,
                order: { id: 'DESC' },
                skip: (page - 1) * size,
                take: size,
            });
            const userIds = rows.map((item) => item.userId);
            const userInfo = await this.userEntity.find({
                where: { id: (0, typeorm_2.In)(userIds) },
            });
            rows.forEach((item) => {
                const user = userInfo.find((user) => user.id === item.userId);
                item.username = user === null || user === void 0 ? void 0 : user.username;
                item.email = user === null || user === void 0 ? void 0 : user.email;
                item.phone = user === null || user === void 0 ? void 0 : user.phone;
                item.status = user === null || user === void 0 ? void 0 : user.status;
                item.avatar = user === null || user === void 0 ? void 0 : user.avatar;
            });
            if (role !== 'super') {
                rows.forEach((item) => {
                    item.email = item.email ? (0, utils_1.hideString)(item.email) : '';
                    item.phone = item.phone ? (0, utils_1.hideString)(item.phone) : '';
                });
            }
            return { rows, count };
        }
        catch (error) {
            console.log('error: ', error);
            throw new common_1.HttpException('查询用户账户失败！', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async queryUserBalanceByIds(ids) {
        return await this.userBalanceEntity.find({ where: { userId: (0, typeorm_2.In)(ids) } });
    }
    async refundMjBalance(userId, amount) {
        return await this.deductFromBalance(userId, 3, -amount, 0, 'midjourney');
    }
    async inheritVisitorData(req) {
        const { fingerprint } = req.headers;
        const { id: userId } = req.user;
        await this.chatLogEntity.update({ userId: Number(fingerprint) }, { userId });
        await this.chatGroupEntity.update({ userId: Number(fingerprint) }, { userId });
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
    async checkUserCertification(userId) {
        const userInfo = await this.userEntity.findOne({
            where: { id: userId },
        });
        const userBalance = await this.userBalanceEntity.findOne({
            where: { userId },
        });
        if (!userInfo || !userBalance) {
            return;
        }
        const { phoneValidationMessageCount, identityVerificationMessageCount, openIdentity, openPhoneValidation, } = await this.globalConfigService.getConfigs([
            'phoneValidationMessageCount',
            'identityVerificationMessageCount',
            'openIdentity',
            'openPhoneValidation',
        ]);
        const phoneValidationCount = Number(phoneValidationMessageCount);
        const identityValidationCount = Number(identityVerificationMessageCount);
        const model3Count = Number(userBalance.useModel3Count) || 0;
        const model4Count = Number(userBalance.useModel4Count) || 0;
        const totalTokens = model3Count + model4Count;
        if (openPhoneValidation === '1' &&
            totalTokens >= phoneValidationCount &&
            !userInfo.phone) {
            throw new common_1.HttpException('请完成手机号绑定', common_1.HttpStatus.BAD_REQUEST);
        }
        if (openIdentity === '1' &&
            totalTokens >= identityValidationCount &&
            (!userInfo.realName || !userInfo.idCard)) {
            throw new common_1.HttpException('请完成实名认证', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async validateUserPointForFunction(userId, functionId, amount = 1) {
        try {
            console.log(`[validateUserPointForFunction-开始] 用户ID: ${userId}, 功能: ${functionId}, 数量: ${amount}`);
            let userInfo = await this.userEntity.findOne({ where: { id: userId } });
            if (!userInfo) {
                console.error(`[validateUserPointForFunction-错误] 用户不存在, ID: ${userId}`);
                return {
                    success: false,
                    message: '用户不存在',
                    error: 'USER_NOT_FOUND'
                };
            }
            let userBalance = await this.userBalanceEntity.findOne({ where: { userId } });
            if (!userBalance) {
                console.log(`[validateUserPointForFunction-创建] 用户ID: ${userId} 无余额记录，创建基础记录`);
                userBalance = await this.createBaseUserBalance(userId);
            }
            const packageId = userBalance.packageId || 0;
            console.log(`[validateUserPointForFunction-套餐] 用户ID: ${userId}, 套餐ID: ${packageId}, 角色: ${userInfo.role}`);
            if (userInfo.role === 'visitor') {
                try {
                    const mockReq = { user: { id: userId, role: 'visitor' } };
                    const defaultType = 2;
                    const visitorResult = await this.validateVisitorBalance(mockReq, defaultType, amount);
                    return {
                        success: true,
                        isVisitor: true,
                        deductType: defaultType,
                        consumeValue: amount,
                        message: '游客积分验证通过'
                    };
                }
                catch (error) {
                    return {
                        success: false,
                        isVisitor: true,
                        message: error.message || '游客积分不足',
                        error: 'VISITOR_BALANCE_INSUFFICIENT'
                    };
                }
            }
            let consumptionRule = null;
            let actualDeductType = 2;
            let consumeValue = amount;
            try {
                const ruleQuery = this.dataSource
                    .createQueryBuilder(pointConsumptionRule_entity_1.PointConsumptionRuleEntity, 'rule')
                    .where('rule.packageId = :packageId', { packageId })
                    .andWhere('rule.functionId = :functionId', { functionId })
                    .andWhere('rule.status = 1')
                    .getOne();
                consumptionRule = await ruleQuery;
                if (!consumptionRule) {
                    console.log(`[validateUserPointForFunction-规则] 未找到功能${functionId}的特定规则，尝试查找默认规则`);
                    const defaultRuleQuery = this.dataSource
                        .createQueryBuilder(pointConsumptionRule_entity_1.PointConsumptionRuleEntity, 'rule')
                        .where('rule.packageId = :packageId', { packageId })
                        .andWhere('rule.functionId = :defaultFunctionId', { defaultFunctionId: 'default' })
                        .andWhere('rule.status = 1')
                        .getOne();
                    consumptionRule = await defaultRuleQuery;
                }
                if (consumptionRule) {
                    console.log(`[validateUserPointForFunction-规则] 找到匹配规则: ${JSON.stringify(consumptionRule)}`);
                    if (consumptionRule.model3Rate > 0) {
                        actualDeductType = 1;
                        consumeValue = consumptionRule.model3Rate * amount;
                        console.log(`[validateUserPointForFunction-消耗] 将使用普通积分(model3), 消耗率: ${consumptionRule.model3Rate}, 数量: ${amount}, 总消耗: ${consumeValue}`);
                    }
                    else if (consumptionRule.model4Rate > 0) {
                        actualDeductType = 2;
                        consumeValue = consumptionRule.model4Rate * amount;
                        console.log(`[validateUserPointForFunction-消耗] 将使用高级积分(model4), 消耗率: ${consumptionRule.model4Rate}, 数量: ${amount}, 总消耗: ${consumeValue}`);
                    }
                    else if (consumptionRule.drawMjRate > 0) {
                        actualDeductType = 3;
                        consumeValue = consumptionRule.drawMjRate * amount;
                        console.log(`[validateUserPointForFunction-消耗] 将使用绘画积分(drawMj), 消耗率: ${consumptionRule.drawMjRate}, 数量: ${amount}, 总消耗: ${consumeValue}`);
                    }
                    else {
                        console.log(`[validateUserPointForFunction-消耗] 规则中所有消耗率均为0，将使用默认值`);
                    }
                }
                else {
                    console.log(`[validateUserPointForFunction-规则] 未找到匹配规则，将使用默认值`);
                }
            }
            catch (error) {
                console.error(`[validateUserPointForFunction-错误] 获取积分规则失败: ${error.message}`);
            }
            const memberKey = actualDeductType === 1
                ? 'memberModel3Count'
                : actualDeductType === 2
                    ? 'memberModel4Count'
                    : actualDeductType === 3
                        ? 'memberDrawMjCount'
                        : null;
            const baseKey = actualDeductType === 1
                ? 'model3Count'
                : actualDeductType === 2
                    ? 'model4Count'
                    : actualDeductType === 3
                        ? 'drawMjCount'
                        : null;
            console.log(`[validateUserPointForFunction-Key] 会员扣费key: ${memberKey}, 非会员扣费key: ${baseKey}`);
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
                    maxConcurrentTasks: (consumptionRule === null || consumptionRule === void 0 ? void 0 : consumptionRule.maxConcurrentTasks) || 1,
                    message: '会员用户积分验证通过'
                };
            }
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
                    maxConcurrentTasks: (consumptionRule === null || consumptionRule === void 0 ? void 0 : consumptionRule.maxConcurrentTasks) || 1,
                    message: '普通用户积分验证通过'
                };
            }
        }
        catch (error) {
            console.error(`[validateUserPointForFunction-错误] 验证失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: error.message || '积分验证过程中出现错误',
                error: 'VALIDATION_ERROR'
            };
        }
    }
    async useFunction(userId, functionId, amount = 1) {
        try {
            console.log(`[useFunction-开始] 用户ID: ${userId}, 功能: ${functionId}, 数量: ${amount}`);
            const validationResult = await this.validateUserPointForFunction(userId, functionId, amount);
            if (!validationResult.success) {
                return validationResult;
            }
            try {
                const deductResult = await this.deductFromBalance(userId, validationResult.deductType, validationResult.consumeValue, 0, functionId);
                console.log(`[useFunction-完成] 用户ID: ${userId} 积分扣除成功`);
                return Object.assign(Object.assign({}, validationResult), { deducted: true, message: '功能使用成功，积分已扣除' });
            }
            catch (error) {
                console.error(`[useFunction-错误] 扣除积分失败: ${error.message}`);
                return Object.assign(Object.assign({}, validationResult), { success: false, deducted: false, message: error.message || '扣除积分失败', error: 'DEDUCTION_FAILED' });
            }
        }
        catch (error) {
            console.error(`[useFunction-错误] 验证或扣除积分失败: ${error.message}`, error.stack);
            return {
                success: false,
                deducted: false,
                message: error.message || '使用功能过程中出现错误',
                error: 'FUNCTION_USE_ERROR'
            };
        }
    }
    async refundFunctionPoints(userId, functionId, deductType, amount) {
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
            if (deductType === 1) {
                userBalance.model3Count += amount;
            }
            else if (deductType === 2) {
                userBalance.useModel3Count += amount;
            }
            else {
                return {
                    success: false,
                    refunded: false,
                    message: `不支持的扣除类型: ${deductType}`
                };
            }
            await this.userBalanceEntity.save(userBalance);
            const uid = Math.random().toString(36).substring(2, 15);
            await this.accountLogEntity.save({
                userId,
                action: `退还${deductType === 1 ? '积分' : '使用次数'}`,
                detail: `功能[${functionId}]退款`,
                changeAmount: amount,
                changeType: deductType,
                balance: deductType === 1 ? userBalance.model3Count : userBalance.useModel3Count,
                remark: `因功能使用失败退还`,
                rechargeType: balance_constant_1.RechargeType.DRAW_FAIL_REFUND,
                model3Count: deductType === 1 ? amount : 0,
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
        }
        catch (error) {
            console.error(`退款过程中出错: ${error.message}`, error.stack);
            return {
                success: false,
                refunded: false,
                message: `退款失败: ${error.message}`
            };
        }
    }
};
UserBalanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(balance_entity_1.BalanceEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(userBalance_entity_1.UserBalanceEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(accountLog_entity_1.AccountLogEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(cramiPackage_entity_1.CramiPackageEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(config_entity_1.ConfigEntity)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(6, (0, typeorm_1.InjectRepository)(fingerprint_entity_1.FingerprintLogEntity)),
    __param(7, (0, typeorm_1.InjectRepository)(chatGroup_entity_1.ChatGroupEntity)),
    __param(8, (0, typeorm_1.InjectRepository)(chatLog_entity_1.ChatLogEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        globalConfig_service_1.GlobalConfigService,
        typeorm_3.DataSource])
], UserBalanceService);
exports.UserBalanceService = UserBalanceService;
