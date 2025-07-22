import { Column, Entity, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity('xhs_activities')
export class XhsActivity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column({ comment: '活动名称' })
  name: string;

  @Column({ comment: '素材类型', default: 'normal' })
  type: string;

  @Column({ comment: '状态', default: 'active' })
  status: string; // active, paused, completed

  @Column({ comment: '是否默认活动', default: false })
  isDefault: boolean;

  @Column({ comment: '用户ID', nullable: true })
  userId: number;

  @Column({ comment: '创建时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createTime: Date;

  @Column({ comment: '更新时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updateTime: Date;
} 