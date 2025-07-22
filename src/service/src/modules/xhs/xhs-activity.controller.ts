import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { XhsActivityService } from './xhs-activity.service';
import { AddPostToActivityDto, CreateXhsActivityDto, QueryXhsActivityDto, UpdateXhsActivityDto, XhsActivityStatsDto } from './dto/xhs-activity.dto';
import { XhsActivity } from './xhs-activity.entity';
import { XhsActivityPost } from './xhs-activity-post.entity';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/auth/jwtAuth.guard';

@ApiTags('小红书活动类型')
@Controller('xhs/activities')
// @UseGuards(JwtAuthGuard) // 将控制器级别的守卫注释掉
@ApiBearerAuth()
export class XhsActivityController {
  constructor(private readonly activityService: XhsActivityService) {}

  @Get('stats')
  @ApiOperation({ summary: '获取活动统计信息' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getStats(@Req() req: Request): Promise<XhsActivityStatsDto[]> {
    console.log('getStats：', req.user);
    const userId = req.user?.id || 0;
    return this.activityService.getActivityStats(userId);
  }

  @Post('ensure-default')
  @ApiOperation({ summary: '确保有默认活动' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async ensureDefault(@Req() req: Request): Promise<XhsActivity> {
    const userId = req.user?.id || 0;
    return this.activityService.ensureDefaultActivity(userId);
  }

  @Post()
  @ApiOperation({ summary: '创建活动' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Body() createDto: CreateXhsActivityDto, @Req() req: Request): Promise<XhsActivity> {
    const userId = req.user?.id || 0;
    return this.activityService.create(createDto, userId);
  }

  @Get()
  @ApiOperation({ summary: '获取活动列表' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(@Query() queryDto: QueryXhsActivityDto, @Req() req: Request): Promise<XhsActivity[]> {
    const userId = req.user?.id || 0;
    queryDto.userId = userId;
    return this.activityService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取活动详情' })
  @ApiParam({ name: 'id', description: '活动ID' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('id') id: string): Promise<XhsActivity> {
    return this.activityService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新活动' })
  @ApiParam({ name: 'id', description: '活动ID' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateXhsActivityDto,
  ): Promise<XhsActivity> {
    return this.activityService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除活动' })
  @ApiParam({ name: 'id', description: '活动ID' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string): Promise<void> {
    return this.activityService.remove(id);
  }

  @Post(':id/posts')
  @ApiOperation({ summary: '添加笔记到活动' })
  @ApiParam({ name: 'id', description: '活动ID' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async addPost(
    @Param('id') id: string,
    @Body() dto: AddPostToActivityDto,
  ) {
    return this.activityService.addPostToActivity(id, dto.postId.toString());
  }

  @Delete(':id/posts/:postId')
  @ApiOperation({ summary: '从活动中移除笔记' })
  @ApiParam({ name: 'id', description: '活动ID' })
  @ApiParam({ name: 'postId', description: '笔记ID' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async removePost(
    @Param('id') id: string,
    @Param('postId') postId: number,
  ): Promise<void> {
    return this.activityService.removePostFromActivity(id, postId.toString());
  }

  @Get(':id/posts')
  @ApiOperation({ summary: '获取活动的所有笔记' })
  @ApiParam({ name: 'id', description: '活动ID' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getPosts(@Param('id') id: string) {
    return this.activityService.getActivityPosts(id);
  }
} 