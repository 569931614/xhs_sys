import { Controller, Get, Post, Body, Param, Delete, Query, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NoteTypeService } from './notetype.service';
import { CreateNoteTypeDto, UpdateNoteTypeDto, NoteTypeQueryDto } from './dto/notetype.dto';
import { NoteType } from './notetype.entity';

@ApiTags('小红书笔记类型')
@Controller('xiaohongshu/notetype')
export class NoteTypeController {
  constructor(private readonly noteTypeService: NoteTypeService) {}

  @Post('create')
  @ApiOperation({ summary: '创建笔记类型' })
  @ApiResponse({ status: 201, description: '创建成功', type: NoteType })
  async create(@Body() createNoteTypeDto: CreateNoteTypeDto) {
    return {
      code: 0,
      message: '创建成功',
      data: await this.noteTypeService.create(createNoteTypeDto),
    };
  }

  @Get('list')
  @ApiOperation({ summary: '获取笔记类型列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() query: NoteTypeQueryDto) {
    return await this.noteTypeService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取笔记类型详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: NoteType })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.noteTypeService.findOne(id);
  }

  @Post('update')
  @ApiOperation({ summary: '更新笔记类型' })
  @ApiResponse({ status: 200, description: '更新成功', type: NoteType })
  async update(@Body() updateNoteTypeDto: UpdateNoteTypeDto) {
    return await this.noteTypeService.update(updateNoteTypeDto.id, updateNoteTypeDto);
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除笔记类型' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.noteTypeService.remove(id);
    return {
      code: 0,
      message: '删除成功',
    };
  }
} 