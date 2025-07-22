import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Res } from '@nestjs/common';
import { XhsService } from './xhs.service';
import { XhsAutoService } from './xhs-auto.service';
import { 
  XhsAutoNoteListDto, 
  XhsAutoNoteDetailDto,
  XhsAutoCreateNoteDto,
  XhsAutoUpdateNoteDto,
  XhsAutoDeleteNoteDto,
  XhsAutoMarkUsedDto,
} from './dto/xhs-auto.dto';
import { SignatureDto } from './dto/xhs-signature.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../decorators/public.decorator';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { GlobalConfigService } from '../globalConfig/globalConfig.service';

@ApiTags('xhs-auto')
@Controller('xhs-auto')
@Public()
export class XhsAutoController {
  constructor(
    private readonly xhsService: XhsService,
    private readonly xhsAutoService: XhsAutoService,
    private readonly globalConfigService: GlobalConfigService
  ) {}

  @Get('signature')
  @ApiOperation({ summary: '获取小红书分享API签名' })
  @ApiResponse({ status: 200, description: '成功获取签名', type: SignatureDto })
  async getSignature() {
    try {
      // 使用XhsAutoService获取签名数据，调用新的方法名
      const signatureData = await this.xhsAutoService.getXhsSignature();
      
      console.log('获取到的签名数据:', signatureData);
      
      return {
        code: 200,
        message: 'success',
        data: signatureData
      };
    } catch (error) {
      return {
        code: 500,
        message: '获取签名数据失败',
        error: error.message
      };
    }
  }

  @Get('notes')
  async getNotes(@Query() query: XhsAutoNoteListDto) {
    const { isUsed, limit, page, identifier, id, platform, isSequential } = query;
    
    // 如果提供了identifier参数，则查询该标识符下的下一篇笔记
    if (identifier) {
      // 直接使用string类型的id，不进行数字转换
      const currentId = id || undefined;
      
      try {
        // 查询符合条件的笔记列表
        const notes = await this.xhsService.findNextByIdentifier(
          identifier, 
          currentId, 
          isUsed, // isUsed是string类型
          platform, // platform参数
          isSequential // 是否按顺序选取笔记
        );
        
        // 确保每个笔记对象都有douyinUsed字段
        const processedNotes = notes.map(note => ({
          ...note,
          douyinUsed: note.douyinUsed !== undefined ? note.douyinUsed : false
        }));
        
        return processedNotes;
      } catch (error) {
        return {
          code: 500,
          message: '查询失败',
          error: error.message
        };
      }
    }
  }

  @Get('notes/:id')
  async getNoteDetail(@Param() params: XhsAutoNoteDetailDto) {
    try {
      const { id } = params;
      const note = await this.xhsService.findOne(id);
      
      if (!note) {
        return {
          code: 404,
          message: '笔记不存在',
          data: null
        };
      }
      
      // 确保douyinUsed字段正确返回
      const result = {
        ...note,
        douyinUsed: note.douyinUsed !== undefined ? note.douyinUsed : false
      };
      
      // 返回处理好的数据格式
      return result;
    } catch (error) {
      return {
        code: 500,
        message: '获取笔记详情失败',
        error: error.message
      };
    }
  }

  @Post('notesBySupplier')
  async createNoteBysupplier(@Body() body: XhsAutoCreateNoteDto) {

    if (!body.supplier) {
      return {
        code: 400,
        message: '渠道商id不能为空',
        data: null
      };
    }

    // 从请求体中获取userId，如果没有则使用默认值1
    const userId = body.userId || 1;
    
    // 从body中分离出不需要保存到数据库的参数（只排除isPublish和platform）
    const { userId: _, isPublish, platform, ...noteData } = body;
    
    // 确保type字段存在
    const postData = {
      ...noteData,
      type: noteData.type || 'normal', // 默认为normal类型
    };
    
    // 根据type类型检查必要字段
    if (postData.type === 'video') {
      // 视频类型必须有video和cover字段
      if (!postData.video) {
        return {
          code: 400,
          message: '视频类型笔记必须提供视频链接',
          data: null
        };
      }
      
      if (!postData.cover) {
        return {
          code: 400,
          message: '视频类型笔记必须提供封面图片链接',
          data: null
        };
      }
      
      // 如果是视频类型，清空images数组
      postData.images = [];
    }
    
    // 创建笔记
    const note = await this.xhsService.create(postData, userId);
    
    // 获取全局配置中的domain
    const domain = await this.globalConfigService.getConfigs(['domain']) || 'https://xhs.aivip1.top';
    
    // 根据参数生成不同的分享链接
    let shareLink = '';
    let acShareLink ='';
    if (note.identifier) {
      acShareLink = `${domain}/chat/#/xhs-auto-api?identifier=${note.identifier}`;
    }

    // 基础链接
    let baseUrl = `${domain}/chat/#/xhs-auto-api?id=${note.id}`;
    
    // 根据参数添加查询参数
    const queryParams = [];
    if (isPublish !== undefined) {
      queryParams.push(`publish=${isPublish}`);
    }
    if (platform) {
      queryParams.push(`platform=${platform}`);
    }
    
    // 组装最终链接
    if (queryParams.length > 0) {
      shareLink = `${baseUrl}&${queryParams.join('&')}`;
    } else {
      shareLink = baseUrl;
    }
    
    // 生成二维码链接
    const qrcodeLink = `https://xhs.aivip1.top/api/html-render/qrcode?data=${encodeURIComponent(shareLink)}`;
    
    return {
      code: 200,
      message: 'success',
      data: {
        ...note,
        shareLink,
        qrcodeLink,
        acShareLink,
      }
    };
  }

