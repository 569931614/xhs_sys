import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomPage } from './customPage.entity';
import { CreateCustomPageDto, UpdateCustomPageDto, CustomPageListDto } from './dto/customPage.dto';
import { RedisCacheService } from '@/modules/redisCache/redisCache.service';

@Injectable()
export class CustomPageService {
  private readonly CACHE_KEY_ENABLED_PAGES = 'custom_page:enabled_pages';
  private readonly CACHE_EXPIRE_TIME = 60 * 60; // 1小时

  constructor(
    @InjectRepository(CustomPage)
    private customPageRepository: Repository<CustomPage>,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  // 创建自定义页面
  async create(createCustomPageDto: CreateCustomPageDto): Promise<CustomPage> {
    const customPage = this.customPageRepository.create(createCustomPageDto);
    const result = await this.customPageRepository.save(customPage);
    // 更新缓存
    await this.invalidateCache();
    return result;
  }

  // 更新自定义页面
  async update(id: number, updateCustomPageDto: UpdateCustomPageDto): Promise<CustomPage> {
    await this.customPageRepository.update(id, updateCustomPageDto);
    // 更新缓存
    await this.invalidateCache();
    return this.findById(id);
  }

  // 删除自定义页面
  async remove(id: number): Promise<void> {
    await this.customPageRepository.delete(id);
    // 更新缓存
    await this.invalidateCache();
  }

  // 获取自定义页面列表
  async findAll(query: CustomPageListDto): Promise<{ list: CustomPage[]; total: number }> {
    const page = query.page || 1;
    const size = query.size || 10;
    const skip = (page - 1) * size;

    const queryBuilder = this.customPageRepository.createQueryBuilder('customPage');
    
    // 添加标题搜索条件
    if (query.title) {
      queryBuilder.where('customPage.title LIKE :title', { title: `%${query.title}%` });
    }
    
    queryBuilder.skip(skip).take(size)
      .orderBy('customPage.order', 'ASC')
      .addOrderBy('customPage.createTime', 'DESC');
    
    const [list, total] = await queryBuilder.getManyAndCount();

    return { list, total };
  }

  // 获取自定义页面详情
  async findById(id: number): Promise<CustomPage> {
    return this.customPageRepository.findOne({ where: { id } });
  }

  // 通过路径查找自定义页面
  async findByPath(path: string): Promise<CustomPage> {
    return this.customPageRepository.findOne({ where: { path } });
  }

  // 获取所有启用的自定义页面（前台展示）
  async getEnabledPages(): Promise<CustomPage[]> {
    // 尝试从缓存获取
    try {
      const cachedData = await this.redisCacheService.get({ key: this.CACHE_KEY_ENABLED_PAGES });
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (error) {
      console.error('Redis缓存获取失败', error);
      // 缓存出错不影响正常业务，继续从数据库获取
    }

    // 缓存不存在或获取出错，从数据库获取
    const pages = await this.customPageRepository.find({
      where: { status: 1 },
      order: { order: 'ASC', createTime: 'DESC' },
    });

    // 设置缓存
    try {
      await this.redisCacheService.set(
        { key: this.CACHE_KEY_ENABLED_PAGES, val: JSON.stringify(pages) },
        this.CACHE_EXPIRE_TIME
      );
    } catch (error) {
      console.error('Redis缓存设置失败', error);
    }

    return pages;
  }

  // 清除缓存
  private async invalidateCache(): Promise<void> {
    try {
      await this.redisCacheService.del({ key: this.CACHE_KEY_ENABLED_PAGES });
    } catch (error) {
      console.error('Redis缓存清除失败', error);
    }
  }
} 