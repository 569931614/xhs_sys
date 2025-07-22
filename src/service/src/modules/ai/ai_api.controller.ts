import { Controller, Post, Get, Body, Param, Query, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../decorators/public.decorator';
import { AiApiService } from './ai_api.service';
import { CreateTaskDto, GetTaskResultDto, CreateTaskByTemplateDto, ApiRequestOptionsDto } from './dto/ai_api.dto';

@ApiTags('ai_api')
@Controller('ai_api')
@Public()
export class AiApiController {
  private logger = new Logger(AiApiController.name);

  constructor(private readonly aiApiService: AiApiService) {
    this.logger.log('AI API控制器初始化');
  }

  @Post('create_task')
  @ApiOperation({ summary: '创建AI图像生成任务' })
  async createTask(@Body() createTaskDto: CreateTaskDto) {
    this.logger.log(`接收到创建任务请求: ${JSON.stringify(createTaskDto)}`);
    try {
      const { prompt, variables, image_url } = createTaskDto;
      this.logger.debug(`处理任务参数: prompt=${prompt}, variables=${JSON.stringify(variables)}`);
      
      // 处理图片URL
      const imageUrls = this.validateAndProcessImageUrls(image_url);
      
      // 使用新的统一方法创建任务
      this.logger.log(`开始创建任务: 提示词长度=${prompt.length}, 图片数量=${imageUrls.length}`);
      const result = await this.aiApiService.createTemplateTask({
        templateContent: prompt,
        variables: variables || [],
        imageUrls
      });
      
      if (!result.success) {
        this.logger.error(`任务创建失败: ${result.message}`);
        throw new HttpException({
          error: result.message
        }, HttpStatus.BAD_REQUEST);
      }
      
      this.logger.log(`任务创建成功: ${result.taskId}`);
      return {
        task_id: result.taskId,
        message: '任务创建成功',
        usage_count: 999 // 临时固定值
      };
    } catch (error) {
      this.logger.error(`创建任务时发生错误: ${error.message}`, error.stack);
      throw new HttpException({
        error: `创建任务失败: ${error.message}`
      }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('create_task_by_template')
  @ApiOperation({ summary: '通过提示词模板名称创建AI图像生成任务' })
  async createTaskByTemplate(@Body() createTaskDto: CreateTaskByTemplateDto) {
    this.logger.log(`接收到通过提示词模板名称创建任务请求: ${JSON.stringify(createTaskDto)}`);
    
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 10000; // 10秒
    let retryCount = 0;
    let lastError: any = null;
    
    while (retryCount <= MAX_RETRIES) {
    try {
      const { template_name, variables, image_url } = createTaskDto;
      this.logger.debug(`处理任务参数: template_name=${template_name}, variables=${JSON.stringify(variables)}`);
      
      // 处理图片URL
      const imageUrls = this.validateAndProcessImageUrls(image_url);
      
      // 使用新的统一方法创建任务
      this.logger.log(`开始根据提示词模板创建任务: template_name=${template_name}, 图片数量=${imageUrls.length}`);
        
        if (retryCount > 0) {
          this.logger.log(`第${retryCount}次重试创建任务: template_name=${template_name}`);
        }
        
      const result = await this.aiApiService.createTemplateTask({
        templateName: template_name,
        variables: variables || [],
        imageUrls
      });
      
      if (!result.success) {
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            lastError = new HttpException({
              error: result.message
            }, HttpStatus.BAD_REQUEST);
            this.logger.warn(`任务创建失败，准备第${retryCount}次重试: ${result.message}`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            continue;
          } else {
            this.logger.error(`任务创建失败，已达到最大重试次数: ${result.message}`);
        throw new HttpException({
          error: result.message
        }, HttpStatus.BAD_REQUEST);
          }
      }
      
      this.logger.log(`任务创建成功: ${result.taskId}`);
      return {
        task_id: result.taskId,
        message: '任务创建成功',
        usage_count: 999 // 临时固定值
      };
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          lastError = error;
          this.logger.warn(`创建任务时发生错误，准备第${retryCount}次重试: ${error.message}`, error.stack);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        } else {
          this.logger.error(`创建任务失败，已达到最大重试次数: ${error.message}`, error.stack);
      throw new HttpException({
            error: `创建任务失败: ${error.message}`,
            retryCount: retryCount
      }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }
    }
    
    // 如果所有重试都失败，抛出最后一个错误
    if (lastError) {
      throw lastError;
    }
  }

  @Get('get_result/:task_id')
  @ApiOperation({ summary: '获取任务结果' })
  async getResult(@Param('task_id') task_id: string, @Query() query: GetTaskResultDto) {
    this.logger.log(`接收到获取任务结果请求: task_id=${task_id}, timeout=${query.timeout || 10}`);
    try {
      // 设置客户端请求超时参数
      const timeout = parseInt(query.timeout) || 10; // 默认10秒
      this.logger.debug(`设置超时时间: ${timeout}秒`);
      
      // 获取任务结果
      this.logger.log(`开始查询任务: ${task_id}`);
      const result = await this.aiApiService.getTaskResult(task_id, timeout);
      
      this.logger.log(`获取任务结果完成: task_id=${task_id}, 状态=${result.status}`);
      return result;
    } catch (error) {
      this.logger.error(`获取任务结果时发生错误: ${error.message}`, error.stack);
      throw new HttpException({
        error: `获取任务结果失败: ${error.message}`,
        status: 'error'
      }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
  @Post('request')
  @ApiOperation({ summary: '直接发送API请求' })
  async sendApiRequest(@Body() requestOptions: ApiRequestOptionsDto) {
    this.logger.log(`接收到直接API请求: 模型=${requestOptions.model}, 请求方式=${requestOptions.requestMethod || 'stream'}`);
    
    try {
      // 创建一个临时任务用于跟踪
      const taskId = await this.aiApiService.createDirectApiRequestTask(requestOptions);
      
      this.logger.log(`创建直接API请求任务成功: taskId=${taskId}`);
      return {
        success: true,
        task_id: taskId,
        message: '请求已提交，请使用task_id查询结果'
      };
    } catch (error) {
      this.logger.error(`发送API请求时发生错误: ${error.message}`, error.stack);
      throw new HttpException({
        error: `发送API请求失败: ${error.message}`,
        status: 'error'
      }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
  /**
   * 验证并处理图片URL
   * @param image_url 原始图片URL(字符串或数组)
   * @returns 处理后的图片URL数组
   */
  private validateAndProcessImageUrls(image_url: string | string[]): string[] {
    let imageUrls: string[] = [];
    
    if (image_url) {
      // 确保image_url是数组
      imageUrls = Array.isArray(image_url) ? image_url : [image_url];
      this.logger.log(`图片URL数量: ${imageUrls.length}`);
      
      // 验证所有图片URL格式
      for (const url of imageUrls) {
        this.logger.debug(`验证图片URL: ${url}`);
        if (!(url.startsWith('http://') || url.startsWith('https://'))) {
          this.logger.error(`图片URL格式不正确: ${url}`);
          throw new HttpException({
            error: `图片URL格式不正确: ${url}，必须以http://或https://开头`
          }, HttpStatus.BAD_REQUEST);
        }
      }
    }
    
    return imageUrls;
  }
} 