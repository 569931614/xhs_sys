import { Body, Controller, Get, Post, Query, UseGuards, Req, Param, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwtAuth.guard';
import { AccountAnalysisService } from './accountAnalysis.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { Request } from 'express';
import { Result } from '@/common/result';
import * as fs from 'fs';
import * as path from 'path';
import { Connection } from 'typeorm';

@ApiTags('账号分析')
@Controller('account-analysis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountAnalysisController {
  constructor(
    private readonly accountAnalysisService: AccountAnalysisService,
    private connection: Connection
  ) {}

  @ApiOperation({ 
    summary: '创建分析任务', 
    description: '根据链接分析账号，支持抖音和小红书。系统会自动根据链接域名判断平台，无需手动指定platform。'
  })
  @Post('create-task')
  async createTask(@Body() createTaskDto: CreateTaskDto, @Req() req) {
    // 获取当前用户ID
    const userId = req.user?.id || createTaskDto.user_id || 1;
    
    // 创建任务
    createTaskDto.user_id = userId;
    return this.accountAnalysisService.createTask(createTaskDto);
  }

  @ApiOperation({ summary: '获取分析任务列表' })
  @Get('tasks')
  async getTasks(@Req() req) {
    // 获取当前用户ID
    const userId = req.user?.id || 1;
    
    // 使用Repository查询，并排除长文本字段
    const result = await this.accountAnalysisService.getTasksWithoutContent(userId);
    return result;
  }

  @ApiOperation({ summary: '获取分析任务结果' })
  @Get('result')
  async getResult(@Query('task_id') taskId: string, @Query('id') id: number) {
    if (!taskId && !id) {
      return Result.fail(HttpStatus.BAD_REQUEST, '参数不完整');
    }
    
    return this.accountAnalysisService.getTaskResult(taskId, id);
  }
  
  @Post('refresh-task')
  async refreshTask(@Body() body: any, @Req() req) {
    const { task_id, id } = body;
    const userId = req.user?.id || 1;
    
    if (!task_id || !id) {
      return Result.fail(400, '参数不完整');
    }
    
    return this.accountAnalysisService.refreshTask(id, task_id, userId);
  }

  @Post('migrate-fx-url')
  @ApiOperation({ summary: '执行数据库迁移，修改fx_url字段长度' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '执行成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '数据库迁移执行成功' }
      }
    }
  })
  async migrateFxUrl() {
    try {
      // 读取SQL文件
      const sqlPath = path.join(__dirname, 'fx-url-length.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      // 执行SQL
      await this.connection.query(sql);
      
      return {
        code: 200,
        message: '数据库迁移执行成功：fx_url字段长度已修改为500'
      };
    } catch (error) {
      console.error('数据库迁移执行失败:', error);
      return {
        code: 500,
        message: `数据库迁移执行失败: ${error.message}`
      };
    }
  }
} 