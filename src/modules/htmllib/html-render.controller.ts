import { Body, Controller, Post, HttpException, HttpStatus, Header, Res, Get, Param, Delete, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { HtmlRenderService } from './html-render.service';
import { HtmlRenderDto, TextReplacementItem } from './dto/htmllib-render.dto';
import { Public } from '../../decorators/public.decorator';
import { Response } from 'express';

@ApiTags('HTML模板渲染')
@Controller('html-render')
@Public()
export class HtmlRenderController {
  constructor(
    private readonly htmlRenderService: HtmlRenderService
  ) {}
  
  @ApiOperation({ summary: '返回替换后的HTML代码或将其转换为图片' })
  @ApiResponse({ 
    status: 200, 
    description: '根据参数返回HTML代码或图片URL',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { 
          type: 'object',
          properties: {
            html: { type: 'string', example: '<div>替换后的HTML内容</div>' },
            templateName: { type: 'string', example: '商品详情页', description: '使用的模板名称（随机模式下会返回）' },
            imageUrl: { type: 'string', example: 'https://pic1.superbed.cn/abc123.png', description: '当convertToImage=true时返回' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 404, description: '模板未找到' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        templateName: { type: 'string', description: '模板名称（可选，未提供时随机选择）' },
        imageUrls: { type: 'array', items: { type: 'string' }, description: '替换的图片URL数组' },
        textReplacements: { 
          type: 'array', 
          items: { 
            type: 'object',
            properties: {
              placeholder: { type: 'string', description: '要替换的文本' },
              replaceWith: { type: 'string', description: '替换成的文本' }
            }
          },
          description: '文本替换项' 
        },
        wrapHtml: { type: 'boolean', description: '是否包装HTML（添加DOCTYPE等）' },
        textMode: { type: 'boolean', description: '是否以纯文本格式返回HTML' },
        rawHtml: { type: 'boolean', description: '是否直接输出HTML而非JSON' },
        generateAiContent: { type: 'boolean', description: '是否使用AI生成内容' },
        content: { type: 'string', description: 'AI生成内容的参考文本' },
        convertToImage: { type: 'boolean', description: '是否将HTML转换为图片并返回图片URL' },
        imageOptions: { 
          type: 'object', 
          properties: {
            width: { type: 'number', description: '图片宽度' },
            height: { type: 'number', description: '图片高度' },
            quality: { type: 'number', description: '图片质量' },
            type: { type: 'string', enum: ['jpeg', 'png'], description: '图片格式' },
            uploadToSuperbed: { type: 'boolean', description: '是否上传到Super图床' }
          },
          description: '图片转换选项'
        }
      }
    }
  })
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
      
      // 获取HTML内容
      const result = await this.htmlRenderService.renderTemplateToHtml(
        renderDto.templateName || '', // 允许templateName为空，服务层会随机选择一个模板
        renderDto.imageUrls || [],
        renderDto.textReplacements || [],
        renderDto.wrapHtml !== undefined ? renderDto.wrapHtml : false, // 默认不包装HTML，除非明确指定
        generateAiContent, // 传入AI内容生成参数
        content // 传入content内容
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
          // 如果转换图片失败，返回错误
          return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: `HTML转图片失败: ${error.message}`
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
        console.log(`HTML生成失败，${10}秒后进行第${retryCount + 1}次重试...`);
        
        // 等待10秒后重试
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(this.getHtmlCodeWithRetry(renderDto, response, retryCount + 1));
          }, 10000);
        });
      }
      
      // 已达到最大重试次数，返回错误
      const statusCode = error instanceof HttpException 
        ? error.getStatus() 
        : HttpStatus.INTERNAL_SERVER_ERROR;
        
      const errorMessage = error instanceof HttpException
        ? error.message
        : `HTML生成失败 (已重试${retryCount}次)`;
        
      return response.status(statusCode).json({
        success: false,
        message: errorMessage
      });
    }
  }

  // ... 其他方法保持不变
// ... existing code ...
} 