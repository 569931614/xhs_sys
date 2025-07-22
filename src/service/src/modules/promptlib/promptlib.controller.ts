import { Body, Controller, Get, Post, Query, UseGuards, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from 'src/common/auth/adminAuth.guard';
import { SuperAuthGuard } from 'src/common/auth/superAuth.guard';
import { PromptLibService } from './promptlib.service';
import { CreatePromptTemplateDto, UpdatePromptTemplateDto, QueryPromptTemplateDto, DeletePromptTemplateDto } from './dto/promptlib.dto';

@ApiTags('提示词模板')
@Controller('promptlib')
export class PromptLibController {
  constructor(private readonly promptLibService: PromptLibService) {}

  @ApiOperation({ summary: '查询提示词模板列表' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Get('list')
  async queryPromptTemplates(@Query() query: QueryPromptTemplateDto) {
    return this.promptLibService.queryPromptTemplates(query);
  }

  @ApiOperation({ summary: '获取单个提示词模板' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Get(':id')
  async getPromptTemplate(@Param('id') id: number) {
    return this.promptLibService.getPromptTemplate(id);
  }

  @ApiOperation({ summary: '创建提示词模板' })
  @ApiBearerAuth()
  @UseGuards(SuperAuthGuard)
  @Post('create')
  async createPromptTemplate(@Body() dto: CreatePromptTemplateDto) {
    return this.promptLibService.createPromptTemplate(dto);
  }

  @ApiOperation({ summary: '更新提示词模板' })
  @ApiBearerAuth()
  @UseGuards(SuperAuthGuard)
  @Post('update')
  async updatePromptTemplate(@Body() dto: UpdatePromptTemplateDto) {
    return this.promptLibService.updatePromptTemplate(dto);
  }

  @ApiOperation({ summary: '删除提示词模板' })
  @ApiBearerAuth()
  @UseGuards(SuperAuthGuard)
  @Post('delete')
  async deletePromptTemplate(@Body() dto: DeletePromptTemplateDto) {
    return this.promptLibService.deletePromptTemplate(dto);
  }
} 