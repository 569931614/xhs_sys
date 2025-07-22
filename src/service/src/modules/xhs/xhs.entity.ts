import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('xhs_posts')
export class XhsPost {
  @PrimaryColumn({ type: 'varchar', length: 20, comment: '主键ID' })
  id: string;

  @Column({ comment: '类型', default: 'normal' })
  type: string;

  @Column({ comment: '标题' })
  title: string;

  @Column({ comment: '内容', type: 'text' })
  content: string;

  @Column({ comment: '图片URL', type: 'simple-array' })
  images: string[];

  @Column({ comment: '视频URL', nullable: true })
  video: string;

  @Column({ comment: '封面URL', nullable: true })
  cover: string;

  @Column({ comment: '标识符', nullable: true })
  identifier: string;

  @Column({ comment: '是否已使用', default: false })
  isUsed: boolean;

  @Column({ comment: '抖音是否已使用', default: false })
  douyinUsed: boolean;

  @Column({ comment: '是否已弃用', default: false })
  isDiscarded: boolean;

  @Column({ comment: '用户ID', nullable: true })
  userId: number;

  @Column({ comment: '活动ID', nullable: true, type: 'varchar', length: 50 })
  activityId: string;

  @Column({ comment: '供应商', nullable: true, type: 'varchar', length: 100 })
  supplier: string;

  @Column({ comment: '创建时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createTime: Date;

  @Column({ comment: '更新时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updateTime: Date;
} 