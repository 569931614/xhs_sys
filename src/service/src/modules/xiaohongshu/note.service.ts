import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Note } from './note.entity';
import { NoteType } from './notetype.entity';
import { NoteTemplate } from './notetemplate.entity';
import { NoteTemplateRelation } from './note-template-relation.entity';
import { CreateNoteDto, UpdateNoteDto, NoteQueryDto } from './dto/note.dto';
import { XhsService } from '../xhs/xhs.service';
import { HtmlTemplateEntity } from '../htmllib/htmllib.entity';

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
    @InjectRepository(NoteType)
    private noteTypeRepository: Repository<NoteType>,
    @InjectRepository(NoteTemplate)
    private noteTemplateRepository: Repository<NoteTemplate>,
    @InjectRepository(NoteTemplateRelation)
    private noteTemplateRelationRepository: Repository<NoteTemplateRelation>,
    @InjectRepository(HtmlTemplateEntity)
    private htmlTemplateRepository: Repository<HtmlTemplateEntity>,
    private xhsService: XhsService,
  ) {}

  async create(createNoteDto: CreateNoteDto): Promise<Note> {
    // 验证类型是否存在
    const noteType = await this.noteTypeRepository.findOne({ where: { id: createNoteDto.typeId } });
    if (!noteType) {
      throw new HttpException('笔记类型不存在', HttpStatus.BAD_REQUEST);
    }

    // 如果有noteId但没有标题、内容或封面图，从xhs_posts表获取数据
    if (createNoteDto.noteId && 
        (!createNoteDto.title || !createNoteDto.content || !createNoteDto.coverImage)) {
      try {
        // 从xhs_posts表获取数据
        const xhsPost = await this.xhsService.findOne(createNoteDto.noteId);
        if (xhsPost) {
          // 填充缺失的字段
          if (!createNoteDto.title) {
            createNoteDto.title = xhsPost.title;
          }
          if (!createNoteDto.content) {
            createNoteDto.content = xhsPost.content;
          }
          if (!createNoteDto.coverImage && xhsPost.images && xhsPost.images.length > 0) {
            // 使用第一张图片作为封面
            createNoteDto.coverImage = xhsPost.images[0];
          }
        }
      } catch (error) {
        console.error('从xhs_posts获取数据失败:', error);
        // 不抛出异常，继续使用原始数据
      }
    }

    // 创建笔记对象
    const note = this.noteRepository.create({
      ...createNoteDto,
      // 确保botId和paramsType字段能被正确保存
      botId: createNoteDto.botId || null,
      paramsType: createNoteDto.paramsType || null
    });
    
    console.log('创建笔记数据:', JSON.stringify(note));
    const savedNote = await this.noteRepository.save(note);
    
    // 添加模板关联
    if (createNoteDto.htmlTemplates && createNoteDto.htmlTemplates.length > 0) {
      console.log(`为新创建的笔记(ID=${savedNote.id})添加HTML模板关联`);
      console.log('HTML模板数据:', JSON.stringify(createNoteDto.htmlTemplates));
      
      try {
        await this.saveNoteHtmlTemplateRelations(savedNote.id, createNoteDto.htmlTemplates);
      } catch (error) {
        console.error(`为新笔记添加HTML模板关联失败:`, error);
        // 不抛出异常，允许笔记基本信息创建成功
      }
    }
    
    return savedNote;
  }

  async findAll(query: NoteQueryDto) {
    try {
      const { 
        page = 1, 
        pageSize = 10, 
        title,
        typeId,
        status,
        botId,
        orderBy = 'createTime',
        orderDirection = 'DESC'
      } = query;
      
      // 构建查询条件
      const where: any = {};
      
      if (title) {
        where.title = Like(`%${title}%`);
      }
      
      if (typeId !== undefined && typeId !== null) {
        where.typeId = typeId;
      }
      
      if (status !== undefined) {
        where.status = status;
      }
      
      if (botId !== undefined && botId !== null && botId !== '') {
        where.botId = botId;
      }
      
      // 统计总数
      const total = await this.noteRepository.count({ where });
      
      // 查询数据
      const items = await this.noteRepository.find({
        where,
        relations: ['type'],
        skip: (page - 1) * pageSize,
        take: pageSize,
        order: { [orderBy]: orderDirection }
      });
      
      // 处理type关系，生成typeName字段
      const processedItems = items.map(item => {
        const { type, ...rest } = item;
        return {
          ...rest,
          type,
          typeName: type ? type.name : null
        } as any; // 使用any类型避免TypeScript错误
      });
      
      // 为每个笔记获取关联的HTML模板
      for (const item of processedItems) {
        try {
          // 获取HTML模板关联信息
          const htmlTemplates = await this.getNoteHtmlTemplates(item.id);
          
          // 只返回必要的模板信息
          if (htmlTemplates && htmlTemplates.length > 0) {
            item.htmlTemplates = htmlTemplates.map(template => ({
              id: template.id,
              name: template.name,
              isRepeatable: template.isRepeatable || false,
              thumbnailPath: template.thumbnailPath || '',
            }));
          } else {
            item.htmlTemplates = [];
          }
        } catch (error) {
          console.error(`获取笔记ID=${item.id}的HTML模板失败:`, error);
          item.htmlTemplates = [];
        }
      }
      
    return {
      items: processedItems,
      total,
      page,
      pageSize,
    };
    } catch (error) {
      console.error('查询笔记列表失败:', error);
      throw new Error(`查询笔记列表失败: ${error.message}`);
    }
  }

  async findOne(id: number): Promise<any> {
    const note = await this.noteRepository.findOne({ 
      where: { id },
      relations: ['type']
    });
    
    if (!note) {
      throw new HttpException('笔记不存在', HttpStatus.NOT_FOUND);
    }
    
    // 添加typeName字段
    const result: any = {
      ...note,
      typeName: note.type ? note.type.name : null
    };
    
    try {
      // 获取关联的HTML模板
      const htmlTemplates = await this.getNoteHtmlTemplates(id);
      
      if (htmlTemplates && htmlTemplates.length > 0) {
        result.htmlTemplates = htmlTemplates.map(template => ({
          id: template.id,
          name: template.name,
          isRepeatable: template.isRepeatable || false,
          thumbnailPath: template.thumbnailPath || '',
        }));
      } else {
        result.htmlTemplates = [];
      }
    } catch (error) {
      console.error(`获取笔记ID=${id}的HTML模板失败:`, error);
      result.htmlTemplates = [];
    }
    
    return result;
  }

  async update(id: number, updateNoteDto: UpdateNoteDto): Promise<Note> {
    const note = await this.findOne(id);
    
    // 验证类型是否存在
    if (updateNoteDto.typeId) {
      const noteType = await this.noteTypeRepository.findOne({ where: { id: updateNoteDto.typeId } });
      if (!noteType) {
        throw new HttpException('笔记类型不存在', HttpStatus.BAD_REQUEST);
      }
    }
    
    // 如果有noteId但没有标题、内容或封面图，从xhs_posts表获取数据
    if (updateNoteDto.noteId && 
        (!updateNoteDto.title || !updateNoteDto.content || !updateNoteDto.coverImage)) {
      try {
        // 从xhs_posts表获取数据
        const xhsPost = await this.xhsService.findOne(updateNoteDto.noteId);
        if (xhsPost) {
          // 填充缺失的字段
          if (!updateNoteDto.title) {
            updateNoteDto.title = xhsPost.title;
          }
          if (!updateNoteDto.content) {
            updateNoteDto.content = xhsPost.content;
          }
          if (!updateNoteDto.coverImage && xhsPost.images && xhsPost.images.length > 0) {
            // 使用第一张图片作为封面
            updateNoteDto.coverImage = xhsPost.images[0];
          }
        }
      } catch (error) {
        console.error('从xhs_posts获取数据失败:', error);
        // 不抛出异常，继续使用原始数据
      }
    }
    
    // 显式处理botId和paramsType字段，确保即使是空值也能正确设置
    if (updateNoteDto.botId !== undefined) {
      note.botId = updateNoteDto.botId;
    }
    
    if (updateNoteDto.paramsType !== undefined) {
      note.paramsType = updateNoteDto.paramsType;
    }
    
    // 使用Object.assign更新其他字段
    const updatedNote = Object.assign(note, updateNoteDto);
    console.log('更新笔记数据:', JSON.stringify(updatedNote));
    const savedNote = await this.noteRepository.save(updatedNote);

    // 更新模板关联
    if (updateNoteDto.htmlTemplates !== undefined) {
      console.log(`处理笔记(ID=${id})的HTML模板关联更新`);
      console.log('提交的HTML模板数据:', JSON.stringify(updateNoteDto.htmlTemplates));
      
      try {
        // 先删除所有HTML模板关联
        const deleteResult = await this.noteTemplateRelationRepository.delete({ noteId: id });
        console.log(`删除旧的模板关联结果:`, deleteResult);
        
        // 重新创建HTML模板关联
        if (updateNoteDto.htmlTemplates && updateNoteDto.htmlTemplates.length > 0) {
          await this.saveNoteHtmlTemplateRelations(id, updateNoteDto.htmlTemplates);
        } else {
          console.log(`笔记(ID=${id})不需要关联HTML模板`);
        }
      } catch (error) {
        console.error(`更新笔记(ID=${id})的HTML模板关联失败:`, error);
        // 不抛出异常，允许笔记基本信息更新成功
      }
    }

    return savedNote;
  }

  async remove(id: number): Promise<void> {
    // 删除笔记时会级联删除关联关系，因为在关联表中设置了onDelete: 'CASCADE'
    const result = await this.noteRepository.delete(id);
    if (result.affected === 0) {
      throw new HttpException('笔记不存在', HttpStatus.NOT_FOUND);
    }
  }

  // 获取笔记关联的模板列表
  async getNoteTemplates(noteId: number): Promise<any[]> {
    const relations = await this.noteTemplateRelationRepository.find({
      where: { noteId },
      relations: ['template'],
    });

    return relations.map(relation => ({
      ...relation.template,
      isRepeatable: relation.isRepeatable
    }));
  }

  // 获取笔记关联的HTML模板列表
  async getNoteHtmlTemplates(noteId: number): Promise<any[]> {
    try {
      console.log(`获取笔记(ID=${noteId})关联的HTML模板列表`);
      
      // 查询模板关联关系
      const relations = await this.noteTemplateRelationRepository.find({
        where: { noteId }
      });
      
      console.log(`找到${relations.length}个模板关联关系`);
      
      if (relations.length === 0) {
        return [];
      }

      // 获取HTML模板的详细信息
      const templates = [];
      for (const relation of relations) {
        try {
          const htmlTemplate = await this.htmlTemplateRepository.findOne({
            where: { id: relation.templateId }
          });
          
          if (htmlTemplate) {
            templates.push({
              ...htmlTemplate,
              isRepeatable: relation.isRepeatable
            });
            console.log(`成功获取模板ID=${relation.templateId}的详细信息`);
          } else {
            console.log(`未找到模板ID=${relation.templateId}的详细信息`);
          }
        } catch (error) {
          console.error(`获取HTML模板详情失败, 模板ID: ${relation.templateId}`, error);
        }
      }

      console.log(`最终返回${templates.length}个HTML模板详情`);
      return templates;
    } catch (error) {
      console.error('获取笔记关联的HTML模板列表失败:', error);
      throw new HttpException('获取HTML模板列表失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 保存笔记和HTML模板的关联关系
  private async saveNoteHtmlTemplateRelations(noteId: number, templates: { id: number, isRepeatable: boolean }[]): Promise<void> {
    console.log(`开始保存笔记(ID=${noteId})的HTML模板关联，模板数量: ${templates.length}`);
    console.log('模板数据:', JSON.stringify(templates));
    
    try {
      // 清理已有的关系，确保不会有冲突
      try {
        const existingRelations = await this.noteTemplateRelationRepository.find({
          where: { noteId: noteId }
        });
        
        if (existingRelations.length > 0) {
          console.log(`发现${existingRelations.length}个已存在的关联关系，准备删除`);
          const deleteResult = await this.noteTemplateRelationRepository.delete({ noteId: noteId });
          console.log(`删除结果:`, deleteResult);
        } else {
          console.log(`没有找到现有的关联关系，可以直接添加新关系`);
        }
      } catch (deleteError) {
        console.error(`删除现有关联关系时出错: ${deleteError.message}`);
        // 继续尝试创建新关系
      }
      
      // 验证所有模板是否存在
      const validTemplates = [];
      for (const template of templates) {
        try {
          const exists = await this.htmlTemplateRepository.findOne({ where: { id: template.id } });
          if (!exists) {
            console.error(`模板ID=${template.id}不存在，跳过关联`);
            continue;
          }
          console.log(`验证模板ID=${template.id}存在，添加到有效模板列表`);
          validTemplates.push(template);
        } catch (error) {
          console.error(`验证模板ID=${template.id}时出错: ${error.message}`);
        }
      }
      
      if (validTemplates.length === 0) {
        console.error(`没有找到有效的模板，无法创建关联关系`);
        return;
      }
      
      console.log(`有${validTemplates.length}个有效模板需要创建关联关系`);

      // 创建关联关系
      const relations = validTemplates.map(template => {
        return this.noteTemplateRelationRepository.create({
          noteId: noteId,
          templateId: template.id,
          isRepeatable: template.isRepeatable || false
        });
      });

      console.log(`准备保存${relations.length}个模板关联关系`);
      const savedRelations = await this.noteTemplateRelationRepository.save(relations);
      console.log(`成功保存${savedRelations.length}个模板关联关系`);
      
      // 验证保存结果
      try {
        const checkRelations = await this.noteTemplateRelationRepository.find({
          where: { noteId: noteId }
        });
        console.log(`验证结果: 笔记ID=${noteId}现有${checkRelations.length}个模板关联关系`);
        
        // 记录详细的关联关系
        for (const relation of checkRelations) {
          console.log(`- 关联关系ID=${relation.id}, 笔记ID=${relation.noteId}, 模板ID=${relation.templateId}, 可重复=${relation.isRepeatable}`);
        }
      } catch (checkError) {
        console.error(`验证保存结果时出错: ${checkError.message}`);
      }
      
      return;
    } catch (error) {
      console.error(`保存笔记HTML模板关联失败:`, error);
      throw new HttpException(`保存模板关联失败: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 添加根据ID列表查询笔记的方法
  async findAllByIds(query: NoteQueryDto, noteIds: number[]) {
    try {
      const { 
        page = 1, 
        pageSize = 10, 
        title,
        typeId,
        status,
        botId,
        orderBy = 'createTime',
        orderDirection = 'DESC'
      } = query;
      
      // 构建查询条件
      const where: any = {
        id: In(noteIds) // 使用In操作符查询指定ID列表的笔记
      };
      
      if (title) {
        where.title = Like(`%${title}%`);
      }
      
      if (typeId !== undefined && typeId !== null) {
        where.typeId = typeId;
      }
      
      if (status !== undefined) {
        where.status = status;
      }
      
      if (botId !== undefined && botId !== null && botId !== '') {
        where.botId = botId;
      }
      
      // 统计总数
      const total = await this.noteRepository.count({ where });
      
      // 查询数据
      const items = await this.noteRepository.find({
        where,
        relations: ['type'],
        skip: (page - 1) * pageSize,
        take: pageSize,
        order: { [orderBy]: orderDirection }
      });
      
      // 处理type关系，生成typeName字段
      const processedItems = items.map(item => {
        const { type, ...rest } = item;
        return {
          ...rest,
          type,
          typeName: type ? type.name : null
        } as any; // 使用any类型避免TypeScript错误
      });
      
      // 为每个笔记获取关联的HTML模板
      for (const item of processedItems) {
        try {
          // 获取HTML模板关联信息
          const htmlTemplates = await this.getNoteHtmlTemplates(item.id);
          
          // 只返回必要的模板信息
          if (htmlTemplates && htmlTemplates.length > 0) {
            item.htmlTemplates = htmlTemplates.map(template => ({
              id: template.id,
              name: template.name,
              isRepeatable: template.isRepeatable || false,
              thumbnailPath: template.thumbnailPath || '',
            }));
          } else {
            item.htmlTemplates = [];
          }
        } catch (error) {
          console.error(`获取笔记ID=${item.id}的HTML模板失败:`, error);
          item.htmlTemplates = [];
        }
      }
      
      return {
        items: processedItems,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('根据ID列表查询笔记失败:', error);
      throw new Error(`根据ID列表查询笔记失败: ${error.message}`);
    }
  }
} 