import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HtmlTemplateEntity } from './htmllib.entity';
import { CreateHtmlTemplateDto, UpdateHtmlTemplateDto, QueryHtmlTemplateDto, DeleteHtmlTemplateDto } from './dto/htmllib.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { promisify } from 'util';

const mkdirAsync = promisify(fs.mkdir);
const writeFileAsync = promisify(fs.writeFile);
const existsAsync = promisify(fs.exists);

@Injectable()
export class HtmlLibService {
  private readonly logger = new Logger(HtmlLibService.name);
  private readonly uploadDir = path.join(process.cwd(), 'public', 'file', 'html_templates');

  constructor(
    @InjectRepository(HtmlTemplateEntity)
    private htmlTemplateRepository: Repository<HtmlTemplateEntity>,
  ) {
    // 确保上传目录存在
    this.ensureUploadDirExists();
  }

  // 确保上传目录存在
  private async ensureUploadDirExists() {
    try {
      if (!await existsAsync(this.uploadDir)) {
        await mkdirAsync(this.uploadDir, { recursive: true });
        this.logger.log(`创建上传目录: ${this.uploadDir}`);
      }
    } catch (error) {
      this.logger.error(`创建上传目录失败: ${error.message}`);
    }
  }

  // 生成唯一文件名
  private generateUniqueFilename(originalname: string): string {
    const timestamp = new Date().getTime();
    const randomStr = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalname);
    const sanitizedName = path.basename(originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 20);
    
    return `${timestamp}_${randomStr}_${sanitizedName}${ext}`;
  }

  // 创建HTML模板
  async createHtmlTemplate(dto: CreateHtmlTemplateDto) {
    const textDetails = dto.textDetails || [];
    const backgroundImages = dto.backgroundImages || [];
    
    const template = this.htmlTemplateRepository.create({
      ...dto,
      textDetails: JSON.stringify(textDetails),
      backgroundImages: JSON.stringify(backgroundImages),
      status: dto.status || 1,
    });

    await this.htmlTemplateRepository.save(template);
    return template;
  }

  // 更新HTML模板
  async updateHtmlTemplate(dto: UpdateHtmlTemplateDto) {
    const template = await this.htmlTemplateRepository.findOne({
      where: { id: dto.id },
    });

    if (!template) {
      throw new HttpException('HTML模板不存在', HttpStatus.BAD_REQUEST);
    }

    const updateData: any = { ...dto };
    
    // 如果更新了文本数组，更新JSON字符串
    if (dto.textDetails) {
      updateData.textDetails = JSON.stringify(dto.textDetails);
    }

    // 如果更新了背景图片数组，更新JSON字符串
    if (dto.backgroundImages) {
      updateData.backgroundImages = JSON.stringify(dto.backgroundImages);
    }

    // 确保status字段被正确处理，即使值为0也要保存
    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }

    this.logger.log(`更新HTML模板 ID: ${dto.id}, 状态值: ${updateData.status}`);
    await this.htmlTemplateRepository.update(dto.id, updateData);

    return await this.htmlTemplateRepository.findOne({
      where: { id: dto.id },
    });
  }

  // 查询HTML模板列表
  async queryHtmlTemplates(query: QueryHtmlTemplateDto) {
    const { page = 1, pageSize = 10, name, status } = query;
    
    const queryBuilder = this.htmlTemplateRepository.createQueryBuilder('template');
    
    if (name) {
      queryBuilder.andWhere('template.name LIKE :name', { name: `%${name}%` });
    }
    
    if (status !== undefined) {
      queryBuilder.andWhere('template.status = :status', { status });
    }
    
    const [items, total] = await queryBuilder
      .orderBy('template.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    
    // 处理返回结果，尝试解析JSON字符串为数组
    const processedItems = items.map(item => {
      try {
        const textDetails = JSON.parse(item.textDetails || '[]');
        const backgroundImages = JSON.parse(item.backgroundImages || '[]');
        
        return {
          ...item,
          textDetailsArray: textDetails, // 添加解析后的数组，方便前端使用
          backgroundImagesArray: backgroundImages, // 添加解析后的背景图片数组
        };
      } catch (e) {
        return {
          ...item,
          textDetailsArray: [],
          backgroundImagesArray: [],
        };
      }
    });
      
    return {
      items: processedItems,
      total,
      page,
      pageSize,
    };
  }

  // 获取单个HTML模板
  async getHtmlTemplate(id: number) {
    const template = await this.htmlTemplateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new HttpException('HTML模板不存在', HttpStatus.BAD_REQUEST);
    }

    // 尝试解析JSON字符串为数组
    try {
      const textDetails = JSON.parse(template.textDetails || '[]');
      const backgroundImages = JSON.parse(template.backgroundImages || '[]');
      
      return {
        ...template,
        textDetailsArray: textDetails,
        backgroundImagesArray: backgroundImages,
      };
    } catch (e) {
      return {
        ...template,
        textDetailsArray: [],
        backgroundImagesArray: [],
      };
    }
  }

  // 删除HTML模板
  async deleteHtmlTemplate(dto: DeleteHtmlTemplateDto) {
    const template = await this.htmlTemplateRepository.findOne({
      where: { id: dto.id },
    });

    if (!template) {
      throw new HttpException('HTML模板不存在', HttpStatus.BAD_REQUEST);
    }

    await this.htmlTemplateRepository.remove(template);
    return { success: true };
  }

  // 上传缩略图
  async uploadThumbnail(file: Express.Multer.File): Promise<string> {
    try {
      if (!file) {
        throw new HttpException('未检测到上传文件', HttpStatus.BAD_REQUEST);
      }
      
      // 确保文件对象有必要的属性
      if (!file.buffer || !file.originalname) {
        throw new HttpException('文件数据不完整', HttpStatus.BAD_REQUEST);
      }
      
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      const fileExt = path.extname(file.originalname).toLowerCase();
      
      if (!allowedExtensions.includes(fileExt)) {
        throw new HttpException('只支持图片格式文件(.jpg, .jpeg, .png, .gif)', HttpStatus.BAD_REQUEST);
      }
      
      // 确保上传目录存在
      await this.ensureUploadDirExists();
      
      // 生成唯一文件名
      const filename = this.generateUniqueFilename(file.originalname);
      const filePath = path.join(this.uploadDir, filename);
      
      // 写入文件
      await writeFileAsync(filePath, file.buffer);
      
      // 返回相对路径，用于存储在数据库
      const relativePath = path.join('public', 'file', 'html_templates', filename).replace(/\\/g, '/');
      this.logger.log(`缩略图上传成功: ${relativePath}`);
      
      return relativePath;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`缩略图上传失败: ${error.message}`);
      throw new HttpException('缩略图上传失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 