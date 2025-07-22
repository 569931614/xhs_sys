import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwtAuth.guard';
import { ChannelLevelService } from './channel-level.service';
import { CreateChannelLevelDto, UpdateChannelLevelDto, ChannelLevelQueryDto } from './dto/channel-level.dto';

@ApiTags('渠道管理')
@Controller('channel-level')
export class ChannelLevelController {
  constructor(private readonly channelLevelService: ChannelLevelService) {}

  @ApiOperation({ summary: '创建渠道等级' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createDto: CreateChannelLevelDto) {
    const result = await this.channelLevelService.create(createDto);
    return {
      code: 200,
      message: '创建成功',
      data: result,
      success: true,
    };
  }

  @ApiOperation({ summary: '更新渠道等级' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: number, @Body() updateDto: UpdateChannelLevelDto) {
    const result = await this.channelLevelService.update(id, updateDto);
    return {
      code: 200,
      message: '更新成功',
      data: result,
      success: true,
    };
  }

  @ApiOperation({ summary: '查询渠道等级列表' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query() query: ChannelLevelQueryDto) {
    const result = await this.channelLevelService.findAll(query);
    return {
      code: 200,
      message: '查询成功',
      data: result,
      success: true,
    };
  }

  @ApiOperation({ summary: '查询渠道等级详情' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: number) {
    const result = await this.channelLevelService.findOne(id);
    return {
      code: 200,
      message: '查询成功',
      data: result,
      success: true,
    };
  }

  @ApiOperation({ summary: '删除渠道等级' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: number) {
    await this.channelLevelService.remove(id);
    return {
      code: 200,
      message: '删除成功',
      success: true,
    };
  }

  @ApiOperation({ summary: '获取所有可用渠道等级' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('list/active')
  async findAllActive() {
    const result = await this.channelLevelService.findAllActive();
    return {
      code: 200,
      message: '查询成功',
      data: result,
      success: true,
    };
  }
} 