import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomPageService } from './customPage.service';
import { 
  CreateCustomPageDto, 
  UpdateCustomPageDto, 
  CustomPageListDto, 
  CustomPageDetailDto 
} from './dto/customPage.dto';
import { JwtAuthGuard } from '@/common/auth/jwtAuth.guard';
import { AdminAuthGuard } from '@/common/auth/adminAuth.guard';

@ApiTags('自定义页面')
@Controller('customPage')
export class CustomPageController {
  constructor(private readonly customPageService: CustomPageService) {}

  @Post()
  // 暂时注释掉权限验证，方便添加示例数据
  // @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建自定义页面' })
  async create(@Body() createCustomPageDto: CreateCustomPageDto) {
    return {
      code: 200,
      message: '创建成功',
      data: await this.customPageService.create(createCustomPageDto),
    };
  }

  @Put(':id')
  // 暂时注释掉权限验证，方便编辑数据
  // @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新自定义页面' })
  async update(@Param('id') id: string, @Body() updateCustomPageDto: UpdateCustomPageDto) {
    return {
      code: 200,
      message: '更新成功',
      data: await this.customPageService.update(+id, updateCustomPageDto),
    };
  }

  @Delete(':id')
  // 暂时注释掉权限验证，方便删除数据
  // @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除自定义页面' })
  async remove(@Param('id') id: string) {
    await this.customPageService.remove(+id);
    return {
      code: 200,
      message: '删除成功',
    };
  }

  @Get()
  // 暂时注释掉权限验证，方便获取数据
  // @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取自定义页面列表' })
  async findAll(@Query() query: CustomPageListDto) {
    return {
      code: 200,
      message: '获取成功',
      data: await this.customPageService.findAll(query),
    };
  }

  @Get('public/list')
  @ApiOperation({ summary: '获取启用的自定义页面列表（前台展示）' })
  async getEnabledPages() {
    return {
      code: 200,
      message: '获取成功',
      data: await this.customPageService.getEnabledPages(),
    };
  }

  @Get(':id')
  // 暂时注释掉权限验证，方便获取详情
  // @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取自定义页面详情' })
  async findOne(@Param('id') id: string) {
    return {
      code: 200,
      message: '获取成功',
      data: await this.customPageService.findById(+id),
    };
  }
} 