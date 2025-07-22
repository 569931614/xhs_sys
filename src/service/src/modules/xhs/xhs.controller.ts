import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { XhsService } from './xhs.service';
import { CreateXhsPostDto, UpdateXhsPostDto, XhsPostListDto } from './dto/xhs.dto';
import { JwtAuthGuard } from '../../common/auth/jwtAuth.guard';
import { Request, Response } from 'express';
import * as ExcelJS from 'exceljs';
import { FileInterceptor } from '@nestjs/platform-express';

// 临时定义Multer.File类型，避免类型错误
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer: Buffer;
}

@ApiTags('小红书')
@Controller('xhs')
export class XhsController {
  constructor(private readonly xhsService: XhsService) {}

  @Post()
  @ApiOperation({ summary: '创建小红书帖子' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Body() createXhsPostDto: CreateXhsPostDto, @Req() req: Request) {
    // 从JWT中获取用户ID并设置到DTO
    const userId = req.user.id;
    createXhsPostDto.userId = userId;
    
    // 记录请求信息以便调试
    console.log('创建小红书帖子请求:', {
      body: createXhsPostDto,
      query: req.query,
      hasActivityId: !!createXhsPostDto.activityId
    });
    
    return {
      code: 200,
      message: '创建成功',
      data: await this.xhsService.create(createXhsPostDto, userId),
    };
  }

  @Get()
  @ApiOperation({ summary: '获取小红书帖子列表' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(@Query() query: XhsPostListDto, @Req() req: Request) {
    // 根据查询参数确定是否应用用户ID过滤
    const { isUsed } = query;
    let params = { ...query };
    
    // 如果查询自己的帖子，添加用户ID
    params.userId = req.user.id;
    
    return {
      code: 200,
      message: '获取成功',
      data: await this.xhsService.findAll(params),
    };
  }

  @Post('import')
  @ApiOperation({ summary: '导入Excel批量创建小红书帖子' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(@UploadedFile() file: MulterFile, @Req() req: Request) {
    try {
      if (!file) {
        return {
          code: 400,
          message: '请上传Excel文件',
          data: null,
        };
      }

      // 从JWT中获取用户ID
      const userId = req.user.id;

      // 读取Excel文件
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      
      // 获取第一个工作表
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        return {
          code: 400,
          message: 'Excel文件格式错误：找不到工作表',
          data: null,
        };
      }

      // 准备存储解析结果
      const posts = [];
      const validationErrors = [];
      let totalRows = 0;
      let validRows = 0;

      // 获取活动ID参数（可选）- 使用字符串类型
      const activityId = req.query.activityId ? String(req.query.activityId) : null;
      
      // 跳过表头，从第2行开始读取数据
      worksheet.eachRow({ includeEmpty: false }, (row, rowIndex) => {
        if (rowIndex === 1) return; // 跳过表头
        
        totalRows++;
        let isRowValid = true;

        // 获取单元格数据
        const rowData = {
          title: row.getCell(1).text.trim(),
          content: row.getCell(2).text.trim(),
          type: row.getCell(3).text.trim(),
          image1: row.getCell(4).text.trim(),
          image2: row.getCell(5).text.trim(),
          image3: row.getCell(6).text.trim(),
          image4: row.getCell(7).text.trim(),
          image5: row.getCell(8).text.trim(),
          image6: row.getCell(9).text.trim(),
          image7: row.getCell(10).text.trim(),
          image8: row.getCell(11).text.trim(),
          image9: row.getCell(12).text.trim(),
        };

        // 准备有效的帖子数据
        const validPost = {
          title: '',
          content: '',
          type: 'normal' as 'normal' | 'video',
          images: [] as string[],
          userId: userId,
        };
        
        // 如果有活动ID，添加到数据中
        if (activityId) {
          validPost['activityId'] = activityId;
        }

        // 验证标题和内容(至少有一个不为空)
        if (!rowData.title && !rowData.content) {
          validationErrors.push(`第${rowIndex}行: 标题和内容至少填写一项`);
          isRowValid = false;
        } else {
          validPost.title = rowData.title || '';
          validPost.content = rowData.content || '';
        }

        // 验证和规范化类型值
        if (!rowData.type || (rowData.type !== 'normal' && rowData.type !== 'video')) {
          validationErrors.push(`第${rowIndex}行: 类型必须是 "normal"(图文) 或 "video"(视频)`);
          isRowValid = false;
        } else {
          validPost.type = rowData.type as 'normal' | 'video';
        }

        // 收集有效的图片URL
        const imageUrls = [
          rowData.image1, rowData.image2, rowData.image3, rowData.image4, 
          rowData.image5, rowData.image6, rowData.image7, rowData.image8, rowData.image9
        ].filter(url => url && url.trim() !== '');

        // 根据类型验证图片数量
        if (rowData.type === 'normal') {
          // 图文帖子：1-9张图片
          if (imageUrls.length === 0) {
            validationErrors.push(`第${rowIndex}行: 图文帖子至少需要1张图片`);
            isRowValid = false;
          } else if (imageUrls.length > 9) {
            validationErrors.push(`第${rowIndex}行: 图文帖子最多只能有9张图片`);
            isRowValid = false;
          } else {
            validPost.images = imageUrls;
          }
        } else if (rowData.type === 'video') {
          // 视频帖子：只能有1张封面图
          if (imageUrls.length !== 1) {
            validationErrors.push(`第${rowIndex}行: 视频帖子只能有1张封面图`);
            isRowValid = false;
          } else {
            validPost.images = imageUrls;
          }
        }

        // 如果行数据有效，添加到待创建列表
        if (isRowValid) {
          validRows++;
          posts.push(validPost);
        }
      });

      // 如果没有有效数据，返回错误
      if (posts.length === 0) {
        return {
          code: 400,
          message: '导入失败：没有有效的帖子数据',
          data: {
            total: totalRows,
            success: 0,
            fail: totalRows,
            errors: validationErrors
          },
        };
      }

      // 批量创建帖子
      const createdPosts = [];
      const createErrors = [];

      for (const post of posts) {
        try {
          const createdPost = await this.xhsService.create(post, userId);
          createdPosts.push(createdPost);
        } catch (error) {
          console.error('创建帖子失败:', error);
          createErrors.push(`创建失败: ${error.message || JSON.stringify(error)}`);
        }
      }

      // 返回导入结果
      return {
        code: 200,
        message: createdPosts.length > 0 ? '导入成功' : '导入部分成功',
        data: {
          total: totalRows,
          success: createdPosts.length,
          fail: totalRows - createdPosts.length,
          errors: [...validationErrors, ...createErrors]
        },
      };
    } catch (error) {
      console.error('导入Excel出错:', error);
      return {
        code: 500,
        message: '导入失败: ' + (error.message || '服务器错误'),
        data: null,
      };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '获取小红书帖子详情' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('id') id: string) {
    return {
      code: 200,
      message: '获取成功',
      data: await this.xhsService.findOne(id),
    };
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: '更新小红书帖子', 
    description: '修改已生成的笔记，支持更新标题、正文内容和图片' 
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({
    description: '可以更新笔记的标题、内容和图片',
    type: UpdateXhsPostDto,
    examples: {
      '修改标题和内容': {
        value: {
          title: '新的笔记标题',
          content: '新的笔记内容'
        }
      },
      '修改图片': {
        value: {
          images: ['http://example.com/image1.jpg', 'http://example.com/image2.jpg']
        }
      },
      '全部修改': {
        value: {
          title: '新的笔记标题',
          content: '新的笔记内容',
          images: ['http://example.com/image1.jpg', 'http://example.com/image2.jpg']
        }
      }
    }
  })
  async update(@Param('id') id: string, @Body() updateXhsPostDto: UpdateXhsPostDto, @Req() req: Request) {
    // 获取用户ID，以便可以验证权限
    const userId = req.user.id;
    
    // 记录详细请求信息以便调试
    console.log('更新小红书帖子请求:', {
      id,
      userId,
      updateData: {
        title: updateXhsPostDto.title,
        contentPreview: updateXhsPostDto.content ? updateXhsPostDto.content.substring(0, 50) + '...' : null,
        hasContent: !!updateXhsPostDto.content,
        imageCount: updateXhsPostDto.images?.length || 0,
        imageUrls: updateXhsPostDto.images?.slice(0, 2).map(url => url.substring(0, 30) + '...') || []
      },
      headers: req.headers
    });
    
    try {
      console.log(`[1] 开始处理更新请求，ID: ${id}`);
      
      // 先获取原始笔记信息
      console.log(`[2] 获取原始笔记信息，ID: ${id}`);
      const originalPost = await this.xhsService.findOne(id);
      console.log(`[3] 获取原始笔记成功:`, {
        id: originalPost.id,
        userId: originalPost.userId,
        title: originalPost.title,
        hasImages: originalPost.images && originalPost.images.length > 0
      });
      
      // 验证笔记所有权
      if (originalPost.userId !== userId) {
        console.warn(`[4] 权限验证失败: 笔记所有者(${originalPost.userId}) 不匹配请求用户(${userId})`);
        return {
          code: 403,
          message: '无权修改此笔记',
          data: null
        };
      }
      
      console.log(`[5] 权限验证通过`);
      
      // 如果没有提供新图片但原始笔记有图片，保留原始图片
      if (!updateXhsPostDto.images && originalPost.images && originalPost.images.length > 0) {
        console.log(`[6] 保留原始图片:`, originalPost.images.length);
        updateXhsPostDto.images = originalPost.images;
      }
      
      // 执行更新操作
      console.log(`[7] 开始执行更新操作`);
      try {
        const updatedPost = await this.xhsService.update(id, updateXhsPostDto);
        console.log(`[8] 更新成功:`, {
          id: updatedPost.id,
          title: updatedPost.title,
          imageCount: updatedPost.images?.length || 0
        });
    
    return {
      code: 200,
      message: '更新成功',
          data: updatedPost,
        };
      } catch (updateError) {
        console.error(`[8-Error] 更新操作失败:`, updateError);
        if (updateError instanceof Error) {
          console.error(`[8-Error-Detail] 错误名称: ${updateError.name}, 错误消息: ${updateError.message}, 堆栈: ${updateError.stack}`);
        }
        throw updateError; // 重新抛出以便外层捕获
      }
    } catch (error) {
      console.error('[Error] 更新笔记失败:', error);
      
      // 详细记录错误信息
      if (error instanceof Error) {
        console.error(`[Error-Detail] 错误名称: ${error.name}, 错误消息: ${error.message}`);
        console.error(`[Error-Stack] ${error.stack}`);
      } else {
        console.error(`[Error-Unknown] 未知错误类型:`, error);
      }
      
      return {
        code: 500,
        message: `更新失败: ${error.message || '服务器错误'}`,
        data: null
      };
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除小红书帖子' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string, @Req() req: Request) {
    // 获取用户ID，以便可以验证权限
    const userId = req.user.id;
    
    await this.xhsService.remove(id);
    return {
      code: 200,
      message: '删除成功',
      data: null,
    };
  }

  @Post(':id/used')
  @ApiOperation({ summary: '标记小红书帖子为已使用' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async markUsed(@Param('id') id: string) {
    return {
      code: 200,
      message: '标记成功',
      data: await this.xhsService.markUsed(id),
    };
  }

  @Post(':id/discard')
  @ApiOperation({ summary: '标记小红书帖子为弃用' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async markDiscarded(@Param('id') id: string) {
    return {
      code: 200,
      message: '标记为弃用成功',
      data: await this.xhsService.markDiscarded(id),
    };
  }

  @Post(':id/douyin-used')
  @ApiOperation({ summary: '标记小红书帖子为抖音已使用' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async markDouyinUsed(@Param('id') id: string) {
    return {
      code: 200,
      message: '标记为抖音已使用成功',
      data: await this.xhsService.markUsed(id, 'douyin'),
    };
  }
} 