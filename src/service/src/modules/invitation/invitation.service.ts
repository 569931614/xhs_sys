import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import { InvitationEntity } from './invitation.entity';
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { GlobalConfigService } from '../globalConfig/globalConfig.service';
import { ChannelLevelService } from './channel-level.service';
import { ChannelLevelEntity } from '../channelLevel/channelLevel.entity';
import { ChannelCommissionEntity } from '../channelCommission/channelCommission.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { MoreThan } from 'typeorm';

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    @InjectRepository(InvitationEntity)
    private readonly invitationRepository: Repository<InvitationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly userService: UserService,
    private readonly globalConfigService: GlobalConfigService,
    private readonly channelLevelService: ChannelLevelService,
    @InjectRepository(ChannelLevelEntity)
    private readonly channelLevelRepository: Repository<ChannelLevelEntity>,
    @InjectRepository(ChannelCommissionEntity)
    private readonly channelCommissionRepository: Repository<ChannelCommissionEntity>,
  ) {}

  /**
   * 创建邀请链接
   */
  async createInviteLink(userId: number): Promise<string> {
    // 查找用户
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    try {
      // 生成唯一邀请码
      const inviteCode = nanoid(10);
      
      // 更新用户的邀请码
      await this.userRepository.update(userId, { inviteCode });

      // 构建邀请链接 - 使用固定格式
      const inviteLink = `/chat/#/chat?invite=${inviteCode}`;
      this.logger.log(`用户ID ${userId} 创建了新的邀请链接: ${inviteLink}`);

      return inviteLink;
    } catch (error) {
      this.logger.error(`创建邀请链接失败: ${error.message}`, error.stack);
      throw new HttpException('创建邀请链接失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 获取用户的邀请链接
   */
  async getInviteLink(userId: number): Promise<string> {
    // 查找用户
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    // 如果用户已有邀请码，则使用现有的
    if (user.inviteCode) {
      // 构建固定格式的邀请链接
      return `/chat/#/chat?invite=${user.inviteCode}`;
    }

    // 否则创建新的邀请链接
    return this.createInviteLink(userId);
  }

  /**
   * 获取用户的邀请列表
   */
  async getInviteList(userId: number): Promise<any[]> {
    try {
      this.logger.log(`正在获取用户ID ${userId} 的邀请列表`);
      
      // 查询邀请记录并加载关联的被邀请用户
      const invitations = await this.invitationRepository.find({
        where: { inviterId: userId },
        relations: ['invitee'],
        order: { createdAt: 'DESC' },
      });
      
      this.logger.log(`找到 ${invitations.length} 条邀请记录`);
      
      // 处理数据，提供更有用的信息
      const result = invitations.map(invitation => {
        // 使用类型断言确保TypeScript不会报错
        const invitee = invitation.invitee as any || {};
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
    } catch (error) {
      this.logger.error(`获取邀请列表错误: ${error.message}`, error.stack);
      return []; // 发生错误时返回空数组
    }
  }

  /**
   * 获取系统邀请统计数据
   */
  async getInviteStats(userId: number): Promise<any> {
    try {
      // 查询用户的邀请记录
      const invitations = await this.invitationRepository.find({
        where: { inviterId: userId }
      });
      
      // 计算邀请总数
      const inviteCount = invitations.length;
      
      // 计算充值总金额
      const totalRechargeAmount = invitations.reduce((sum, inv) => sum + Number(inv.rechargeAmount || 0), 0);
      
      // 计算返佣总金额
      const totalCommissionAmount = invitations.reduce((sum, inv) => sum + Number(inv.commissionAmount || 0), 0);

      // 获取用户信息
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
    } catch (error) {
      this.logger.error(`获取邀请统计数据失败: ${error.message}`, error.stack);
      throw new HttpException('获取邀请统计数据失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 处理接受邀请
   */
  async acceptInvitation(inviteCode: string, newUserId: number): Promise<boolean> {
    // 查找拥有此邀请码的用户（邀请人）
    const inviter = await this.userRepository.findOne({
      where: { inviteCode },
    });

    if (!inviter) {
      throw new HttpException('无效的邀请码', HttpStatus.BAD_REQUEST);
    }

    // 检查用户是否已经接受过邀请
    const existingInvitation = await this.invitationRepository.findOne({
      where: { inviteeId: newUserId }
    });

    if (existingInvitation) {
      throw new HttpException('该用户已经接受过邀请', HttpStatus.BAD_REQUEST);
    }

    // 创建邀请记录
    const invitation = new InvitationEntity();
    invitation.inviterId = inviter.id;
    invitation.inviteeId = newUserId;
    invitation.rechargeAmount = 0;
    invitation.commissionAmount = 0;

    await this.invitationRepository.save(invitation);

    // 更新新用户的invitedBy字段
    await this.userRepository.update(newUserId, { invitedBy: inviteCode });

    // 更新邀请者的邀请计数
    await this.userRepository.update(inviter.id, { 
      inviteLinkCount: inviter.inviteLinkCount + 1 
    });

    this.logger.log(`用户ID ${newUserId} 接受了来自用户ID ${inviter.id} 的邀请`);

    return true;
  }
  
  /**
   * 处理用户充值，增加邀请记录中的充值金额并计算返佣
   */
  async processRecharge(userId: number, amount: number): Promise<void> {
    try {
      // 查找用户信息
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });
      
      if (!user || !user.invitedBy) {
        this.logger.log(`用户ID ${userId} 没有邀请人，无需处理返佣`);
        return;
      }
      
      // 查找邀请人
      const inviter = await this.userRepository.findOne({
        where: { inviteCode: user.invitedBy }
      });
      
      if (!inviter) {
        this.logger.log(`找不到邀请码为 ${user.invitedBy} 的邀请人`);
        return;
      }
      
      // 查找邀请记录
      const invitation = await this.invitationRepository.findOne({
        where: { inviterId: inviter.id, inviteeId: userId }
      });
      
      if (!invitation) {
        this.logger.log(`找不到邀请记录：邀请人ID ${inviter.id}，被邀请人ID ${userId}`);
        return;
      }
      
      // 获取邀请人的返佣比例
      const commissionRate = await this.channelLevelService.getCommissionRate(inviter.channelLevelId);
      
      // 计算返佣金额
      const commissionAmount = (amount * commissionRate) / 100;
      
      // 更新邀请记录
      invitation.rechargeAmount = Number(invitation.rechargeAmount || 0) + amount;
      invitation.commissionAmount = Number(invitation.commissionAmount || 0) + commissionAmount;
      await this.invitationRepository.save(invitation);
      
      // TODO: 处理实际的返佣到账逻辑
      // 这里需要根据实际业务需求添加返佣到账的实现
      // 例如：添加余额、积分或者其他形式的奖励
      
      this.logger.log(
        `用户ID ${userId} 充值 ${amount}，邀请人ID ${inviter.id} 获得返佣 ${commissionAmount}，` +
        `返佣比例 ${commissionRate}%`
      );
    } catch (error) {
      this.logger.error(`处理充值返佣失败: ${error.message}`, error.stack);
      // 不抛出异常，避免影响正常的充值流程
    }
  }

  // 创建邀请关系
  async createInvitation(inviterId: number, inviteeId: number, level: number = 1): Promise<InvitationEntity> {
    const invitation = this.invitationRepository.create({
      inviterId,
      inviteeId,
      level,
      totalAmount: 0,
      orderCount: 0,
    });
    return this.invitationRepository.save(invitation);
  }

  // 获取用户的邀请记录
  async getUserInvitations(userId: number, paginationDto: PaginationDto) {
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

  // 获取用户邀请的总人数
  async getUserInvitationCount(userId: number): Promise<number> {
    return this.invitationRepository.count({
      where: { inviterId: userId },
    });
  }

  /**
   * 获取直接邀请的用户列表
   * @param userId 用户ID
   * @returns 直接邀请的用户列表
   */
  async getDirectInvitees(userId: number): Promise<any[]> {
    try {
      // 查询所有直接邀请的记录
      const invitations = await this.invitationRepository.find({
        where: { inviterId: userId, level: 1 },
        relations: ['invitee'],
        order: { createdAt: 'DESC' },
      });
      
      // 处理返回数据格式
      return invitations.map(invitation => {
        const invitee = invitation.invitee as any || {};
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
    } catch (error) {
      this.logger.error(`获取直接邀请用户列表失败: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * 获取用户的邀请人信息
   * @param userId 用户ID
   * @returns 邀请人信息
   */
  async getInviter(userId: number): Promise<any> {
    try {
      // 获取用户信息
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });
      
      if (!user || !user.invitedBy) {
        return null; // 用户没有邀请人
      }
      
      // 查询邀请人
      const inviter = await this.userRepository.findOne({
        where: { inviteCode: user.invitedBy }
      });
      
      if (!inviter) {
        return null; // 找不到邀请人
      }
      
      // 返回邀请人基本信息
      return {
        id: inviter.id,
        username: inviter.username || '未知用户',
        email: inviter.email || '',
        avatar: inviter.avatar || '',
      };
    } catch (error) {
      this.logger.error(`获取邀请人信息失败: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 计算用户邀请的总人数
   * @param userId 用户ID
   * @returns 邀请总人数
   */
  async countTotalInvitees(userId: number): Promise<number> {
    // 由于只有一级关系，总人数就是直接邀请的人数
    return this.getUserInvitationCount(userId);
  }

  // 更新邀请产生的订单和销售额
  async updateInvitationOrderStats(inviteeId: number, orderAmount: number): Promise<void> {
    // 查找该用户的所有上级邀请关系
    const invitations = await this.invitationRepository.find({
      where: { inviteeId },
    });

    // 更新每个邀请关系的订单统计
    for (const invitation of invitations) {
      invitation.totalAmount = Number(invitation.totalAmount) + Number(orderAmount);
      invitation.orderCount++;
      await this.invitationRepository.save(invitation);
    }
  }

  // 获取某个用户的邀请人
  async getUserInviter(userId: number): Promise<InvitationEntity> {
    return this.invitationRepository.findOne({
      where: { inviteeId: userId, level: 1 },
      relations: ['inviter'],
    });
  }

  // 获取某个用户的上级链
  async getUserInviterChain(userId: number): Promise<InvitationEntity[]> {
    return this.invitationRepository.find({
      where: { inviteeId: userId },
      relations: ['inviter'],
      order: { level: 'ASC' },
    });
  }

  /**
   * 获取用户的返佣记录列表
   * @param userId 用户ID
   * @param paginationDto 分页参数
   * @returns 返佣记录和分页信息
   */
  async getCommissionRecords(userId: number, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [records, total] = await this.invitationRepository.findAndCount({
      where: { 
        inviterId: userId,
        commissionAmount: MoreThan(0)
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

    // 获取返佣总金额
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
        totalCommissionAmount: totalCommission?.totalCommission || 0
      }
    };
  }
} 