import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { XhsTemplateEntity } from './template.entity';
import { CreateTemplateDto, DeleteTemplateDto, UpdateTemplateDto, UpdateTemplateStatusDto } from './dto/template.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as util from 'util';

const writeFileAsync = util.promisify(fs.writeFile);
const unlinkAsync = util.promisify(fs.unlink);
const mkdirAsync = util.promisify(fs.mkdir);
const existsAsync = util.promisify(fs.exists);

// 扩展Express类型定义中的Multer
declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    }
  }
}

@Injectable()
export class XhsTemplateService {
  private readonly logger = new Logger(XhsTemplateService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'templates');

  constructor(
    @InjectRepository(XhsTemplateEntity)
    private readonly templateRepository: Repository<XhsTemplateEntity>,
  ) {
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
  private generateUniqueFilename(originalFilename: string): string {
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    const timestamp = new Date().getTime();
    const hash = crypto.createHash('md5').update(`${basename}${timestamp}`).digest('hex').substring(0, 8);
    return `${basename}-${hash}${ext}`;
  }

  // 上传模板文件
  async uploadTemplateFile(file: Express.Multer.File): Promise<string> {
    try {
      if (!file) {
        throw new HttpException('未检测到上传文件', HttpStatus.BAD_REQUEST);
      }

      // 检查文件对象是否完整
      if (!file.buffer || file.buffer.length === 0) {
        this.logger.error('文件内容为空或未定义');
        throw new HttpException('文件内容为空或已损坏', HttpStatus.BAD_REQUEST);
      }

      const allowedExtensions = ['.ppt', '.pptx'];
      const fileExt = path.extname(file.originalname).toLowerCase();
      
      if (!allowedExtensions.includes(fileExt)) {
        throw new HttpException('只支持PPT格式文件(.ppt, .pptx)', HttpStatus.BAD_REQUEST);
      }

      // 确保上传目录存在
      await this.ensureUploadDirExists();

      // 生成唯一文件名，防止中文或特殊字符问题
      const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = this.generateUniqueFilename(safeOriginalName);
      const filePath = path.join(this.uploadDir, filename);
      
      // 记录文件信息，便于调试
      this.logger.log(`准备保存文件: ${filePath}, 大小: ${file.buffer.length} 字节`);
      
      // 使用同步方法写入文件，避免异步可能引发的问题
      try {
        fs.writeFileSync(filePath, file.buffer);
        
        // 验证文件是否成功写入
        if (!fs.existsSync(filePath)) {
          throw new Error('文件写入后无法验证');
        }
        
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
          throw new Error('文件写入后大小为0字节');
        }
        
        this.logger.log(`文件成功保存: ${filePath}, 大小: ${stats.size} 字节`);
      } catch (writeError) {
        this.logger.error(`文件写入失败: ${writeError.message}`);
        throw new HttpException('文件保存失败', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      // 返回相对路径，用于存储在数据库
      const relativePath = path.join('uploads', 'templates', filename).replace(/\\/g, '/');
      this.logger.log(`模板文件上传成功: ${relativePath}`);
      
      return relativePath;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`文件上传失败: ${error.message}`, error.stack);
      throw new HttpException('文件上传失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 获取模板列表(分页)
  async findAll(page = 1, pageSize = 10, keyword = '') {
    try {
      const skip = (page - 1) * pageSize;
      
      // 构建查询条件
      const whereCondition = keyword 
        ? { name: Like(`%${keyword}%`) }
        : {};
      
      // 查询总数
      const total = await this.templateRepository.count({
        where: whereCondition,
      });
      
      // 查询数据
      const items = await this.templateRepository.find({
        where: whereCondition,
        order: { createdAt: 'DESC' },
        skip,
        take: pageSize,
      });
      
      return { 
        items, 
        total,
        page,
        pageSize
      };
    } catch (error) {
      this.logger.error(`获取模板列表失败: ${error.message}`);
      throw new HttpException('获取模板列表失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 获取单个模板
  async findOne(id: number) {
    const template = await this.templateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new HttpException('模板不存在', HttpStatus.BAD_REQUEST);
    }

    return template;
  }

  // 创建模板
  async create(createDto: CreateTemplateDto, filePath: string, fileSize: number) {
    try {
      // 检查是否有相同名称的模板
      const existTemplate = await this.templateRepository.findOne({
        where: { name: createDto.name },
      });

      if (existTemplate) {
        throw new HttpException('该模板名称已存在', HttpStatus.BAD_REQUEST);
      }

      // 创建新模板
      const newTemplate = this.templateRepository.create({
        ...createDto,
        filePath,
        fileSize,
        status: createDto.status ?? 1,
      });

      return await this.templateRepository.save(newTemplate);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`创建模板失败: ${error.message}`);
      throw new HttpException('创建模板失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 更新模板
  async update(updateDto: UpdateTemplateDto, filePath?: string, fileSize?: number) {
    try {
      const { id } = updateDto;
      
      const existTemplate = await this.templateRepository.findOne({
        where: { id },
      });

      if (!existTemplate) {
        throw new HttpException('模板不存在', HttpStatus.BAD_REQUEST);
      }

      // 如果更新了名称，检查名称是否重复
      if (updateDto.name && updateDto.name !== existTemplate.name) {
        const nameExists = await this.templateRepository.findOne({
          where: { name: updateDto.name, id: { $ne: id } as any },
        });

        if (nameExists) {
          throw new HttpException('该模板名称已存在', HttpStatus.BAD_REQUEST);
        }
      }

      // 更新模板
      let updateData: any = { ...updateDto };
      
      // 如果有新文件，更新文件相关信息
      if (filePath) {
        updateData.filePath = filePath;
      }
      
      if (fileSize) {
        updateData.fileSize = fileSize;
      }
      
      Object.assign(existTemplate, updateData);
      
      return await this.templateRepository.save(existTemplate);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`更新模板失败: ${error.message}`);
      throw new HttpException('更新模板失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 更新模板状态
  async updateStatus(updateStatusDto: UpdateTemplateStatusDto) {
    try {
      const { id, status } = updateStatusDto;
      
      const template = await this.templateRepository.findOne({
        where: { id },
      });

      if (!template) {
        throw new HttpException('模板不存在', HttpStatus.BAD_REQUEST);
      }

      template.status = status;
      
      return await this.templateRepository.save(template);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`更新模板状态失败: ${error.message}`);
      throw new HttpException('更新模板状态失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 删除模板
  async delete(deleteDto: DeleteTemplateDto) {
    try {
      const { id } = deleteDto;
      
      const template = await this.templateRepository.findOne({
        where: { id },
      });

      if (!template) {
        throw new HttpException('模板不存在', HttpStatus.BAD_REQUEST);
      }

      // 删除文件
      try {
        const filePath = path.join(process.cwd(), template.filePath);
        if (await existsAsync(filePath)) {
          await unlinkAsync(filePath);
          this.logger.log(`文件已删除: ${filePath}`);
        }
      } catch (error) {
        this.logger.error(`删除文件失败: ${error.message}`);
        // 继续执行，即使文件删除失败
      }

      // 删除数据库记录
      return await this.templateRepository.remove(template);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`删除模板失败: ${error.message}`);
      throw new HttpException('删除模板失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 增加使用次数
  async incrementUsageCount(id: number) {
    try {
      const template = await this.templateRepository.findOne({
        where: { id },
      });

      if (!template) {
        throw new HttpException('模板不存在', HttpStatus.BAD_REQUEST);
      }

      template.usageCount += 1;
      
      return await this.templateRepository.save(template);
    } catch (error) {
      this.logger.error(`增加使用次数失败: ${error.message}`);
      // 这里失败可以不抛出异常，不影响主流程
    }
  }
} 