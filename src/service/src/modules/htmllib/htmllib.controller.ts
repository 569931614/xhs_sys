import { Body, Controller, Get, Post, Query, UseGuards, Param, UploadedFile, UseInterceptors, HttpException, HttpStatus, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { AdminAuthGuard } from 'src/common/auth/adminAuth.guard';
import { HtmlLibService } from './htmllib.service';
import { CreateHtmlTemplateDto, UpdateHtmlTemplateDto, QueryHtmlTemplateDto, DeleteHtmlTemplateDto } from './dto/htmllib.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

// 定义文件类型，解决Multer类型问题
type MulterFile = Express.Multer.File;

@ApiTags('HTML模板')
@Controller('htmllib')
export class HtmlLibController {
  constructor(
    private readonly htmlLibService: HtmlLibService
  ) {}

  @ApiOperation({ summary: '查询HTML模板列表' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Get('list')
  async queryHtmlTemplates(@Query() query: QueryHtmlTemplateDto) {
    return this.htmlLibService.queryHtmlTemplates(query);
  }

  @ApiOperation({ summary: '获取单个HTML模板' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Get(':id')
  async getHtmlTemplate(@Param('id') id: number) {
    return this.htmlLibService.getHtmlTemplate(id);
  }

  @ApiOperation({ summary: '创建HTML模板' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Post('create')
  async createHtmlTemplate(@Body() dto: CreateHtmlTemplateDto) {
    return this.htmlLibService.createHtmlTemplate(dto);
  }

  @ApiOperation({ summary: '更新HTML模板' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Post('update')
  async updateHtmlTemplate(@Body() dto: UpdateHtmlTemplateDto) {
    return this.htmlLibService.updateHtmlTemplate(dto);
  }

  @ApiOperation({ summary: '删除HTML模板' })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Post('delete')
  async deleteHtmlTemplate(@Body() dto: DeleteHtmlTemplateDto) {
    return this.htmlLibService.deleteHtmlTemplate(dto);
  }
  
  @ApiOperation({ summary: '上传HTML模板缩略图' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Post('upload-thumbnail')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB 大小限制
    },
    fileFilter: (req, file, callback) => {
      // 检查文件类型
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (!allowedExtensions.includes(ext)) {
        return callback(new HttpException('只支持图片格式文件(.jpg, .jpeg, .png, .gif)', HttpStatus.BAD_REQUEST), false);
      }
      
      // 允许上传
      callback(null, true);
    }
  }))
  async uploadThumbnail(@UploadedFile() file: MulterFile) {
    try {
      if (!file) {
        throw new HttpException('未检测到上传文件', HttpStatus.BAD_REQUEST);
      }
      
      // 确保文件对象有必要的属性
      if (!file.buffer || !file.originalname) {
        throw new HttpException('文件数据不完整', HttpStatus.BAD_REQUEST);
      }
      
      const thumbnailPath = await this.htmlLibService.uploadThumbnail(file);
      
      return {
        success: true,
        data: {
          thumbnailPath,
          fileSize: Math.round(file.size / 1024), // 转换为KB
          fileName: file.originalname
        }
      };
    } catch (error) {
      const errorMessage = error instanceof HttpException 
        ? error.message
        : error.message || '上传模板缩略图失败';
      
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 