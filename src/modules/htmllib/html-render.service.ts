import { Injectable, Logger, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HtmlTemplateEntity } from './htmllib.entity';
import { TextReplacementItem } from './dto/htmllib-render.dto';
import * as cheerio from 'cheerio';
import { OpenAIChatService } from '../ai/openaiChat.service';
import { GlobalConfigService } from '../globalConfig/globalConfig.service';
import { AiApiService } from '../ai/ai_api.service';
import { ImageUploadService } from '../ai/image-upload.service';
import nodeHtmlToImage from 'node-html-to-image';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { RenderTask } from './entities/render-task.entity';
import { v4 as uuidv4 } from 'uuid';

/**
 * HTML渲染服务
 * 
 * 更新日志:
 * - 2024-05-26: 添加超时处理和重试机制
 *   - 为renderTemplateToHtml方法添加20秒超时限制和3次重试机制
 *   - 为htmlToImage方法添加20秒超时限制和3次重试机制
 *   - 为processRenderTask方法添加超时处理和重试机制
 *   - 超时错误会在日志中记录并进行重试
 */
@Injectable()
export class HtmlRenderService {
  private readonly logger = new Logger(HtmlRenderService.name);
  // 保存最近选择的三个模板ID
  private recentlyUsedTemplateIds: number[] = [];
  // HTML转图片输出目录
  private readonly imageOutputDir = path.join(process.cwd(), 'uploads', 'html-images');

  constructor(
    @InjectRepository(HtmlTemplateEntity)
    private readonly htmlTemplateRepository: Repository<HtmlTemplateEntity>,
    @InjectRepository(RenderTask)
    private readonly renderTaskRepository: Repository<RenderTask>,
    private readonly openAIChatService: OpenAIChatService,
    private readonly globalConfigService: GlobalConfigService,
    private readonly aiApiService: AiApiService,
    private readonly imageUploadService: ImageUploadService,
  ) {
    // 确保图片输出目录存在
    if (!fs.existsSync(this.imageOutputDir)) {
      fs.mkdirSync(this.imageOutputDir, { recursive: true });
    }
    
    // 检查并设置Chromium浏览器路径
    this.checkAndSetChromiumPath();
    
    // 检查并尝试安装字体
    this.checkAndInstallFonts().catch(err => {
      this.logger.warn(`字体检查/安装过程中出现警告: ${err.message}`);
    });
  }

  /**
   * 检查并设置Chromium浏览器路径
   */
  private checkAndSetChromiumPath(): void {
    try {
      const { existsSync } = require('fs');
      
      // 检查常见的Chromium浏览器路径
      const possiblePaths = [
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable'
      ];
      
      // 查找第一个存在的路径
      for (const path of possiblePaths) {
        if (existsSync(path)) {
          process.env.CHROME_BIN = path;
          this.logger.log(`已设置Chromium浏览器路径: ${path}`);
          return;
        }
      }
      
      this.logger.warn('未找到Chromium浏览器，将在需要时尝试安装');
    } catch (error) {
      this.logger.warn(`检查Chromium浏览器路径时出错: ${error.message}`);
    }
  }

  /**
   * 检查并安装必要的中文字体
   * 这是一个异步操作，不会阻塞服务启动
   */
  private async checkAndInstallFonts(): Promise<void> {
    try {
      const { exec } = require('child_process');
      
      // 检查操作系统类型
      const isLinux = process.platform === 'linux';
      if (!isLinux) {
        this.logger.log('非Linux系统，跳过字体安装检查');
        return;
      }
      
      // 检查是否已安装字体
      this.logger.log('检查系统中文字体...');
      
      // 检查常用中文字体包是否已安装
      exec('fc-list :lang=zh | wc -l', (error, stdout) => {
        const fontCount = parseInt(stdout.trim(), 10);
        
        if (error || fontCount < 5) {
          this.logger.warn(`系统中文字体不足 (检测到${fontCount || 0}个)，尝试安装中文字体包...`);
          
          // 尝试安装字体
          exec('apt-get update && apt-get install -y fonts-wqy-microhei fonts-wqy-zenhei fonts-arphic-ukai fonts-arphic-uming', 
            { maxBuffer: 1024 * 1024 * 10 }, // 增加缓冲区大小
            (installError, installStdout, installStderr) => {
              if (installError) {
                this.logger.error(`安装中文字体失败: ${installError.message}`);
                this.logger.error(installStderr);
              } else {
                this.logger.log('中文字体安装完成，更新字体缓存...');
                
                // 更新字体缓存
                exec('fc-cache -f -v', (cacheError) => {
                  if (cacheError) {
                    this.logger.error(`更新字体缓存失败: ${cacheError.message}`);
                  } else {
                    this.logger.log('字体缓存更新完成');
                  }
                });
              }
            }
          );
        } else {
          this.logger.log(`系统已安装足够的中文字体 (检测到${fontCount}个)`);
        }
      });
    } catch (error) {
      this.logger.error(`检查字体时出错: ${error.message}`);
    }
  }

