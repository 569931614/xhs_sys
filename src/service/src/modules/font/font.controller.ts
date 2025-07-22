import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { FontService } from './font.service';
import { CreateFontDto } from './dto/create-font.dto';
import { UpdateFontDto } from './dto/update-font.dto';
import { QueryFontDto } from './dto/query-font.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/auth/adminAuth.guard';

@ApiTags('字体管理')
@Controller('font')
export class FontController {
  constructor(private readonly fontService: FontService) {}

  @Post()
  @ApiOperation({ summary: '创建字体' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  create(@Body() createFontDto: CreateFontDto) {
    return this.fontService.create(createFontDto);
  }

  @Get()
  @ApiOperation({ summary: '查询字体列表' })
  findAll(@Query() query: QueryFontDto) {
    return this.fontService.findAll(query);
  }

  @Get('available')
  @ApiOperation({ summary: '获取所有可用字体' })
  getAllAvailableFonts() {
    return this.fontService.getAllAvailableFonts();
  }

  @Get('fetch-from-api')
  @ApiOperation({ summary: '从API获取字体数据' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  fetchFontsFromApi() {
    return this.fontService.fetchFontsFromApi();
  }

  @Get(':id')
  @ApiOperation({ summary: '查询单个字体' })
  findOne(@Param('id') id: string) {
    return this.fontService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新字体' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  update(@Param('id') id: string, @Body() updateFontDto: UpdateFontDto) {
    return this.fontService.update(+id, updateFontDto);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: '切换字体状态' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  toggleStatus(@Param('id') id: string) {
    return this.fontService.toggleStatus(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除字体' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  remove(@Param('id') id: string) {
    return this.fontService.remove(+id);
  }

  @Post('batch-remove')
  @ApiOperation({ summary: '批量删除字体' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  batchRemove(@Body() ids: number[]) {
    return this.fontService.batchRemove(ids);
  }
} 