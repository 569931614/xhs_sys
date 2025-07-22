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
exports.ChannelCommissionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const channelCommission_entity_1 = require("./channelCommission.entity");
const invitation_service_1 = require("../invitation/invitation.service");
const user_service_1 = require("../user/user.service");
let ChannelCommissionService = class ChannelCommissionService {
    constructor(channelCommissionRepository, invitationService, userService) {
        this.channelCommissionRepository = channelCommissionRepository;
        this.invitationService = invitationService;
        this.userService = userService;
    }
    async createCommission(userId, inviteeId, orderId, orderAmount, level, commissionRate) {
        const amount = orderAmount * commissionRate;
        const commission = this.channelCommissionRepository.create({
            userId,
            inviteeId,
            orderId,
            orderAmount,
            amount,
            commissionRate,
            level,
            status: 0,
        });
        return this.channelCommissionRepository.save(commission);
    }
    async processOrderCommission(orderId, userId, orderAmount) {
        const inviterChain = await this.invitationService.getUserInviterChain(userId);
        if (!inviterChain || inviterChain.length === 0) {
            return;
        }
        for (const invitation of inviterChain) {
            const inviterId = invitation.inviterId;
            const level = invitation.level;
            const inviter = await this.userService.findById(inviterId);
            if (!inviter) {
                continue;
            }
            const commissionRate = 0.05;
            if (commissionRate > 0) {
                await this.createCommission(inviterId, userId, orderId, orderAmount, level, commissionRate);
            }
        }
        await this.invitationService.updateInvitationOrderStats(userId, orderAmount);
    }
    async getUserCommissions(userId, paginationDto) {
        const { page = 1, limit = 10 } = paginationDto;
        const skip = (page - 1) * limit;
        const [records, total] = await this.channelCommissionRepository.findAndCount({
            where: { userId },
            relations: ['invitee', 'order'],
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });
        return {
            records,
            pagination: {
                total,
                page,
                limit,
            },
        };
    }
    async getUserCommissionSummary(userId) {
        const totalResult = await this.channelCommissionRepository
            .createQueryBuilder('commission')
            .select('SUM(commission.amount)', 'total')
            .where('commission.userId = :userId', { userId })
            .getRawOne();
        const settledResult = await this.channelCommissionRepository
            .createQueryBuilder('commission')
            .select('SUM(commission.amount)', 'total')
            .where('commission.userId = :userId', { userId })
            .andWhere('commission.status = 1')
            .getRawOne();
        const pendingResult = await this.channelCommissionRepository
            .createQueryBuilder('commission')
            .select('SUM(commission.amount)', 'total')
            .where('commission.userId = :userId', { userId })
            .andWhere('commission.status = 0')
            .getRawOne();
        return {
            totalCommission: Number(totalResult.total || 0),
            settledCommission: Number(settledResult.total || 0),
            pendingCommission: Number(pendingResult.total || 0),
        };
    }
    async settleCommission(id) {
        const commission = await this.channelCommissionRepository.findOne({ where: { id } });
        if (!commission) {
            throw new Error('佣金记录不存在');
        }
        if (commission.status !== 0) {
            throw new Error('该佣金记录已处理');
        }
        commission.status = 1;
        commission.settledAt = new Date();
        return this.channelCommissionRepository.save(commission);
    }
    async cancelCommission(id) {
        const commission = await this.channelCommissionRepository.findOne({ where: { id } });
        if (!commission) {
            throw new Error('佣金记录不存在');
        }
        if (commission.status !== 0) {
            throw new Error('该佣金记录已处理');
        }
        commission.status = -1;
        return this.channelCommissionRepository.save(commission);
    }
};
ChannelCommissionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(channelCommission_entity_1.ChannelCommissionEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        invitation_service_1.InvitationService,
        user_service_1.UserService])
], ChannelCommissionService);
exports.ChannelCommissionService = ChannelCommissionService;
