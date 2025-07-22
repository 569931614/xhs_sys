import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  UploadedFile,
  UseInterceptors,UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags,ApiBearerAuth } from '@nestjs/swagger';
import { MaterialService } from './material.service';
import { JwtAuthGuard } from '../../common/auth/jwtAuth.guard';
import { Logger } from '@nestjs/common';

@ApiTags('material')
@Controller('material')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MaterialController {
  private readonly logger = new Logger(MaterialController.name);

  constructor(private readonly materialService: MaterialService) {}

  @Post('folders')
  @ApiOperation({ summary: '创建素材文件夹' })
  async createFolder(@Body() { name }: { name: string }, @Req() req) {
    const userId = req.user?.id;
    return this.materialService.createFolder(name, userId);
  }

  @Get('folders')
  @ApiOperation({ summary: '获取所有素材文件夹' })
  async getFolders(@Req() req) {
    const userId = req.user?.id;
    this.logger.log(`获取文件夹列表，用户ID: ${userId || '未登录'}`);
    return this.materialService.getFolders(userId);
  }

  @Get('files')
  @ApiOperation({ summary: '获取素材文件列表' })
  async getMaterials(@Req() req, @Query('folderId') folderId?: string) {
    const userId = req.user?.id;
    return this.materialService.getMaterials(folderId, userId);
  }

  @Post('upload')
  @ApiOperation({ summary: '上传素材' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMaterial(
    @UploadedFile() file,
    @Body('folderId') folderId: string,
    @Req() req,
  ) {
    const userId = req.user?.id;
    this.logger.log(`上传素材, 文件夹ID: ${folderId}, 用户ID: ${userId || '未登录'}`);
    return this.materialService.uploadMaterial(file, folderId, userId);
  }

  @Post('files/delete')
  @ApiOperation({ summary: '删除素材' })
  async deleteMaterial(@Body() { id }: { id: string }, @Req() req) {
    const userId = req.user?.id;
    return this.materialService.deleteMaterial(id);
  }

  @Post('folders/delete')
  @ApiOperation({ summary: '删除素材文件夹' })
  async deleteFolder(@Body() body: any, @Req() req) {
    // 打印请求体，检查是否包含必要的id字段
    this.logger.log(`删除文件夹请求体: ${JSON.stringify(body)}`);
    
    // 从请求体中提取ID
    const id = body?.id;
    if (!id) {
      this.logger.error('请求中没有提供文件夹ID');
      throw new BadRequestException('请求中必须包含文件夹ID');
    }
    
    const userId = req.user?.id;
    this.logger.log(`开始删除文件夹，ID: ${id}, 用户ID: ${userId || '未登录'}`);
    
    try {
      const result = await this.materialService.deleteFolder(id, userId);
      this.logger.log(`文件夹删除结果: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`删除文件夹失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('select')
  @ApiOperation({ summary: '从素材库选择素材' })
  async selectMaterials(
    @Body() { folderIds, count }: { folderIds: string[]; count: number },
    @Req() req,
  ) {
    const userId = req.user?.id;
    return this.materialService.selectMaterials(folderIds, count, userId);
  }

  @Get('check/:materialId')
  @ApiOperation({ summary: '检查素材是否有效，如果过期则刷新' })
  async checkMaterialValidity(@Param('materialId') materialId: string, @Req() req) {
    const userId = req.user?.id;
    return this.materialService.checkMaterialValidity(materialId, userId);
  }
} 