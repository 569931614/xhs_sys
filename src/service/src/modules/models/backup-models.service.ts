import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository, Not } from 'typeorm';
import { BackupModelsEntity } from './backup-models.entity';
import { CreateBackupModelDto, DeleteBackupModelDto, UpdateBackupModelDto, UpdateBackupModelStatusDto } from './dto/backup-models.dto';
import { RedisCacheService } from '../redisCache/redisCache.service';

@Injectable()
export class BackupModelsService {
  private readonly logger = new Logger(BackupModelsService.name);
  private readonly CACHE_KEY_PREFIX = 'backup_models:';
  
  constructor(
    @InjectRepository(BackupModelsEntity)
    private readonly backupModelsRepository: Repository<BackupModelsEntity>,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  // 获取备用模型列表
  async findAll(page = 1, pageSize = 10) {
    const [items, total] = await this.backupModelsRepository.findAndCount({
      order: { createdAt: 'DESC' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    return {
      items,
      total,
    };
  }

  // 获取单个备用模型
  async findOne(id: number) {
    const model = await this.backupModelsRepository.findOne({
      where: { id },
    });

    if (!model) {
      throw new HttpException('备用模型不存在', HttpStatus.BAD_REQUEST);
    }

    return model;
  }

  // 创建备用模型
  async create(createDto: CreateBackupModelDto) {
    // 检查是否有相同名称的模型
    const existModel = await this.backupModelsRepository.findOne({
      where: { name: createDto.name },
    });

    if (existModel) {
      throw new HttpException('该模型名称已存在', HttpStatus.BAD_REQUEST);
    }

    const newModel = this.backupModelsRepository.create(createDto);
    const result = await this.backupModelsRepository.save(newModel);
    
    // 清除缓存
    await this.clearModelTypeCache(createDto.modelType);
    this.logger.log(`创建备用模型成功，已清除类型 ${createDto.modelType} 的缓存`);
    
    return result;
  }

  // 更新备用模型
  async update(updateDto: UpdateBackupModelDto) {
    const { id } = updateDto;
    const existModel = await this.backupModelsRepository.findOne({
      where: { id },
    });

    if (!existModel) {
      throw new HttpException('备用模型不存在', HttpStatus.BAD_REQUEST);
    }

    // 检查名称是否重复（排除自己）
    const nameExists = await this.backupModelsRepository.findOne({
      where: { 
        name: updateDto.name,
        id: Not(id)
      },
    });

    if (nameExists) {
      throw new HttpException('该模型名称已存在', HttpStatus.BAD_REQUEST);
    }

    // 更新前记录原始类型
    const originalType = existModel.modelType;

    // 更新模型
    Object.assign(existModel, updateDto);
    const result = await this.backupModelsRepository.save(existModel);
    
    // 清除原类型和新类型的缓存（如果不同）
    await this.clearModelTypeCache(originalType);
    if (updateDto.modelType && originalType !== updateDto.modelType) {
      await this.clearModelTypeCache(updateDto.modelType);
      this.logger.log(`更新备用模型时类型发生变化，清除原类型 ${originalType} 和新类型 ${updateDto.modelType} 的缓存`);
    } else {
      this.logger.log(`更新备用模型成功，清除类型 ${originalType} 的缓存`);
    }
    
    return result;
  }

  // 更新模型状态
  async updateStatus(updateStatusDto: UpdateBackupModelStatusDto) {
    const { id, status } = updateStatusDto;
    const model = await this.backupModelsRepository.findOne({
      where: { id },
    });

    if (!model) {
      throw new HttpException('备用模型不存在', HttpStatus.BAD_REQUEST);
    }

    model.status = status;
    const result = await this.backupModelsRepository.save(model);
    
    // 清除该类型的缓存
    await this.clearModelTypeCache(model.modelType);
    this.logger.log(`更新备用模型状态成功，清除类型 ${model.modelType} 的缓存`);
    
    return result;
  }

  // 删除备用模型
  async delete(deleteDto: DeleteBackupModelDto) {
    const { id } = deleteDto;
    const model = await this.backupModelsRepository.findOne({
      where: { id },
    });

    if (!model) {
      throw new HttpException('备用模型不存在', HttpStatus.BAD_REQUEST);
    }

    // 记录模型类型，用于后续清除缓存
    const modelType = model.modelType;
    
    const result = await this.backupModelsRepository.remove(model);
    
    // 清除该类型的缓存
    await this.clearModelTypeCache(modelType);
    this.logger.log(`删除备用模型成功，清除类型 ${modelType} 的缓存`);
    
    return result;
  }

  // 根据模型类型获取备用模型
  async findByType(modelType: string) {
    // 尝试从缓存获取
    const cacheKey = `${this.CACHE_KEY_PREFIX}type:${modelType}`;
    try {
      const cachedModels = await this.redisCacheService.get({ key: cacheKey });
      if (cachedModels) {
        this.logger.log(`从缓存获取到类型 ${modelType} 的备用模型`);
        return JSON.parse(cachedModels);
      }
    } catch (error) {
      this.logger.warn(`获取缓存失败: ${error.message}`);
    }
    
    // 缓存中没有，从数据库获取
    const models = await this.backupModelsRepository.find({
      where: { modelType, status: 1 },
      order: { priority: 'ASC', createdAt: 'DESC' },
    });
    
    // 将结果存入缓存
    if (models && models.length > 0) {
      try {
        await this.redisCacheService.set(
          { key: cacheKey, val: JSON.stringify(models) },
          3600 // 缓存1小时
        );
        this.logger.log(`类型 ${modelType} 的备用模型已缓存，有效期1小时`);
      } catch (error) {
        this.logger.warn(`缓存备用模型失败: ${error.message}`);
      }
    }
    
    return models;
  }

  // 根据模型类型获取备用模型，不使用priority排序字段
  async findByTypeWithoutPriority(modelType: string) {
    // 尝试从缓存获取
    const cacheKey = `${this.CACHE_KEY_PREFIX}type:${modelType}:no_priority`;
    try {
      const cachedModels = await this.redisCacheService.get({ key: cacheKey });
      if (cachedModels) {
        this.logger.log(`从缓存获取到类型 ${modelType} 的备用模型（不使用priority排序）`);
        return JSON.parse(cachedModels);
      }
    } catch (error) {
      this.logger.warn(`获取缓存失败: ${error.message}`);
    }
    
    // 缓存中没有，从数据库获取
    const models = await this.backupModelsRepository.find({
      where: { modelType, status: 1 },
      order: { createdAt: 'DESC' }, // 只按创建时间排序
    });
    
    // 将结果存入缓存
    if (models && models.length > 0) {
      try {
        await this.redisCacheService.set(
          { key: cacheKey, val: JSON.stringify(models) },
          3600 // 缓存1小时
        );
        this.logger.log(`类型 ${modelType} 的备用模型已缓存（不使用priority排序），有效期1小时`);
      } catch (error) {
        this.logger.warn(`缓存备用模型失败: ${error.message}`);
      }
    }
    
    return models;
  }

  // 搜索备用模型
  async search(keyword: string, page = 1, pageSize = 10) {
    const [items, total] = await this.backupModelsRepository.findAndCount({
      where: [
        { name: Like(`%${keyword}%`) },
        { baseUrl: Like(`%${keyword}%`) },
      ],
      order: { createdAt: 'DESC' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    return {
      items,
      total,
    };
  }
  
  // 清除指定类型的备用模型缓存
  private async clearModelTypeCache(modelType: string): Promise<void> {
    if (!modelType) return;
    
    const cacheKey = `${this.CACHE_KEY_PREFIX}type:${modelType}`;
    try {
      await this.redisCacheService.del({ key: cacheKey });
      this.logger.log(`已清除类型 ${modelType} 的备用模型缓存`);
    } catch (error) {
      this.logger.error(`清除缓存失败: ${error.message}`);
    }
  }
} 