  @Post('notes')
  async createNote(@Body() body: XhsAutoCreateNoteDto) {
    // 从请求体中获取userId，如果没有则使用默认值1
    const userId = body.userId || 1;
    
    // 从body中分离出不需要保存到数据库的参数（只排除isPublish和platform）
    const { userId: _, isPublish, platform, ...noteData } = body;
    
    // 确保type字段存在
    const postData = {
      ...noteData,
      type: noteData.type || 'normal', // 默认为normal类型
    };
    
    // 根据type类型检查必要字段
    if (postData.type === 'video') {
      // 视频类型必须有video和cover字段
      if (!postData.video) {
        return {
          code: 400,
          message: '视频类型笔记必须提供视频链接',
          data: null
        };
      }
      
      if (!postData.cover) {
        return {
          code: 400,
          message: '视频类型笔记必须提供封面图片链接',
          data: null
        };
      }
      
      // 如果是视频类型，清空images数组
      postData.images = [];
    }
    
    // 创建笔记
    const note = await this.xhsService.create(postData, userId);
    
    // 获取全局配置中的domain
    const domain = await this.globalConfigService.getConfigs(['domain']) || 'https://xhs.aivip1.top';
    
    // 根据参数生成不同的分享链接
    let shareLink = '';
    let acShareLink ='';
    if (note.identifier) {
      acShareLink = `${domain}/chat/#/xhs-auto-api?identifier=${note.identifier}`;
    }

    // 基础链接
    let baseUrl = `${domain}/chat/#/xhs-auto-api?id=${note.id}`;
    
    // 根据参数添加查询参数
    const queryParams = [];
    if (isPublish !== undefined) {
      queryParams.push(`publish=${isPublish}`);
    }
    if (platform) {
      queryParams.push(`platform=${platform}`);
    }
    
    // 组装最终链接
    if (queryParams.length > 0) {
      shareLink = `${baseUrl}&${queryParams.join('&')}`;
    } else {
      shareLink = baseUrl;
    }
    
    // 生成二维码链接
    const qrcodeLink = `https://xhs.aivip1.top/api/html-render/qrcode?data=${encodeURIComponent(shareLink)}`;
    
    return {
      code: 200,
      message: 'success',
      data: {
        ...note,
        shareLink,
        qrcodeLink,
        acShareLink,
      }
    };
  }

  @Patch('notes/:id')
  async updateNote(@Param('id') id: string, @Body() body: XhsAutoUpdateNoteDto) {
    const note = await this.xhsService.update(id, body);
    return {
      code: 200,
      message: 'success',
      data: note
    };
  }

  @Delete('notes/:id')
  async deleteNote(@Param() params: XhsAutoDeleteNoteDto) {
    const { id } = params;
    await this.xhsService.remove(id);
    return {
      code: 200,
      message: 'success'
    };
  }

  @Post('notes/:id/used')
  async markNoteUsed(
    @Param() params: XhsAutoMarkUsedDto,
    @Query('platform') platform?: string
  ) {
    const { id } = params;
    await this.xhsService.markUsed(id, platform);
    return {
      code: 200,
      message: 'success'
    };
  }

