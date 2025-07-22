import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('invitation_channel_level')
export class ChannelLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, comment: '渠道等级名称' })
  name: string;
  
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10, comment: '返佣比例，百分比' })
  commissionRate: number; // 返佣比例，如10表示10%
  
  @Column({ default: 0, comment: '等级排序' })
  order: number;
  
  @Column({ length: 200, nullable: true, comment: '备注说明' })
  remark: string;
  
  @Column({ default: true, comment: '是否启用' })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 