  // 通过模板名称查找模板
  private async findTemplateByName(templateName: string): Promise<HtmlTemplateEntity> {
    // 如果未提供模板名称，则随机选择一个模板
    if (!templateName) {
      return this.getRandomTemplate();
    }
    
    const template = await this.htmlTemplateRepository.findOne({
      where: { name: templateName},
    });

    if (!template) {
      throw new HttpException(`未找到名称为"${templateName}"的模板或模板未启用`, HttpStatus.NOT_FOUND);
    }
    
    // 确保正确处理textDetails字段
    // 1. 如果textDetails不存在，初始化为空数组的字符串形式
    if (!template.textDetails) {
      template.textDetails = JSON.stringify([]);
    }
    
    // 2. 尝试解析textDetails为数组，供内部使用
    try {
      if (typeof template.textDetails === 'string') {
        // 解析JSON格式的textDetails
        const parsedDetails = JSON.parse(template.textDetails);
        
        // 将解析结果保存回模板对象，但以字符串形式(符合实体定义)
        if (!Array.isArray(parsedDetails) || parsedDetails.length === 0) {
          // 如果解析结果不是数组或为空，尝试从HTML中提取
          const extractedTexts = this.extractReplaceableText(template.htmlCode);
          template.textDetails = JSON.stringify(extractedTexts);
        }
      }
    } catch (error) {
      this.logger.warn(`模板${templateName}的textDetails解析失败: ${error.message}`);
      // 解析失败，尝试从HTML中提取文本
      const extractedTexts = this.extractReplaceableText(template.htmlCode);
      template.textDetails = JSON.stringify(extractedTexts);
    }

    return template;
  }
  
  // 从HTML中提取可能需要替换的文本（备用方法）
  private extractReplaceableText(html: string): string[] {
    try {
      // 加载HTML内容
      const $ = cheerio.load(html);
      
      // 提取所有文本节点内容，可能包含可替换的文本
      const textNodes: string[] = [];
      $('*').each((_, element) => {
        // 只考虑那些直接包含文本的元素
        const $element = $(element);
        const text = $element.contents().filter(function() {
          return this.type === 'text' && $(this).text().trim().length > 0;
        }).text().trim();
        
        if (text && text.length > 0 && !textNodes.includes(text)) {
          // 只添加那些可能是可替换内容的文本
          if (text.length > 3 && text.length < 100) {
            textNodes.push(text);
          }
        }
      });
      
      return textNodes;
    } catch (error) {
      this.logger.error(`从HTML中提取可替换文本失败: ${error.message}`);
      return [];
    }
  }

