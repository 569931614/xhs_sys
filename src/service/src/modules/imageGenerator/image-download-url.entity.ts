import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('image_download_url')
export class ImageDownloadUrl {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '图片任务ID', length: 100, nullable: true })
  taskId: string;

  @Column({ comment: '下载链接', length: 800 })
  downloadUrl: string;

  @Column({ comment: '文件名', length: 200, nullable: true })
  fileName: string;

  @CreateDateColumn({ comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updateTime: Date;
} 