import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Material, MaterialFolder } from './material.entities';
import { CozeService } from '../coze/coze.service';
import { UploadService } from '../upload/upload.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AiApiService } from '../ai/ai_api.service';
import axios from 'axios';

@Injectable()
export class MaterialService {
  private readonly logger = new Logger(MaterialService.name);

  constructor(
    @InjectRepository(Material)
    public readonly materialRepository: Repository<Material>,
    @InjectRepository(MaterialFolder)
    public readonly folderRepository: Repository<MaterialFolder>,
    private readonly cozeService: CozeService,
    public readonly uploadService: UploadService,
    private readonly aiApiService: AiApiService,
  ) {}

  /**
   * 创建素材文件夹
   */
  async createFolder(name: string, userId?: string) {
    if (!name) {
      throw new BadRequestException('文件夹名称不能为空');
    }

    // 创建新文件夹
    const folder = this.folderRepository.create({
      name,
      count: 0,
      userId
    });
    
    await this.folderRepository.save(folder);
    
    return {
      success: true,
      data: folder,
    };
  }

  /**
   * 获取所有素材文件夹
   */
  async getFolders(userId?: string) {
    try {
      this.logger.log(`开始获取素材文件夹，用户ID: ${userId || '全部'}`);
      
      let query = this.folderRepository.createQueryBuilder('folder')
        .orderBy('folder.createTime', 'DESC');
      
      // 如果提供了用户ID，则筛选该用户的文件夹
      // 同时返回没有用户ID的公共文件夹
      if (userId) {
        query = query.where('(folder.userId = :userId OR folder.userId IS NULL)', { userId });
      }
      
      const folders = await query.getMany();
      
      this.logger.log(`成功获取${folders.length}个素材文件夹`);
      
      return {
        success: true,
        data: folders,
      };
    } catch (error) {
      this.logger.error(`获取素材文件夹失败: ${error.message}`, error.stack);
      // 返回带有错误信息的响应而不是抛出异常
      return {
        success: false,
        message: `获取素材文件夹失败: ${error.message}`,
        error: error.stack
      };
    }
  }

  /**
   * 获取素材列表
   * @param folderId 文件夹ID，特殊值'1'表示获取用户的所有素材，不限文件夹
   * @param userId 用户ID，用于筛选用户的素材
   */
  async getMaterials(folderId?: string, userId?: string) {
    try {
      this.logger.log(`开始获取素材列表, 文件夹ID: ${folderId || '所有'}, 用户ID: ${userId || '所有'}`);
      
      let query = this.materialRepository.createQueryBuilder('material')
        .leftJoinAndSelect('material.folder', 'folder')
        .orderBy('material.uploadTime', 'DESC');
      
      // 构建查询条件
      const whereConditions = [];
      const params: any = {};
      
      // 如果提供了文件夹ID，且不等于特殊值"1"(全部文件夹)
      // 特殊值"1"表示获取用户的所有素材，不限文件夹
      if (folderId && folderId !== '1') {
        whereConditions.push('material.folderId = :folderId');
        params.folderId = folderId;
      }
      
      // 如果提供了用户ID，则筛选该用户的素材
      // 同时返回没有用户ID的公共素材
      if (userId) {
        whereConditions.push('(material.userId = :userId OR material.userId IS NULL)');
        params.userId = userId;
      }
      
      // 应用查询条件
      if (whereConditions.length > 0) {
        query = query.where(whereConditions.join(' AND '), params);
      }
      
      const materials = await query.getMany();
      
      this.logger.log(`成功获取${materials.length}个素材`);
      
      return {
        success: true,
        data: materials,
      };
    } catch (error) {
      this.logger.error(`获取素材列表失败: ${error.message}`, error.stack);
      // 返回带有错误信息的响应而不是抛出异常
      return {
        success: false,
        message: `获取素材列表失败: ${error.message}`,
        error: error.stack
      };
    }
  }

