import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelLevelEntity } from './channelLevel.entity';

@Injectable()
export class ChannelLevelService {
  constructor(
    @InjectRepository(ChannelLevelEntity)
    private readonly channelLevelRepository: Repository<ChannelLevelEntity>,
  ) {}

  // 获取所有渠道等级
  async getAllLevels(): Promise<ChannelLevelEntity[]> {
    return this.channelLevelRepository.find({
      where: { status: 1 },
      order: { level: 'ASC' },
    });
  }

  // 获取指定等级信息
  async getLevelById(id: number): Promise<ChannelLevelEntity> {
    return this.channelLevelRepository.findOne({
      where: { id, status: 1 },
    });
  }

  // 根据等级获取配置
  async getLevelByLevel(level: number): Promise<ChannelLevelEntity> {
    return this.channelLevelRepository.findOne({
      where: { level, status: 1 },
    });
  }

  // 计算用户可以获得的佣金比例
  async calculateCommissionRatio(userLevel: number, commissionLevel: number): Promise<number> {
    const levelConfig = await this.getLevelByLevel(userLevel);
    if (!levelConfig) {
      return 0;
    }

    // 根据佣金等级返回对应比例
    switch (commissionLevel) {
      case 1:
        return levelConfig.levelOneRatio;
      case 2:
        return levelConfig.levelTwoRatio;
      case 3:
        return levelConfig.levelThreeRatio;
      default:
        return 0;
    }
  }
} 