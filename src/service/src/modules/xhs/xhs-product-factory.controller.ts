import { Body, Controller, Post, Get, Logger, Query, UseGuards, Req } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { XhsProductFactoryService } from './xhs-product-factory.service';
import { JwtAuthGuard } from '../../common/auth/jwtAuth.guard';
import { Request } from 'express';
import { MaterialService } from '../material/material.service';

@ApiTags('小红书产品工厂')
@Controller('xhs/product-factory')
export class XhsProductFactoryController {
  private readonly logger = new Logger(XhsProductFactoryController.name);

  constructor(
    private readonly xhsProductFactoryService: XhsProductFactoryService,
    private readonly materialService: MaterialService,
  ) {}

  @ApiOperation({ summary: '生成小红书产品内容' })
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async generateProduct(
    @Req() req: Request,
    @Body() generateDto: {
      brandProduct: string;       // 品牌产品名称
      title: string;              // 标题
      titleList?: string[];       // 多个标题列表（批量）
      activityId: string;         // 活动ID
      fileIds: string[];          // 手动上传文件IDs
      batchCount?: number;        // 批次数量
      useMaterialLibrary?: boolean; // 是否使用素材库中的单个素材
      materialIds?: string[];     // 选中的单个素材IDs
      materialCount?: number;     // 从素材中选择的数量
      useFolders?: boolean;       // 是否使用文件夹
      folderIds?: string[];       // 选中的文件夹IDs
      folderMaterialCount?: number; // 从文件夹中选择的素材数量
      templateIds?: string[];     // HTML模板ID列表
      information?: string;       // 补充信息
    },
  ) {
    const userId = req.user?.id;
    const batchCount = generateDto.batchCount !== undefined ? generateDto.batchCount : 1;
    this.logger.log(
      `用户 ${userId} 请求生成产品内容: ${JSON.stringify(generateDto)}, batchCount: ${batchCount}, 类型: ${typeof batchCount}`,
    );
    
    const numericBatchCount = typeof batchCount === 'string' ? parseInt(batchCount) : batchCount;
    this.logger.log(`转换后的batchCount: ${numericBatchCount}, 类型: ${typeof numericBatchCount}`);
    
    // 将素材和文件夹处理逻辑转移到Service层
    // 直接调用service的generateProduct方法，传递完整参数
    return this.xhsProductFactoryService.generateProduct(
      userId.toString(),
      generateDto.brandProduct,
      generateDto.title,
      generateDto.activityId,
      generateDto.fileIds,
      req,
      numericBatchCount,
      generateDto.titleList,
      generateDto.useMaterialLibrary,
      generateDto.materialIds,
      generateDto.materialCount,
      generateDto.useFolders,
      generateDto.folderIds,
      generateDto.folderMaterialCount,
      generateDto.templateIds,
      generateDto.information
    );
  }

  @ApiOperation({ summary: '获取生成结果' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('result')
  async getGenerationResult(
    @Req() req: Request,
    @Query('taskId') taskId: string,
  ) {
    const userId = req.user?.id;
    this.logger.log(`用户 ${userId} 获取任务 ${taskId} 的生成结果`);
    return this.xhsProductFactoryService.getGenerationResult(userId.toString(), taskId);
  }

  @ApiOperation({ summary: '运行定时任务检查所有运行中任务状态' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('check-tasks')
  async checkRunningTasks(@Query('secretKey') secretKey: string) {
    // 简单的安全检查，实际生产环境请使用更复杂的认证机制
    if (secretKey !== this.xhsProductFactoryService['configService'].get('TASK_SECRET_KEY')) {
      return { success: false, message: '无权限执行此操作' };
    }
    
    this.logger.log('定时任务：检查运行中的任务状态');
    return this.xhsProductFactoryService.checkRunningTasks();
  }

  @ApiOperation({ summary: '获取用户的所有任务' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('tasks')
  async getUserTasks(
    @Req() req: Request,
    @Query('status') status?: string,
  ) {
    console.log('getUserTasks：', req.user);
    const userId = req.user?.id;
    this.logger.log(`用户 ${userId} 获取任务列表, 状态: ${status || '全部'}`);
    return this.xhsProductFactoryService.getUserTasks(userId.toString(), status);
  }

  @ApiOperation({ summary: '批量获取任务状态' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('/batch-results')
  async getBatchGenerationResults(@Query('taskIds') taskIds: string, @Req() req: Request) {
    const userId = req.user?.id;

    if (!taskIds) {
      return {
        success: false,
        message: '未提供任务ID列表',
        results: []
      };
    }

    const taskIdArray = taskIds.split(',').filter(id => id.trim().length > 0);

    if (taskIdArray.length === 0) {
      return {
        success: false,
        message: '任务ID列表为空',
        results: []
      };
    }

    try {
      this.logger.log(`用户 ${userId} 批量获取 ${taskIdArray.length} 个任务的状态`);

      const resultsPromises = taskIdArray.map(taskId =>
        this.xhsProductFactoryService.getGenerationResult(userId.toString(), taskId)
      );

      const results = await Promise.all(resultsPromises);

      const mappedResults = results.map((result, index) => ({
        id: taskIdArray[index],
        ...result
      }));

      return {
        success: true,
        message: `已获取 ${mappedResults.length} 个任务的状态`,
        results: mappedResults
      };
    } catch (error) {
      this.logger.error(`批量获取任务状态失败: ${error.message}`, error.stack);
      return {
        success: false,
        message: '批量获取任务状态失败',
        error: error.message,
        results: []
      };
    }
  }

  @ApiOperation({ summary: '重试失败的任务' })
  @Post('retry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async retryTask(
    @Req() req: Request,
    @Body() retryDto: {
      taskId: string;
    },
  ) {
    const userId = req.user?.id;
    this.logger.log(`用户 ${userId} 重试任务 ${retryDto.taskId}`);
    return this.xhsProductFactoryService.retryTask(userId.toString(), retryDto.taskId);
  }
} 