  // 包装HTML
  private wrapHtml(html: string): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated HTML</title>
</head>
<body>
${html}
</body>
</html>`;
  }

  /**
   * 渲染HTML模板
   * @param templateName 模板名称，如果为空则随机选择一个模板
   * @param imageUrls 图片URL数组
   * @param textReplacements 文本替换项数组
   * @param wrapHtml 是否包装HTML
   * @param generateAiContent 是否生成AI内容
   * @param content 内容
   * @param useId 是否通过ID进行元素文本替换
   * @param retryCount 重试次数，默认为0
   * @returns 渲染结果
   */
  async renderTemplateToHtml(
    templateName: string,
    imageUrls: string[] = [],
    textReplacements: TextReplacementItem[] = [],
    wrapHtml: boolean = true,
    generateAiContent: boolean = false,
    content: string = '',
    useId: boolean = false,
    retryCount: number = 0
  ): Promise<{ html: string; templateName?: string }> {
    // 设置超时时间（毫秒）
    const TIMEOUT = 20000; // 20秒
    const MAX_RETRIES = 3;

    try {
      // 创建一个超时Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('渲染操作超时(20秒)')), TIMEOUT);
      });

      // 创建实际的渲染Promise
      const renderPromise = (async () => {
      // 查找模板
      let template: HtmlTemplateEntity;
      let randomTemplate = false;
      
      if (!templateName) {
        // 如果没有指定模板名称，随机选择一个模板
        template = await this.getRandomTemplate();
        randomTemplate = true;
        
        if (!template) {
          throw new NotFoundException('没有可用的模板');
        }
        
        this.logger.log(`随机选择模板: ${template.name}`);
      } else {
        // 查找指定名称的模板
        template = await this.findTemplateByName(templateName);
        
        if (!template) {
          throw new NotFoundException(`未找到名称为"${templateName}"的模板`);
        }
        
        this.logger.log(`使用指定模板: ${template.name}`);
      }
      
      // 获取HTML代码
      let htmlString = template.htmlCode;
      
      // 包装HTML
      if (wrapHtml && !htmlString.toLowerCase().includes('<!doctype')) {
        htmlString = this.wrapHtml(htmlString);
      }
      
      // 构建结果
      const result: { html: string; templateName?: string } = {
        html: htmlString
      };
      
      // 如果是随机选择的模板，添加模板名称到结果
      if (randomTemplate) {
        result.templateName = template.name;
      }
      
      return result;
      })();

      // 使用Promise.race来实现超时
      return await Promise.race([renderPromise, timeoutPromise]);
    } catch (error) {
      this.logger.error(`渲染HTML模板失败 (尝试 ${retryCount + 1}/${MAX_RETRIES + 1}): ${error.message}`);
      
      // 如果是超时错误或其他错误，且未超过最大重试次数，则重试
      if (retryCount < MAX_RETRIES) {
        this.logger.log(`超时或错误，进行第 ${retryCount + 1} 次重试...`);
        // 递归调用自身，增加重试计数
        return this.renderTemplateToHtml(
          templateName,
          imageUrls,
          textReplacements,
          wrapHtml,
          generateAiContent,
          content,
          useId,
          retryCount + 1
        );
      }

      // 超过最大重试次数，抛出异常
      throw new HttpException(
        `渲染HTML模板失败，已重试${MAX_RETRIES}次: ${error.message}`, 
        error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 获取随机模板，确保近期三次选择不重复
  private async getRandomTemplate(): Promise<HtmlTemplateEntity> {
    // 查询所有启用状态的模板
    const allTemplates = await this.htmlTemplateRepository.find({
      where: { status: 1 },
    });

    if (!allTemplates || allTemplates.length === 0) {
      throw new HttpException('没有可用的模板', HttpStatus.NOT_FOUND);
    }

    // 如果可用模板数量少于或等于3个，直接随机选择一个
    if (allTemplates.length <= 3) {
      const randomIndex = Math.floor(Math.random() * allTemplates.length);
      const selectedTemplate = allTemplates[randomIndex];

      // 更新最近使用的模板列表
      this.updateRecentlyUsedTemplates(selectedTemplate.id);

      return selectedTemplate;
    }

    // 过滤掉最近使用的模板
    const availableTemplates = allTemplates.filter(template =>
      !this.recentlyUsedTemplateIds.includes(template.id)
    );

    // 如果过滤后没有可用模板（极少情况），从全部模板中随机选择
    if (availableTemplates.length === 0) {
      const randomIndex = Math.floor(Math.random() * allTemplates.length);
      const selectedTemplate = allTemplates[randomIndex];

      // 更新最近使用的模板列表
      this.updateRecentlyUsedTemplates(selectedTemplate.id);

      return selectedTemplate;
    }

    // 从过滤后的模板中随机选择一个
    const randomIndex = Math.floor(Math.random() * availableTemplates.length);
    const selectedTemplate = availableTemplates[randomIndex];

    // 更新最近使用的模板列表
    this.updateRecentlyUsedTemplates(selectedTemplate.id);

    this.logger.log(`随机选择了模板: "${selectedTemplate.name}"`);

    return selectedTemplate;
  }

  // 更新最近使用的模板ID列表
  private updateRecentlyUsedTemplates(templateId: number): void {
    // 添加新的模板ID到列表头部
    this.recentlyUsedTemplateIds.unshift(templateId);

    // 保持列表最多只有3个元素
    if (this.recentlyUsedTemplateIds.length > 3) {
      this.recentlyUsedTemplateIds.pop();
    }

    this.logger.log(`更新最近使用的模板列表: [${this.recentlyUsedTemplateIds.join(', ')}]`);
  }

  // 公开方法：通过模板名称获取模板信息
  async getTemplateByName(templateName: string): Promise<HtmlTemplateEntity> {
    return this.findTemplateByName(templateName);
  }

  /**
   * 将HTML字符串转换为图片
   * @param html HTML字符串
   * @param options 转换选项
   * @param retryCount 重试次数，默认为0
   * @returns 图片路径信息
   */
  async htmlToImage(html: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    type?: 'jpeg' | 'png';
    selector?: string;
    uploadToSuperbed?: boolean; // 是否上传到super图床
    useAutoWidth?: boolean; // 是否使用自适应宽度
  }, retryCount: number = 0): Promise<{ filePath: string; fileName: string; url: string; superImageUrl?: string }> {
    // 设置超时时间（毫秒）
    const TIMEOUT = 20000; // 20秒
    const MAX_RETRIES = 3;

    try {
      // 创建一个超时Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('HTML转图片操作超时(20秒)')), TIMEOUT);
      });

      // 创建实际的转换Promise
      const convertPromise = (async () => {
      // 设置默认值
      const useAutoWidth = options?.useAutoWidth !== false; // 默认启用自动宽度检测
      const uploadToSuperbed = options?.uploadToSuperbed !== false; // 默认上传到super图床
      const imageType = options?.type || 'png';
      const imageQuality = options?.quality || 80;

      this.logger.log(`开始执行HTML到图片的转换（${useAutoWidth ? '自适应宽度模式' : '固定宽度模式'}）`);

      // 创建一个随机的文件名
      const fileName = `${crypto.randomBytes(16).toString('hex')}.${imageType}`;
      const filePath = path.join(this.imageOutputDir, fileName);

      this.logger.log(`生成的文件名: ${fileName}`);
      this.logger.log(`文件保存路径: ${filePath}`);

      // 使用node-html-to-image库将HTML转换为图片
      const puppeteerArgs = [
          '--no-sandbox',
          '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-features=site-per-process',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--allow-file-access-from-files'
      ];

      // 如果是在Docker环境中运行，添加额外的参数
      if (process.env.DOCKER_ENV === 'true') {
        puppeteerArgs.push('--disable-dev-shm-usage');
        puppeteerArgs.push('--disable-software-rasterizer');
        this.logger.log(`检测到Docker环境，添加额外的Puppeteer参数`);
      }

      // 设置转换选项
      const convertOptions: any = {
        output: filePath,
        puppeteerArgs: {
          args: puppeteerArgs,
          defaultViewport: null, // 使用页面默认视口
          executablePath: process.env.CHROME_BIN || '/usr/bin/chromium-browser' // 使用环境变量中的Chrome路径或指定的路径
        },
        type: imageType,
        quality: imageQuality,
        encoding: 'binary',
        html: html,
        waitUntil: ['load', 'networkidle0', 'domcontentloaded'],
        transparent: imageType === 'png'
      };

      // 如果指定了选择器，则只截取选择器对应的元素
      if (options?.selector) {
        convertOptions.selector = options.selector;
        this.logger.log(`使用选择器截图: ${options.selector}`);
      }

      this.logger.log(`开始执行HTML到图片的转换...`);

        // 执行转换
      await nodeHtmlToImage(convertOptions);

      this.logger.log(`HTML转图片成功: ${filePath}`);

      // 构建URL路径
      const urlPath = `/uploads/html-images/${fileName}`;

      // 如果需要上传到Super图床
      let superImageUrl: string | undefined;
      if (uploadToSuperbed) {
        try {
          this.logger.log(`开始上传图片到Super图床...`);
          // 上传到Super图床
          const uploadResult = await this.imageUploadService.uploadToPicgo(filePath);
          if (uploadResult && uploadResult.original_url) {
            superImageUrl = uploadResult.original_url;
            this.logger.log(`图片已上传到Super图床: ${superImageUrl}`);
          } else {
            this.logger.warn(`上传到Super图床返回空结果`);
          }
        } catch (error) {
          this.logger.error(`上传到Super图床失败: ${error.message}`);
        }
      }

      // 返回结果
      return {
        filePath,
        fileName,
        url: urlPath,
        superImageUrl
      };
      })();

      // 使用Promise.race来实现超时
      return await Promise.race([convertPromise, timeoutPromise]);
    } catch (error) {
      this.logger.error(`HTML转图片失败 (尝试 ${retryCount + 1}/${MAX_RETRIES + 1}): ${error.message}`);
      this.logger.error(`错误堆栈: ${error.stack}`);

      // 如果是超时错误或其他错误，且未超过最大重试次数，则重试
      if (retryCount < MAX_RETRIES) {
        this.logger.log(`超时或错误，进行第 ${retryCount + 1} 次重试...`);

        // 如果是超时错误，等待1秒后重试
        if (error.message && error.message.includes('超时')) {
          this.logger.log('超时错误，等待1秒后重试...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 递归调用自身，增加重试计数
        return this.htmlToImage(html, options, retryCount + 1);
      }

      // 超过最大重试次数，抛出异常
      throw new HttpException(
        `HTML转图片失败，已重试${MAX_RETRIES}次: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
