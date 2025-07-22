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
var InvitationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const nanoid_1 = require("nanoid");
const invitation_entity_1 = require("./invitation.entity");
const user_entity_1 = require("../user/user.entity");
const user_service_1 = require("../user/user.service");
const globalConfig_service_1 = require("../globalConfig/globalConfig.service");
const channel_level_service_1 = require("./channel-level.service");
const channelLevel_entity_1 = require("../channelLevel/channelLevel.entity");
const channelCommission_entity_1 = require("../channelCommission/channelCommission.entity");
const typeorm_3 = require("typeorm");
let InvitationService = InvitationService_1 = class InvitationService {
    constructor(invitationRepository, userRepository, userService, globalConfigService, channelLevelService, channelLevelRepository, channelCommissionRepository) {
        this.invitationRepository = invitationRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.globalConfigService = globalConfigService;
        this.channelLevelService = channelLevelService;
        this.channelLevelRepository = channelLevelRepository;
        this.channelCommissionRepository = channelCommissionRepository;
        this.logger = new common_1.Logger(InvitationService_1.name);
    }
    async createInviteLink(userId) {
        const user = await this.userService.getUserById(userId);
        if (!user) {
            throw new common_1.HttpException('用户不存在', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const inviteCode = (0, nanoid_1.nanoid)(10);
            await this.userRepository.update(userId, { inviteCode });
            const inviteLink = `/chat/#/chat?invite=${inviteCode}`;
            this.logger.log(`用户ID ${userId} 创建了新的邀请链接: ${inviteLink}`);
            return inviteLink;
        }
        catch (error) {
            this.logger.error(`创建邀请链接失败: ${error.message}`, error.stack);
            throw new common_1.HttpException('创建邀请链接失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getInviteLink(userId) {
        const user = await this.userService.getUserById(userId);
        if (!user) {
            throw new common_1.HttpException('用户不存在', common_1.HttpStatus.BAD_REQUEST);
        }
        if (user.inviteCode) {
            return `/chat/#/chat?invite=${user.inviteCode}`;
        }
        return this.createInviteLink(userId);
    }
    async getInviteList(userId) {
        try {
            this.logger.log(`正在获取用户ID ${userId} 的邀请列表`);
            const invitations = await this.invitationRepository.find({
                where: { inviterId: userId },
                relations: ['invitee'],
                order: { createdAt: 'DESC' },
            });
            this.logger.log(`找到 ${invitations.length} 条邀请记录`);
            const result = invitations.map(invitation => {
                const invitee = invitation.invitee || {};
                return {
                    id: invitation.id,
                    inviteeId: invitation.inviteeId,
                    inviteeName: invitee.username || '未知用户',
                    inviteeAvatar: invitee.avatar || '',
                    inviteeEmail: invitee.email || '',
                    createdAt: invitation.createdAt,
                    rechargeAmount: invitation.rechargeAmount || 0,
                    commissionAmount: invitation.commissionAmount || 0,
                };
            });
            this.logger.log(`处理后的邀请列表: ${JSON.stringify(result)}`);
            return result;
        }
        catch (error) {
            this.logger.error(`获取邀请列表错误: ${error.message}`, error.stack);
            return [];
        }
    }
    async getInviteStats(userId) {
        try {
            const invitations = await this.invitationRepository.find({
                where: { inviterId: userId }
            });
            const inviteCount = invitations.length;
            const totalRechargeAmount = invitations.reduce((sum, inv) => sum + Number(inv.rechargeAmount || 0), 0);
            const totalCommissionAmount = invitations.reduce((sum, inv) => sum + Number(inv.commissionAmount || 0), 0);
            const user = await this.userService.getUserById(userId);
            return {
                totalInvites: inviteCount,
                inviteLinkClicks: user ? user.inviteLinkCount : 0,
                conversionRate: user && user.inviteLinkCount > 0
                    ? (inviteCount / user.inviteLinkCount * 100).toFixed(2) + '%'
                    : '0%',
                totalRechargeAmount: totalRechargeAmount.toFixed(2),
                totalCommissionAmount: totalCommissionAmount.toFixed(2),
            };
        }
        catch (error) {
            this.logger.error(`获取邀请统计数据失败: ${error.message}`, error.stack);
            throw new common_1.HttpException('获取邀请统计数据失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async acceptInvitation(inviteCode, newUserId) {
        const inviter = await this.userRepository.findOne({
            where: { inviteCode },
        });
        if (!inviter) {
            throw new common_1.HttpException('无效的邀请码', common_1.HttpStatus.BAD_REQUEST);
        }
        const existingInvitation = await this.invitationRepository.findOne({
            where: { inviteeId: newUserId }
        });
        if (existingInvitation) {
            throw new common_1.HttpException('该用户已经接受过邀请', common_1.HttpStatus.BAD_REQUEST);
        }
        const invitation = new invitation_entity_1.InvitationEntity();
        invitation.inviterId = inviter.id;
        invitation.inviteeId = newUserId;
        invitation.rechargeAmount = 0;
        invitation.commissionAmount = 0;
        await this.invitationRepository.save(invitation);
        await this.userRepository.update(newUserId, { invitedBy: inviteCode });
        await this.userRepository.update(inviter.id, {
            inviteLinkCount: inviter.inviteLinkCount + 1
        });
        this.logger.log(`用户ID ${newUserId} 接受了来自用户ID ${inviter.id} 的邀请`);
        return true;
    }
    async processRecharge(userId, amount) {
        try {
            const user = await this.userRepository.findOne({
                where: { id: userId }
            });
            if (!user || !user.invitedBy) {
                this.logger.log(`用户ID ${userId} 没有邀请人，无需处理返佣`);
                return;
            }
            const inviter = await this.userRepository.findOne({
                where: { inviteCode: user.invitedBy }
            });
            if (!inviter) {
                this.logger.log(`找不到邀请码为 ${user.invitedBy} 的邀请人`);
                return;
            }
            const invitation = await this.invitationRepository.findOne({
                where: { inviterId: inviter.id, inviteeId: userId }
            });
            if (!invitation) {
                this.logger.log(`找不到邀请记录：邀请人ID ${inviter.id}，被邀请人ID ${userId}`);
                return;
            }
            const commissionRate = await this.channelLevelService.getCommissionRate(inviter.channelLevelId);
            const commissionAmount = (amount * commissionRate) / 100;
            invitation.rechargeAmount = Number(invitation.rechargeAmount || 0) + amount;
            invitation.commissionAmount = Number(invitation.commissionAmount || 0) + commissionAmount;
            await this.invitationRepository.save(invitation);
            this.logger.log(`用户ID ${userId} 充值 ${amount}，邀请人ID ${inviter.id} 获得返佣 ${commissionAmount}，` +
                `返佣比例 ${commissionRate}%`);
        }
        catch (error) {
            this.logger.error(`处理充值返佣失败: ${error.message}`, error.stack);
        }
    }
    async createInvitation(inviterId, inviteeId, level = 1) {
        const invitation = this.invitationRepository.create({
            inviterId,
            inviteeId,
            level,
            totalAmount: 0,
            orderCount: 0,
        });
        return this.invitationRepository.save(invitation);
    }
    async getUserInvitations(userId, paginationDto) {
        const { page = 1, limit = 10 } = paginationDto;
        const skip = (page - 1) * limit;
        const [records, total] = await this.invitationRepository.findAndCount({
            where: { inviterId: userId },
            relations: ['invitee'],
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
    async getUserInvitationCount(userId) {
        return this.invitationRepository.count({
            where: { inviterId: userId },
        });
    }
    async getDirectInvitees(userId) {
        try {
            const invitations = await this.invitationRepository.find({
                where: { inviterId: userId, level: 1 },
                relations: ['invitee'],
                order: { createdAt: 'DESC' },
            });
            return invitations.map(invitation => {
                const invitee = invitation.invitee || {};
                return {
                    id: invitation.id,
                    inviteeId: invitation.inviteeId,
                    username: invitee.username || '未知用户',
                    email: invitee.email || '',
                    avatar: invitee.avatar || '',
                    createdAt: invitation.createdAt,
                    rechargeAmount: invitation.rechargeAmount || 0,
                    commissionAmount: invitation.commissionAmount || 0,
                };
            });
        }
        catch (error) {
            this.logger.error(`获取直接邀请用户列表失败: ${error.message}`, error.stack);
            return [];
        }
    }
    async getInviter(userId) {
        try {
            const user = await this.userRepository.findOne({
                where: { id: userId }
            });
            if (!user || !user.invitedBy) {
                return null;
            }
            const inviter = await this.userRepository.findOne({
                where: { inviteCode: user.invitedBy }
            });
            if (!inviter) {
                return null;
            }
            return {
                id: inviter.id,
                username: inviter.username || '未知用户',
                email: inviter.email || '',
                avatar: inviter.avatar || '',
            };
        }
        catch (error) {
            this.logger.error(`获取邀请人信息失败: ${error.message}`, error.stack);
            return null;
        }
    }
    async countTotalInvitees(userId) {
        return this.getUserInvitationCount(userId);
    }
    async updateInvitationOrderStats(inviteeId, orderAmount) {
        const invitations = await this.invitationRepository.find({
            where: { inviteeId },
        });
        for (const invitation of invitations) {
            invitation.totalAmount = Number(invitation.totalAmount) + Number(orderAmount);
            invitation.orderCount++;
            await this.invitationRepository.save(invitation);
        }
    }
    async getUserInviter(userId) {
        return this.invitationRepository.findOne({
            where: { inviteeId: userId, level: 1 },
            relations: ['inviter'],
        });
    }
    async getUserInviterChain(userId) {
        return this.invitationRepository.find({
            where: { inviteeId: userId },
            relations: ['inviter'],
            order: { level: 'ASC' },
        });
    }
    async getCommissionRecords(userId, paginationDto) {
        const { page = 1, limit = 10 } = paginationDto;
        const skip = (page - 1) * limit;
        const [records, total] = await this.invitationRepository.findAndCount({
            where: {
                inviterId: userId,
                commissionAmount: (0, typeorm_3.MoreThan)(0)
            },
            relations: ['invitee'],
            order: { updatedAt: 'DESC' },
            skip,
            take: limit,
            select: [
                'id',
                'inviteeId',
                'rechargeAmount',
                'commissionAmount',
                'level',
                'createdAt',
                'updatedAt'
            ]
        });
        const totalCommission = await this.invitationRepository
            .createQueryBuilder('invitation')
            .select('SUM(invitation.commissionAmount)', 'totalCommission')
            .where('invitation.inviterId = :userId', { userId })
            .getRawOne();
        return {
            records,
            pagination: {
                total,
                page,
                limit,
            },
            summary: {
                totalCommissionAmount: (totalCommission === null || totalCommission === void 0 ? void 0 : totalCommission.totalCommission) || 0
            }
        };
    }
};
InvitationService = InvitationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(invitation_entity_1.InvitationEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(5, (0, typeorm_1.InjectRepository)(channelLevel_entity_1.ChannelLevelEntity)),
    __param(6, (0, typeorm_1.InjectRepository)(channelCommission_entity_1.ChannelCommissionEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        user_service_1.UserService,
        globalConfig_service_1.GlobalConfigService,
        channel_level_service_1.ChannelLevelService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], InvitationService);
exports.InvitationService = InvitationService;