  @Post('notes/:id/discard')
  @ApiOperation({ summary: '标记小红书帖子为弃用状态' })
  @ApiResponse({ status: 200, description: '标记为弃用成功' })
  async markNoteDiscarded(
    @Param() params: XhsAutoMarkUsedDto
  ) {
    try {
      const { id } = params;
      await this.xhsService.markDiscarded(id);
      return {
        code: 200,
        message: '标记为弃用成功',
        data: { id }
      };
    } catch (error) {
      return {
        code: 500,
        message: '标记为弃用失败',
        error: error.message
      };
    }
  }

  @Get('template')
  @ApiOperation({ summary: '下载小红书帖子导入模板' })
  async downloadTemplate(@Res() res: Response) {
    try {
      // 创建工作簿和工作表
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'XHS Auto API';
      workbook.lastModifiedBy = 'XHS Auto API';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      const worksheet = workbook.addWorksheet('小红书帖子导入模板');
      
      // 定义列
      worksheet.columns = [
        { header: '标题', key: 'title', width: 30 },
        { header: '内容', key: 'content', width: 50 },
        { header: '类型', key: 'type', width: 15 },
        { header: '图片URL1', key: 'image1', width: 50 },
        { header: '图片URL2', key: 'image2', width: 50 },
        { header: '图片URL3', key: 'image3', width: 50 },
        { header: '图片URL4', key: 'image4', width: 50 },
        { header: '图片URL5', key: 'image5', width: 50 },
        { header: '图片URL6', key: 'image6', width: 50 },
        { header: '图片URL7', key: 'image7', width: 50 },
        { header: '图片URL8', key: 'image8', width: 50 },
        { header: '图片URL9', key: 'image9', width: 50 },
        { header: '视频URL', key: 'video', width: 50 },
        { header: '封面URL', key: 'cover', width: 50 },
      ];
      
      // 设置第一行样式
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, size: 12 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.commit();

      // 添加示例数据 - 图文类型
      worksheet.addRow({
        title: '图文笔记示例标题',
        content: '这是一个图文笔记的内容示例，可以描述产品、分享心得等',
        type: 'normal',
        image1: 'https://example.com/image1.jpg',
        image2: 'https://example.com/image2.jpg',
        image3: 'https://example.com/image3.jpg'
      });

      // 添加示例数据 - 视频类型
      worksheet.addRow({
        title: '视频笔记示例标题',
        content: '这是一个视频笔记的内容示例，一般只需要一张封面图',
        type: 'video',
        video: 'https://example.com/video.mp4',
        cover: 'https://example.com/video-cover.jpg'
      });
      
      // 添加说明
      worksheet.addRow([]); // 空行
      const noteRow = worksheet.addRow(['注意事项']);
      noteRow.font = { bold: true, size: 12 };
      noteRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFD700' }
      };
      
      // 添加说明文本
      worksheet.addRow(['1. 类型字段只能填写 normal 或 video，分别对应图文帖子和视频帖子']);
      worksheet.addRow(['2. 图文帖子可以包含1-9张图片，视频帖子必须包含视频URL和封面图片URL']);
      worksheet.addRow(['3. 标题和内容至少填写一项']);
      worksheet.addRow(['4. 所有图片URL必须是有效的图片地址']);
      worksheet.addRow(['5. 视频URL必须是有效的视频文件地址']);

      // 设置响应头
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=xhs_note_template.xlsx');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      
      // 将工作簿写入响应
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).json({ 
        code: 500,
        message: '生成模板失败',
        error: error.message 
      });
    }
  }

  @Get('douyin-schema/:id')
  @ApiOperation({ summary: '获取抖音分享跳转链接' })
  @ApiResponse({ status: 200, description: '成功获取抖音跳转链接' })
  async getDouyinSchema(
    @Param('id') id: string, 
    @Query('userId') userId?: string, 
    @Query('activityId') activityId?: string
  ) {
    try {
      // 验证必要参数
      if (!id) {
        return {
          code: 400,
          message: 'id不能为空',
          data: null
        };
      }
      
      console.log('接收到的请求参数:', { id, userId, activityId });
      
      // 使用XhsAutoService获取抖音跳转链接
      const schemaData = await this.xhsAutoService.getDouyinSchema(id, userId, activityId);
      
      return {
        code: 200,
        message: 'success',
        data: schemaData
      };
    } catch (error) {
      console.error('获取抖音跳转链接失败:', error);
      
      // 根据错误类型返回不同的状态码
      if (error.message === '笔记不存在') {
        return {
          code: 404,
          message: '笔记不存在',
          error: error.message
        };
      }
      
      return {
        code: 500,
        message: '获取抖音跳转链接失败',
        error: error.message
      };
    }
  }
} 