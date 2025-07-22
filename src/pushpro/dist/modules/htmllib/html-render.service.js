"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var HtmlRenderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlRenderService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const htmllib_entity_1 = require("./htmllib.entity");
const cheerio = require("cheerio");
const openaiChat_service_1 = require("../ai/openaiChat.service");
const globalConfig_service_1 = require("../globalConfig/globalConfig.service");
const ai_api_service_1 = require("../ai/ai_api.service");
const image_upload_service_1 = require("../ai/image-upload.service");
const node_html_to_image_1 = require("node-html-to-image");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const render_task_entity_1 = require("./entities/render-task.entity");
const uuid_1 = require("uuid");
let HtmlRenderService = HtmlRenderService_1 = class HtmlRenderService {
    constructor(htmlTemplateRepository, renderTaskRepository, openAIChatService, globalConfigService, aiApiService, imageUploadService) {
        this.htmlTemplateRepository = htmlTemplateRepository;
        this.renderTaskRepository = renderTaskRepository;
        this.openAIChatService = openAIChatService;
        this.globalConfigService = globalConfigService;
        this.aiApiService = aiApiService;
        this.imageUploadService = imageUploadService;
        this.logger = new common_1.Logger(HtmlRenderService_1.name);
        this.recentlyUsedTemplateIds = [];
        this.imageOutputDir = path.join(process.cwd(), 'uploads', 'html-images');
        if (!fs.existsSync(this.imageOutputDir)) {
            fs.mkdirSync(this.imageOutputDir, { recursive: true });
        }
        this.checkAndSetChromiumPath();
        this.checkAndInstallFonts().catch(err => {
            this.logger.warn(`字体检查/安装过程中出现警告: ${err.message}`);
        });
    }
    checkAndSetChromiumPath() {
        try {
            const { existsSync } = require('fs');
            const possiblePaths = [
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium',
                '/usr/bin/google-chrome',
                '/usr/bin/google-chrome-stable'
            ];
            for (const path of possiblePaths) {
                if (existsSync(path)) {
                    process.env.CHROME_BIN = path;
                    this.logger.log(`已设置Chromium浏览器路径: ${path}`);
                    return;
                }
            }
            this.logger.warn('未找到Chromium浏览器，将在需要时尝试安装');
        }
        catch (error) {
            this.logger.warn(`检查Chromium浏览器路径时出错: ${error.message}`);
        }
    }
    async checkAndInstallFonts() {
        try {
            const { exec } = require('child_process');
            const isLinux = process.platform === 'linux';
            if (!isLinux) {
                this.logger.log('非Linux系统，跳过字体安装检查');
                return;
            }
            this.logger.log('检查系统中文字体...');
            exec('fc-list :lang=zh | wc -l', (error, stdout) => {
                const fontCount = parseInt(stdout.trim(), 10);
                if (error || fontCount < 5) {
                    this.logger.warn(`系统中文字体不足 (检测到${fontCount || 0}个)，尝试安装中文字体包...`);
                    exec('apt-get update && apt-get install -y fonts-wqy-microhei fonts-wqy-zenhei fonts-arphic-ukai fonts-arphic-uming', { maxBuffer: 1024 * 1024 * 10 }, (installError, installStdout, installStderr) => {
                        if (installError) {
                            this.logger.error(`安装中文字体失败: ${installError.message}`);
                            this.logger.error(installStderr);
                        }
                        else {
                            this.logger.log('中文字体安装完成，更新字体缓存...');
                            exec('fc-cache -f -v', (cacheError) => {
                                if (cacheError) {
                                    this.logger.error(`更新字体缓存失败: ${cacheError.message}`);
                                }
                                else {
                                    this.logger.log('字体缓存更新完成');
                                }
                            });
                        }
                    });
                }
                else {
                    this.logger.log(`系统已安装足够的中文字体 (检测到${fontCount}个)`);
                }
            });
        }
        catch (error) {
            this.logger.error(`检查字体时出错: ${error.message}`);
        }
    }
    async findTemplateByName(templateName) {
        if (!templateName) {
            return this.getRandomTemplate();
        }
        const template = await this.htmlTemplateRepository.findOne({
            where: { name: templateName },
        });
        if (!template) {
            throw new common_1.HttpException(`未找到名称为"${templateName}"的模板或模板未启用`, common_1.HttpStatus.NOT_FOUND);
        }
        if (!template.textDetails) {
            template.textDetails = JSON.stringify([]);
        }
        try {
            if (typeof template.textDetails === 'string') {
                const parsedDetails = JSON.parse(template.textDetails);
                if (!Array.isArray(parsedDetails) || parsedDetails.length === 0) {
                    const extractedTexts = this.extractReplaceableText(template.htmlCode);
                    template.textDetails = JSON.stringify(extractedTexts);
                }
            }
        }
        catch (error) {
            this.logger.warn(`模板${templateName}的textDetails解析失败: ${error.message}`);
            const extractedTexts = this.extractReplaceableText(template.htmlCode);
            template.textDetails = JSON.stringify(extractedTexts);
        }
        return template;
    }
    extractReplaceableText(html) {
        try {
            const $ = cheerio.load(html);
            const textNodes = [];
            $('*').each((_, element) => {
                const $element = $(element);
                const text = $element.contents().filter(function () {
                    return this.type === 'text' && $(this).text().trim().length > 0;
                }).text().trim();
                if (text && text.length > 0 && !textNodes.includes(text)) {
                    if (text.length > 3 && text.length < 100) {
                        textNodes.push(text);
                    }
                }
            });
            return textNodes;
        }
        catch (error) {
            this.logger.error(`从HTML中提取可替换文本失败: ${error.message}`);
            return [];
        }
    }
    replaceTextInHtml(html, textReplacements, useId = false) {
        try {
            if (!textReplacements || textReplacements.length === 0) {
                return html;
            }
            const replacementMap = new Map();
            for (const item of textReplacements) {
                if (item.placeholder && item.replaceWith) {
                    replacementMap.set(item.placeholder, item.replaceWith);
                }
            }
            this.logger.log(`开始替换文本，共${textReplacements.length}个替换项，useId=${useId}`);
            if (useId) {
                this.logger.log(`使用ID进行替换，共${textReplacements.length}个替换项`);
                for (const [id, newText] of replacementMap.entries()) {
                    this.logger.log(`尝试替换ID: ${id} -> "${newText.substring(0, 30)}${newText.length > 30 ? '...' : ''}"`);
                    const reactRegex = new RegExp(`React\\.createElement\\(['"]([^'"]+)['"][^,]*,\\s*\\{[^}]*id\\s*[:=]\\s*["']${id}["'][^}]*\\}[^,]*,\\s*["']([^"']+)["']\\s*\\)`, 'g');
                    let reactReplaceCount = 0;
                    html = html.replace(reactRegex, (match, tagName, oldText) => {
                        reactReplaceCount++;
                        this.logger.log(`替换React组件中ID为${id}的文本: ${oldText} -> ${newText}`);
                        return match.replace(`"${oldText}"`, `"${newText}"`);
                    });
                    if (reactReplaceCount > 0) {
                        this.logger.log(`成功替换了${reactReplaceCount}处React组件中ID为${id}的文本`);
                    }
                    else {
                        this.logger.log(`未找到React组件中ID为${id}的文本，尝试其他替换方式`);
                        const looseReactRegex = new RegExp(`id\\s*[:=]\\s*["']${id}["'][^>]*>[^<]*<`, 'g');
                        let looseReplaceCount = 0;
                        html = html.replace(looseReactRegex, (match) => {
                            looseReplaceCount++;
                            this.logger.log(`使用宽松模式替换ID为${id}的文本`);
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
                        }
                        else {
                            this.logger.log(`宽松模式也未找到ID为${id}的文本，尝试直接替换ID字符串`);
                            const idRegex = new RegExp(`${this.escapeRegExp(id)}`, 'g');
                            let idReplaceCount = 0;
                            html = html.replace(idRegex, (match) => {
                                idReplaceCount++;
                                this.logger.log(`直接替换ID字符串: ${id} -> ${newText}`);
                                return newText;
                            });
                            if (idReplaceCount > 0) {
                                this.logger.log(`直接替换ID字符串成功，替换了${idReplaceCount}处`);
                            }
                            else {
                                this.logger.warn(`警告: 未能替换ID为${id}的文本，该ID可能不存在于HTML中`);
                            }
                        }
                    }
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
            this.logger.log(`使用常规文本替换，共${textReplacements.length}个替换项`);
            let replacedHtml = html;
            for (const [placeholder, replaceWith] of replacementMap.entries()) {
                const regex = new RegExp(this.escapeRegExp(placeholder), 'g');
                const originalHtml = replacedHtml;
                replacedHtml = replacedHtml.replace(regex, replaceWith);
                if (originalHtml === replacedHtml) {
                    this.logger.warn(`警告: 未能替换文本 "${placeholder}"`);
                }
                else {
                    this.logger.log(`成功替换文本: "${placeholder}" -> "${replaceWith.substring(0, 30)}${replaceWith.length > 30 ? '...' : ''}"`);
                }
            }
            return replacedHtml;
        }
        catch (error) {
            this.logger.error(`替换文本时出错: ${error.message}`);
            return html;
        }
    }
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    replaceHtmlContent(html, imageUrls = [], textReplacements = [], useId = false) {
        try {
            const $ = cheerio.load(html, {
                xml: {
                    decodeEntities: false
                },
                decodeEntities: false
            });
            if (imageUrls.length > 0) {
                const imgElements = $('img');
                const imgCount = imgElements.length;
                if (imageUrls.length > imgCount) {
                    this.logger.log(`提供的图片URL数量(${imageUrls.length})超过了模板中的图片数量(${imgCount})，将随机选择`);
                    const imageUrlsCopy = [...imageUrls];
                    const randomizedUrls = this.shuffleArray(imageUrlsCopy).slice(0, imgCount);
                    imgElements.each((index, element) => {
                        $(element).attr('src', randomizedUrls[index]);
                    });
                }
                else {
                    imgElements.each((index, element) => {
                        if (index < imageUrls.length && imageUrls[index]) {
                            $(element).attr('src', imageUrls[index]);
                        }
                    });
                }
            }
            let htmlString = $.html();
            htmlString = htmlString.replace(/<(div|span|p|h[1-6]|section|article|nav|header|footer|aside|main)([^>]*?)\/>/g, '<$1$2></$1>');
            htmlString = this.replaceTextInHtml(htmlString, textReplacements, useId);
            return htmlString;
        }
        catch (error) {
            this.logger.error(`替换HTML内容失败: ${error.message}`);
            throw new common_1.HttpException('替换HTML内容失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    shuffleArray(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    async generateAIContent(template, imageUrls = [], content = '') {
        try {
            this.logger.log('开始使用AI生成HTML内容');
            let prompt = `{{USER_HTML_TEMPLATE}}:\n${template.htmlCode}\n\n`;
            if (content) {
                prompt += `{{USER_TOPIC_OR_CONCEPT}}:\n${content}`;
            }
            const aiResult = await this.aiApiService.generateAIContent({
                appName: "HTML模板",
                prompt: prompt,
                chatId: `html-template-${template.id}`,
            });
            if (!aiResult) {
                this.logger.warn('AI未返回有效内容');
                return '';
            }
            const resultText = aiResult;
            this.logger.log(`AI生成内容成功，长度=${resultText.length}`);
            const htmlMatch = resultText.match(/<!DOCTYPE html[\s\S]*<\/html>/) ||
                resultText.match(/<html[\s\S]*<\/html>/);
            if (htmlMatch) {
                const extractedHtml = htmlMatch[1] || htmlMatch[0];
                this.logger.log(`成功从AI响应中提取HTML代码，长度：${extractedHtml.length}`);
                return extractedHtml;
            }
            this.logger.log('未找到特定格式的HTML，返回整个AI响应');
            return resultText;
        }
        catch (error) {
            this.logger.error(`生成AI内容出错: ${error.message}`);
            return '';
        }
    }
    async getRandomTemplate() {
        const allTemplates = await this.htmlTemplateRepository.find({
            where: { status: 1 },
        });
        if (!allTemplates || allTemplates.length === 0) {
            throw new common_1.HttpException('没有可用的模板', common_1.HttpStatus.NOT_FOUND);
        }
        if (allTemplates.length <= 3) {
            const randomIndex = Math.floor(Math.random() * allTemplates.length);
            const selectedTemplate = allTemplates[randomIndex];
            this.updateRecentlyUsedTemplates(selectedTemplate.id);
            return selectedTemplate;
        }
        const availableTemplates = allTemplates.filter(template => !this.recentlyUsedTemplateIds.includes(template.id));
        if (availableTemplates.length === 0) {
            const randomIndex = Math.floor(Math.random() * allTemplates.length);
            const selectedTemplate = allTemplates[randomIndex];
            this.updateRecentlyUsedTemplates(selectedTemplate.id);
            return selectedTemplate;
        }
        const randomIndex = Math.floor(Math.random() * availableTemplates.length);
        const selectedTemplate = availableTemplates[randomIndex];
        this.updateRecentlyUsedTemplates(selectedTemplate.id);
        this.logger.log(`随机选择了模板: "${selectedTemplate.name}"`);
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
        }
        catch (error) {
            this.logger.warn(`模板${selectedTemplate.name}的textDetails解析失败: ${error.message}`);
            const extractedTexts = this.extractReplaceableText(selectedTemplate.htmlCode);
            selectedTemplate.textDetails = JSON.stringify(extractedTexts);
        }
        return selectedTemplate;
    }
    updateRecentlyUsedTemplates(templateId) {
        this.recentlyUsedTemplateIds.unshift(templateId);
        if (this.recentlyUsedTemplateIds.length > 3) {
            this.recentlyUsedTemplateIds.pop();
        }
        this.logger.log(`更新最近使用的模板列表: [${this.recentlyUsedTemplateIds.join(', ')}]`);
    }
    async renderTemplateToHtml(templateName, imageUrls = [], textReplacements = [], wrapHtml = true, generateAiContent = false, content = '', useId = false, retryCount = 0) {
        const TIMEOUT = 20000;
        const MAX_RETRIES = 3;
        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('渲染操作超时(20秒)')), TIMEOUT);
            });
            const renderPromise = (async () => {
                let template;
                let randomTemplate = false;
                if (!templateName) {
                    template = await this.getRandomTemplate();
                    randomTemplate = true;
                    if (!template) {
                        throw new common_1.NotFoundException('没有可用的模板');
                    }
                    this.logger.log(`随机选择模板: ${template.name}`);
                }
                else {
                    template = await this.findTemplateByName(templateName);
                    if (!template) {
                        throw new common_1.NotFoundException(`未找到名称为"${templateName}"的模板`);
                    }
                    this.logger.log(`使用指定模板: ${template.name}`);
                }
                let htmlString = template.htmlCode;
                if (generateAiContent && content) {
                    this.logger.log('使用AI内容生成');
                    try {
                        const aiGeneratedHtml = await this.generateAIContent(template, imageUrls, content);
                        if (aiGeneratedHtml) {
                            htmlString = aiGeneratedHtml;
                            this.logger.log('成功生成AI内容');
                        }
                        else {
                            this.logger.warn('AI内容生成失败，使用原始模板');
                        }
                    }
                    catch (error) {
                        this.logger.error(`AI内容生成出错: ${error.message}`);
                    }
                }
                const $ = cheerio.load(htmlString, {
                    xml: {
                        decodeEntities: false
                    },
                    decodeEntities: false
                });
                if (imageUrls && imageUrls.length > 0) {
                    const imgElements = $('img');
                    const safeImageUrls = [...imageUrls];
                    while (safeImageUrls.length < imgElements.length) {
                        safeImageUrls.push(safeImageUrls[safeImageUrls.length % imageUrls.length]);
                    }
                    imgElements.each((index, element) => {
                        if (index < safeImageUrls.length) {
                            $(element).attr('src', safeImageUrls[index]);
                            this.logger.log(`替换图片 #${index + 1}: ${safeImageUrls[index]}`);
                        }
                    });
                    htmlString = $.html();
                    htmlString = htmlString.replace(/<(div|span|p|h[1-6]|section|article|nav|header|footer|aside|main)([^>]*?)\/>/g, '<$1$2></$1>');
                }
                if (textReplacements && textReplacements.length > 0) {
                    if (useId) {
                        this.logger.log(`使用ID进行文本替换，共${textReplacements.length}个替换项`);
                        htmlString = this.replaceTextInHtml(htmlString, textReplacements, true);
                    }
                    else {
                        this.logger.log(`使用常规文本替换，共${textReplacements.length}个替换项`);
                        htmlString = this.replaceTextInHtml(htmlString, textReplacements, false);
                    }
                }
                if (wrapHtml && !htmlString.toLowerCase().includes('<!doctype')) {
                    htmlString = this.wrapHtml(htmlString);
                }
                const result = {
                    html: htmlString
                };
                if (randomTemplate) {
                    result.templateName = template.name;
                }
                return result;
            })();
            return await Promise.race([renderPromise, timeoutPromise]);
        }
        catch (error) {
            this.logger.error(`渲染HTML模板失败 (尝试 ${retryCount + 1}/${MAX_RETRIES + 1}): ${error.message}`);
            if (retryCount < MAX_RETRIES) {
                this.logger.log(`超时或错误，进行第 ${retryCount + 1} 次重试...`);
                return this.renderTemplateToHtml(templateName, imageUrls, textReplacements, wrapHtml, generateAiContent, content, useId, retryCount + 1);
            }
            throw new common_1.HttpException(`渲染HTML模板失败，已重试${MAX_RETRIES}次: ${error.message}`, error instanceof common_1.HttpException ? error.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getTemplateByName(templateName) {
        return this.findTemplateByName(templateName);
    }
    async htmlToImage(html, options, retryCount = 0) {
        const TIMEOUT = 20000;
        const MAX_RETRIES = 3;
        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('HTML转图片操作超时(20秒)')), TIMEOUT);
            });
            const convertPromise = (async () => {
                const useAutoWidth = (options === null || options === void 0 ? void 0 : options.useAutoWidth) !== false;
                const uploadToSuperbed = (options === null || options === void 0 ? void 0 : options.uploadToSuperbed) !== false;
                const imageType = (options === null || options === void 0 ? void 0 : options.type) || 'png';
                const imageQuality = (options === null || options === void 0 ? void 0 : options.quality) || 80;
                this.logger.log(`开始执行HTML到图片的转换（${useAutoWidth ? '自适应宽度模式' : '固定宽度模式'}）`);
                this.logger.log(`需要执行的HTML内容：\n${html}`);
                const fileName = `${crypto.randomBytes(16).toString('hex')}.${imageType}`;
                const filePath = path.join(this.imageOutputDir, fileName);
                this.logger.log(`生成的文件名: ${fileName}`);
                this.logger.log(`文件保存路径: ${filePath}`);
                html = this.addFontPreloadToHtml(html);
                this.logger.log(`已添加字体预加载到HTML`);
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
                if (process.env.DOCKER_ENV === 'true') {
                    puppeteerArgs.push('--disable-dev-shm-usage');
                    puppeteerArgs.push('--disable-software-rasterizer');
                    this.logger.log(`检测到Docker环境，添加额外的Puppeteer参数`);
                }
                const convertOptions = {
                    output: filePath,
                    puppeteerArgs: {
                        args: puppeteerArgs,
                        defaultViewport: null,
                        executablePath: process.env.CHROME_BIN || '/usr/bin/chromium-browser'
                    },
                    type: imageType,
                    quality: imageQuality,
                    encoding: 'binary',
                    html: html,
                    waitUntil: ['load', 'networkidle0', 'domcontentloaded'],
                    transparent: imageType === 'png',
                    beforeScreenshot: async (page) => {
                        await page.waitForFunction('document.fonts.ready');
                        this.logger.log(`页面字体加载完成`);
                        if (useAutoWidth) {
                            this.logger.log('使用自动宽度检测模式，计算页面实际尺寸');
                            const dimensions = await page.evaluate(() => {
                                const body = document.body;
                                const html = document.documentElement;
                                const width = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth);
                                const height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
                                return { width, height };
                            });
                            this.logger.log(`页面实际尺寸: 宽度=${dimensions.width}px, 高度=${dimensions.height}px`);
                            await page.setViewport({
                                width: dimensions.width,
                                height: dimensions.height,
                                deviceScaleFactor: 1
                            });
                            this.logger.log(`已设置视口大小为: ${dimensions.width}x${dimensions.height}`);
                        }
                        else if (options === null || options === void 0 ? void 0 : options.width) {
                            const viewportWidth = options.width;
                            const viewportHeight = options.height || Math.round(viewportWidth * 1.5);
                            this.logger.log(`使用指定尺寸: 宽度=${viewportWidth}px, 高度=${viewportHeight}px`);
                            await page.setViewport({
                                width: viewportWidth,
                                height: viewportHeight,
                                deviceScaleFactor: 1
                            });
                            this.logger.log(`已设置视口大小为: ${viewportWidth}x${viewportHeight}`);
                        }
                    }
                };
                if (options === null || options === void 0 ? void 0 : options.selector) {
                    convertOptions.selector = options.selector;
                    this.logger.log(`使用选择器截图: ${options.selector}`);
                }
                this.logger.log(`开始执行HTML到图片的转换...`);
                await (0, node_html_to_image_1.default)(convertOptions);
                this.logger.log(`HTML转图片成功: ${filePath}`);
                const urlPath = `/uploads/html-images/${fileName}`;
                let superImageUrl;
                if (uploadToSuperbed) {
                    try {
                        this.logger.log(`开始上传图片到Super图床...`);
                        const uploadResult = await this.imageUploadService.uploadToSuperbed(filePath);
                        if (uploadResult && uploadResult.url) {
                            superImageUrl = uploadResult.url;
                            this.logger.log(`图片已上传到Super图床: ${superImageUrl}`);
                        }
                        else {
                            this.logger.warn(`上传到Super图床返回空结果`);
                        }
                    }
                    catch (error) {
                        this.logger.error(`上传到Super图床失败: ${error.message}`);
                    }
                }
                return {
                    filePath,
                    fileName,
                    url: urlPath,
                    superImageUrl
                };
            })();
            return await Promise.race([convertPromise, timeoutPromise]);
        }
        catch (error) {
            this.logger.error(`HTML转图片失败 (尝试 ${retryCount + 1}/${MAX_RETRIES + 1}): ${error.message}`);
            this.logger.error(`错误堆栈: ${error.stack}`);
            if (retryCount < MAX_RETRIES) {
                this.logger.log(`超时或错误，进行第 ${retryCount + 1} 次重试...`);
                if (error.message && error.message.includes('超时')) {
                    this.logger.log('超时错误，等待1秒后重试...');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                return this.htmlToImage(html, options, retryCount + 1);
            }
            throw new common_1.HttpException(`HTML转图片失败，已重试${MAX_RETRIES}次: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    addFontPreloadToHtml(html) {
        try {
            const $ = cheerio.load(html);
            let hasFontStyle = false;
            $('style').each((i, el) => {
                const styleContent = $(el).html() || '';
                if (styleContent.includes('@font-face') || styleContent.includes('font-family')) {
                    hasFontStyle = true;
                }
            });
            if (!hasFontStyle) {
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
                $('head').prepend(`
          <link rel="preload" as="font" href="data:font/woff2;base64," crossorigin>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        `);
            }
            if (!$('meta[charset]').length && !$('meta[http-equiv="Content-Type"]').length) {
                $('head').prepend('<meta charset="utf-8">');
            }
            let htmlString = $.html();
            htmlString = htmlString.replace(/<(div|span|p|h[1-6]|section|article|nav|header|footer|aside|main)([^>]*?)\/>/g, '<$1$2></$1>');
            return htmlString;
        }
        catch (error) {
            this.logger.warn(`添加字体预加载失败: ${error.message}`);
            return html;
        }
    }
    async renderTemplateToImage(templateName, imageUrls = [], textReplacements = [], options) {
        const TIMEOUT = 20000;
        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('渲染模板为图片操作超时(20秒)')), TIMEOUT);
            });
            const renderPromise = (async () => {
                const result = await this.renderTemplateToHtml(templateName, imageUrls, textReplacements, true, (options === null || options === void 0 ? void 0 : options.generateAiContent) || false, (options === null || options === void 0 ? void 0 : options.content) || '', (options === null || options === void 0 ? void 0 : options.useId) || false);
                this.logger.log(`渲染模板 ${templateName} 为图片，自动宽度检测: ${(options === null || options === void 0 ? void 0 : options.useAutoWidth) ? '启用' : '禁用'}`);
                return this.htmlToImage(result.html, {
                    width: options === null || options === void 0 ? void 0 : options.width,
                    height: options === null || options === void 0 ? void 0 : options.height,
                    quality: options === null || options === void 0 ? void 0 : options.quality,
                    type: options === null || options === void 0 ? void 0 : options.type,
                    selector: options === null || options === void 0 ? void 0 : options.selector,
                    uploadToSuperbed: options === null || options === void 0 ? void 0 : options.uploadToSuperbed,
                    useAutoWidth: options === null || options === void 0 ? void 0 : options.useAutoWidth
                });
            })();
            return await Promise.race([renderPromise, timeoutPromise]);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error(`渲染模板为图片失败: ${error.message}`);
            throw new common_1.HttpException(`渲染模板为图片失败: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteHtmlImage(fileName) {
        try {
            const filePath = path.join(this.imageOutputDir, fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                this.logger.log(`成功删除图片: ${fileName}`);
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error(`删除图片失败: ${error.message}`, error.stack);
            return false;
        }
    }
    async createRenderTask(renderParams) {
        const taskId = (0, uuid_1.v4)();
        let paramsToStore;
        if (typeof renderParams === 'string') {
            try {
                JSON.parse(renderParams);
                paramsToStore = renderParams;
            }
            catch (error) {
                throw new Error(`无效的JSON字符串: ${error.message}`);
            }
        }
        else if (typeof renderParams === 'object') {
            try {
                paramsToStore = JSON.stringify(renderParams);
            }
            catch (error) {
                throw new Error(`无法序列化参数: ${error.message}`);
            }
        }
        else {
            throw new Error(`无效的渲染参数类型: ${typeof renderParams}`);
        }
        const task = this.renderTaskRepository.create({
            taskId,
            renderParams: paramsToStore,
            status: 'pending',
        });
        await this.renderTaskRepository.save(task);
        this.processRenderTask(task, 0).catch(error => {
            console.error(`处理渲染任务 ${taskId} 失败:`, error);
        });
        return task;
    }
    async processRenderTask(task, retryCount = 0) {
        var _a;
        try {
            this.logger.log(`开始处理渲染任务 ${task.taskId} (尝试 ${retryCount + 1}/4)`);
            if (!task || !task.renderParams) {
                throw new Error('无效的任务或渲染参数');
            }
            task.status = 'processing';
            await this.saveTask(task);
            let params;
            if (typeof task.renderParams === 'string') {
                try {
                    params = JSON.parse(task.renderParams);
                }
                catch (parseError) {
                    throw new Error(`无法解析渲染参数: ${parseError.message}`);
                }
            }
            else if (typeof task.renderParams === 'object') {
                params = task.renderParams;
            }
            else {
                throw new Error(`无效的渲染参数类型: ${typeof task.renderParams}`);
            }
            const textMode = params.textMode === true;
            const generateAiContent = params.generateAiContent === true;
            const content = params.content || '';
            const convertToImage = params.convertToImage === true;
            const useId = params.useId === true;
            if (params.textReplacements && params.textReplacements.length > 0) {
                this.logger.log(`文本替换项数量: ${params.textReplacements.length}, useId: ${useId}`);
                for (const item of params.textReplacements) {
                    this.logger.log(`文本替换项: placeholder=${item.placeholder}, replaceWith=${item.replaceWith.substring(0, 30)}${item.replaceWith.length > 30 ? '...' : ''}`);
                }
            }
            else {
                this.logger.log(`没有提供文本替换项`);
            }
            this.logger.log(`调用renderTemplateToHtml: templateName=${params.templateName || '(随机)'}, useId=${useId}, 图片数量=${((_a = params.imageUrls) === null || _a === void 0 ? void 0 : _a.length) || 0}`);
            const TIMEOUT = 20000;
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('渲染任务超时(20秒)')), TIMEOUT);
            });
            const renderPromise = this.renderTemplateToHtml(params.templateName || '', params.imageUrls || [], params.textReplacements || [], params.wrapHtml !== undefined ? params.wrapHtml : true, generateAiContent, content, useId);
            const result = await Promise.race([renderPromise, timeoutPromise]);
            task.htmlContent = result.html;
            this.logger.log(`已保存HTML内容，长度: ${result.html.length}`);
            if (params.textReplacements && params.textReplacements.length > 0) {
                for (const item of params.textReplacements) {
                    if (result.html.includes(item.placeholder)) {
                        this.logger.warn(`警告: HTML内容中仍包含未替换的placeholder: ${item.placeholder}`);
                    }
                }
            }
            let imageResult;
            try {
                const imageTimeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('HTML转图片超时(20秒)')), TIMEOUT);
                });
                const imageRenderPromise = this.htmlToImage(result.html, {
                    width: params.width,
                    height: params.height,
                    quality: params.quality,
                    type: params.type || 'png',
                    selector: params.selector,
                    uploadToSuperbed: params.uploadToSuperbed,
                    useAutoWidth: params.useAutoWidth
                });
                imageResult = await Promise.race([imageRenderPromise, imageTimeoutPromise]);
            }
            catch (renderError) {
                if (renderError.message && (renderError.message.includes('Could not find Chrome') ||
                    renderError.message.includes('Unable to launch browser') ||
                    renderError.message.includes('Failed to launch') ||
                    renderError.message.includes('超时'))) {
                    this.logger.error(`HTML转图片失败: ${renderError.message}`);
                    if (retryCount === 0) {
                        try {
                            this.logger.log('尝试安装Chrome浏览器...');
                            const { execSync } = require('child_process');
                            try {
                                execSync('apt-get update && apt-get install -y chromium-browser', { stdio: 'inherit' });
                                this.logger.log('Chrome浏览器安装成功，重试渲染任务');
                                process.env.CHROME_BIN = '/usr/bin/chromium-browser';
                            }
                            catch (installError) {
                                this.logger.error(`安装Chrome浏览器失败: ${installError.message}`);
                                try {
                                    execSync('apt-get update && apt-get install -y chromium', { stdio: 'inherit' });
                                    this.logger.log('Chromium浏览器安装成功，重试渲染任务');
                                    process.env.CHROME_BIN = '/usr/bin/chromium';
                                }
                                catch (installError2) {
                                    this.logger.error(`安装Chromium浏览器失败: ${installError2.message}`);
                                }
                            }
                            if (retryCount < 3) {
                                this.logger.log(`渲染任务处理失败 (尝试 ${retryCount + 1}/4): ${renderError.message}`);
                                return this.processRenderTask(task, retryCount + 1);
                            }
                        }
                        catch (execError) {
                            this.logger.error(`执行安装命令失败: ${execError.message}`);
                        }
                    }
                }
                throw renderError;
            }
            task.status = 'completed';
            task.result = imageResult;
            task.completedAt = new Date();
            await this.saveTask(task);
            this.logger.log(`渲染任务 ${task.taskId} 处理完成`);
        }
        catch (error) {
            this.logger.error(`渲染任务处理失败: ${error.message}`);
            if (retryCount < 3) {
                this.logger.log(`渲染任务处理失败 (尝试 ${retryCount + 1}/4): ${error.message}`);
                if (error.message && error.message.includes('超时')) {
                    this.logger.log('超时错误，等待1秒后重试...');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                return this.processRenderTask(task, retryCount + 1);
            }
            task.status = 'failed';
            task.errorMessage = error.message;
            await this.saveTask(task);
            throw new Error(`HTML转图片失败: ${error.message}`);
        }
    }
    async getTaskById(taskId) {
        const task = await this.renderTaskRepository.findOne({ where: { taskId } });
        if (!task) {
            throw new common_1.NotFoundException(`任务ID ${taskId} 不存在`);
        }
        return task;
    }
    async cleanupOldTasks(days = 7) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        const result = await this.renderTaskRepository
            .createQueryBuilder()
            .delete()
            .where('createdAt < :date', { date })
            .execute();
        return result.affected || 0;
    }
    async saveTask(task) {
        return this.renderTaskRepository.save(task);
    }
    extractReactComponentIds(html) {
        const elementsWithId = [];
        try {
            const reactElementRegex = /React\.createElement\(['"]([^'"]+)['"][^,]*,\s*\{[^}]*id\s*[:=]\s*["']([^"']+)["'][^}]*\}[^,]*,\s*["']([^"']+)["']\s*\)/g;
            let match;
            while ((match = reactElementRegex.exec(html)) !== null) {
                const tagName = match[1];
                const id = match[2];
                const text = match[3];
                this.logger.log(`从React组件中提取到标签: ${tagName}, ID: ${id}, 文本: ${text}`);
                const existing = elementsWithId.find(item => item.id === id);
                if (!existing && id !== 'root' && text) {
                    elementsWithId.push({ id, text });
                }
            }
            const idRegex = /\bid\s*[:=]\s*["']([^"']+)["']/g;
            while ((match = idRegex.exec(html)) !== null) {
                const id = match[1];
                if (id === 'root' || elementsWithId.find(item => item.id === id)) {
                    continue;
                }
                const idPosition = match.index;
                const lineStart = Math.max(0, html.lastIndexOf('\n', idPosition));
                const lineEnd = html.indexOf('\n', idPosition);
                const line = html.substring(lineStart, lineEnd > 0 ? lineEnd : html.length);
                let text = '';
                const textMatch = /},\s*["']([^"']+)["']\s*\)/.exec(line) ||
                    /},\s*React\.createElement\([^,]+,[^,]+,\s*["']([^"']+)["']\s*\)/.exec(line);
                if (textMatch) {
                    text = textMatch[1];
                    this.logger.log(`从行中提取到ID: ${id}, 文本: ${text}`);
                }
                else {
                    const afterId = html.substring(idPosition, idPosition + 500);
                    const afterTextMatch = /},\s*["']([^"']+)["']\s*\)/.exec(afterId) ||
                        /},\s*React\.createElement\([^,]+,[^,]+,\s*["']([^"']+)["']\s*\)/.exec(afterId);
                    if (afterTextMatch) {
                        text = afterTextMatch[1];
                        this.logger.log(`从ID后面提取到文本: ${text}`);
                    }
                    else {
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
                if (!text) {
                    const context = html.substring(Math.max(0, idPosition - 200), Math.min(html.length, idPosition + 500));
                    const contextTextMatch = /["']([^"']{3,100})["']\s*\)/.exec(context);
                    if (contextTextMatch) {
                        text = contextTextMatch[1];
                        this.logger.log(`从上下文中提取到ID: ${id}, 文本: ${text}`);
                    }
                }
                if (!text) {
                    text = `Element with ID ${id}`;
                }
                elementsWithId.push({ id, text });
            }
            const reactSpecificIds = this.extractExampleSpecificIds(html);
            for (const element of reactSpecificIds) {
                if (element.id !== 'root' && !elementsWithId.find(item => item.id === element.id)) {
                    elementsWithId.push(element);
                }
            }
            return elementsWithId;
        }
        catch (error) {
            this.logger.error(`从React组件中提取ID失败: ${error.message}`);
            return elementsWithId;
        }
    }
    extractComplexReactIds(html) {
        const elementsWithId = [];
        try {
            const lines = html.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (!line.includes('id') || line.trim().startsWith('//')) {
                    continue;
                }
                const idMatches = Array.from(line.matchAll(/id\s*[:=]\s*["']([^"']+)["']/g));
                for (const idMatch of idMatches) {
                    const id = idMatch[1];
                    if (id === 'root' || elementsWithId.find(item => item.id === id)) {
                        continue;
                    }
                    this.logger.log(`在复杂React组件中找到ID: ${id}`);
                    let text = '';
                    const lineTextMatch = line.match(/["']([^"']{3,100})["']\s*\)/) ||
                        line.match(/},\s*["']([^"']+)["']\s*\)/);
                    if (lineTextMatch) {
                        text = lineTextMatch[1];
                        this.logger.log(`在当前行找到文本: ${text}`);
                    }
                    else {
                        let j = i + 1;
                        const maxLines = 10;
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
                        if (!text && (line.includes('img') || line.includes('image'))) {
                            const srcMatch = line.match(/src\s*[:=]\s*["']([^"']+)["']/) ||
                                (j < lines.length ? lines[j].match(/src\s*[:=]\s*["']([^"']+)["']/) : null);
                            if (srcMatch) {
                                text = srcMatch[1];
                                this.logger.log(`找到img标签的src: ${text}`);
                            }
                        }
                        if (!text) {
                            const startLine = Math.max(0, i - 5);
                            const endLine = Math.min(lines.length - 1, i + 10);
                            const context = lines.slice(startLine, endLine + 1).join('\n');
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
                    if (!text && line.includes('h2') && line.includes('id')) {
                        const h2TextRegex = /React\.createElement\(['"]h2['"][^,]*,\s*\{[^}]*id\s*[:=]\s*["'][^"']+["'][^}]*\}[^,]*,\s*["']([^"']+)["']/;
                        const h2Match = line.match(h2TextRegex);
                        if (h2Match) {
                            text = h2Match[1];
                            this.logger.log(`找到h2标签的文本内容: ${text}`);
                        }
                        else {
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
                    if (!text) {
                        text = `Element with ID ${id}`;
                        this.logger.log(`未找到文本内容，使用默认值: ${text}`);
                    }
                    elementsWithId.push({ id, text });
                }
            }
            return elementsWithId;
        }
        catch (error) {
            this.logger.error(`处理复杂React组件失败: ${error.message}`);
            return elementsWithId;
        }
    }
    extractElementsWithId(html) {
        try {
            const $ = cheerio.load(html, {
                xml: {
                    decodeEntities: false
                },
                decodeEntities: false
            });
            const elementsWithId = [];
            $('[id]').each((_, element) => {
                const $element = $(element);
                const id = $element.attr('id');
                const text = $element.text().trim();
                if (id && text && id !== 'root') {
                    this.logger.log(`从常规HTML中提取到ID: ${id}, 文本: ${text}`);
                    elementsWithId.push({ id, text });
                }
            });
            const isReactComponent = html.includes('React.createElement') ||
                html.includes('import React from') ||
                html.includes('from "react"') ||
                html.includes('from \'react\'');
            if (isReactComponent) {
                this.logger.log('检测到React组件格式，使用专门的方法处理');
                const reactElements = this.extractReactComponentIds(html);
                for (const element of reactElements) {
                    if (element.id !== 'root') {
                        const existing = elementsWithId.find(item => item.id === element.id);
                        if (!existing) {
                            elementsWithId.push(element);
                        }
                    }
                }
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
            const filteredElements = elementsWithId.filter(element => element.id !== 'root');
            this.logger.log(`从HTML中提取到${filteredElements.length}个带ID的元素: ${JSON.stringify(filteredElements)}`);
            return filteredElements;
        }
        catch (error) {
            this.logger.error(`从HTML中提取带ID的元素失败: ${error.message}`);
            return [];
        }
    }
    async getTemplateElementsWithId(templateName) {
        try {
            const template = await this.findTemplateByName(templateName);
            if (!template) {
                throw new common_1.NotFoundException(`未找到名称为"${templateName}"的模板`);
            }
            const elements = this.extractElementsWithId(template.htmlCode);
            const filteredElements = elements.filter(element => element.id !== 'root');
            this.logger.log(`从模板"${templateName}"中提取到${filteredElements.length}个带ID的元素（已过滤root元素）`);
            return filteredElements;
        }
        catch (error) {
            this.logger.error(`获取模板元素ID失败: ${error.message}`);
            throw new common_1.HttpException(`获取模板元素ID失败: ${error.message}`, error instanceof common_1.HttpException ? error.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAllTemplateNames() {
        try {
            const templates = await this.htmlTemplateRepository.find({
                where: { status: 1 },
                select: ['name'],
                order: { id: 'ASC' }
            });
            return templates.map(template => template.name);
        }
        catch (error) {
            this.logger.error(`获取模板名称列表失败: ${error.message}`);
            throw new common_1.HttpException(`获取模板名称列表失败: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getRandomTemplateWithElements() {
        try {
            const template = await this.getRandomTemplate();
            if (!template) {
                throw new common_1.HttpException('没有可用的模板', common_1.HttpStatus.NOT_FOUND);
            }
            const elementsWithId = this.extractElementsWithId(template.htmlCode);
            const filteredElements = elementsWithId.filter(element => element.id !== 'root');
            const textReplacements = filteredElements.map(element => ({
                placeholder: element.id,
                replaceWith: element.text
            }));
            return {
                templateName: template.name,
                elements: filteredElements,
                textReplacements: textReplacements
            };
        }
        catch (error) {
            this.logger.error(`获取随机模板及其元素失败: ${error.message}`);
            throw new common_1.HttpException(`获取随机模板及其元素失败: ${error.message}`, error instanceof common_1.HttpException ? error.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    extractExampleSpecificIds(html) {
        const elementsWithId = [];
        try {
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
            const elementIdPattern = /React\.createElement\(['"]([^'"]+)['"][^,]*,\s*\{[^}]*id\s*[:=]\s*["']([^"']+)["'][^}]*\}[^,]*,\s*["']([^"']+)["']/g;
            while ((match = elementIdPattern.exec(html)) !== null) {
                const tagName = match[1];
                const id = match[2];
                const text = match[3];
                if (id && text) {
                    this.logger.log(`从React组件中提取到${tagName} ID: ${id}, 文本: ${text}`);
                    const existing = elementsWithId.find(item => item.id === id);
                    if (!existing) {
                        elementsWithId.push({ id, text });
                    }
                }
            }
            const lines = html.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const idMatches = Array.from(line.matchAll(/id\s*[:=]\s*["']([^"']+)["']/g));
                for (const idMatch of idMatches) {
                    const id = idMatch[1];
                    const existing = elementsWithId.find(item => item.id === id);
                    if (!existing && id !== 'root') {
                        let textContent = '';
                        let j = i;
                        const maxLines = 5;
                        while (j < lines.length && j < i + maxLines) {
                            const textMatch = lines[j].match(/["']([^"']+)["']\s*\)/);
                            if (textMatch) {
                                textContent = textMatch[1];
                                break;
                            }
                            j++;
                        }
                        if (textContent) {
                            this.logger.log(`从行分析中提取到ID: ${id}, 文本: ${textContent}`);
                            elementsWithId.push({ id, text: textContent });
                        }
                        else {
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
        }
        catch (error) {
            this.logger.error(`从React组件中提取ID失败: ${error.message}`);
            return elementsWithId;
        }
    }
    wrapHtml(html) {
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
};
HtmlRenderService = HtmlRenderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(htmllib_entity_1.HtmlTemplateEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(render_task_entity_1.RenderTask)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        openaiChat_service_1.OpenAIChatService,
        globalConfig_service_1.GlobalConfigService,
        ai_api_service_1.AiApiService,
        image_upload_service_1.ImageUploadService])
], HtmlRenderService);
exports.HtmlRenderService = HtmlRenderService;
