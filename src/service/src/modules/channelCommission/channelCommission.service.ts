import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelCommissionEntity } from './channelCommission.entity';
import { InvitationService } from '../invitation/invitation.service';
import { UserService } from '../user/user.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ChannelCommissionService {
  constructor(
    @InjectRepository(ChannelCommissionEntity)
    private readonly channelCommissionRepository: Repository<ChannelCommissionEntity>,
    private readonly invitationService: InvitationService,
    private readonly userService: UserService,
  ) {}

  // 创建佣金记录
  async createCommission(
    userId: number,
    inviteeId: number,
    orderId: number,
    orderAmount: number,
    level: number,
    commissionRate: number,
  ): Promise<ChannelCommissionEntity> {
    const amount = orderAmount * commissionRate;
    const commission = this.channelCommissionRepository.create({
      userId,
      inviteeId,
      orderId,
      orderAmount,
      amount,
      commissionRate,
      level,
      status: 0, // 未结算
    });
    return this.channelCommissionRepository.save(commission);
  }

  // 处理订单佣金分配
  async processOrderCommission(orderId: number, userId: number, orderAmount: number): Promise<void> {
    // 获取用户的邀请链
    const inviterChain = await this.invitationService.getUserInviterChain(userId);
    if (!inviterChain || inviterChain.length === 0) {
      return;
    }

    // 遍历邀请人链，为每个层级创建佣金记录
    for (const invitation of inviterChain) {
      const inviterId = invitation.inviterId;
      const level = invitation.level;

      // 获取邀请人的用户信息和等级
      const inviter = await this.userService.findById(inviterId);
      if (!inviter) {
        continue;
      }

      // 计算佣金比例 - 暂时使用固定比例代替
      const commissionRate = 0.05; // 默认5%的佣金比例

      if (commissionRate > 0) {
        // 创建佣金记录
        await this.createCommission(
          inviterId,
          userId,
          orderId,
          orderAmount,
          level,
          commissionRate,
        );
      }
    }

    // 更新邀请关系的销售统计
    await this.invitationService.updateInvitationOrderStats(userId, orderAmount);
  }

  // 获取用户佣金记录
  async getUserCommissions(userId: number, paginationDto: PaginationDto) {
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

  // 获取用户佣金统计
  async getUserCommissionSummary(userId: number) {
    // 总佣金
    const totalResult = await this.channelCommissionRepository
      .createQueryBuilder('commission')
      .select('SUM(commission.amount)', 'total')
      .where('commission.userId = :userId', { userId })
      .getRawOne();

    // 已结算佣金
    const settledResult = await this.channelCommissionRepository
      .createQueryBuilder('commission')
      .select('SUM(commission.amount)', 'total')
      .where('commission.userId = :userId', { userId })
      .andWhere('commission.status = 1')
      .getRawOne();

    // 未结算佣金
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

  // 结算佣金
  async settleCommission(id: number): Promise<ChannelCommissionEntity> {
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

  // 取消佣金
  async cancelCommission(id: number): Promise<ChannelCommissionEntity> {
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
} 