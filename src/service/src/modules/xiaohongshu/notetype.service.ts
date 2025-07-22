import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { NoteType } from './notetype.entity';
import { CreateNoteTypeDto, UpdateNoteTypeDto, NoteTypeQueryDto } from './dto/notetype.dto';

@Injectable()
export class NoteTypeService {
  constructor(
    @InjectRepository(NoteType)
    private noteTypeRepository: Repository<NoteType>,
  ) {}

  async create(createNoteTypeDto: CreateNoteTypeDto): Promise<NoteType> {
    const noteType = this.noteTypeRepository.create(createNoteTypeDto);
    return this.noteTypeRepository.save(noteType);
  }

  async findAll(query: NoteTypeQueryDto) {
    const { page = 1, pageSize = 10, name, status } = query;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.noteTypeRepository.createQueryBuilder('noteType');

    if (name) {
      queryBuilder.andWhere('noteType.name LIKE :name', { name: `%${name}%` });
    }

    if (status !== undefined) {
      queryBuilder.andWhere('noteType.status = :status', { status });
    }

    const [items, total] = await queryBuilder
      .orderBy('noteType.sort', 'ASC')
      .addOrderBy('noteType.createTime', 'DESC')
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

  async findOne(id: number): Promise<NoteType> {
    const noteType = await this.noteTypeRepository.findOne({ where: { id } });
    if (!noteType) {
      throw new HttpException('笔记类型不存在', HttpStatus.NOT_FOUND);
    }
    return noteType;
  }

  async update(id: number, updateNoteTypeDto: UpdateNoteTypeDto): Promise<NoteType> {
    const noteType = await this.findOne(id);
    const updatedNoteType = Object.assign(noteType, updateNoteTypeDto);
    return this.noteTypeRepository.save(updatedNoteType);
  }

  async remove(id: number): Promise<void> {
    const result = await this.noteTypeRepository.delete(id);
    if (result.affected === 0) {
      throw new HttpException('笔记类型不存在', HttpStatus.NOT_FOUND);
    }
  }
} 