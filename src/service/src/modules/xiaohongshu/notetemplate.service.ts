import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { NoteTemplate } from './notetemplate.entity';
import { CreateNoteTemplateDto, UpdateNoteTemplateDto, NoteTemplateQueryDto } from './dto/notetemplate.dto';

@Injectable()
export class NoteTemplateService {
  constructor(
    @InjectRepository(NoteTemplate)
    private noteTemplateRepository: Repository<NoteTemplate>,
  ) {}

  async create(createNoteTemplateDto: CreateNoteTemplateDto): Promise<NoteTemplate> {
    const noteTemplate = this.noteTemplateRepository.create(createNoteTemplateDto);
    return this.noteTemplateRepository.save(noteTemplate);
  }

  async findAll(query: NoteTemplateQueryDto) {
    const { page = 1, pageSize = 10, name, status } = query;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.noteTemplateRepository.createQueryBuilder('noteTemplate');

    if (name) {
      queryBuilder.andWhere('noteTemplate.name LIKE :name', { name: `%${name}%` });
    }

    if (status !== undefined) {
      queryBuilder.andWhere('noteTemplate.status = :status', { status });
    }

    const [items, total] = await queryBuilder
      .orderBy('noteTemplate.sort', 'ASC')
      .addOrderBy('noteTemplate.createTime', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number): Promise<NoteTemplate> {
    const noteTemplate = await this.noteTemplateRepository.findOne({ where: { id } });
    if (!noteTemplate) {
      throw new HttpException('笔记页面模板不存在', HttpStatus.NOT_FOUND);
    }
    return noteTemplate;
  }

  async update(id: number, updateNoteTemplateDto: UpdateNoteTemplateDto): Promise<NoteTemplate> {
    const noteTemplate = await this.findOne(id);
    const updatedNoteTemplate = Object.assign(noteTemplate, updateNoteTemplateDto);
    return this.noteTemplateRepository.save(updatedNoteTemplate);
  }

  async remove(id: number): Promise<void> {
    const result = await this.noteTemplateRepository.delete(id);
    if (result.affected === 0) {
      throw new HttpException('笔记页面模板不存在', HttpStatus.NOT_FOUND);
    }
  }
} 