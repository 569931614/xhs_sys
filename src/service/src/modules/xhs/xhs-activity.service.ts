import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XhsActivity } from './xhs-activity.entity';
import { CreateXhsActivityDto, QueryXhsActivityDto, UpdateXhsActivityDto, XhsActivityStatsDto } from './dto/xhs-activity.dto';
import { XhsActivityPost } from './xhs-activity-post.entity';
import { XhsPost } from './xhs.entity';

@Injectable()
export class XhsActivityService {
  constructor(
    @InjectRepository(XhsActivity)
    private readonly activityRepository: Repository<XhsActivity>,
    @InjectRepository(XhsActivityPost)
    private readonly activityPostRepository: Repository<XhsActivityPost>,
    @InjectRepository(XhsPost)
    private readonly postRepository: Repository<XhsPost>,
  ) {}

  // 生成随机ID
  private generateRandomId(prefix: string = 'a'): string {
    const timestamp = Date.now().toString().slice(-6);
    const randomStr = Math.random().toString(36).substring(2, 7);
    return `${prefix}_${timestamp}${randomStr}`;
  }

  // 创建活动
  async create(createDto: CreateXhsActivityDto, userId: number): Promise<XhsActivity> {
    // 如果没有提供ID，则生成一个
    if (!createDto.id) {
      createDto.id = this.generateRandomId();
    }

    // 创建活动实体
    const activity = this.activityRepository.create({
      ...createDto,
      userId,
    });

    // 如果是默认活动，需要将其他活动设为非默认
    if (activity.isDefault) {
      await this.activityRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    return this.activityRepository.save(activity);
  }

  // 确保用户有默认活动
  async ensureDefaultActivity(userId: number): Promise<XhsActivity> {
    // 查找用户的默认活动
    const defaultActivity = await this.activityRepository.findOne({
      where: { userId, isDefault: true },
    });

    // 如果已有默认活动，直接返回
    if (defaultActivity) {
      return defaultActivity;
    }

    // 创建默认活动
    const activity = this.activityRepository.create({
      id: this.generateRandomId('d'),
      name: '日常使用',
      type: 'normal',
      status: 'active',
      isDefault: true,
      userId,
    });

    return this.activityRepository.save(activity);
  }

  // 查询活动列表
  async findAll(queryDto: QueryXhsActivityDto): Promise<XhsActivity[]> {
    const { name, type, status, isDefault, userId } = queryDto;
    const queryBuilder = this.activityRepository.createQueryBuilder('activity');

    if (userId !== undefined) {
      queryBuilder.andWhere('activity.userId = :userId', { userId });
    }

    if (name) {
      queryBuilder.andWhere('activity.name LIKE :name', { name: `%${name}%` });
    }

    if (type) {
      queryBuilder.andWhere('activity.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('activity.status = :status', { status });
    }

    if (isDefault !== undefined) {
      queryBuilder.andWhere('activity.isDefault = :isDefault', { isDefault });
    }

    queryBuilder.orderBy('activity.isDefault', 'DESC');
    queryBuilder.addOrderBy('activity.createTime', 'DESC');

    return queryBuilder.getMany();
  }

  // 查询活动详情
  async findOne(id: string): Promise<XhsActivity> {
    const activity = await this.activityRepository.findOne({
      where: { id },
    });

    if (!activity) {
      throw new NotFoundException(`活动ID ${id} 不存在`);
    }

    return activity;
  }

  // 更新活动
  async update(id: string, updateDto: UpdateXhsActivityDto): Promise<XhsActivity> {
    const activity = await this.findOne(id);
    
    // 检查是否设置为默认
    if (updateDto.status && activity.isDefault) {
      // 默认活动不能暂停或完成
      if (updateDto.status !== 'active') {
        throw new Error('默认活动只能设置为活跃状态');
      }
    }

    // 如果设置为默认，将其他活动设为非默认
    if (updateDto.isDefault) {
      await this.activityRepository.update(
        { userId: activity.userId, isDefault: true },
        { isDefault: false },
      );
    }

    await this.activityRepository.update(id, updateDto);
    return this.findOne(id);
  }

  // 删除活动
  async remove(id: string): Promise<void> {
    const activity = await this.findOne(id);
    
    // 不能删除默认活动
    if (activity.isDefault) {
      throw new Error('不能删除默认活动');
    }
    
    await this.activityRepository.remove(activity);
  }

  // 将笔记添加到活动
  async addPostToActivity(activityId: string, postId: string): Promise<XhsPost> {
    // 检查活动是否存在
    await this.findOne(activityId);

    // 检查笔记是否存在
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`笔记ID ${postId} 不存在`);
    }

    // 直接更新笔记的identifier为活动ID
    post.identifier = activityId;
    
    // 保存更新后的笔记
    return this.postRepository.save(post);
  }

  // 从活动中移除笔记
  async removePostFromActivity(activityId: string, postId: string): Promise<void> {
    // 检查笔记是否存在
    const post = await this.postRepository.findOne({
      where: { id: postId, identifier: activityId },
    });

    if (!post) {
      throw new NotFoundException(`活动 ${activityId} 中不存在笔记 ${postId}`);
    }

    // 清除笔记的identifier
    post.identifier = null;
    await this.postRepository.save(post);
  }

  // 获取活动的所有笔记
  async getActivityPosts(activityId: string): Promise<XhsPost[]> {
    // 检查活动是否存在
    await this.findOne(activityId);

    // 直接查询xhs_posts表，使用identifier匹配活动ID
    const queryBuilder = this.postRepository.createQueryBuilder('post');
    queryBuilder.where('post.identifier = :activityId', { activityId });

    return queryBuilder.getMany();
  }

  // 获取活动统计信息
  async getActivityStats(userId: number): Promise<XhsActivityStatsDto[]> {
    // 确保有默认活动
    await this.ensureDefaultActivity(userId);

    // 获取用户的所有活动
    const activities = await this.activityRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createTime: 'DESC' },
    });

    // 收集结果
    const result: XhsActivityStatsDto[] = [];

    // 为每个活动计算统计信息
    for (const activity of activities) {
      // 获取活动的所有笔记 - 使用identifier匹配
      const activityPosts = await this.getActivityPosts(activity.id);
      
      // 如果是默认活动且没有关联笔记，则获取所有未设置identifier的笔记
      let posts = activityPosts;
      
      if (activity.isDefault && posts.length === 0) {
        // 获取所有未设置identifier的笔记或identifier为null的笔记
        posts = await this.postRepository.createQueryBuilder('post')
          .where('post.userId = :userId', { userId })
          .andWhere('(post.identifier IS NULL OR post.identifier = \'\')')
          .getMany();
      }

      // 计算统计信息
      const totalNotes = posts.length;
      const availableNotes = posts.filter(post => !post.isUsed).length;
      const publishedNotes = posts.filter(post => post.isUsed).length;

      // 添加到结果中
      result.push({
        id: activity.id,
        name: activity.name,
        type: activity.type,
        status: activity.status,
        isDefault: activity.isDefault,
        totalNotes,
        availableNotes,
        publishedNotes,
      });
    }

    return result;
  }
} 