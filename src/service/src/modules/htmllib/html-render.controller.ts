import { Body, Controller, Post, HttpException, HttpStatus, Header, Res, Get, Param, Delete, Query, Logger } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { HtmlRenderService } from './html-render.service';
import { HtmlRenderDto, TextReplacementItem, SvgToImageDto } from './dto/htmllib-render.dto';
import { Public } from '../../decorators/public.decorator';
import { Response } from 'express';
import { RenderTemplateToImageDto } from './renderTemplateToImage.dto';
import { AsyncRenderDto, AsyncRenderResponseDto, TaskQueryDto } from './dto/async-render.dto';
import * as QRCode from 'qrcode';

@ApiTags('HTML模板渲染')
@Controller('html-render')
@Public()
export class HtmlRenderController {
  private readonly logger = new Logger(HtmlRenderController.name);

  constructor(
    private readonly htmlRenderService: HtmlRenderService
  ) {}
  
  @ApiOperation({ summary: '返回替换后的HTML代码或将其转换为图片' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 404, description: '模板未找到' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  @Post('html-code')
  async getHtmlCode(@Body() renderDto: HtmlRenderDto, @Res() response: Response) {
    // 调用带重试机制的函数
    return await this.getHtmlCodeWithRetry(renderDto, response, 0);
  }

  // 辅助函数：带重试机制的HTML生成
  private async getHtmlCodeWithRetry(renderDto: HtmlRenderDto, response: Response, retryCount: number) {
    try {
      // 确定处理参数
      const textMode = renderDto.textMode === true;
      const generateAiContent = renderDto.generateAiContent === true;
      const content = renderDto.content || ''; // 获取content字段内容
      const convertToImage = renderDto.convertToImage === true; // 是否转换为图片
      const useId = renderDto.useId === true; // 是否通过ID进行元素文本替换
      
      // 获取HTML内容
      const result = await this.htmlRenderService.renderTemplateToHtml(
        renderDto.templateName || '', // 允许templateName为空，服务层会随机选择一个模板
        renderDto.imageUrls || [],
        renderDto.textReplacements || [],
        renderDto.wrapHtml !== undefined ? renderDto.wrapHtml : false, // 默认不包装HTML，除非明确指定
        generateAiContent, // 传入AI内容生成参数
        content, // 传入content内容
        useId // 传入useId参数
      );
      
      // 处理HTML内容
      let htmlContent = result.html;
   
      // 如果启用了转换为图片选项
      if (convertToImage) {
        try {
          // 使用htmlToImage服务将HTML转换为图片
          const imageResult = await this.htmlRenderService.htmlToImage(htmlContent, {
            width: renderDto.imageOptions?.width,
            height: renderDto.imageOptions?.height,
            quality: renderDto.imageOptions?.quality,
            type: renderDto.imageOptions?.type,
            uploadToSuperbed: renderDto.imageOptions?.uploadToSuperbed
          });
          
          // 返回图片URL信息
          return response.json({
            success: true,
            data: {
              templateName: result.templateName,
              imageUrl: imageResult.superImageUrl || imageResult.url,
              localUrl: imageResult.url,
              fileName: imageResult.fileName
            }
          });
        } catch (error) {
          // 如果转换图片失败且还有重试机会，则重试
          if (retryCount < 3) {
            this.logger.error(`HTML转图片失败，将在${Math.pow(2, retryCount) * 5}秒后重试 (尝试 ${retryCount + 1}/4): ${error.message}`);
            
            // 使用指数退避策略计算延迟时间
            const delaySeconds = Math.pow(2, retryCount) * 5; // 5秒, 10秒, 20秒
            
            // 延迟后重试
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(this.getHtmlCodeWithRetry(renderDto, response, retryCount + 1));
              }, delaySeconds * 1000);
            });
          }
          
          // 已达到最大重试次数，返回错误
          return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: `HTML转图片失败 (已重试${retryCount}次): ${error.message}`
          });
        }
      }
      
      // 如果启用了纯文本模式或需要直接输出HTML而非JSON
      if (textMode || renderDto.rawHtml === true) {
        // 设置内容类型为text/html或text/plain
        response.setHeader('Content-Type', textMode ? 'text/plain; charset=utf-8' : 'text/html; charset=utf-8');
        // 直接返回HTML内容
        return response.send(htmlContent);
      }
      
      // 正常JSON响应，包含模板名称（如果存在）
      const responseData: any = {
        success: true,
        data: {
          html: htmlContent
        }
      };
      
      // 如果是随机选择的模板，添加模板名称到响应
      if (result.templateName) {
        responseData.data.templateName = result.templateName;
      }
      
      return response.json(responseData);
    } catch (error) {
      // 检查是否还有重试机会
      if (retryCount < 3) {
        this.logger.error(`HTML生成失败，将在${Math.pow(2, retryCount) * 5}秒后重试 (尝试 ${retryCount + 1}/4): ${error.message}`);
        
        // 使用指数退避策略计算延迟时间
        const delaySeconds = Math.pow(2, retryCount) * 5; // 5秒, 10秒, 20秒
        
        // 延迟后重试
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(this.getHtmlCodeWithRetry(renderDto, response, retryCount + 1));
          }, delaySeconds * 1000);
        });
      }
      
      // 已达到最大重试次数，返回错误
      const statusCode = error instanceof HttpException 
        ? error.getStatus() 
        : HttpStatus.INTERNAL_SERVER_ERROR;
        
      const errorMessage = error instanceof HttpException
        ? error.message
        : `HTML生成失败 (已重试${retryCount}次): ${error.message}`;
        
      return response.status(statusCode).json({
        success: false,
        message: errorMessage
      });
    }
  }

  @ApiOperation({ summary: '获取模板详情，包括可替换的文本列表' })
  @ApiResponse({ 
    status: 200, 
    description: '返回模板详情',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { 
          type: 'object',
          properties: {
            name: { type: 'string', example: 'pic_4_1' },
            htmlCode: { type: 'string', example: '<!DOCTYPE html>...' },
            imageCount: { type: 'number', example: 4 },
            textDetails: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['可替换文本1', '超级好用的产品']
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: '模板未找到' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  @ApiParam({ name: 'name', description: '模板名称' })
  @Get('template-details/:name')
  async getTemplateDetails(@Param('name') templateName: string) {
    try {
      // 查找模板
      const template = await this.htmlRenderService.getTemplateByName(templateName);
      
      // 解析textDetails，确保是数组格式
      let textDetailsArray = [];
      if (template.textDetails) {
        try {
          textDetailsArray = JSON.parse(template.textDetails);
        } catch (error) {
          console.error(`解析模板${templateName}的textDetails失败:`, error.message);
        }
      }
      
      // 构建返回结果
      return {
        success: true,
        data: {
          id: template.id,
          name: template.name,
          htmlCode: template.htmlCode,
          imageCount: template.imageCount,
          textDetails: textDetailsArray,
          status: template.status
        }
      };
    } catch (error) {
      const statusCode = error instanceof HttpException 
        ? error.getStatus() 
        : HttpStatus.INTERNAL_SERVER_ERROR;
        
      const errorMessage = error instanceof HttpException
        ? error.message
        : '获取模板详情失败';
        
      throw new HttpException({
        success: false,
        message: errorMessage
      }, statusCode);
    }
  }

  @ApiOperation({ summary: '将HTML字符串转换为图片' })
  @ApiResponse({ 
    status: 200, 
    description: '返回图片URL和信息',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { 
          type: 'object',
          properties: {
            url: { type: 'string', example: '/uploads/html-images/abc123.png' },
            fileName: { type: 'string', example: 'abc123.png' },
            filePath: { type: 'string', example: '/app/uploads/html-images/abc123.png' },
            superImageUrl: { type: 'string', example: 'https://pic1.superbed.cn/abc123.png', description: '上传到Super图床后的URL' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['html'],
      properties: {
        html: { type: 'string', description: 'HTML字符串' },
        width: { type: 'number', description: '图片宽度（可选，未指定时自动从HTML识别）' },
        height: { type: 'number', description: '图片高度（可选，未指定时自动计算）' },
        quality: { type: 'number', description: '图片质量(1-100)' },
        type: { type: 'string', enum: ['jpeg', 'png'], description: '图片类型' },
        selector: { type: 'string', description: '选择器，用于指定转换HTML中的特定元素' },
        uploadToSuperbed: { type: 'boolean', description: '是否上传到Super图床（默认为true）' },
        useAutoDetect: { type: 'boolean', description: '是否自动检测HTML宽高（默认为true）' }
      },
    },
  })
  @Post('to-image')
  async htmlToImage(@Body() body: {
    html: string;
    width?: number;
    height?: number;
    quality?: number;
    type?: 'jpeg' | 'png';
    selector?: string;
    uploadToSuperbed?: boolean;
    useAutoDetect?: boolean;
  }) {
    try {
      if (!body.html) {
        throw new HttpException('HTML内容不能为空', HttpStatus.BAD_REQUEST);
      }

      // 设置默认值：如果useAutoDetect未明确设置为false，则启用自动检测
      const useAutoDetect = body.useAutoDetect !== false;
      
      this.logger.log(`将HTML转换为图片，自动检测宽高: ${useAutoDetect}`);

      const result = await this.htmlRenderService.htmlToImage(body.html, {
        width: body.width,
        height: body.height,
        quality: body.quality,
        type: body.type,
        selector: body.selector,
        uploadToSuperbed: body.uploadToSuperbed,
        useAutoWidth: useAutoDetect
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      const statusCode = error instanceof HttpException 
        ? error.getStatus() 
        : HttpStatus.INTERNAL_SERVER_ERROR;
        
      throw new HttpException({
        success: false,
        message: error.message || 'HTML转图片失败'
      }, statusCode);
    }
  }

  @Post('render-to-image')
  @ApiOperation({ summary: '渲染HTML模板并转换为图片' })
  async renderTemplateToImage(@Body() dto: RenderTemplateToImageDto) {
    try {
      this.logger.log(`接收到渲染模板请求: ${dto.templateName}, 自动宽度检测: ${dto.useAutoWidth !== false}`);
      
      const result = await this.htmlRenderService.renderTemplateToImage(
        dto.templateName,
        dto.imageUrls,
        dto.textReplacements,
        {
          width: dto.width,
          height: dto.height,
          quality: dto.quality,
          type: dto.type,
          selector: dto.selector,
          generateAiContent: dto.generateAiContent,
          content: dto.content,
          uploadToSuperbed: dto.uploadToSuperbed,
          useAutoWidth: dto.useAutoWidth !== false, // 默认开启自动宽度检测
          useId: dto.useId === true // 是否通过ID进行元素文本替换
        }
      );
      
      return { code: 200, msg: '渲染成功', data: result };
    } catch (error) {
      this.logger.error(`渲染模板为图片失败: ${error.message}`);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @ApiOperation({ summary: '删除生成的HTML图片' })
  @ApiParam({ name: 'fileName', description: '图片文件名' })
  @ApiResponse({ status: 200, description: '删除结果' })
  @Delete('image/:fileName')
  async deleteHtmlImage(@Param('fileName') fileName: string) {
    try {
      const result = await this.htmlRenderService.deleteHtmlImage(fileName);
      
      return {
        success: true,
        data: {
          deleted: result
        },
        message: result ? '删除成功' : '文件不存在或删除失败'
      };
    } catch (error) {
      throw new HttpException({
        success: false,
        message: error.message || '删除图片失败'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: '异步渲染HTML模板（创建任务）' })
  @ApiResponse({ 
    status: 200, 
    description: '返回任务ID和状态',
    type: AsyncRenderResponseDto
  })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  @Post('async-html-code')
  async createAsyncHtmlRenderTask(@Body() renderDto: AsyncRenderDto) {
    try {
      // 创建异步渲染任务
      const task = await this.htmlRenderService.createRenderTask(renderDto);
      
      // 返回任务信息
      return {
          taskId: task.taskId,
          status: task.status,
          createdAt: task.createdAt
        }
    } catch (error) {
      const statusCode = error instanceof HttpException 
        ? error.getStatus() 
        : HttpStatus.INTERNAL_SERVER_ERROR;
        
      throw new HttpException({
        success: false,
        message: error.message || '创建异步渲染任务失败'
      }, statusCode);
    }
  }

  @ApiOperation({ summary: '获取异步渲染任务结果' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  @Get('task/:taskId')
  async getTaskResult(@Param() params: TaskQueryDto) {
    try {
      const task = await this.htmlRenderService.getTaskById(params.taskId);
      
      return {
          taskId: task.taskId,
          status: task.status,
          result: task.status === 'completed' ? task.result : null,
          htmlContent: task.status === 'completed' ? task.htmlContent : null,
          errorMessage: task.status === 'failed' ? task.errorMessage : null,
          createdAt: task.createdAt,
          completedAt: task.completedAt
        }
    } catch (error) {
      const statusCode = error instanceof HttpException 
        ? error.getStatus() 
        : HttpStatus.INTERNAL_SERVER_ERROR;
        
      throw new HttpException({
        success: false,
        message: error.message || '获取任务结果失败'
      }, statusCode);
    }
  }

  @ApiOperation({ summary: '获取模板中所有带ID的元素及其文本内容' })
  @ApiResponse({ 
    status: 200, 
    description: '返回模板中所有带ID的元素及其文本内容',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '7512475873321435154' },
              text: { type: 'string', example: '大标题' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: '模板未找到' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  @ApiParam({ name: 'name', description: '模板名称' })
  @Get('template-elements/:name')
  async getTemplateElementsWithId(@Param('name') templateName: string) {
    try {
      // 获取模板中所有带ID的元素及其文本内容
      const elements = await this.htmlRenderService.getTemplateElementsWithId(templateName);
      
      // 构建返回结果
      return {
        success: true,
        data: elements
      };
    } catch (error) {
      const statusCode = error instanceof HttpException 
        ? error.getStatus() 
        : HttpStatus.INTERNAL_SERVER_ERROR;
        
      const errorMessage = error instanceof HttpException
        ? error.message
        : '获取模板元素ID失败';
        
      throw new HttpException({
        success: false,
        message: errorMessage
      }, statusCode);
    }
  }

  @ApiOperation({ summary: '生成带ID元素的文本替换示例' })
  @ApiResponse({ 
    status: 200, 
    description: '返回文本替换示例',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              placeholder: { type: 'string', example: '7512475873321435154' },
              replaceWith: { type: 'string', example: '大标题' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: '模板未找到' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  @ApiParam({ name: 'name', description: '模板名称' })
  @Get('id-replacements/:name')
  async getIdReplacementExample(@Param('name') templateName: string) {
    try {
      // 获取模板中所有带ID的元素及其文本内容
      const elements = await this.htmlRenderService.getTemplateElementsWithId(templateName);
      
      // 过滤掉id为"root"的元素
      const filteredElements = elements.filter(element => element.id !== 'root');
      
      this.logger.log(`获取到${filteredElements.length}个带ID的元素（已过滤root元素）`);
      
      // 将元素ID和文本转换为文本替换格式
      const replacements = filteredElements.map(element => ({
        placeholder: element.id,
        replaceWith: element.text
      }));
      
      // 构建返回结果
      return {
        success: true,
        data: replacements
      };
    } catch (error) {
      const statusCode = error instanceof HttpException 
        ? error.getStatus() 
        : HttpStatus.INTERNAL_SERVER_ERROR;
        
      const errorMessage = error instanceof HttpException
        ? error.message
        : '生成文本替换示例失败';
        
      throw new HttpException({
        success: false,
        message: errorMessage
      }, statusCode);
    }
  }

  @ApiOperation({ summary: '获取所有模板名称列表' })
  @ApiResponse({ 
    status: 200, 
    description: '返回所有模板名称列表',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { 
          type: 'array',
          items: { type: 'string' },
          example: ['模板1', '模板2', '模板3']
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  @Get('template-names')
  async getAllTemplateNames() {
    try {
      // 获取所有模板名称
      const templateNames = await this.htmlRenderService.getAllTemplateNames();
      
      // 构建返回结果
      return {
        success: true,
        data: templateNames
      };
    } catch (error) {
      const statusCode = error instanceof HttpException 
        ? error.getStatus() 
        : HttpStatus.INTERNAL_SERVER_ERROR;
        
      const errorMessage = error instanceof HttpException
        ? error.message
        : '获取模板名称列表失败';
        
      throw new HttpException({
        success: false,
        message: errorMessage
      }, statusCode);
    }
  }

  @ApiOperation({ summary: '随机选择一个模板并获取其中所有带ID的元素及其文本内容' })
  @ApiResponse({ 
    status: 200, 
    description: '返回随机模板名称和带ID的元素列表',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { 
          type: 'object',
          properties: {
            templateName: { type: 'string', example: 'pic_4_1' },
            elements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '7512475873321435154' },
                  text: { type: 'string', example: '大标题' }
                }
              }
            },
            textReplacements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  placeholder: { type: 'string', example: '7512475873321435154' },
                  replaceWith: { type: 'string', example: '大标题' }
                }
              },
              description: '文本替换格式，可直接用于请求参数'
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: '没有可用的模板' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  @Get('random-template-elements')
  async getRandomTemplateWithElements() {
    try {
      // 获取随机模板及其带ID的元素
      const result = await this.htmlRenderService.getRandomTemplateWithElements();
      
      // 构建返回结果
      return {
        success: true,
        data: result
      };
    } catch (error) {
      const statusCode = error instanceof HttpException 
        ? error.getStatus() 
        : HttpStatus.INTERNAL_SERVER_ERROR;
        
      const errorMessage = error instanceof HttpException
        ? error.message
        : '获取随机模板及其元素失败';
        
      throw new HttpException({
        success: false,
        message: errorMessage
      }, statusCode);
    }
  }

  @ApiOperation({ summary: '生成二维码' })
  @ApiResponse({ status: 200, description: '返回二维码图片' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  @ApiQuery({ name: 'data', description: '需要转换为二维码的内容，需要进行encodeURIComponent编码', required: true })
  @ApiQuery({ name: 'size', description: '二维码尺寸，默认为200', required: false })
  @Get('qrcode')
  async generateQRCode(
    @Query('data') data: string, 
    @Query('size') size: string,
    @Res() response: Response
  ) {
    try {
      if (!data) {
        throw new HttpException('二维码内容不能为空', HttpStatus.BAD_REQUEST);
      }

      // 解码URL参数
      const decodedData = decodeURIComponent(data);
      this.logger.log(`生成二维码，原始内容: ${data}, 解码后内容: ${decodedData}`);

      // 解析尺寸参数，默认为300
      const qrSize = size ? parseInt(size, 10) : 300;
      
      // 设置响应头为图片类型
      response.setHeader('Content-Type', 'image/png');
      
      // 生成二维码并直接写入响应流
      QRCode.toFileStream(response, decodedData, {
        type: 'png',
        width: qrSize,
        margin: 1,
        errorCorrectionLevel: 'H'
      });
      
      // 注意：不需要手动结束响应，toFileStream会自动完成
    } catch (error) {
      this.logger.error(`生成二维码失败: ${error.message}`);
      
      // 如果已经设置了内容类型，需要重置
      if (!response.headersSent) {
        response.setHeader('Content-Type', 'application/json');
        
        const statusCode = error instanceof HttpException 
          ? error.getStatus() 
          : HttpStatus.INTERNAL_SERVER_ERROR;
          
        response.status(statusCode).json({
          success: false,
          message: error.message || '生成二维码失败'
        });
      } else {
        response.end();
      }
    }
  }

  @ApiOperation({ summary: '将SVG转换为图片并上传到Super图床' })
  @ApiResponse({
    status: 200,
    description: 'SVG转换成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'SVG转换成功' },
        data: {
          type: 'object',
          properties: {
            fileName: { type: 'string', example: 'svg_abc123.png' },
            url: { type: 'string', example: '/uploads/html-images/svg_abc123.png' },
            superImageUrl: { type: 'string', example: 'https://pic1.superbed.cn/abc123.png' },
            width: { type: 'number', example: 800 },
            height: { type: 'number', example: 600 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  @ApiBody({
    type: SvgToImageDto,
    description: 'SVG转图片参数',
    examples: {
      simple: {
        summary: '简单SVG示例',
        value: {
          svgContent: '<svg width="100" height="100"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" /></svg>',
          width: 800,
          height: 600,
          type: 'png',
          quality: 80,
          uploadToSuperbed: true
        }
      },
      complex: {
        summary: '复杂SVG示例',
        value: {
          svgContent: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="180" height="180" fill="lightblue" stroke="navy" stroke-width="2"/><text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="16" fill="navy">Hello SVG</text></svg>',
          width: 1200,
          height: 1200,
          type: 'png',
          quality: 90,
          uploadToSuperbed: true,
          devicePixelRatio: 2
        }
      }
    }
  })
  @Post('svg-to-image')
  async svgToImage(@Body() svgDto: SvgToImageDto) {
    try {
      this.logger.log(`接收到SVG转图片请求，SVG长度: ${svgDto.svgContent.length}`);

      // 验证SVG内容
      if (!svgDto.svgContent.trim().toLowerCase().includes('<svg')) {
        throw new HttpException('无效的SVG内容，必须包含<svg>标签', HttpStatus.BAD_REQUEST);
      }

      const result = await this.htmlRenderService.svgToImage(svgDto.svgContent, {
        width: svgDto.width,
        height: svgDto.height,
        quality: svgDto.quality,
        type: svgDto.type,
        uploadToSuperbed: svgDto.uploadToSuperbed,
        devicePixelRatio: svgDto.devicePixelRatio
      });

      this.logger.log(`SVG转图片成功: ${result.superImageUrl || result.url}`);

      return {
        success: true,
        message: 'SVG转换成功',
        data: {
          fileName: result.fileName,
          url: result.url,
          superImageUrl: result.superImageUrl,
          localPath: result.filePath
        }
      };
    } catch (error) {
      this.logger.error(`SVG转图片失败: ${error.message}`);

      const statusCode = error instanceof HttpException
        ? error.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

      throw new HttpException({
        success: false,
        message: error.message || 'SVG转图片失败'
      }, statusCode);
    }
  }
}