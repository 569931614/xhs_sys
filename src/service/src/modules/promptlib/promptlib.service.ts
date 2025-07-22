import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromptTemplateEntity } from './promptlib.entity';
import { CreatePromptTemplateDto, UpdatePromptTemplateDto, QueryPromptTemplateDto, DeletePromptTemplateDto } from './dto/promptlib.dto';

@Injectable()
export class PromptLibService {
  constructor(
    @InjectRepository(PromptTemplateEntity)
    private promptTemplateRepository: Repository<PromptTemplateEntity>,
  ) {}

  // 创建提示词模板
  async createPromptTemplate(dto: CreatePromptTemplateDto) {
    // 检查是否已存在相同标识的模板
    const existTemplate = await this.promptTemplateRepository.findOne({
      where: { identifier: dto.identifier },
    });

    if (existTemplate) {
      throw new HttpException('提示词标识已存在', HttpStatus.BAD_REQUEST);
    }

    const template = this.promptTemplateRepository.create({
      ...dto,
      status: dto.status || 1,
    });

    await this.promptTemplateRepository.save(template);
    return template;
  }

  // 更新提示词模板
  async updatePromptTemplate(dto: UpdatePromptTemplateDto) {
    const template = await this.promptTemplateRepository.findOne({
      where: { id: dto.id },
    });

    if (!template) {
      throw new HttpException('提示词模板不存在', HttpStatus.BAD_REQUEST);
    }

    // 如果修改了标识，需要检查新标识是否已存在
    if (dto.identifier && dto.identifier !== template.identifier) {
      const existTemplate = await this.promptTemplateRepository.findOne({
        where: { identifier: dto.identifier },
      });

      if (existTemplate && existTemplate.id !== dto.id) {
        throw new HttpException('提示词标识已存在', HttpStatus.BAD_REQUEST);
      }
    }

    await this.promptTemplateRepository.update(dto.id, {
      ...dto,
    });

    return await this.promptTemplateRepository.findOne({
      where: { id: dto.id },
    });
  }

  // 查询提示词模板列表
  async queryPromptTemplates(query: QueryPromptTemplateDto) {
    const { page = 1, pageSize = 10, identifier, modelName, status } = query;
    
    const queryBuilder = this.promptTemplateRepository.createQueryBuilder('template');
    
    if (identifier) {
      queryBuilder.andWhere('template.identifier LIKE :identifier', { identifier: `%${identifier}%` });
    }
    
    if (modelName) {
      queryBuilder.andWhere('template.modelName LIKE :modelName', { modelName: `%${modelName}%` });
    }
    
    if (status !== undefined) {
      queryBuilder.andWhere('template.status = :status', { status });
    }
    
    const [items, total] = await queryBuilder
      .orderBy('template.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
      
    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  // 获取单个提示词模板
  async getPromptTemplate(id: number) {
    const template = await this.promptTemplateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new HttpException('提示词模板不存在', HttpStatus.BAD_REQUEST);
    }

    return template;
  }

  // 删除提示词模板
  async deletePromptTemplate(dto: DeletePromptTemplateDto) {
    const template = await this.promptTemplateRepository.findOne({
      where: { id: dto.id },
    });

    if (!template) {
      throw new HttpException('提示词模板不存在', HttpStatus.BAD_REQUEST);
    }

    await this.promptTemplateRepository.remove(template);
    return { success: true };
  }
} 