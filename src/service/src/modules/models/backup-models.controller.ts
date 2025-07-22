import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/auth/adminAuth.guard';
import { BasePage } from '../../common/dto/basePage.dto';
import { Result } from '../../common/vo/result.vo';
import { BackupModelsService } from './backup-models.service';
import { CreateBackupModelDto, DeleteBackupModelDto, UpdateBackupModelDto, UpdateBackupModelStatusDto } from './dto/backup-models.dto';

@ApiTags('备用模型管理')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('backup/models')
export class BackupModelsController {
  constructor(private readonly backupModelsService: BackupModelsService) {}

  @Get()
  @ApiOperation({ summary: '获取备用模型列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findAll(@Query() query: BasePage) {
    const { page = 1, pageSize = 10 } = query;
    const result = await this.backupModelsService.findAll(page, pageSize);
    return Result.success(result);
  }

  @Get('detail')
  @ApiOperation({ summary: '获取备用模型详情' })
  @ApiQuery({ name: 'id', required: true, type: Number })
  async findOne(@Query('id') id: number) {
    const result = await this.backupModelsService.findOne(id);
    return Result.success(result);
  }

  @Post('create')
  @ApiOperation({ summary: '创建备用模型' })
  async create(@Body() createDto: CreateBackupModelDto) {
    const result = await this.backupModelsService.create(createDto);
    return Result.success(result);
  }

  @Post('update')
  @ApiOperation({ summary: '更新备用模型' })
  async update(@Body() updateDto: UpdateBackupModelDto) {
    const result = await this.backupModelsService.update(updateDto);
    return Result.success(result);
  }

  @Post('update-status')
  @ApiOperation({ summary: '更新备用模型状态' })
  async updateStatus(@Body() updateStatusDto: UpdateBackupModelStatusDto) {
    const result = await this.backupModelsService.updateStatus(updateStatusDto);
    return Result.success(result);
  }

  @Post('delete')
  @ApiOperation({ summary: '删除备用模型' })
  async delete(@Body() deleteDto: DeleteBackupModelDto) {
    const result = await this.backupModelsService.delete(deleteDto);
    return Result.success(result);
  }

  @Get('by-type')
  @ApiOperation({ summary: '根据模型类型获取备用模型' })
  @ApiQuery({ name: 'modelType', required: true, enum: ['text', 'image', 'video'] })
  async findByType(@Query('modelType') modelType: string) {
    const result = await this.backupModelsService.findByType(modelType);
    return Result.success(result);
  }

  @Get('search')
  @ApiOperation({ summary: '搜索备用模型' })
  @ApiQuery({ name: 'keyword', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async search(
    @Query('keyword') keyword: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    const result = await this.backupModelsService.search(keyword, page, pageSize);
    return Result.success(result);
  }
} 