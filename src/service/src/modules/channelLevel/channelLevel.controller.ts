import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChannelLevelService } from './channelLevel.service';

@ApiTags('渠道等级')
@Controller('channel-level')
export class ChannelLevelController {
  constructor(private readonly channelLevelService: ChannelLevelService) {}

  @Get()
  @ApiOperation({ summary: '获取所有渠道等级' })
  @ApiResponse({ status: 200, description: '成功获取渠道等级列表' })
  async getAllLevels() {
    return await this.channelLevelService.getAllLevels();
  }
} 