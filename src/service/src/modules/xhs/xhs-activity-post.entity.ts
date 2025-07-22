import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('xhs_activity_posts')
export class XhsActivityPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '小红书帖子ID', type: 'varchar', length: 20 })
  postId: string;

  @Column({ comment: '活动ID', type: 'varchar', length: 50 })
  activityId: string;

  @Column({ comment: '创建时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createTime: Date;

  @Column({ comment: '更新时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updateTime: Date;
} 