  /**
   * 上传素材
   * @param file 文件对象
   * @param folderId 文件夹ID
   * @param userId 用户ID（可选）
   */
  async uploadMaterial(file: any, folderId: string, userId?: string) {
    if (!file) {
      throw new BadRequestException('未检测到上传文件');
    }
    
    if (!folderId) {
      throw new BadRequestException('请选择文件夹');
    }
    
    // 检查文件夹是否存在
    const folder = await this.folderRepository.findOne({
      where: { id: folderId },
    });
    
    if (!folder) {
      throw new NotFoundException('文件夹不存在');
    }
    
    try {
      // 处理文件名，解决中文乱码问题
      let fileName = file.originalname;
      
      try {
        // 尝试解码文件名（如果已经是URL编码格式）
        if (/%[0-9A-F]{2}/i.test(fileName)) {
          fileName = decodeURIComponent(fileName);
        }
        
        // 检查是否包含乱码特征（常见的乱码字符）
        if (/æ|ç|ä|å|è|é|ê|ë|ì|í|î|ï|ð|ñ|ò|ó|ô|õ|ö/.test(fileName)) {
          // 尝试使用Buffer处理可能的乱码
          const buf = Buffer.from(fileName, 'latin1');
          fileName = buf.toString('utf8');
        }
      } catch (encodeError) {
        this.logger.warn(`处理文件名编码失败: ${encodeError.message}，将使用原始文件名`);
      }
      
      // 确定当前用户ID
      const effectiveUserId = userId || folder.userId;
      
      // 检查用户在当前文件夹是否已有同名素材
      if (effectiveUserId) {
        this.logger.log(`检查用户 ${effectiveUserId} 在文件夹 ${folder.id} 是否已有同名素材: ${fileName}`);
        
        const existingMaterial = await this.materialRepository.findOne({
          where: {
            name: fileName,
            folderId: folder.id,
            userId: effectiveUserId
          }
        });
        
        if (existingMaterial) {
          this.logger.warn(`用户 ${effectiveUserId} 在文件夹 ${folder.id} 中已有同名素材: ${fileName}`);
          throw new BadRequestException(`已有相同名称素材，名称为：${fileName}`);
        }
        
        this.logger.log(`文件名检查通过: ${fileName}`);
      }
      
      // 1. 先上传到本地，拿到本地路径
      const localResult = await this.uploadService.uploadFile(file, 'material');
      // 兼容不同返回结构，取绝对路径或相对路径
      const localPath = localResult.path || localResult.filePath || localResult.url || localResult;
      this.logger.log(`获取文件链接: ${localPath}`);
      // 2. 传本地路径给图床
      const picbedResult = await this.aiApiService['imageUploadService'].uploadToPicgo(localPath);
      if (!picbedResult || !picbedResult.original_url) {
        throw new Error('上传到图床失败');
      }
      const picbedUrl = picbedResult.original_url;
      
      // 3. 上传到Coze获取file_id
      const cozeResult = await this.cozeService.uploadFile(
        file.buffer,
        fileName, // 使用处理后的文件名
        file.mimetype,
      );
      
      if (!cozeResult || !cozeResult.file_id) {
        throw new Error('上传到Coze失败');
      }
      
      // 4. 计算过期时间 (Coze文件有效期为3个月)
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 3);
      
      // 5. 保存素材信息到数据库，fileId/previewUrl 均用图床链接
      const material = this.materialRepository.create({
        fileId: picbedUrl,
        cozeFileId: cozeResult.file_id,
        name: fileName, // 使用处理后的文件名
        previewUrl: picbedUrl,
        size: file.size,
        type: file.mimetype,
        folderId: folder.id,
        expiryTime: expiryDate,
        status: 'valid',
        userId: userId || folder.userId, // 设置用户ID，如果没有提供则使用文件夹所属的用户ID
      });
      
      this.logger.log(`正在保存素材，用户ID: ${userId || folder.userId || '未提供'}`);
      await this.materialRepository.save(material);
      
      // 6. 更新文件夹素材数量
      folder.count += 1;
      await this.folderRepository.save(folder);
      
      return {
        success: true,
        data: material,
      };
    } catch (error) {
      this.logger.error(`上传素材失败: ${error.message}`, error.stack);
      throw new BadRequestException(`上传素材失败: ${error.message}`);
    }
  }

  /**
   * 删除素材
   */
  async deleteMaterial(id: string) {
    if (!id) {
      throw new BadRequestException('素材ID不能为空');
    }
    
    // 查找素材
    const material = await this.materialRepository.findOne({
      where: { id },
      relations: ['folder'],
    });
    
    if (!material) {
      throw new NotFoundException('素材不存在');
    }
    
    try {
      // 删除数据库记录
      await this.materialRepository.remove(material);
      
      // 更新文件夹素材数量
      if (material.folder) {
        material.folder.count = Math.max(0, material.folder.count - 1);
        await this.folderRepository.save(material.folder);
      }
      
      return {
        success: true,
        message: '删除成功',
      };
    } catch (error) {
      this.logger.error(`删除素材失败: ${error.message}`, error.stack);
      throw new BadRequestException(`删除素材失败: ${error.message}`);
    }
  }

  /**
   * 删除素材文件夹
   */
  async deleteFolder(id: string, userId?: string) {
    if (!id) {
      this.logger.error('文件夹ID不能为空');
      throw new BadRequestException('文件夹ID不能为空');
    }
    
    this.logger.log(`请求删除文件夹, ID: ${id}, 请求用户ID: ${userId || '未提供'}`);
    
    // 查找文件夹
    const folder = await this.folderRepository.findOne({
      where: { id },
    });
    
    if (!folder) {
      this.logger.error(`文件夹 ${id} 不存在`);
      throw new NotFoundException('文件夹不存在');
    }
    
    // 记录文件夹详细信息
    this.logger.log(`文件夹信息: ID=${folder.id}, 名称=${folder.name}, 拥有者ID=${folder.userId || '无'}, 素材数量=${folder.count}`);
    
    // 如果提供了userId，验证文件夹是否属于该用户
    if (userId && folder.userId && String(folder.userId) !== String(userId)) {
      this.logger.error(`权限验证失败: 文件夹拥有者ID=${folder.userId}, 请求用户ID=${userId}`);
    }
    
    try {
      // 查找文件夹内的所有素材
      const materials = await this.materialRepository.find({
        where: { folderId: id },
      });
      
      this.logger.log(`文件夹 ${id} 包含 ${materials.length} 个素材`);
      
      // 删除文件夹内的所有素材
      if (materials.length > 0) {
        this.logger.log(`开始删除文件夹 ${id} 中的 ${materials.length} 个素材...`);
        await this.materialRepository.remove(materials);
        this.logger.log(`文件夹 ${id} 中的所有素材已删除`);
      }
      
      // 删除文件夹
      this.logger.log(`开始删除文件夹 ${id}...`);
      await this.folderRepository.remove(folder);
      this.logger.log(`文件夹 ${id} 已成功删除`);
      
      return {
        success: true,
        message: `已删除文件夹"${folder.name}"及其中的 ${materials.length} 个素材`,
      };
    } catch (error) {
      this.logger.error(`删除文件夹 ${id} 失败: ${error.message}`, error.stack);
      throw new BadRequestException(`删除文件夹失败: ${error.message}`);
    }
  }

  /**
   * 从素材库选择素材
   * @param folderIds 文件夹ID数组，包含特殊值'1'时表示获取用户的所有素材，不限文件夹
   * @param count 选择素材的数量
   * @param userId 用户ID，用于筛选用户的素材
   */
  async selectMaterials(folderIds: string[], count: number, userId?: string) {
    if (!folderIds || folderIds.length === 0) {
      throw new BadRequestException('请选择至少一个文件夹');
    }
    
    if (!count || count <= 0) {
      count = 5; // 默认选择5个
    }
    
    try {
      // 查询所有有效的素材
      let query = this.materialRepository.createQueryBuilder('material')
        .where('material.status = :status', { status: 'valid' });
        
      // 检查是否包含特殊值"1"(全部文件夹)
      const hasSpecialFolder = folderIds.includes('1');
      
      // 如果不包含特殊值"1"，并且提供了有效的文件夹ID，则按文件夹ID筛选
      if (!hasSpecialFolder && folderIds.length > 0 && folderIds[0] !== '') {
        query = query.andWhere('material.folderId IN (:...folderIds)', { folderIds });
      }
      
      // 如果提供了用户ID，则筛选该用户的素材或公共素材
      if (userId) {
        query = query.andWhere('(material.userId = :userId OR material.userId IS NULL)', { userId });
      }
      
      // 获取所有符合条件的素材
      const materials = await query.getMany();
      
      if (materials.length === 0) {
        return {
          success: true,
          data: [],
          message: '未找到有效素材',
        };
      }
      
      // 随机选择指定数量的素材
      const selectedMaterials = this.getRandomElements(materials, Math.min(count, materials.length));
      
      // 检查每个素材是否有效，如果过期则更新
      const checkedMaterials = await Promise.all(
        selectedMaterials.map(async (material) => {
          return this.ensureMaterialValid(material);
        })
      );
      
      return {
        success: true,
        data: checkedMaterials,
      };
    } catch (error) {
      this.logger.error(`选择素材失败: ${error.message}`, error.stack);
      throw new BadRequestException(`选择素材失败: ${error.message}`);
    }
  }

  /**
   * 检查素材是否有效，如果过期则刷新
   * @param materialId 素材ID
   * @param userId 用户ID，用于验证权限
   */
  async checkMaterialValidity(materialId: string, userId?: string) {
    if (!materialId) {
      throw new BadRequestException('素材ID不能为空');
    }
    
    try {
      // 查找素材
      const material = await this.materialRepository.findOne({
        where: { id: materialId },
      });
      
      if (!material) {
        throw new NotFoundException('素材不存在');
      }
      
      // 如果提供了userId，验证素材是否属于该用户
      if (userId && material.userId && String(material.userId) !== String(userId)) {
        this.logger.error(`权限验证失败: 素材拥有者ID=${material.userId}, 请求用户ID=${userId}`);
        throw new BadRequestException('没有权限访问此素材');
      }
      
      // 检查并确保素材有效
      const updatedMaterial = await this.ensureMaterialValid(material);
      
      return {
        success: true,
        data: {
          valid: updatedMaterial.status === 'valid',
          material: updatedMaterial,
        },
      };
    } catch (error) {
      this.logger.error(`检查素材有效性失败: ${error.message}`, error.stack);
      throw new BadRequestException(`检查素材有效性失败: ${error.message}`);
    }
  }

  /**
   * 确保素材有效，如果过期则重新上传
   */
  private async ensureMaterialValid(material: Material): Promise<Material> {
    // 检查是否过期
    const now = new Date();
    
    if (material.status === 'valid' && material.expiryTime > now) {
      // 素材仍然有效
      return material;
    }
    
    // 素材已过期，需要重新上传到Coze
    try {
      this.logger.log(`素材 ${material.id} 已过期，重新上传到Coze`);
      
      // 获取本地文件路径
      const fileUrl = material.previewUrl;
      let localFilePath;
      
      if (fileUrl.startsWith('http')) {
        // 如果是完整URL，需要下载文件
        const downloadPath = path.join(process.cwd(), 'temp', uuidv4());
        await this.downloadFile(fileUrl, downloadPath);
        localFilePath = downloadPath;
      } else {
        // 如果是相对路径，直接使用
        localFilePath = path.join(process.cwd(), 'public', fileUrl.replace(/^\//, ''));
      }
      
      // 读取文件
      const fileBuffer = fs.readFileSync(localFilePath);
      
      // 上传到Coze
      const cozeResult = await this.cozeService.uploadFile(
        fileBuffer,
        material.name,
        material.type,
      );
      
      if (!cozeResult || !cozeResult.file_id) {
        throw new Error('重新上传到Coze失败');
      }
      
      // 更新素材信息
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 3);
      
      material.cozeFileId = cozeResult.file_id;
      material.expiryTime = expiryDate;
      material.status = 'valid';
      
      await this.materialRepository.save(material);
      
      // 清理临时文件
      if (fileUrl.startsWith('http')) {
        fs.unlinkSync(localFilePath);
      }
      
      return material;
    } catch (error) {
      this.logger.error(`重新上传素材失败: ${error.message}`, error.stack);
      
      // 更新素材状态为过期
      material.status = 'expired';
      await this.materialRepository.save(material);
      
      return material;
    }
  }

  /**
   * 下载文件到本地
   */
  private async downloadFile(url: string, destination: string): Promise<void> {
    const { promises: fs } = require('fs');
    const axios = require('axios');
    const path = require('path');
    
    try {
      // 确保目录存在
      await fs.mkdir(path.dirname(destination), { recursive: true });
      
      // 下载文件
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer',
      });
      
      // 写入文件
      await fs.writeFile(destination, response.data);
    } catch (error) {
      this.logger.error(`下载文件失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 从数组中随机选择n个元素
   */
  private getRandomElements<T>(array: T[], n: number): T[] {
    // 复制数组，避免修改原数组
    const shuffled = [...array];
    
    // Fisher-Yates洗牌算法
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // 返回前n个元素
    return shuffled.slice(0, n);
  }

  /**
   * 上传图片到图床并与文件夹关联
   */
  async uploadToPicBed(imageUrl: string, folderId?: string) {
    try {
      const result = await this.aiApiService['imageUploadService'].uploadToPicgo(imageUrl);
      let savedMaterial = null;
      if (result && result.original_url && folderId) {
        // 保存到Material表，建立与文件夹的关联
        const material = this.materialRepository.create({
          fileId: result.original_url,
          cozeFileId: '',
          name: result.original_url.split('/').pop() || '图片',
          previewUrl: result.original_url,
          size: 0,
          type: '',
          folderId: folderId,
          expiryTime: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 默认3个月
          status: 'valid',
        });
        savedMaterial = await this.materialRepository.save(material);
      }
      return {
        success: true,
        data: result,
        material: savedMaterial
      };
    } catch (error) {
      this.logger.error(`上传图片到图床失败: ${error.message}`);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 获取文件夹中的所有素材
   * @param folderId 文件夹ID，特殊值'1'表示获取用户的所有素材，不限文件夹
   * @param userId 用户ID，用于筛选用户的素材
   * @returns 文件夹中的素材列表
   */
  async getMaterialsByFolder(folderId: string, userId?: string): Promise<any[]> {
    try {
      this.logger.log(`获取文件夹 ${folderId} 中的素材，用户ID: ${userId || '未提供'}`);
      
      // 构建查询条件
      const query = this.materialRepository.createQueryBuilder('material');
      
      // 如果folderId不是特殊值"1"，则按文件夹ID筛选
      if (folderId !== '1') {
        query.where('material.folderId = :folderId', { folderId });
      }
      
      // 如果提供了用户ID，则筛选该用户的素材或公共素材
      if (userId) {
        if (folderId !== '1') {
          // 已有WHERE条件，使用AND
          query.andWhere('(material.userId = :userId OR material.userId IS NULL)', { userId });
        } else {
          // 没有WHERE条件，直接使用WHERE
          query.where('(material.userId = :userId OR material.userId IS NULL)', { userId });
        }
      }
      
      // 执行查询
      const materials = await query.getMany();
      
      this.logger.log(`文件夹 ${folderId} 中找到 ${materials.length} 个素材`);
      return materials;
    } catch (error) {
      this.logger.error(`获取文件夹素材失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 根据ID获取素材
   * @param materialId 素材ID
   * @param userId 用户ID（可选）
   * @returns 素材详情
   */
  async getMaterialById(materialId: string, userId?: string): Promise<any> {
    try {
      this.logger.log(`获取素材详情: ${materialId}, 用户ID: ${userId || '未提供'}`);
      
      // 查询素材详情
      const material = await this.materialRepository.findOne({
        where: { id: materialId }
      });
      
      if (!material) {
        this.logger.warn(`素材 ${materialId} 不存在`);
        return null;
      }
      
      // 如果提供了userId，验证素材是否属于该用户
      if (userId && material.userId && String(material.userId) !== String(userId)) {
        this.logger.error(`权限验证失败: 素材拥有者ID=${material.userId}, 请求用户ID=${userId}`);
        throw new BadRequestException('没有权限访问此素材');
      }
      
      return material;
    } catch (error) {
      this.logger.error(`获取素材详情失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 更新素材的cozeFileId
   * @param materialId 素材ID
   * @param userId 用户ID（可选）
   * @returns 更新后的素材
   */
  async updateMaterialCozeId(materialId: string, userId?: string): Promise<any> {
    try {
      this.logger.log(`更新素材 ${materialId} 的cozeFileId, 用户ID: ${userId || '未提供'}`);
      
      // 获取素材详情，传入用户ID
      const material = await this.getMaterialById(materialId, userId);
      
      if (!material) {
        throw new Error(`素材 ${materialId} 不存在`);
      }
      
      // 如果提供了userId，验证素材是否属于该用户
      if (userId && material.userId && String(material.userId) !== String(userId)) {
        this.logger.error(`权限验证失败: 素材拥有者ID=${material.userId}, 请求用户ID=${userId}`);
        throw new Error('没有权限访问此素材');
      }
      
      // 修正：使用previewUrl代替fileUrl
      if (!material.previewUrl) {
        throw new Error(`素材 ${materialId} 没有可用的URL`);
      }
      
      // 从URL下载文件
      const response = await axios.get(material.previewUrl, {
        responseType: 'arraybuffer'
      });
      
      // 获取文件类型
      const contentType = response.headers['content-type'] || 'image/jpeg';
      
      // 获取文件名
      const urlParts = material.previewUrl.split('/');
      const filename = urlParts[urlParts.length - 1] || material.name || 'file';
      
      // 使用CozeService上传文件
      const fileBuffer = Buffer.from(response.data);
      const result = await this.cozeService.uploadFile(
        fileBuffer,
        filename,
        contentType
      );
      
      if (!result || !result.file_id) {
        throw new Error('上传到Coze失败');
      }
      
      // 更新素材记录
      material.cozeFileId = result.file_id;
      
      // 更新过期时间
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 3);
      material.expiryTime = expiryDate;
      material.status = 'valid';
      
      // 保存更新后的素材
      const updatedMaterial = await this.materialRepository.save(material);
      
      this.logger.log(`素材 ${materialId} 已更新cozeFileId: ${updatedMaterial.cozeFileId}`);
      
      return updatedMaterial;
    } catch (error) {
      this.logger.error(`更新素材cozeFileId失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 根据素材ID数组获取素材名称映射
   * @param materialIds 素材ID数组
   * @returns 包含素材名称的对象，key为素材ID，value为素材名称
   */
  async getMaterialNamesByIds(materialIds: string[]): Promise<{[key: string]: string}> {
    if (!materialIds || materialIds.length === 0) {
      return {};
    }
    
    try {
      // 查询所有指定ID的素材
      const materials = await this.materialRepository.find({
        where: { id: In(materialIds) },
        select: ['id', 'name']
      });
      
      // 构建ID到名称的映射
      const nameMap: {[key: string]: string} = {};
      materials.forEach(material => {
        nameMap[material.id] = material.name;
      });
      
      return nameMap;
    } catch (error) {
      this.logger.error(`获取素材名称映射失败: ${error.message}`, error.stack);
      return {};
    }
  }
} 