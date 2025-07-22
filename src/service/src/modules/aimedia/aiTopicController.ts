import { Controller, Get, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AiTopicService } from './aiTopicService';
import { AiTopicConfig } from './dto/aiTopicConfig.dto';
import { TopicGenerateResponse } from './dto/topicGenerateResponse.dto';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/auth/jwtAuth.guard';

@ApiTags('AI选题助手')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiTopicController {
  constructor(
    private readonly aiTopicService: AiTopicService,
  ) {}

  @Get('user/ai-topic-settings')
  @ApiOperation({ summary: '获取用户AI选题配置' })
  async getAiTopicSettings(@Req() req: Request) {
    const userId = req.user?.id || 0;
    return this.aiTopicService.getUserTopicSettings(userId);
  }

  @Post('user/ai-topic-settings')
  @ApiOperation({ summary: '保存用户AI选题配置' })
  @ApiBody({ type: AiTopicConfig })
  async saveAiTopicSettings(
    @Body() topicConfig: AiTopicConfig,
    @Req() req: Request,
  ) {
    const userId = req.user?.id || 0;
    return this.aiTopicService.saveUserTopicSettings(userId, topicConfig);
  }

  @Post('chatgpt/generate-topic')
  @ApiOperation({ summary: '生成选题' })
  @ApiBody({ type: AiTopicConfig })
  @ApiQuery({ name: 'count', description: '要生成的选题数量', type: Number, required: false })
  @ApiResponse({ status: 200, description: '返回生成的选题', type: TopicGenerateResponse })
  async generateTopic(
    @Body() topicConfig: AiTopicConfig,
    @Query('count') count: number = 5,
  ): Promise<TopicGenerateResponse> {
    return this.aiTopicService.generateTopic(topicConfig, count);
  }

} 