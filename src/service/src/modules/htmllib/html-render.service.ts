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

  // 替换HTML中的文本内容
  private replaceTextInHtml(html: string, textReplacements: TextReplacementItem[], useId: boolean = false): string {
    try {
      // 如果没有替换项，直接返回原始HTML
      if (!textReplacements || textReplacements.length === 0) {
        return html;
      }
      
      // 创建替换映射表
      const replacementMap = new Map<string, string>();
      for (const item of textReplacements) {
        if (item.placeholder && item.replaceWith) {
          replacementMap.set(item.placeholder, item.replaceWith);
        }
      }
      
      this.logger.log(`开始替换文本，共${textReplacements.length}个替换项，useId=${useId}`);
      
      // 如果使用ID进行替换
      if (useId) {
        this.logger.log(`使用ID进行替换，共${textReplacements.length}个替换项`);
        
        // 处理React组件中的ID替换
        // 1. 替换h2标签中的内容: React.createElement('h2', { className: "...", id:"123123" }, "一生必去的绝美景点")
        for (const [id, newText] of replacementMap.entries()) {
          this.logger.log(`尝试替换ID: ${id} -> "${newText.substring(0, 30)}${newText.length > 30 ? '...' : ''}"`);
          
          // 匹配React.createElement中带有特定ID的元素
          const reactRegex = new RegExp(`React\\.createElement\\(['"]([^'"]+)['"][^,]*,\\s*\\{[^}]*id\\s*[:=]\\s*["']${id}["'][^}]*\\}[^,]*,\\s*["']([^"']+)["']\\s*\\)`, 'g');
          let reactReplaceCount = 0;
          html = html.replace(reactRegex, (match, tagName, oldText) => {
            reactReplaceCount++;
            this.logger.log(`替换React组件中ID为${id}的文本: ${oldText} -> ${newText}`);
            return match.replace(`"${oldText}"`, `"${newText}"`);
          });
          
          if (reactReplaceCount > 0) {
            this.logger.log(`成功替换了${reactReplaceCount}处React组件中ID为${id}的文本`);
          } else {
            this.logger.log(`未找到React组件中ID为${id}的文本，尝试其他替换方式`);
            
            // 2. 尝试匹配更宽松的React组件模式
            const looseReactRegex = new RegExp(`id\\s*[:=]\\s*["']${id}["'][^>]*>[^<]*<`, 'g');
            let looseReplaceCount = 0;
            html = html.replace(looseReactRegex, (match) => {
              looseReplaceCount++;
              this.logger.log(`使用宽松模式替换ID为${id}的文本`);
              // 提取开始和结束标签
              const startTagEnd = match.indexOf('>');
              const endTagStart = match.lastIndexOf('<');
              if (startTagEnd !== -1 && endTagStart > startTagEnd) {
                const startTag = match.substring(0, startTagEnd + 1);
                const endTag = match.substring(endTagStart);
                return `${startTag}${newText}${endTag}`;
              }
              return match;
            });
            
            if (looseReplaceCount > 0) {
              this.logger.log(`使用宽松模式成功替换了${looseReplaceCount}处ID为${id}的文本`);
            } else {
              this.logger.log(`宽松模式也未找到ID为${id}的文本，尝试直接替换ID字符串`);
              
              // 3. 如果上述方法都失败，尝试直接替换ID字符串
              // 这是一个不太精确但可能有效的方法
              const idRegex = new RegExp(`${this.escapeRegExp(id)}`, 'g');
              let idReplaceCount = 0;
              html = html.replace(idRegex, (match) => {
                idReplaceCount++;
                this.logger.log(`直接替换ID字符串: ${id} -> ${newText}`);
                return newText;
              });
              
              if (idReplaceCount > 0) {
                this.logger.log(`直接替换ID字符串成功，替换了${idReplaceCount}处`);
              } else {
                this.logger.warn(`警告: 未能替换ID为${id}的文本，该ID可能不存在于HTML中`);
              }
            }
          }
          
          // 处理script标签后的文本内容
          const scriptEndRegex = new RegExp(`<\/script>([^<]*${id}[^<]*)`, 'g');
          html = html.replace(scriptEndRegex, (match, textContent) => {
            if (textContent.includes(id)) {
              this.logger.log(`替换script标签后包含ID ${id}的文本`);
              return '</script>';
            }
            return match;
          });
        }
        
        return html;
      }
      
      // 常规文本替换
      this.logger.log(`使用常规文本替换，共${textReplacements.length}个替换项`);
      let replacedHtml = html;
      for (const [placeholder, replaceWith] of replacementMap.entries()) {
        // 使用正则表达式进行全局替换
        const regex = new RegExp(this.escapeRegExp(placeholder), 'g');
        const originalHtml = replacedHtml;
        replacedHtml = replacedHtml.replace(regex, replaceWith);
        
        // 检查是否成功替换
        if (originalHtml === replacedHtml) {
          this.logger.warn(`警告: 未能替换文本 "${placeholder}"`);
        } else {
          this.logger.log(`成功替换文本: "${placeholder}" -> "${replaceWith.substring(0, 30)}${replaceWith.length > 30 ? '...' : ''}"`);
        }
      }
      
      return replacedHtml;
    } catch (error) {
      this.logger.error(`替换文本时出错: ${error.message}`);
      return html; // 出错时返回原始HTML
    }
  }

  // 转义正则表达式中的特殊字符
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $&表示整个匹配的字符串
  }

  // 替换HTML中的图片和文本
  private replaceHtmlContent(
    html: string, 
    imageUrls: string[] = [], 
    textReplacements: TextReplacementItem[] = [],
    useId: boolean = false
  ): string {
    try {
      // 使用cheerio加载HTML，指定选项避免实体编码
      const $ = cheerio.load(html, {
        xml: {
          decodeEntities: false
        },
        // @ts-ignore - cheerio类型定义不完整，但API支持这个选项
        decodeEntities: false
      });

      // 替换图片
      if (imageUrls.length > 0) {
        // 获取所有图片元素
        const imgElements = $('img');
        const imgCount = imgElements.length;
        
        // 如果提供的图片URL数量大于模板中可替换的图片数量，随机选择
        if (imageUrls.length > imgCount) {
          this.logger.log(`提供的图片URL数量(${imageUrls.length})超过了模板中的图片数量(${imgCount})，将随机选择`);
          
          // 创建图片URL的副本，避免修改原数组
          const imageUrlsCopy = [...imageUrls];
          // 随机打乱数组
          const randomizedUrls = this.shuffleArray(imageUrlsCopy).slice(0, imgCount);
          
          // 使用随机选择的图片URL替换
          imgElements.each((index, element) => {
            $(element).attr('src', randomizedUrls[index]);
          });
        } else {
          // 图片URL数量不超过模板中的图片数量，按顺序替换
          imgElements.each((index, element) => {
            if (index < imageUrls.length && imageUrls[index]) {
              $(element).attr('src', imageUrls[index]);
            }
          });
        }
      }

      // 获取HTML字符串
      let htmlString = $.html();
      
      // 修复自闭合标签问题：将<div/>类标签转换回<div></div>格式
      htmlString = htmlString.replace(/<(div|span|p|h[1-6]|section|article|nav|header|footer|aside|main)([^>]*?)\/>/g, '<$1$2></$1>');
      
      // 替换文本占位符
      htmlString = this.replaceTextInHtml(htmlString, textReplacements, useId);
      
      // 返回替换后的HTML
      return htmlString;
    } catch (error) {
      this.logger.error(`替换HTML内容失败: ${error.message}`);
      throw new HttpException('替换HTML内容失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
  // 打乱数组的辅助方法（Fisher-Yates洗牌算法）
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array]; // 创建副本
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]]; // 交换元素
    }
    return result;
  }

  // 使用AI生成HTML内容
  private async generateAIContent(template: HtmlTemplateEntity, imageUrls: string[] = [], content: string = ''): Promise<string> {
    try {
      this.logger.log('开始使用AI生成HTML内容');
      
      // 构建更加结构化的提示词
      let prompt = `{{USER_HTML_TEMPLATE}}:\n${template.htmlCode}\n\n`;
      
      if (content) {
        prompt += `{{USER_TOPIC_OR_CONCEPT}}:\n${content}`;
      }
      
      
      // 使用aiApiService的通用AI生成内容方法
      const aiResult = await this.aiApiService.generateAIContent({
        appName: "HTML模板",
        prompt: prompt,
        chatId: `html-template-${template.id}`,
      });
      
      if (!aiResult) {
        this.logger.warn('AI未返回有效内容');
        return '';
      }
      
      const resultText = aiResult as string;
      this.logger.log(`AI生成内容成功，长度=${resultText.length}`);
      
      // 扩展提取HTML代码的正则模式
      const htmlMatch = resultText.match(/<!DOCTYPE html[\s\S]*<\/html>/) ||
                        resultText.match(/<html[\s\S]*<\/html>/)
      
      if (htmlMatch) {
        const extractedHtml = htmlMatch[1] || htmlMatch[0];
        this.logger.log(`成功从AI响应中提取HTML代码，长度：${extractedHtml.length}`);
        return extractedHtml;
      }
      
      // 如果没有找到特定格式的HTML，返回整个内容
      this.logger.log('未找到特定格式的HTML，返回整个AI响应');
      return resultText;
    } catch (error) {
      this.logger.error(`生成AI内容出错: ${error.message}`);
      return '';
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
    
    // 处理textDetails字段，与findTemplateByName方法中的处理逻辑相同
    if (!selectedTemplate.textDetails) {
      selectedTemplate.textDetails = JSON.stringify([]);
    }
    
    try {
      if (typeof selectedTemplate.textDetails === 'string') {
        const parsedDetails = JSON.parse(selectedTemplate.textDetails);
        
        if (!Array.isArray(parsedDetails) || parsedDetails.length === 0) {
          const extractedTexts = this.extractReplaceableText(selectedTemplate.htmlCode);
          selectedTemplate.textDetails = JSON.stringify(extractedTexts);
        }
      }
    } catch (error) {
      this.logger.warn(`模板${selectedTemplate.name}的textDetails解析失败: ${error.message}`);
      const extractedTexts = this.extractReplaceableText(selectedTemplate.htmlCode);
      selectedTemplate.textDetails = JSON.stringify(extractedTexts);
    }
    
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
      
      // 如果需要生成AI内容
      if (generateAiContent && content) {
        this.logger.log('使用AI内容生成');
        try {
          const aiGeneratedHtml = await this.generateAIContent(template, imageUrls, content);
          if (aiGeneratedHtml) {
            htmlString = aiGeneratedHtml;
            this.logger.log('成功生成AI内容');
          } else {
            this.logger.warn('AI内容生成失败，使用原始模板');
          }
        } catch (error) {
          this.logger.error(`AI内容生成出错: ${error.message}`);
        }
      }
      
      // 加载HTML内容
      const $ = cheerio.load(htmlString, {
        xml: {
          decodeEntities: false
        },
        // @ts-ignore - cheerio类型定义不完整，但API支持这个选项
        decodeEntities: false
      });
      
      // 替换图片URL
      if (imageUrls && imageUrls.length > 0) {
        const imgElements = $('img');
      
        // 确保有足够的图片URL
        const safeImageUrls = [...imageUrls];
        while (safeImageUrls.length < imgElements.length) {
          safeImageUrls.push(safeImageUrls[safeImageUrls.length % imageUrls.length]);
        }
        
        // 替换图片URL
        imgElements.each((index, element) => {
          if (index < safeImageUrls.length) {
            $(element).attr('src', safeImageUrls[index]);
            this.logger.log(`替换图片 #${index + 1}: ${safeImageUrls[index]}`);
          }
        });
        
        // 更新HTML字符串
        htmlString = $.html();
        
        // 修复自闭合标签问题：将<div/>类标签转换回<div></div>格式
        htmlString = htmlString.replace(/<(div|span|p|h[1-6]|section|article|nav|header|footer|aside|main)([^>]*?)\/>/g, '<$1$2></$1>');
      }
      
      // 替换文本内容
      if (textReplacements && textReplacements.length > 0) {
        if (useId) {
          this.logger.log(`使用ID进行文本替换，共${textReplacements.length}个替换项`);
          
          // 使用专门处理React组件和ID替换的方法
          htmlString = this.replaceTextInHtml(htmlString, textReplacements, true);
        } else {
          this.logger.log(`使用常规文本替换，共${textReplacements.length}个替换项`);
          
          // 使用常规文本替换方法
          htmlString = this.replaceTextInHtml(htmlString, textReplacements, false);
        }
      }
      
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
      
      // 在日志中输出完整的HTML内容
      this.logger.log(`需要执行的HTML内容：\n${html}`);
      
      // 创建一个随机的文件名
      const fileName = `${crypto.randomBytes(16).toString('hex')}.${imageType}`;
      const filePath = path.join(this.imageOutputDir, fileName);
      
      this.logger.log(`生成的文件名: ${fileName}`);
      this.logger.log(`文件保存路径: ${filePath}`);
      
      // 添加字体预加载
      html = this.addFontPreloadToHtml(html);
      
      this.logger.log(`已添加字体预加载到HTML`);
      
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
        transparent: imageType === 'png',
        beforeScreenshot: async (page) => {
          // 等待页面加载完成
          await page.waitForFunction('document.fonts.ready');
          this.logger.log(`页面字体加载完成`);
          
          // 如果启用了自动宽度检测，则获取页面内容的实际宽度和高度
      if (useAutoWidth) {
            this.logger.log('使用自动宽度检测模式，计算页面实际尺寸');
        
            // 获取页面内容的实际宽度和高度
            const dimensions = await page.evaluate(() => {
              const body = document.body;
              const html = document.documentElement;
              const width = Math.max(
                body.scrollWidth, body.offsetWidth,
                html.clientWidth, html.scrollWidth, html.offsetWidth
              );
              const height = Math.max(
                body.scrollHeight, body.offsetHeight,
                html.clientHeight, html.scrollHeight, html.offsetHeight
              );
              return { width, height };
            });
            
            this.logger.log(`页面实际尺寸: 宽度=${dimensions.width}px, 高度=${dimensions.height}px`);
            
            // 设置视口大小
            await page.setViewport({
              width: dimensions.width,
              height: dimensions.height,
              deviceScaleFactor: 1
            });
            
            this.logger.log(`已设置视口大小为: ${dimensions.width}x${dimensions.height}`);
          } else if (options?.width) {
            // 如果指定了宽度，则使用指定的宽度和高度
            const viewportWidth = options.width;
            const viewportHeight = options.height || Math.round(viewportWidth * 1.5); // 默认高度为宽度的1.5倍
            
            this.logger.log(`使用指定尺寸: 宽度=${viewportWidth}px, 高度=${viewportHeight}px`);
            
            // 设置视口大小
            await page.setViewport({
              width: viewportWidth,
              height: viewportHeight,
              deviceScaleFactor: 1
            });
            
            this.logger.log(`已设置视口大小为: ${viewportWidth}x${viewportHeight}`);
                  }
                }
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
      let superImageUrl;
      if (uploadToSuperbed) {
        try {
          this.logger.log(`开始上传图片到Super图床...`);
          // 上传到Super图床
          const uploadResult = await this.imageUploadService.uploadToSuperbed(filePath);
          if (uploadResult && uploadResult.url) {
            superImageUrl = uploadResult.url;
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

  /**
   * 在HTML中添加字体预加载
   * @param html 原始HTML
   * @returns 添加字体预加载后的HTML
   */
  private addFontPreloadToHtml(html: string): string {
    try {
      const $ = cheerio.load(html);
      
      // 检查是否已有字体样式
      let hasFontStyle = false;
      $('style').each((i, el) => {
        const styleContent = $(el).html() || '';
        if (styleContent.includes('@font-face') || styleContent.includes('font-family')) {
          hasFontStyle = true;
        }
      });
      
      // 如果没有字体样式，添加中文字体支持
      if (!hasFontStyle) {
        // 添加字体CSS
        $('head').append(`
          <style>
            @font-face {
              font-family: "Microsoft YaHei";
              src: local("Microsoft YaHei"), local("微软雅黑");
            }
            @font-face {
              font-family: "PingFang SC";
              src: local("PingFang SC"), local("苹方");
            }
            @font-face {
              font-family: "Hiragino Sans GB";
              src: local("Hiragino Sans GB"), local("冬青黑体");
            }
            @font-face {
              font-family: "WenQuanYi Micro Hei";
              src: local("WenQuanYi Micro Hei"), local("文泉驿微米黑");
            }
            body, div, p, span, h1, h2, h3, h4, h5, h6 {
              font-family: Arial, "Microsoft YaHei", "微软雅黑", "PingFang SC", "Hiragino Sans GB", "WenQuanYi Micro Hei", sans-serif !important;
            }
          </style>
        `);
        
        // 添加字体预加载
        $('head').prepend(`
          <link rel="preload" as="font" href="data:font/woff2;base64," crossorigin>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        `);
      }
      
      // 确保有charset设置
      if (!$('meta[charset]').length && !$('meta[http-equiv="Content-Type"]').length) {
        $('head').prepend('<meta charset="utf-8">');
      }
      
      let htmlString = $.html();
      
      // 修复自闭合标签问题：将<div/>类标签转换回<div></div>格式
      htmlString = htmlString.replace(/<(div|span|p|h[1-6]|section|article|nav|header|footer|aside|main)([^>]*?)\/>/g, '<$1$2></$1>');
      
      return htmlString;
    } catch (error) {
      this.logger.warn(`添加字体预加载失败: ${error.message}`);
      return html;
    }
  }

  /**
   * 渲染模板并转换为图片
   * @param templateName 模板名称
   * @param imageUrls 图片URL数组
   * @param textReplacements 文本替换项数组
   * @param options 图片转换选项
   * @returns 图片路径信息
   */
  async renderTemplateToImage(
    templateName: string,
    imageUrls: string[] = [],
    textReplacements: TextReplacementItem[] = [],
    options?: {
      width?: number;
      height?: number;
      quality?: number;
      type?: 'jpeg' | 'png';
      selector?: string;
      generateAiContent?: boolean;
      content?: string;
      uploadToSuperbed?: boolean; // 是否上传到super图床
      useAutoWidth?: boolean; // 是否使用自适应宽度
      useId?: boolean; // 是否通过ID进行元素文本替换
    }
  ): Promise<{ filePath: string; fileName: string; url: string; superImageUrl?: string }> {
    // 设置超时时间（毫秒）
    const TIMEOUT = 20000; // 20秒
    
    try {
      // 创建超时Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('渲染模板为图片操作超时(20秒)')), TIMEOUT);
      });
      
      // 创建渲染Promise
      const renderPromise = (async () => {
      // 获取HTML内容
      const result = await this.renderTemplateToHtml(
        templateName,
        imageUrls,
        textReplacements,
        true, // 始终返回完整HTML
        options?.generateAiContent || false,
        options?.content || '',
        options?.useId || false // 传入useId参数
      );
      
      // 转换为图片
      this.logger.log(`渲染模板 ${templateName} 为图片，自动宽度检测: ${options?.useAutoWidth ? '启用' : '禁用'}`);
      
      return this.htmlToImage(result.html, {
        width: options?.width,
        height: options?.height,
        quality: options?.quality,
        type: options?.type,
        selector: options?.selector,
        uploadToSuperbed: options?.uploadToSuperbed,
        useAutoWidth: options?.useAutoWidth
      });
      })();
      
      // 使用Promise.race实现超时
      return await Promise.race([renderPromise, timeoutPromise]);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`渲染模板为图片失败: ${error.message}`);
      throw new HttpException(`渲染模板为图片失败: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 删除生成的图片
   * @param fileName 图片文件名
   * @returns 是否删除成功
   */
  async deleteHtmlImage(fileName: string): Promise<boolean> {
    try {
      const filePath = path.join(this.imageOutputDir, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`成功删除图片: ${fileName}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`删除图片失败: ${error.message}`, error.stack);
      return false;
    }
  }

  async createRenderTask(renderParams: any): Promise<RenderTask> {
    // 生成唯一的任务ID
    const taskId = uuidv4();
    
    // 确保renderParams是字符串
    let paramsToStore;
    if (typeof renderParams === 'string') {
      try {
        // 验证是否为有效的JSON字符串
        JSON.parse(renderParams);
        paramsToStore = renderParams;
      } catch (error) {
        throw new Error(`无效的JSON字符串: ${error.message}`);
      }
    } else if (typeof renderParams === 'object') {
      // 将对象转换为JSON字符串
      try {
        paramsToStore = JSON.stringify(renderParams);
      } catch (error) {
        throw new Error(`无法序列化参数: ${error.message}`);
      }
    } else {
      throw new Error(`无效的渲染参数类型: ${typeof renderParams}`);
    }
    
    // 创建任务记录
    const task = this.renderTaskRepository.create({
      taskId,
      renderParams: paramsToStore,
      status: 'pending',
    });
    
    await this.renderTaskRepository.save(task);
    
    // 启动异步处理任务
    this.processRenderTask(task, 0).catch(error => {
      console.error(`处理渲染任务 ${taskId} 失败:`, error);
    });
    
    return task;
  }

  async processRenderTask(task: RenderTask, retryCount: number = 0): Promise<void> {
    try {
      this.logger.log(`开始处理渲染任务 ${task.taskId} (尝试 ${retryCount + 1}/4)`);
      
      if (!task || !task.renderParams) {
        throw new Error('无效的任务或渲染参数');
      }
      
      // 更新任务状态为处理中
      task.status = 'processing';
      await this.saveTask(task);
      
      // 解析参数 - 确保renderParams是字符串类型
      let params;
      if (typeof task.renderParams === 'string') {
        try {
          params = JSON.parse(task.renderParams);
        } catch (parseError) {
          throw new Error(`无法解析渲染参数: ${parseError.message}`);
        }
      } else if (typeof task.renderParams === 'object') {
        // 如果已经是对象，直接使用
        params = task.renderParams;
      } else {
        throw new Error(`无效的渲染参数类型: ${typeof task.renderParams}`);
      }
      
      const textMode = params.textMode === true;
      const generateAiContent = params.generateAiContent === true;
      const content = params.content || '';
      const convertToImage = params.convertToImage === true;
      const useId = params.useId === true; // 是否通过ID进行元素文本替换
      
      // 记录文本替换参数
      if (params.textReplacements && params.textReplacements.length > 0) {
        this.logger.log(`文本替换项数量: ${params.textReplacements.length}, useId: ${useId}`);
        for (const item of params.textReplacements) {
          this.logger.log(`文本替换项: placeholder=${item.placeholder}, replaceWith=${item.replaceWith.substring(0, 30)}${item.replaceWith.length > 30 ? '...' : ''}`);
        }
      } else {
        this.logger.log(`没有提供文本替换项`);
      }
      
      // 获取HTML内容
      this.logger.log(`调用renderTemplateToHtml: templateName=${params.templateName || '(随机)'}, useId=${useId}, 图片数量=${params.imageUrls?.length || 0}`);
      
      // 设置超时时间（毫秒）
      const TIMEOUT = 20000; // 20秒
      
      // 创建超时Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('渲染任务超时(20秒)')), TIMEOUT);
      });
      
      // 创建渲染Promise
      const renderPromise = this.renderTemplateToHtml(
        params.templateName || '',
        params.imageUrls || [],
        params.textReplacements || [],
        params.wrapHtml !== undefined ? params.wrapHtml : true,
        generateAiContent,
        content,
        useId // 传入useId参数
      );
      
      // 使用Promise.race实现超时控制
      const result = await Promise.race([renderPromise, timeoutPromise]);
      
      // 保存生成的HTML内容
      task.htmlContent = result.html;
      this.logger.log(`已保存HTML内容，长度: ${result.html.length}`);
      
      // 检查HTML中是否包含文本替换项的placeholder
      if (params.textReplacements && params.textReplacements.length > 0) {
        for (const item of params.textReplacements) {
          if (result.html.includes(item.placeholder)) {
            this.logger.warn(`警告: HTML内容中仍包含未替换的placeholder: ${item.placeholder}`);
          }
        }
      }
      
      // 将HTML转换为图片
      let imageResult;
      try {
        // 设置图片转换的超时控制
        const imageTimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('HTML转图片超时(20秒)')), TIMEOUT);
        });
        
        // 创建图片转换Promise
        const imageRenderPromise = this.htmlToImage(result.html, {
          width: params.width,
          height: params.height,
          quality: params.quality,
          type: params.type || 'png',
          selector: params.selector,
          uploadToSuperbed: params.uploadToSuperbed,
          useAutoWidth: params.useAutoWidth
        });
        
        // 使用Promise.race实现图片转换超时控制
        imageResult = await Promise.race([imageRenderPromise, imageTimeoutPromise]);
      } catch (renderError) {
        // 特别处理Chrome浏览器找不到的错误
        if (renderError.message && (
            renderError.message.includes('Could not find Chrome') || 
            renderError.message.includes('Unable to launch browser') ||
            renderError.message.includes('Failed to launch') ||
            renderError.message.includes('超时')
        )) {
          this.logger.error(`HTML转图片失败: ${renderError.message}`);
          
          // 尝试安装Chrome浏览器
          if (retryCount === 0) {
            try {
              this.logger.log('尝试安装Chrome浏览器...');
              const { execSync } = require('child_process');
              
              try {
                execSync('apt-get update && apt-get install -y chromium-browser', { stdio: 'inherit' });
                this.logger.log('Chrome浏览器安装成功，重试渲染任务');
                // 设置环境变量指向安装的浏览器路径
                process.env.CHROME_BIN = '/usr/bin/chromium-browser';
              } catch (installError) {
                this.logger.error(`安装Chrome浏览器失败: ${installError.message}`);
                try {
                  execSync('apt-get update && apt-get install -y chromium', { stdio: 'inherit' });
                  this.logger.log('Chromium浏览器安装成功，重试渲染任务');
                  // 设置环境变量指向安装的浏览器路径
                  process.env.CHROME_BIN = '/usr/bin/chromium';
                } catch (installError2) {
                  this.logger.error(`安装Chromium浏览器失败: ${installError2.message}`);
                }
              }
              
              // 安装完成后重试
              if (retryCount < 3) {
                this.logger.log(`渲染任务处理失败 (尝试 ${retryCount + 1}/4): ${renderError.message}`);
                return this.processRenderTask(task, retryCount + 1);
              }
            } catch (execError) {
              this.logger.error(`执行安装命令失败: ${execError.message}`);
            }
          }
        }
        
        // 其他错误或重试次数已达上限，抛出异常
        throw renderError;
      }
      
      // 更新任务状态为已完成
      task.status = 'completed';
      task.result = imageResult;
      task.completedAt = new Date();
      await this.saveTask(task);
      
      this.logger.log(`渲染任务 ${task.taskId} 处理完成`);
    } catch (error) {
      this.logger.error(`渲染任务处理失败: ${error.message}`);
      
      // 如果还有重试次数，则重试
      if (retryCount < 3) {
        this.logger.log(`渲染任务处理失败 (尝试 ${retryCount + 1}/4): ${error.message}`);
        
        // 如果超时，则延迟1秒后重试
        if (error.message && error.message.includes('超时')) {
          this.logger.log('超时错误，等待1秒后重试...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return this.processRenderTask(task, retryCount + 1);
      }
      
      // 更新任务状态为失败
      task.status = 'failed';
      task.errorMessage = error.message;
      await this.saveTask(task);
      
      throw new Error(`HTML转图片失败: ${error.message}`);
    }
  }

  async getTaskById(taskId: string): Promise<RenderTask> {
    const task = await this.renderTaskRepository.findOne({ where: { taskId } });
    
    if (!task) {
      throw new NotFoundException(`任务ID ${taskId} 不存在`);
    }
    
    return task;
  }

  async cleanupOldTasks(days: number = 7): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    const result = await this.renderTaskRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :date', { date })
      .execute();
      
    return result.affected || 0;
  }

  async saveTask(task: RenderTask): Promise<RenderTask> {
    return this.renderTaskRepository.save(task);
  }

  // 专门处理React组件中的ID和文本内容
  private extractReactComponentIds(html: string): { id: string; text: string }[] {
    const elementsWithId: { id: string; text: string }[] = [];
    
    try {
      // 1. 处理常规React组件中的id属性和文本内容
      // 匹配格式: React.createElement('div', { className: "...", id:"123123" }, "文本内容")
      const reactElementRegex = /React\.createElement\(['"]([^'"]+)['"][^,]*,\s*\{[^}]*id\s*[:=]\s*["']([^"']+)["'][^}]*\}[^,]*,\s*["']([^"']+)["']\s*\)/g;
      let match;
      while ((match = reactElementRegex.exec(html)) !== null) {
        const tagName = match[1];
        const id = match[2];
        const text = match[3];
        
        this.logger.log(`从React组件中提取到标签: ${tagName}, ID: ${id}, 文本: ${text}`);
        
        // 查找该ID是否已经添加过
        const existing = elementsWithId.find(item => item.id === id);
        if (!existing && id !== 'root' && text) {
          elementsWithId.push({ id, text });
        }
      }
      
      // 2. 处理带有id属性的元素
      // 匹配格式: id="123123" 或 id:'123123'
      const idRegex = /\bid\s*[:=]\s*["']([^"']+)["']/g;
      while ((match = idRegex.exec(html)) !== null) {
        const id = match[1];
        
        // 跳过root元素和已经添加过的元素
        if (id === 'root' || elementsWithId.find(item => item.id === id)) {
          continue;
        }
        
        // 查找该ID附近的文本内容
        const idPosition = match.index;
        const lineStart = Math.max(0, html.lastIndexOf('\n', idPosition));
        const lineEnd = html.indexOf('\n', idPosition);
        const line = html.substring(lineStart, lineEnd > 0 ? lineEnd : html.length);
        
        // 查找该行中的文本内容
        let text = '';
        
        // 尝试查找文本内容 - 增强匹配能力
        const textMatch = /},\s*["']([^"']+)["']\s*\)/.exec(line) || 
                         /},\s*React\.createElement\([^,]+,[^,]+,\s*["']([^"']+)["']\s*\)/.exec(line);
        if (textMatch) {
          text = textMatch[1];
          this.logger.log(`从行中提取到ID: ${id}, 文本: ${text}`);
        } else {
          // 查找该ID后面的内容
          const afterId = html.substring(idPosition, idPosition + 500);
          const afterTextMatch = /},\s*["']([^"']+)["']\s*\)/.exec(afterId) ||
                               /},\s*React\.createElement\([^,]+,[^,]+,\s*["']([^"']+)["']\s*\)/.exec(afterId);
          if (afterTextMatch) {
            text = afterTextMatch[1];
            this.logger.log(`从ID后面提取到文本: ${text}`);
          } else {
            // 检查是否是img标签
            if (line.includes('img') || line.includes('image')) {
              const srcMatch = /src\s*[:=]\s*["']([^"']+)["']/.exec(line) ||
                              /src\s*[:=]\s*["']([^"']+)["']/.exec(afterId);
              if (srcMatch) {
                text = srcMatch[1];
                this.logger.log(`从img标签提取到ID: ${id}, src: ${text}`);
              }
            }
          }
        }
        
        // 如果找不到文本内容，尝试在更大范围内查找
        if (!text) {
          // 查找上下文中的文本内容
          const context = html.substring(Math.max(0, idPosition - 200), Math.min(html.length, idPosition + 500));
          const contextTextMatch = /["']([^"']{3,100})["']\s*\)/.exec(context);
          if (contextTextMatch) {
            text = contextTextMatch[1];
            this.logger.log(`从上下文中提取到ID: ${id}, 文本: ${text}`);
          }
        }
        
        // 如果找不到文本内容，使用默认值
        if (!text) {
          text = `Element with ID ${id}`;
        }
        
        elementsWithId.push({ id, text });
      }
      
      // 3. 使用专门处理React组件的方法
      const reactSpecificIds = this.extractExampleSpecificIds(html);
      for (const element of reactSpecificIds) {
        // 跳过root元素和已经添加过的元素
        if (element.id !== 'root' && !elementsWithId.find(item => item.id === element.id)) {
          elementsWithId.push(element);
        }
      }
      
      return elementsWithId;
    } catch (error) {
      this.logger.error(`从React组件中提取ID失败: ${error.message}`);
      return elementsWithId;
    }
  }

  // 处理复杂的React组件格式
  private extractComplexReactIds(html: string): { id: string; text: string }[] {
    const elementsWithId: { id: string; text: string }[] = [];
    
    try {
      // 1. 处理嵌套的React组件
      // 首先按行分析，找出包含id属性的行
      const lines = html.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.includes('id') || line.trim().startsWith('//')) {
          continue; // 跳过不包含id的行或注释行
        }
        
        // 提取所有id属性
        const idMatches = Array.from(line.matchAll(/id\s*[:=]\s*["']([^"']+)["']/g));
        for (const idMatch of idMatches) {
          const id = idMatch[1];
          
          // 跳过root元素和已经添加过的元素
          if (id === 'root' || elementsWithId.find(item => item.id === id)) {
            continue;
          }
          
          this.logger.log(`在复杂React组件中找到ID: ${id}`);
          
          // 查找该ID附近的文本内容
          let text = '';
          
          // 1. 在当前行查找文本内容
          const lineTextMatch = line.match(/["']([^"']{3,100})["']\s*\)/) || 
                               line.match(/},\s*["']([^"']+)["']\s*\)/);
          if (lineTextMatch) {
            text = lineTextMatch[1];
            this.logger.log(`在当前行找到文本: ${text}`);
          } else {
            // 2. 在后续几行查找文本内容
            let j = i + 1;
            const maxLines = 10; // 增加向后查找的行数
            
            while (j < lines.length && j < i + maxLines) {
              const nextLineTextMatch = lines[j].match(/["']([^"']{3,100})["']\s*\)/) || 
                                       lines[j].match(/},\s*["']([^"']+)["']\s*\)/);
              if (nextLineTextMatch) {
                text = nextLineTextMatch[1];
                this.logger.log(`在后续行找到文本: ${text}`);
                break;
              }
              j++;
            }
            
            // 3. 如果是img标签，查找src属性
            if (!text && (line.includes('img') || line.includes('image'))) {
              // 在当前行和后续几行查找src属性
              const srcMatch = line.match(/src\s*[:=]\s*["']([^"']+)["']/) ||
                              (j < lines.length ? lines[j].match(/src\s*[:=]\s*["']([^"']+)["']/) : null);
              
              if (srcMatch) {
                text = srcMatch[1];
                this.logger.log(`找到img标签的src: ${text}`);
              }
            }
            
            // 4. 查找更大范围的上下文
            if (!text) {
              // 获取当前行的上下文
              const startLine = Math.max(0, i - 5); // 增加上下文范围
              const endLine = Math.min(lines.length - 1, i + 10); // 增加上下文范围
              const context = lines.slice(startLine, endLine + 1).join('\n');
              
              // 在上下文中查找文本内容，增强匹配模式
              const contextTextMatch = context.match(/["']([^"']{3,100})["']\s*\)/) || 
                                     context.match(/},\s*["']([^"']+)["']\s*\)/) ||
                                     context.match(/className="[^"]*"[^>]*>([^<]+)<\//) ||
                                     context.match(/id\s*[:=]\s*["']([^"']+)["'][^>]*>([^<]+)</);
              if (contextTextMatch) {
                text = contextTextMatch[1] || contextTextMatch[2] || '';
                this.logger.log(`在上下文中找到文本: ${text}`);
              }
            }
          }
          
          // 5. 特殊处理h2标签，查找其后的文本内容
          if (!text && line.includes('h2') && line.includes('id')) {
            // 在当前行和后续几行中查找h2标签的文本内容
            const h2TextRegex = /React\.createElement\(['"]h2['"][^,]*,\s*\{[^}]*id\s*[:=]\s*["'][^"']+["'][^}]*\}[^,]*,\s*["']([^"']+)["']/;
            
            // 查找当前行
            const h2Match = line.match(h2TextRegex);
            if (h2Match) {
              text = h2Match[1];
              this.logger.log(`找到h2标签的文本内容: ${text}`);
            } else {
              // 查找后续几行
              for (let k = i + 1; k < lines.length && k < i + 5; k++) {
                const nextLineH2Match = lines[k].match(h2TextRegex);
                if (nextLineH2Match) {
                  text = nextLineH2Match[1];
                  this.logger.log(`在后续行找到h2标签的文本内容: ${text}`);
                  break;
                }
              }
            }
          }
          
          // 如果找不到文本内容，使用默认值
          if (!text) {
            text = `Element with ID ${id}`;
            this.logger.log(`未找到文本内容，使用默认值: ${text}`);
          }
          
          elementsWithId.push({ id, text });
        }
      }
      
      return elementsWithId;
    } catch (error) {
      this.logger.error(`处理复杂React组件失败: ${error.message}`);
      return elementsWithId;
    }
  }

  // 从HTML中提取所有带ID的元素及其文本内容
  private extractElementsWithId(html: string): { id: string; text: string }[] {
    try {
      // 加载HTML内容
      const $ = cheerio.load(html, {
        xml: {
          decodeEntities: false
        },
        // @ts-ignore - cheerio类型定义不完整，但API支持这个选项
        decodeEntities: false
      });
      
      // 提取所有带ID的元素
      const elementsWithId: { id: string; text: string }[] = [];
      
      // 处理常规HTML中的id属性
      $('[id]').each((_, element) => {
        const $element = $(element);
        const id = $element.attr('id');
        const text = $element.text().trim();
        
        // 过滤掉id为"root"的元素，因为它是React的根元素容器
        if (id && text && id !== 'root') {
          this.logger.log(`从常规HTML中提取到ID: ${id}, 文本: ${text}`);
          elementsWithId.push({ id, text });
        }
      });
      
      // 检查是否为React组件格式
      const isReactComponent = html.includes('React.createElement') || 
                              html.includes('import React from') ||
                              html.includes('from "react"') ||
                              html.includes('from \'react\'');
      
      // 如果是React组件格式，使用专门的方法处理
      if (isReactComponent) {
        this.logger.log('检测到React组件格式，使用专门的方法处理');
        
        // 1. 使用React组件提取方法
        const reactElements = this.extractReactComponentIds(html);
        for (const element of reactElements) {
          if (element.id !== 'root') {
            const existing = elementsWithId.find(item => item.id === element.id);
            if (!existing) {
              elementsWithId.push(element);
            }
          }
        }
        
        // 2. 使用复杂React组件提取方法
        const complexElements = this.extractComplexReactIds(html);
        for (const element of complexElements) {
          if (element.id !== 'root') {
            const existing = elementsWithId.find(item => item.id === element.id);
            if (!existing) {
              elementsWithId.push(element);
            }
          }
        }
      }
      
      // 过滤掉id为"root"的元素
      const filteredElements = elementsWithId.filter(element => element.id !== 'root');
      
      this.logger.log(`从HTML中提取到${filteredElements.length}个带ID的元素: ${JSON.stringify(filteredElements)}`);
      return filteredElements;
    } catch (error) {
      this.logger.error(`从HTML中提取带ID的元素失败: ${error.message}`);
      return [];
    }
  }

  // 获取模板中所有带ID的元素及其文本内容
  async getTemplateElementsWithId(templateName: string): Promise<{ id: string; text: string }[]> {
    try {
      // 查找模板
      const template = await this.findTemplateByName(templateName);
      if (!template) {
        throw new NotFoundException(`未找到名称为"${templateName}"的模板`);
      }
      
      // 提取带ID的元素
      const elements = this.extractElementsWithId(template.htmlCode);
      
      // 过滤掉id为"root"的元素
      const filteredElements = elements.filter(element => element.id !== 'root');
      
      this.logger.log(`从模板"${templateName}"中提取到${filteredElements.length}个带ID的元素（已过滤root元素）`);
      
      return filteredElements;
    } catch (error) {
      this.logger.error(`获取模板元素ID失败: ${error.message}`);
      throw new HttpException(`获取模板元素ID失败: ${error.message}`, 
        error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 获取所有模板名称列表
  async getAllTemplateNames(): Promise<string[]> {
    try {
      // 查询所有启用的模板
      const templates = await this.htmlTemplateRepository.find({
        where: { status: 1 },
        select: ['name'],
        order: { id: 'ASC' }
      });
      
      // 提取模板名称
      return templates.map(template => template.name);
    } catch (error) {
      this.logger.error(`获取模板名称列表失败: ${error.message}`);
      throw new HttpException(`获取模板名称列表失败: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 随机选择一个模板并获取其中所有带ID的元素及其文本内容
  async getRandomTemplateWithElements(): Promise<{ 
    templateName: string; 
    elements: { id: string; text: string }[];
    textReplacements: { placeholder: string; replaceWith: string }[];
  }> {
    try {
      // 获取随机模板
      const template = await this.getRandomTemplate();
      if (!template) {
        throw new HttpException('没有可用的模板', HttpStatus.NOT_FOUND);
      }
      
      // 提取带ID的元素
      const elementsWithId = this.extractElementsWithId(template.htmlCode);
      
      // 过滤掉id为"root"的元素
      const filteredElements = elementsWithId.filter(element => element.id !== 'root');
      
      // 将元素ID和文本转换为文本替换格式
      const textReplacements = filteredElements.map(element => ({
        placeholder: element.id,
        replaceWith: element.text
      }));
      
      // 返回模板名称、元素列表和文本替换格式
      return {
        templateName: template.name,
        elements: filteredElements,
        textReplacements: textReplacements
      };
    } catch (error) {
      this.logger.error(`获取随机模板及其元素失败: ${error.message}`);
      throw new HttpException(`获取随机模板及其元素失败: ${error.message}`, 
        error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 专门处理示例中的特殊情况
  private extractExampleSpecificIds(html: string): { id: string; text: string }[] {
    const elementsWithId: { id: string; text: string }[] = [];
    
    try {
      // 1. 处理React组件中的img标签
      const imgIdPattern = /React\.createElement\(['"]img['"][^,]*,\s*(?:{[^}]*id\s*[:=]\s*["']([^"']+)["'][^}]*}|[^{]*id\s*[:=]\s*["']([^"']+)["'][^{]*),\s*\{[^}]*src\s*[:=]\s*["']([^"']+)["']/g;
      let match;
      while ((match = imgIdPattern.exec(html)) !== null) {
        const id = match[1] || match[2];
        const src = match[3];
        
        if (id && src) {
          this.logger.log(`从React组件中提取到img ID: ${id}, src: ${src}`);
          elementsWithId.push({ id, text: src });
        }
      }
      
      // 2. 处理React组件中的其他元素
      // 匹配格式: React.createElement('任意标签', {...id:"123123"...}, "文本内容")
      const elementIdPattern = /React\.createElement\(['"]([^'"]+)['"][^,]*,\s*\{[^}]*id\s*[:=]\s*["']([^"']+)["'][^}]*\}[^,]*,\s*["']([^"']+)["']/g;
      while ((match = elementIdPattern.exec(html)) !== null) {
        const tagName = match[1];
        const id = match[2];
        const text = match[3];
        
        if (id && text) {
          this.logger.log(`从React组件中提取到${tagName} ID: ${id}, 文本: ${text}`);
          
          // 检查该ID是否已经添加过
          const existing = elementsWithId.find(item => item.id === id);
          if (!existing) {
            elementsWithId.push({ id, text });
          }
        }
      }
      
      // 3. 处理更通用的情况，按行分析
      const lines = html.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const idMatches = Array.from(line.matchAll(/id\s*[:=]\s*["']([^"']+)["']/g));
        
        for (const idMatch of idMatches) {
          const id = idMatch[1];
          
          // 检查该ID是否已经添加过
          const existing = elementsWithId.find(item => item.id === id);
          if (!existing && id !== 'root') {
            // 在当前行和后续几行中查找文本内容
            let textContent = '';
            let j = i;
            const maxLines = 5; // 最多向后查找5行
            
            while (j < lines.length && j < i + maxLines) {
              const textMatch = lines[j].match(/["']([^"']+)["']\s*\)/);
              if (textMatch) {
                textContent = textMatch[1];
                break;
              }
              j++;
            }
            
            // 如果找到了文本内容
            if (textContent) {
              this.logger.log(`从行分析中提取到ID: ${id}, 文本: ${textContent}`);
              elementsWithId.push({ id, text: textContent });
            } else {
              // 检查是否是img标签
              if (line.includes('img') || line.includes('image')) {
                const srcMatch = line.match(/src\s*[:=]\s*["']([^"']+)["']/) ||
                                (j < lines.length ? lines[j].match(/src\s*[:=]\s*["']([^"']+)["']/) : null);
                if (srcMatch) {
                  this.logger.log(`从行分析中提取到img ID: ${id}, src: ${srcMatch[1]}`);
                  elementsWithId.push({ id, text: srcMatch[1] });
                }
              }
            }
          }
        }
      }
      
      return elementsWithId;
    } catch (error) {
      this.logger.error(`从React组件中提取ID失败: ${error.message}`);
      return elementsWithId;
    }
  }

  /**
   * 将HTML内容包装成完整的HTML文档
   * @param html HTML内容
   * @returns 包装后的HTML文档
   */
  private wrapHtml(html: string): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>生成的HTML</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }
    </style>
</head>
<body>
  ${html}
</body>
</html>`;
  }
} 