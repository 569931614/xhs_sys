import { Controller, Post, Get, Body, Query, Req, UseGuards, HttpStatus, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ImageGeneratorService } from './image-generator.service';
import { CreateImageDto } from './dto/create-image.dto';
import { JwtAuthGuard } from '../../common/auth/jwtAuth.guard';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('图片生成')
@Controller('image-generator')
// @UseGuards(JwtAuthGuard) // 控制器级别的守卫注释掉，改为在各个方法上单独设置
@ApiBearerAuth()
export class ImageGeneratorController {
  constructor(
    private readonly imageGeneratorService: ImageGeneratorService,
  ) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '生成图片' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '生成成功', 
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        data: {
          type: 'object',
          properties: {
            keyword: { type: 'string', example: '0基础小白如何做自媒体' },
            type: { type: 'string', example: 'theme' },
            urls: { 
              type: 'array', 
              items: { type: 'string' },
              example: [
                'https://pri-cdn-oss.chuangkit.com/svg_build/render_result/example1',
                'https://pri-cdn-oss.chuangkit.com/svg_build/render_result/example2'
              ]
            }
          }
        },
        message: { type: 'string', example: '创建AI封面成功' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '参数错误' })
  async generateImage(@Body() createImageDto: CreateImageDto, @Req() req: Request) {
    const userId = req.user?.id?.toString() || '';
    return this.imageGeneratorService.generateImage(createImageDto, userId);
  }

  @Get('tasks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户的图片生成任务列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  async getUserImageTasks(
    @Req() req: Request,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const userId = req.user?.id?.toString() || '';
    return this.imageGeneratorService.getUserImageTasks(userId, +page, +limit);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户的历史生成记录（自动清理1天前的数据）' })
  @ApiQuery({ name: 'page', required: false, description: '页码', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', type: Number })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        data: {
          type: 'object',
          properties: {
            history: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  prompt: { type: 'string', example: '0基础小白如何做自媒体' },
                  createTime: { type: 'string', example: '2023-06-02T10:30:00.000Z' },
                  mainImageUrl: { type: 'string', example: 'https://example.com/image.jpg' },
                  imageCount: { type: 'number', example: 10 },
                  imageUrls: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                }
              }
            },
            total: { type: 'number', example: 50 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 }
          }
        },
        message: { type: 'string', example: '获取历史生成记录成功' }
      }
    }
  })
  async getUserHistory(
    @Req() req: Request,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const userId = req.user?.id?.toString() || '';
    console.log(`获取用户${userId}的历史记录，该操作会自动清理1天前的数据`);
    return this.imageGeneratorService.getUserHistoryTasks(userId, +page, +limit);
  }

  @Get('task')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取任务详情' })
  @ApiQuery({ name: 'taskId', required: true, description: '任务ID', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '任务不存在' })
  async getTaskDetail(@Query('taskId') taskId: number, @Req() req: Request) {
    const userId = req.user?.id?.toString() || '';
    return this.imageGeneratorService.getTaskDetail(+taskId, userId);
  }

  @Get('download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取图片下载链接' })
  @ApiQuery({ name: 'taskId', required: true, description: '任务ID', type: String })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取下载链接成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        data: {
          type: 'object',
          properties: {
            downloadUrl: { type: 'string', example: 'https://example.com/download/image.jpg' }
          }
        },
        message: { type: 'string', example: '获取下载链接成功' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '获取下载链接失败' })
  async downloadImage(@Query('taskId') taskId: string) {
    return this.imageGeneratorService.downloadImage(taskId);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '上传图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '要上传的图片文件'
        },
        fileName: {
          type: 'string',
          description: '文件名'
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '上传成功', 
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        data: {
          type: 'object',
          properties: {
            imageId: { type: 'string', example: '12345678' },
            url: { type: 'string', example: 'https://pri-cdn-oss.chuangkit.com/svg_build/render_result/12345678' }
          }
        },
        message: { type: 'string', example: '图片上传成功' }
      }
    }
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { fileName?: string },
    @Req() req: Request
  ) {
    try {
      if (!file) {
        return {
          code: 400,
          data: null,
          message: '未检测到上传的文件'
        };
      }
      
      const fileName = body.fileName || file.originalname || 'upload.png';
      const contentType = file.mimetype || 'image/png';
      
      return this.imageGeneratorService.uploadImage(
        file.buffer,
        fileName,
        contentType
      );
    } catch (error) {
      console.error('上传图片控制器出错:', error);
      return {
        code: 500,
        data: null,
        message: error.message || '上传图片失败'
      };
    }
  }
} 