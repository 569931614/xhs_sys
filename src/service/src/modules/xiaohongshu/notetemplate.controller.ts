import { Controller, Get, Post, Body, Param, Delete, Query, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NoteTemplateService } from './notetemplate.service';
import { CreateNoteTemplateDto, UpdateNoteTemplateDto, NoteTemplateQueryDto } from './dto/notetemplate.dto';
import { NoteTemplate } from './notetemplate.entity';

@ApiTags('小红书笔记页面模板')
@Controller('xiaohongshu/notetemplate')
export class NoteTemplateController {
  constructor(private readonly noteTemplateService: NoteTemplateService) {}

  @Post('create')
  @ApiOperation({ summary: '创建笔记页面模板' })
  @ApiResponse({ status: 201, description: '创建成功', type: NoteTemplate })
  async create(@Body() createNoteTemplateDto: CreateNoteTemplateDto) {
    return {
      code: 0,
      message: '创建成功',
      data: await this.noteTemplateService.create(createNoteTemplateDto),
    };
  }

  @Get('list')
  @ApiOperation({ summary: '获取笔记页面模板列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() query: NoteTemplateQueryDto) {
    return await this.noteTemplateService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取笔记页面模板详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: NoteTemplate })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.noteTemplateService.findOne(id);
  }

  @Post('update')
  @ApiOperation({ summary: '更新笔记页面模板' })
  @ApiResponse({ status: 200, description: '更新成功', type: NoteTemplate })
  async update(@Body() updateNoteTemplateDto: UpdateNoteTemplateDto) {
    return await this.noteTemplateService.update(updateNoteTemplateDto.id, updateNoteTemplateDto);
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除笔记页面模板' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.noteTemplateService.remove(id);
    return {
      code: 0,
      message: '删除成功',
    };
  }
} 