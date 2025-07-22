import { BaseEntity } from '@/common/entity/baseEntity';
import { Column, Entity, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';

/**
 * AI图像生成任务表
 */
@Entity({ name: 'ai_image_tasks' })
export class AiImageTaskEntity extends BaseEntity {
  @Column({ comment: '任务唯一ID', length: 36, unique: true })
  taskId: string;

  @Column({ comment: '任务状态: pending/processing/completed/failed', length: 20 })
  @Index()
  status: string;

  @Column({ comment: '提示词', type: 'text' })
  prompt: string;

  @Column({ comment: '原始图片URL', type: 'text', nullable: true })
  imageUrl: string;

  @Column({ comment: '执行时间', nullable: true })
  executedAt: Date;

  @Column({ comment: '完成时间', nullable: true })
  completedAt: Date;

  @Column({ comment: '生成的图片URLs', type: 'text', nullable: true })
  imageUrls: string;

  @Column({ comment: '错误信息', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ comment: '完整响应', type: 'text', nullable: true })
  fullResponse: string;

  @Column({ comment: '进度信息', length: 50, nullable: true })
  progressMessage: string;

  @Column({ comment: '当前内容', type: 'text', nullable: true })
  currentContent: string;

  @Column({ comment: 'API请求预设值', type: 'text', nullable: true })
  presetValues: string;

  @Column({ comment: '用户ID', nullable: true })
  @Index()
  userId: number;

  @Column({ comment: '平台ID', length: 100, nullable: true })
  platformId: string;

  @Column({ comment: '飞书ID', length: 100, nullable: true })
  feishuId: string;

  @Column({ comment: '机器人ID', length: 100, nullable: true })
  botId: string;

  // 移除与生成图片的一对多关系
  // @OneToMany(() => AiGeneratedImageEntity, image => image.taskId, { cascade: false })
  // images: AiGeneratedImageEntity[];
}

/**
 * AI生成图片表
 */
@Entity({ name: 'ai_generated_images' })
export class AiGeneratedImageEntity extends BaseEntity {
  @Column({ comment: '关联的任务ID', length: 36 })
  @Index()
  taskId: string;

  @Column({ comment: '图片URL', type: 'text' })
  imageUrl: string;

  @Column({ comment: '图片来源: user/generated', length: 20, default: 'generated' })
  source: string;

  @Column({ comment: '图片类型: original/source', length: 20, default: 'original' })
  imageType: string;

  @Column({ comment: '图片宽度', nullable: true })
  width: number;

  @Column({ comment: '图片高度', nullable: true })
  height: number;

  @Column({ comment: '图片大小(字节)', nullable: true })
  size: number;

  @Column({ comment: '文件名', length: 255, nullable: true })
  filename: string;

  @Column({ comment: '图片格式', length: 10, nullable: true })
  format: string;

  @Column({ comment: '处理时间(毫秒)', nullable: true })
  processTime: number;

  @Column({ comment: '创建时间戳', nullable: true })
  timestamp: Date;
}

/**
 * 图片URL映射表
 */
@Entity({ name: 'ai_image_url_mappings' })
export class ImageUrlMappingEntity extends BaseEntity {
  @Column({ comment: '清理后的URL', type: 'text' })
  cleanedUrl: string;

  @Column({ comment: '上传后的URL', type: 'text' })
  uploadedUrl: string;

  @Column({ comment: '映射创建时间', nullable: true })
  mappingCreatedAt: Date;
} 