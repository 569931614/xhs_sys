import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChannelCommissionService } from './channelCommission.service';
import { JwtAuthGuard } from '../../common/auth/jwtAuth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('渠道佣金')
@Controller('channel-commission')
export class ChannelCommissionController {
  constructor(private readonly channelCommissionService: ChannelCommissionService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取我的佣金记录' })
  @ApiResponse({ status: 200, description: '成功获取佣金记录' })
  async getMyCommissions(@Request() req, @Query() paginationDto: PaginationDto) {
    const userId = req.user.id;
    return this.channelCommissionService.getUserCommissions(userId, paginationDto);
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取我的佣金统计' })
  @ApiResponse({ status: 200, description: '成功获取佣金统计' })
  async getCommissionSummary(@Request() req) {
    const userId = req.user.id;
    return this.channelCommissionService.getUserCommissionSummary(userId);
  }
} 