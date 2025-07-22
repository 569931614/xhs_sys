import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('channel_level')
export class ChannelLevelEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '渠道等级: 1-普通用户, 2-代理商, 3-高级代理商', default: 1 })
  level: number;

  @Column({ comment: '等级名称' })
  name: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, comment: '一级佣金比例' })
  levelOneRatio: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, comment: '二级佣金比例' })
  levelTwoRatio: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, comment: '三级佣金比例' })
  levelThreeRatio: number;

  @Column({ default: 0, comment: '升级所需下级人数' })
  requiredInvites: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '升级所需销售额' })
  requiredSales: number;

  @Column({ comment: '状态: 1-启用, 0-禁用', default: 1 })
  status: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 