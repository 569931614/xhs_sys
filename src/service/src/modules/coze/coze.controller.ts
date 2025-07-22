import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CozeService } from './coze.service';
import { CozeChatDto, CozeCreateDto, CozeListDto, CozeUpdateDto } from './dto/coze.dto';
import { AdminAuthGuard } from 'src/common/auth/adminAuth.guard';
import { Public } from '../../decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/auth/jwtAuth.guard';

// 添加文件类型导入
import type { Multer } from 'multer';

@ApiTags('Coze')
@Controller('coze')
export class CozeController {
  private logger = new Logger(CozeController.name);

  constructor(private readonly cozeService: CozeService) {
    this.logger.log('CozeController initialized');
  }

  @ApiOperation({ summary: '创建Coze配置' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Post()
  create(@Body() cozeCreateDto: CozeCreateDto) {
    this.logger.log(`Creating Coze config: ${JSON.stringify(cozeCreateDto)}`);
    return this.cozeService.create(cozeCreateDto);
  }

  @ApiOperation({ summary: '获取Coze配置列表' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Get()
  findAll(@Query() query: CozeListDto) {
    this.logger.log(`Getting Coze list with query: ${JSON.stringify(query)}`);
    return this.cozeService.findAll(query);
  }

  @ApiOperation({ summary: '获取Coze配置详情' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    this.logger.log(`Getting Coze detail with id: ${id}`);
    return this.cozeService.findOne(+id);
  }

  @ApiOperation({ summary: '更新Coze配置' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() cozeUpdateDto: CozeUpdateDto) {
    this.logger.log(`Updating Coze config with id: ${id}, data: ${JSON.stringify(cozeUpdateDto)}`);
    return this.cozeService.update(+id, cozeUpdateDto);
  }

  @ApiOperation({ summary: '删除Coze配置' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    this.logger.log(`Deleting Coze config with id: ${id}`);
    return this.cozeService.delete(+id);
  }

  @ApiOperation({ summary: 'Coze聊天API' })
  @Public()
  @Post('chat')
  chat(@Body() cozeChatDto: CozeChatDto) {
    this.logger.log(`Chat with Coze: ${JSON.stringify(cozeChatDto)}`);
    return this.cozeService.chat(cozeChatDto);
  }

  @ApiOperation({ summary: '获取Coze机器人列表' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Get('bot/list')
  getBotList() {
    this.logger.log('Getting Coze bot list');
    return this.cozeService.getBotList();
  }

  @ApiOperation({ summary: '触发指定工作流' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Post('workflow/run')
  async runWorkflow(@Body() parameters: Record<string, any>) {
    this.logger.log(`触发工作流，参数: ${JSON.stringify(parameters)}`);
    return this.cozeService.runWorkflow(parameters);
  }
  
  @ApiOperation({ summary: '流式触发工作流' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Post('workflow/stream')
  async streamSpecificWorkflow(@Body() parameters: Record<string, any>) {
    this.logger.log(`流式触发工作流，参数: ${JSON.stringify(parameters)}`);
    return this.cozeService.streamWorkflow(parameters);
  }
  
  @ApiOperation({ summary: '获取工作流执行历史' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Get('workflow/history/:executeId')
  async getWorkflowHistory(
    @Param('executeId') executeId: string,
    @Query('workflowId') workflowId: string
  ) {
    this.logger.log(`获取工作流执行历史，workflowId: ${workflowId}, executeId: ${executeId}`);
    return this.cozeService.getWorkflowHistory(workflowId, executeId);
  }

  @ApiOperation({ summary: '获取工作流列表' })
  @Public()
  @Get('workflow/list')
  getWorkflowList() {
    this.logger.log('获取工作流列表');
    return this.cozeService.getWorkflowList();
  }
  
  @ApiOperation({ summary: '按状态获取工作流执行历史列表' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Get('workflow/history/list')
  async getWorkflowHistoryByStatus(
    @Query('workflowId') workflowId: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ) {
    this.logger.log(`获取工作流执行历史列表, workflowId=${workflowId}, status=${status || '全部'}`);
    return this.cozeService.getWorkflowHistoryByStatus(
      workflowId, 
      status, 
      page ? Number(page) : 1, 
      pageSize ? Number(pageSize) : 10
    );
  }

  @ApiOperation({ summary: '上传文件并获取file_id' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('file/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Body('mimeType') mimeType?: string
  ) {
    this.logger.log(`上传文件, filename=${file.originalname}`);
    const result = await this.cozeService.uploadFile(
      file.buffer,
      file.originalname,
      mimeType || file.mimetype
    );
    return result.file_id;
  }

  // 在controller中
  @ApiOperation({ summary: '获取工作流执行结果' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Get('workflow/result')
  async getWorkflowResult(
    @Query('workflowId') workflowId: string,
    @Query('executeId') executeId: string,
    @Query('extractField') extractField?: string
  ) {
    this.logger.log(`获取工作流执行结果, workflowId=${workflowId}, executeId=${executeId}${extractField ? ', 提取字段=' + extractField : ''}`);
    return this.cozeService.getWorkflowResult(workflowId, executeId, extractField);
  }
} 