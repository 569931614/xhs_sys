import { 
  Body, 
  Controller, 
  Get, 
  HttpStatus, 
  Logger, 
  Post, 
  Query, 
  UploadedFile, 
  UseGuards, 
  UseInterceptors,
  Res,
  HttpException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateTemplateDto, DeleteTemplateDto, UpdateTemplateDto, UpdateTemplateStatusDto } from './dto/template.dto';
import { XhsTemplateService } from './template.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from 'src/common/auth/adminAuth.guard';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

// 定义文件类型，解决Multer类型问题
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@Controller('template')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
export class XhsTemplateController {
  private readonly logger = new Logger(XhsTemplateController.name);
  
  constructor(
    private readonly templateService: XhsTemplateService
  ) {}

  @Get('list')
  async findAll(
    @Query('page') page = 1, 
    @Query('pageSize') pageSize = 10,
    @Query('keyword') keyword = ''
  ) {
    try {
      const data = await this.templateService.findAll(Number(page), Number(pageSize), keyword);
      return {
        success: true,
        data
      };
    } catch (error) {
      this.logger.error(`获取模板列表失败: ${error.message}`);
      return {
        success: false,
        message: error.message || '获取模板列表失败'
      };
    }
  }

  @Get('detail')
  async findOne(@Query('id') id: number) {
    try {
      const data = await this.templateService.findOne(Number(id));
      return {
        success: true,
        data
      };
    } catch (error) {
      this.logger.error(`获取模板详情失败: ${error.message}`);
      return {
        success: false,
        message: error.message || '获取模板详情失败'
      };
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB 大小限制
    },
    fileFilter: (req, file, callback) => {
      // 检查文件类型
      const allowedExtensions = ['.ppt', '.pptx'];
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (!allowedExtensions.includes(ext)) {
        return callback(new HttpException('只支持PPT格式文件(.ppt, .pptx)', HttpStatus.BAD_REQUEST), false);
      }
      
      // 允许上传
      callback(null, true);
    }
  }))
  async uploadFile(@UploadedFile() file: MulterFile) {
    try {
      // 记录请求信息，便于调试
      this.logger.log(`接收到文件上传请求: ${file?.originalname || '未知文件'}`);
      
      if (!file) {
        this.logger.error('未检测到上传文件');
        return {
          success: false,
          message: '未检测到上传文件'
        };
      }
      
      // 记录文件信息
      this.logger.log(`文件信息: 名称=${file.originalname}, 大小=${file.size}字节, 类型=${file.mimetype}`);
      
      // 检查文件buffer是否存在
      if (!file.buffer || file.buffer.length === 0) {
        this.logger.error(`文件buffer无效: ${file.originalname}`);
        return {
          success: false,
          message: '文件内容为空或已损坏'
        };
      }

      const filePath = await this.templateService.uploadTemplateFile(file);
      
      this.logger.log(`文件上传成功: ${filePath}`);
      
      return {
        success: true,
        data: {
          filePath,
          fileSize: Math.round(file.size / 1024), // 转换为KB
          fileName: file.originalname
        }
      };
    } catch (error) {
      const errorMessage = error instanceof HttpException 
        ? error.message
        : error.message || '上传模板文件失败';
      
      this.logger.error(`上传模板文件失败: ${errorMessage}`, error.stack);
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  @Post('create')
  async create(@Body() createDto: CreateTemplateDto) {
    try {
      // 从临时路径获取文件大小
      const fileInfo = await this.getFileInfo(createDto['filePath']);
      
      const data = await this.templateService.create(
        createDto, 
        createDto['filePath'], 
        fileInfo.fileSize || 0
      );
      
      return {
        success: true,
        data
      };
    } catch (error) {
      this.logger.error(`创建模板失败: ${error.message}`);
      return {
        success: false,
        message: error.message || '创建模板失败'
      };
    }
  }

  @Post('update')
  async update(@Body() updateDto: UpdateTemplateDto) {
    try {
      let fileInfo = null;
      
      // 如果更新了文件，获取文件信息
      if (updateDto['filePath']) {
        fileInfo = await this.getFileInfo(updateDto['filePath']);
      }
      
      const data = await this.templateService.update(
        updateDto, 
        updateDto['filePath'], 
        fileInfo?.fileSize
      );
      
      return {
        success: true,
        data
      };
    } catch (error) {
      this.logger.error(`更新模板失败: ${error.message}`);
      return {
        success: false,
        message: error.message || '更新模板失败'
      };
    }
  }

  @Post('update-status')
  async updateStatus(@Body() updateStatusDto: UpdateTemplateStatusDto) {
    try {
      const data = await this.templateService.updateStatus(updateStatusDto);
      return {
        success: true,
        data
      };
    } catch (error) {
      this.logger.error(`更新模板状态失败: ${error.message}`);
      return {
        success: false,
        message: error.message || '更新模板状态失败'
      };
    }
  }

  @Post('delete')
  async delete(@Body() deleteDto: DeleteTemplateDto) {
    try {
      const data = await this.templateService.delete(deleteDto);
      return {
        success: true,
        data
      };
    } catch (error) {
      this.logger.error(`删除模板失败: ${error.message}`);
      return {
        success: false,
        message: error.message || '删除模板失败'
      };
    }
  }

  @Get('download')
  async download(@Query('id') id: number, @Res() res: Response) {
    try {
      const template = await this.templateService.findOne(Number(id));
      
      if (!template) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: '模板不存在'
        });
      }
      
      // 文件路径
      const filePath = path.join(process.cwd(), template.filePath);
      
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: '文件不存在'
        });
      }
      
      // 记录下载次数
      await this.templateService.incrementUsageCount(Number(id));
      
      // 设置文件名
      const fileName = path.basename(template.filePath);
      
      // 设置响应头
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      });
      
      // 发送文件
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      this.logger.error(`下载模板失败: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || '下载模板失败'
      });
    }
  }

  // 获取文件信息
  private async getFileInfo(filePath: string) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        return {
          fileSize: Math.round(stats.size / 1024) // 转换为KB
        };
      }
      
      return { fileSize: 0 };
    } catch (error) {
      this.logger.error(`获取文件信息失败: ${error.message}`);
      return { fileSize: 0 };
    }
  }
} 