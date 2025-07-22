import { Controller, Get, Post, Body, Param, Delete, Query, ParseIntPipe, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NoteService } from './note.service';
import { CreateNoteDto, UpdateNoteDto, NoteQueryDto } from './dto/note.dto';
import { Note } from './note.entity';

@ApiTags('小红书笔记')
@Controller('xiaohongshu/note')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post('create')
  @ApiOperation({ summary: '创建笔记' })
  @ApiResponse({ status: 200, description: '创建成功' })
  async create(@Body() createNoteDto: CreateNoteDto) {
    try {
      console.log('接收到创建笔记请求，数据:', JSON.stringify(createNoteDto));
      
      // 检查HTML模板数据
      if (createNoteDto.htmlTemplates && createNoteDto.htmlTemplates.length > 0) {
        console.log(`请求包含${createNoteDto.htmlTemplates.length}个HTML模板:`, 
          JSON.stringify(createNoteDto.htmlTemplates));
      }
      
      // 执行创建操作
      const note = await this.noteService.create(createNoteDto);
      
      // 创建成功后，验证HTML模板关联是否正确添加
      if (createNoteDto.htmlTemplates && createNoteDto.htmlTemplates.length > 0) {
        try {
          const relations = await this.noteService.getNoteHtmlTemplates(note.id);
          console.log(`笔记创建后验证: ID=${note.id}关联了${relations.length}个HTML模板`);
        } catch (error) {
          console.error(`验证HTML模板关联失败:`, error);
        }
      }
      
      return {
        code: 0,
        message: '创建成功',
        data: note
      };
    } catch (error) {
      // 详细记录错误
      console.error('创建笔记失败:', error);
      throw new HttpException(
        error.message || '创建笔记失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('list')
  @ApiOperation({ summary: '获取笔记列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() query: NoteQueryDto) {
    return {
      code: 0,
      message: '获取成功',
      data: await this.noteService.findAll(query),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取笔记详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: Note })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      code: 0,
      message: '获取成功',
      data: await this.noteService.findOne(id),
    };
  }

  @Get(':id/templates')
  @ApiOperation({ summary: '获取笔记关联的模板列表（已弃用）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getNoteTemplates(@Param('id', ParseIntPipe) id: number) {
    return {
      code: 0,
      message: '获取成功',
      data: await this.noteService.getNoteTemplates(id),
    };
  }

  @Post('update')
  @ApiOperation({ summary: '更新笔记' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(@Body() updateNoteDto: UpdateNoteDto) {
    try {
      console.log('接收到更新笔记请求，数据:', JSON.stringify(updateNoteDto));
      
      // 检查HTML模板数据
      if (updateNoteDto.htmlTemplates !== undefined) {
        console.log(`更新请求包含${updateNoteDto.htmlTemplates?.length || 0}个HTML模板:`, 
          JSON.stringify(updateNoteDto.htmlTemplates));
      }
      
      // 执行更新操作
      const note = await this.noteService.update(updateNoteDto.id, updateNoteDto);
      
      // 更新成功后，验证HTML模板关联是否正确添加
      if (updateNoteDto.htmlTemplates !== undefined) {
        try {
          const relations = await this.noteService.getNoteHtmlTemplates(note.id);
          console.log(`笔记更新后验证: ID=${note.id}关联了${relations.length}个HTML模板`);
          
          // 记录关联的模板详情
          if (relations.length > 0) {
            console.log(`关联的模板ID:`, relations.map(rel => rel.id).join(', '));
          }
        } catch (error) {
          console.error(`验证HTML模板关联失败:`, error);
        }
      }
      
      return {
        code: 0,
        message: '更新成功',
        data: note
      };
    } catch (error) {
      // 详细记录错误
      console.error('更新笔记失败:', error);
      throw new HttpException(
        error.message || '更新笔记失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除笔记' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.noteService.remove(id);
    return {
      code: 0,
      message: '删除成功',
    };
  }
} 