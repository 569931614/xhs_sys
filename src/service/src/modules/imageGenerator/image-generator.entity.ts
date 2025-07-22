import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('image_generator_task')
export class ImageGeneratorTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '用户ID' })
  userId: string;

  @Column({ comment: '任务ID列表', type: 'text', nullable: true })
  taskIds: string;

  @Column({ comment: '模板ID', nullable: true })
  templateId: number;

  @Column({ comment: '生成的提示词', nullable: true })
  prompt: string;

  @Column({ comment: '图片URL', length: 800, nullable: true })
  imageUrl: string;

  @Column({ comment: '图片宽度', nullable: true })
  width: string;

  @Column({ comment: '图片高度', nullable: true })
  height: string;

  @Column({ comment: '所有图片URL列表', type: 'text', nullable: true })
  allImageUrls: string;

  @Column({ comment: '任务状态', default: 'pending' })
  status: string;

  @Column({ comment: '错误信息', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updateTime: Date;
} 