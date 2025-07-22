import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { XhsPost } from './xhs.entity';
import { XhsActivityPost } from './xhs-activity-post.entity';
import { XhsSignature } from './xhs-signature.entity';
import { CreateXhsPostDto, UpdateXhsPostDto, XhsPostListDto } from './dto/xhs.dto';
import { SignatureDto } from './dto/xhs-signature.dto';
import axios from 'axios';
import { ImageUploadService } from '../ai/image-upload.service';
import { IdGeneratorService } from './id-generator.service';
import { UploadService } from '../upload/upload.service';

// 添加签名实体接口定义
interface SignatureData {
  appKey: string;
  signature: string;
  timestamp: string;
  nonce: string;
}

@Injectable()
export class XhsService {
  constructor(
    @InjectRepository(XhsPost)
    private readonly xhsPostRepository: Repository<XhsPost>,
    @InjectRepository(XhsActivityPost)
    private readonly xhsActivityPostRepository: Repository<XhsActivityPost>,
    @InjectRepository(XhsSignature)
    private readonly xhsSignatureRepository: Repository<XhsSignature>,
    private dataSource: DataSource,
    private imageUploadService: ImageUploadService,
    private idGeneratorService: IdGeneratorService,
    private uploadService: UploadService,
  ) {}

  async create(createXhsPostDto: CreateXhsPostDto, userId: number): Promise<XhsPost> {
    // 使用事务来确保数据一致性
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 打印活动ID信息，便于调试
      console.log('创建笔记时收到的活动ID:', {
        value: createXhsPostDto.activityId,
        type: typeof createXhsPostDto.activityId
      });

      // 生成自定义字符串ID
      const customId = this.idGeneratorService.generateStringId();
      console.log('生成的自定义字符串ID:', customId);
      
      // 如果类型是视频，清空images数组
      let processedImages = [];
      if (createXhsPostDto.type === 'video') {
        console.log('视频类型笔记，清空images数组');
        createXhsPostDto.images = [];
      }

      // 上传图片到Super图床（如果有）
      if (createXhsPostDto.images && createXhsPostDto.images.length > 0) {
        for (const imageUrl of createXhsPostDto.images) {
          try {
            // 上传图片到Super图床
            const uploadResult = await this.imageUploadService.uploadToPicgo(imageUrl);
            if (uploadResult && uploadResult.original_url) {
              processedImages.push(uploadResult.original_url);
              console.log(`图片上传成功: ${imageUrl} -> ${uploadResult.original_url}`);
            } else {
              // 如果上传失败，保留原始URL
              processedImages.push(imageUrl);
              console.warn(`图片上传失败，使用原始URL: ${imageUrl}`);
            }
          } catch (error) {
            console.error(`图片上传错误: ${error.message}`);
            processedImages.push(imageUrl); // 失败时使用原始URL
          }
        }
      }

      // 处理封面图片（如果有）
      if (createXhsPostDto.cover) {
        try {
          const coverResult = await this.imageUploadService.uploadToPicgo(createXhsPostDto.cover);
          if (coverResult && coverResult.original_url) {
            createXhsPostDto.cover = coverResult.original_url;
            console.log(`封面图片上传成功: ${createXhsPostDto.cover}`);
          }
        } catch (error) {
          console.error(`封面图片上传错误: ${error.message}`);
          // 保留原始封面URL
        }
      }
      
      // 处理视频链接（如果有）
      if (createXhsPostDto.video) {
        try {
          // 下载视频并上传到服务器
          const processedVideoUrl = await this.processVideoUrl(createXhsPostDto.video);
          createXhsPostDto.video = processedVideoUrl;
          console.log(`视频处理成功: ${processedVideoUrl}`);
        } catch (error) {
          console.error(`视频处理错误: ${error.message}`);
          // 保留原始视频URL
        }
      }

      // 创建新的小红书笔记，使用处理后的图片URL和自定义ID
      const newPost = this.xhsPostRepository.create({
        ...createXhsPostDto,
        id: customId, // 使用自定义生成的ID
        images: processedImages, // 替换为处理后的图片URL数组
        userId: userId,
      });

      // 保存帖子
      const savedPost = await queryRunner.manager.save(newPost);

      // 如果提供了活动ID，创建关联记录
      if (createXhsPostDto.activityId) {
        // 活动ID现在是字符串类型，直接使用
        const activityPost = this.xhsActivityPostRepository.create({
          postId: savedPost.id,
          activityId: createXhsPostDto.activityId,
        });
        
        try {
          await queryRunner.manager.save(activityPost);
          console.log('成功创建活动关联记录', {
            postId: savedPost.id,
            activityId: createXhsPostDto.activityId
          });
        } catch (error) {
          console.error('创建活动关联记录失败:', error);
          // 记录错误但不中断事务，确保笔记能保存
        }
      }

      // 提交事务
      await queryRunner.commitTransaction();
      return savedPost;
    } catch (error) {
      // 如果出错，回滚事务
      await queryRunner.rollbackTransaction();
      console.error('创建笔记事务失败:', error);
      throw error;
    } finally {
      // 释放查询运行器
      await queryRunner.release();
    }
  }

  async findAll(query?: XhsPostListDto): Promise<XhsPost[]> {
    // 构建查询条件
    const where: any = {};

    // 根据查询参数添加条件
    if (query) {
      if (query.title) {
        where['title'] = query.title;
      }
      if (query.userId) {
        where['userId'] = typeof query.userId === 'string' ? parseInt(query.userId, 10) : query.userId;
      }
      
      // 判断是否包含isUsed查询参数和平台参数
      if (query.isUsed !== undefined) {
        const isUsedValue = query.isUsed === true || query.isUsed === '1' || query.isUsed === 1;
        
        // 根据platform参数判断查询哪个状态字段
        if (query.platform === 'douyin') {
          // 查询抖音状态
          where['douyinUsed'] = isUsedValue;
        } else if (query.platform === 'xhs') {
          // 查询小红书状态
          where['isUsed'] = isUsedValue;
        } else {
          // 如果没有指定平台，默认查询小红书状态
          where['isUsed'] = isUsedValue;
        }
      }
    }

    return await this.xhsPostRepository.find({
      where,
      order: {
        createTime: 'DESC',
      },
    });
  }

  // 根据标识符和当前ID查找下一篇帖子
  async findNextByIdentifier(
    identifier: string, 
    currentId?: string, 
    isUsed?: string, 
    platform?: string,
    isSequential?: string
  ): Promise<XhsPost[]> {
    // 构建基本查询条件
    const queryBuilder = this.xhsPostRepository.createQueryBuilder('post');
    
    // 添加标识符条件
    queryBuilder.where('post.identifier = :identifier', { identifier });
    
    // 如果提供了当前ID且需要按顺序选取，则查询ID大于当前ID的笔记
    if (currentId && isSequential !== '0') {
      queryBuilder.andWhere('post.id < :currentId', { currentId });
    }

    // 当提供标识符时，默认查询未使用的笔记
    if (identifier !== undefined) {
      isUsed = '0';
    }
    queryBuilder.andWhere('post.isDiscarded = :isDiscarded', { isDiscarded: false })

    // 根据platform参数添加不同的查询条件
    if (platform === 'douyin') {
      // 查询抖音未发布的笔记（douyinUsed = false）
      queryBuilder.andWhere('post.douyinUsed = :douyinUsed', { douyinUsed: false });
    } else if (platform === 'xhs') {
      // 查询小红书未发布的笔记（isUsed = false）
      queryBuilder.andWhere('post.isUsed = :isUsed', { isUsed: false });
    } else {
      // 如果没有指定平台，查询任一平台未发布的笔记
      queryBuilder.andWhere('(post.isUsed = :isUsed OR post.douyinUsed = :douyinUsed)', { 
        isUsed: false, 
        douyinUsed: false 
      });
    }
    queryBuilder.orderBy('post.createTime', 'DESC');

    // 限制只返回1条记录
    queryBuilder.limit(1);
    
    return await queryBuilder.getMany();
  }

  async findOne(id: string): Promise<XhsPost & { xhs_status?: boolean, douyin_status?: boolean }> {
    // 根据ID查找笔记
    const post = await this.xhsPostRepository.findOne({ where: { id } });
    
    if (post) {
      // 添加平台特定的状态字段，便于前端识别
      const result = {
        ...post,
        xhs_status: post.isUsed,
        douyin_status: post.douyinUsed
      };
      
      return result;
    }
    
    return post;
  }

  async update(id: string, updateXhsPostDto: UpdateXhsPostDto): Promise<XhsPost> {
    // 使用事务确保数据一致性
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 查找要更新的笔记
      const post = await this.findOne(id);
      if (!post) {
        throw new Error('笔记不存在');
      }

      console.log('开始更新笔记:', {
        id,
        originalTitle: post.title,
        originalContentLength: post.content?.length || 0,
        originalImagesCount: post.images?.length || 0,
        updateTitle: updateXhsPostDto.title ? '有更新' : '无更新',
        updateContent: updateXhsPostDto.content ? '有更新' : '无更新',
        updateImagesCount: updateXhsPostDto.images?.length || 0
      });

      // 处理图片上传（如果有更新图片）
      if (updateXhsPostDto.images && updateXhsPostDto.images.length > 0) {
        const processedImages = [];
        for (const imageUrl of updateXhsPostDto.images) {
          try {
            // 检查URL是否已经是上传后的URL格式
            if (imageUrl.startsWith('http') && 
                (imageUrl.includes('picgo') || 
                 imageUrl.includes('cdn') || 
                 imageUrl.includes('oss') || 
                 imageUrl.includes('cos'))) {
              // 如果已经是CDN URL，直接使用
              processedImages.push(imageUrl);
              console.log(`更新操作 - 使用现有CDN图片: ${imageUrl}`);
            } else {
            // 上传图片到Super图床
            const uploadResult = await this.imageUploadService.uploadToPicgo(imageUrl);
            if (uploadResult && uploadResult.original_url) {
              processedImages.push(uploadResult.original_url);
              console.log(`更新操作 - 图片上传成功: ${imageUrl} -> ${uploadResult.original_url}`);
            } else {
              // 如果上传失败，保留原始URL
              processedImages.push(imageUrl);
              console.warn(`更新操作 - 图片上传失败，使用原始URL: ${imageUrl}`);
              }
            }
          } catch (error) {
            console.error(`更新操作 - 图片上传错误: ${error.message}`);
            processedImages.push(imageUrl); // 失败时使用原始URL
          }
        }
        // 更新为处理后的图片URL数组
        updateXhsPostDto.images = processedImages;
      } else if (updateXhsPostDto.images && updateXhsPostDto.images.length === 0) {
        // 如果提供了空数组，表示清空图片
        console.log('更新操作 - 清空所有图片');
      } else {
        // 如果没有提供images字段，保留原有图片
        delete updateXhsPostDto.images;
        console.log('更新操作 - 保留原有图片');
      }

      // 处理封面图片（如果有更新封面）
      if (updateXhsPostDto.cover) {
        try {
          // 检查URL是否已经是上传后的URL格式
          if (updateXhsPostDto.cover.startsWith('http') && 
              (updateXhsPostDto.cover.includes('picgo') || 
               updateXhsPostDto.cover.includes('cdn') || 
               updateXhsPostDto.cover.includes('oss') || 
               updateXhsPostDto.cover.includes('cos'))) {
            // 如果已经是CDN URL，直接使用
            console.log(`更新操作 - 使用现有CDN封面图片: ${updateXhsPostDto.cover}`);
          } else {
          const coverResult = await this.imageUploadService.uploadToPicgo(updateXhsPostDto.cover);
          if (coverResult && coverResult.original_url) {
            updateXhsPostDto.cover = coverResult.original_url;
            console.log(`更新操作 - 封面图片上传成功: ${updateXhsPostDto.cover}`);
            }
          }
        } catch (error) {
          console.error(`更新操作 - 封面图片上传错误: ${error.message}`);
          // 保留原始封面URL
        }
      }

      // 更新字段，只更新提供的字段
      const updatedPost = { ...post };
      
      // 只更新提供的字段
      if (updateXhsPostDto.title !== undefined) updatedPost.title = updateXhsPostDto.title;
      if (updateXhsPostDto.content !== undefined) updatedPost.content = updateXhsPostDto.content;
      if (updateXhsPostDto.images !== undefined) updatedPost.images = updateXhsPostDto.images;
      if (updateXhsPostDto.cover !== undefined) updatedPost.cover = updateXhsPostDto.cover;
      if (updateXhsPostDto.type !== undefined) updatedPost.type = updateXhsPostDto.type;
      if (updateXhsPostDto.video !== undefined) updatedPost.video = updateXhsPostDto.video;
      if (updateXhsPostDto.identifier !== undefined) updatedPost.identifier = updateXhsPostDto.identifier;
      if (updateXhsPostDto.supplier !== undefined) updatedPost.supplier = updateXhsPostDto.supplier;
      
      // 不允许通过更新接口修改使用状态
      // if (updateXhsPostDto.isUsed !== undefined) updatedPost.isUsed = updateXhsPostDto.isUsed;

      // 保存更新后的帖子
      const savedPost = await queryRunner.manager.save(XhsPost, updatedPost);

      // 如果提供了活动ID，更新关联记录
      if (updateXhsPostDto.activityId !== undefined) {
        // 查找现有关联
        const existingActivityPost = await this.xhsActivityPostRepository.findOne({
          where: { postId: id }
        });

          if (existingActivityPost) {
          // 如果活动ID为空，删除关联
          if (!updateXhsPostDto.activityId) {
            await queryRunner.manager.remove(existingActivityPost);
            console.log(`更新操作 - 删除活动关联: ${id}`);
          } 
          // 如果活动ID不同，更新关联
          else if (existingActivityPost.activityId !== updateXhsPostDto.activityId) {
            existingActivityPost.activityId = updateXhsPostDto.activityId;
            await queryRunner.manager.save(existingActivityPost);
            console.log(`更新操作 - 更新活动关联: ${id} -> ${updateXhsPostDto.activityId}`);
          }
        } 
        // 如果没有关联但提供了活动ID，创建新关联
        else if (updateXhsPostDto.activityId) {
          const activityPost = this.xhsActivityPostRepository.create({
              postId: id,
              activityId: updateXhsPostDto.activityId,
            });
          await queryRunner.manager.save(activityPost);
          console.log(`更新操作 - 创建活动关联: ${id} -> ${updateXhsPostDto.activityId}`);
        }
      }

      // 提交事务
      await queryRunner.commitTransaction();
      console.log('更新笔记成功:', {
        id,
        newTitle: savedPost.title,
        newContentLength: savedPost.content?.length || 0,
        newImagesCount: savedPost.images?.length || 0
      });
      
      return savedPost;
    } catch (error) {
      // 如果出错，回滚事务
      await queryRunner.rollbackTransaction();
      console.error('更新笔记事务失败:', error);
      throw error;
    } finally {
      // 释放查询运行器
      await queryRunner.release();
    }
  }

  async markUsed(id: string | number, platform?: string): Promise<XhsPost> {
    const postId = typeof id === 'string' ? id : id.toString();
    try {
      // 找到帖子
      const post = await this.xhsPostRepository.findOne({ where: { id: postId } });
    if (!post) {
        throw new Error(`找不到ID为 ${postId} 的帖子`);
    }

      // 根据平台参数设置相应的状态字段
    if (platform === 'douyin') {
      post.douyinUsed = true;
    } else {
    post.isUsed = true;
      }

      // 保存更新后的帖子
      return await this.xhsPostRepository.save(post);
    } catch (error) {
      console.error(`标记帖子ID ${postId} 为已使用时出错:`, error);
      throw error;
    }
  }

  async markDiscarded(id: string | number): Promise<XhsPost> {
    const postId = typeof id === 'string' ? id : id.toString();
    try {
      // 找到帖子
      const post = await this.xhsPostRepository.findOne({ where: { id: postId } });
      if (!post) {
        throw new Error(`找不到ID为 ${postId} 的帖子`);
      }

      // 设置为弃用状态
      post.isDiscarded = true;

      // 保存更新后的帖子
    return await this.xhsPostRepository.save(post);
    } catch (error) {
      console.error(`标记帖子ID ${postId} 为弃用时出错:`, error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    // 使用事务确保数据一致性
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 先删除关联记录
      await queryRunner.manager.delete(XhsActivityPost, { postId: id });
      
      // 再删除帖子
      await queryRunner.manager.delete(XhsPost, id);
      
      // 提交事务
      await queryRunner.commitTransaction();
    } catch (error) {
      // 如果出错，回滚事务
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // 释放查询运行器
      await queryRunner.release();
    }
  }

  async clear() {
    // 清空所有笔记（危险操作，通常需要管理员权限）
    return await this.xhsPostRepository.clear();
  }

  /**
   * 处理视频URL，下载并上传到服务器
   * @param videoUrl 视频的URL
   * @returns 上传后的视频URL
   */
  async processVideoUrl(videoUrl: string): Promise<string> {
    try {
      console.log(`开始处理视频: ${videoUrl}`);
      
      // 下载视频文件
      const response = await axios.get(videoUrl, { 
        responseType: 'arraybuffer',
        timeout: 60000 // 设置较长的超时时间，因为视频可能较大
      });
      
      // 从URL中提取文件名
      const urlParts = videoUrl.split('/');
      let filename = urlParts[urlParts.length - 1];
      
      // 如果文件名包含查询参数，去除它们
      if (filename.includes('?')) {
        filename = filename.split('?')[0];
      }
      
      // 确保文件名有扩展名，如果没有则添加.mp4
      if (!filename.includes('.')) {
        filename = `${filename}.mp4`;
      }
      
      // 创建文件对象
      const file = {
        buffer: Buffer.from(response.data),
        mimetype: response.headers['content-type'] || 'video/mp4',
        originalname: filename
      };
      
      // 使用UploadService上传视频
      const uploadedUrl = await this.uploadService.uploadFile(file, 'videos');
      console.log(`视频处理完成，上传后的URL: ${uploadedUrl}`);
      
      return uploadedUrl;
    } catch (error) {
      console.error(`视频处理失败: ${error.message}`, error);
      throw new Error(`视频处理失败: ${error.message}`);
    }
  }
} 