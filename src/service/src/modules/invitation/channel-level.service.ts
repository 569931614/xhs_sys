import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { ChannelLevel } from './channel-level.entity';
import { CreateChannelLevelDto, UpdateChannelLevelDto, ChannelLevelQueryDto } from './dto/channel-level.dto';

@Injectable()
export class ChannelLevelService {
  private readonly logger = new Logger(ChannelLevelService.name);

  constructor(
    @InjectRepository(ChannelLevel)
    private readonly channelLevelRepository: Repository<ChannelLevel>,
  ) {
    // 初始化默认渠道等级
    this.initDefaultChannelLevel();
  }

  private async initDefaultChannelLevel() {
    try {
      const count = await this.channelLevelRepository.count();
      if (count === 0) {
        // 如果没有渠道等级，则创建默认等级
        const defaultLevel = new ChannelLevel();
        defaultLevel.name = '普通代理';
        defaultLevel.commissionRate = 10;
        defaultLevel.order = 1;
        defaultLevel.remark = '默认渠道等级';
        defaultLevel.isActive = true;
        await this.channelLevelRepository.save(defaultLevel);
        this.logger.log('已创建默认渠道等级');
      }
    } catch (error) {
      this.logger.error(`初始化默认渠道等级失败: ${error.message}`, error.stack);
    }
  }

  async create(createDto: CreateChannelLevelDto): Promise<ChannelLevel> {
    try {
      // 检查名称是否已存在
      const existing = await this.channelLevelRepository.findOne({ where: { name: createDto.name } });
      if (existing) {
        throw new HttpException('渠道等级名称已存在', HttpStatus.BAD_REQUEST);
      }

      const level = new ChannelLevel();
      level.name = createDto.name;
      level.commissionRate = createDto.commissionRate;
      level.order = createDto.order || 0;
      level.remark = createDto.remark;
      level.isActive = true;

      return this.channelLevelRepository.save(level);
    } catch (error) {
      this.logger.error(`创建渠道等级失败: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('创建渠道等级失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: number, updateDto: UpdateChannelLevelDto): Promise<ChannelLevel> {
    try {
      const level = await this.channelLevelRepository.findOne({ where: { id } });
      if (!level) {
        throw new HttpException('渠道等级不存在', HttpStatus.NOT_FOUND);
      }

      // 检查名称是否已被其他记录使用
      if (updateDto.name && updateDto.name !== level.name) {
        const existing = await this.channelLevelRepository.findOne({ where: { name: updateDto.name } });
        if (existing && existing.id !== id) {
          throw new HttpException('渠道等级名称已存在', HttpStatus.BAD_REQUEST);
        }
      }

      Object.assign(level, updateDto);
      return this.channelLevelRepository.save(level);
    } catch (error) {
      this.logger.error(`更新渠道等级失败: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('更新渠道等级失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(query: ChannelLevelQueryDto) {
    try {
      const { page = 1, size = 10, name, isActive } = query;
      const skip = (page - 1) * size;

      const where: any = {};
      if (name) {
        where.name = Like(`%${name}%`);
      }
      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      const [rows, count] = await this.channelLevelRepository.findAndCount({
        where,
        skip,
        take: size,
        order: { order: 'ASC' },
      });

      return { rows, count };
    } catch (error) {
      this.logger.error(`查询渠道等级失败: ${error.message}`, error.stack);
      throw new HttpException('查询渠道等级失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: number): Promise<ChannelLevel> {
    try {
      const level = await this.channelLevelRepository.findOne({ where: { id } });
      if (!level) {
        throw new HttpException('渠道等级不存在', HttpStatus.NOT_FOUND);
      }
      return level;
    } catch (error) {
      this.logger.error(`查询渠道等级失败: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('查询渠道等级失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const level = await this.channelLevelRepository.findOne({ where: { id } });
      if (!level) {
        throw new HttpException('渠道等级不存在', HttpStatus.NOT_FOUND);
      }

      // 直接删除
      await this.channelLevelRepository.remove(level);
    } catch (error) {
      this.logger.error(`删除渠道等级失败: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('删除渠道等级失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAllActive(): Promise<ChannelLevel[]> {
    try {
      return this.channelLevelRepository.find({
        where: { isActive: true },
        order: { order: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`查询活跃渠道等级失败: ${error.message}`, error.stack);
      throw new HttpException('查询活跃渠道等级失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 获取用户的返佣比例
  async getCommissionRate(channelLevelId: number): Promise<number> {
    try {
      if (!channelLevelId) {
        // 如果用户没有渠道等级，则使用默认比例10%
        return 10;
      }

      const level = await this.channelLevelRepository.findOne({ where: { id: channelLevelId } });
      if (!level || !level.isActive) {
        return 10; // 默认返佣比例
      }

      return level.commissionRate;
    } catch (error) {
      this.logger.error(`获取返佣比例失败: ${error.message}`, error.stack);
      return 10; // 出错时返回默认比例
    }
  }
} 