import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { FontEntity } from './entities/font.entity';
import { CreateFontDto } from './dto/create-font.dto';
import { UpdateFontDto } from './dto/update-font.dto';
import { QueryFontDto } from './dto/query-font.dto';
import axios from 'axios';

@Injectable()
export class FontService {
  constructor(
    @InjectRepository(FontEntity)
    private fontRepository: Repository<FontEntity>,
  ) {}

  /**
   * 创建字体
   */
  async create(createFontDto: CreateFontDto): Promise<FontEntity> {
    // 检查字体代码是否已存在
    const existFont = await this.fontRepository.findOne({
      where: { code: createFontDto.code },
    });

    if (existFont) {
      throw new HttpException('字体代码已存在', HttpStatus.BAD_REQUEST);
    }

    const font = this.fontRepository.create(createFontDto);
    return this.fontRepository.save(font);
  }

  /**
   * 查询字体列表
   */
  async findAll(query: QueryFontDto) {
    const { page = 1, pageSize = 10, name, code, type, status, source, orderBy = 'createTime', orderDirection = 'DESC' } = query;
    
    const queryBuilder = this.fontRepository.createQueryBuilder('font');
    
    // 构建查询条件
    if (name) {
      queryBuilder.andWhere('font.name LIKE :name', { name: `%${name}%` });
    }
    
    if (code) {
      queryBuilder.andWhere('font.code LIKE :code', { code: `%${code}%` });
    }
    
    if (type) {
      queryBuilder.andWhere('font.type = :type', { type });
    }
    
    if (status !== undefined) {
      queryBuilder.andWhere('font.status = :status', { status });
    }
    
    if (source) {
      queryBuilder.andWhere('font.source = :source', { source });
    }
    
    // 计算总数
    const total = await queryBuilder.getCount();
    
    // 添加排序和分页
    queryBuilder
      .orderBy(`font.${orderBy}`, orderDirection)
      .skip((page - 1) * pageSize)
      .take(pageSize);
    
    // 获取结果
    const items = await queryBuilder.getMany();
    
    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 查询单个字体
   */
  async findOne(id: number): Promise<FontEntity> {
    const font = await this.fontRepository.findOne({ where: { id } });
    if (!font) {
      throw new HttpException('字体不存在', HttpStatus.NOT_FOUND);
    }
    return font;
  }

  /**
   * 更新字体
   */
  async update(id: number, updateFontDto: UpdateFontDto): Promise<FontEntity> {
    const font = await this.fontRepository.findOne({ where: { id } });
    if (!font) {
      throw new HttpException('字体不存在', HttpStatus.NOT_FOUND);
    }
    
    // 如果更新code，需要检查是否与其他字体重复
    if (updateFontDto.code && updateFontDto.code !== font.code) {
      const existFont = await this.fontRepository.findOne({
        where: { code: updateFontDto.code },
      });
      
      if (existFont && existFont.id !== id) {
        throw new HttpException('字体代码已存在', HttpStatus.BAD_REQUEST);
      }
    }
    
    // 更新字体
    Object.assign(font, updateFontDto);
    return this.fontRepository.save(font);
  }

  /**
   * 删除字体
   */
  async remove(id: number): Promise<void> {
    const font = await this.fontRepository.findOne({ where: { id } });
    if (!font) {
      throw new HttpException('字体不存在', HttpStatus.NOT_FOUND);
    }
    
    await this.fontRepository.remove(font);
  }

  /**
   * 批量删除字体
   */
  async batchRemove(ids: number[]): Promise<void> {
    await this.fontRepository.delete(ids);
  }

  /**
   * 切换字体状态
   */
  async toggleStatus(id: number): Promise<FontEntity> {
    const font = await this.fontRepository.findOne({ where: { id } });
    if (!font) {
      throw new HttpException('字体不存在', HttpStatus.NOT_FOUND);
    }
    
    font.status = !font.status;
    return this.fontRepository.save(font);
  }

  /**
   * 从API获取字体数据并保存
   */
  async fetchFontsFromApi(): Promise<{ success: boolean; message: string; total: number }> {
    try {
      // 从API获取字体数据
      const response = await axios.get('https://poster.mofabiji.com/api/font');
      
      if (response.data.code !== 0 || !response.data.success) {
        throw new HttpException('获取字体数据失败: ' + response.data.message, HttpStatus.BAD_REQUEST);
      }
      
      const fontsData = response.data.data;
      let savedCount = 0;
      
      // 保存字体数据
      for (const key in fontsData) {
        const fontData = fontsData[key];
        
        // 检查字体是否已存在
        const existFont = await this.fontRepository.findOne({
          where: { code: fontData.code },
        });
        
        if (!existFont) {
          // 提取字体类型
          const urlParts = fontData.url.split('.');
          const fontType = urlParts.length > 1 ? urlParts[urlParts.length - 1] : 'ttf';
          
          // 创建新字体
          const newFont = this.fontRepository.create({
            name: fontData.name,
            code: fontData.code,
            preview: fontData.preview,
            url: fontData.url,
            type: fontType,
            status: true,
            sort: 0,
            source: 'api',
            remark: '从API自动获取',
          });
          
          await this.fontRepository.save(newFont);
          savedCount++;
        }
      }
      
      return {
        success: true,
        message: `成功从API获取并保存了${savedCount}个字体`,
        total: savedCount,
      };
    } catch (error) {
      throw new HttpException(
        `获取字体数据失败: ${error.message || '未知错误'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * 获取所有可用字体
   */
  async getAllAvailableFonts() {
    return this.fontRepository.find({
      where: { status: true },
      order: { sort: 'ASC', createTime: 'DESC' },
    });
  }
} 