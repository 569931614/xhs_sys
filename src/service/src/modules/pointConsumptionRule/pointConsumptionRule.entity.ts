import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('point_consumption_rule')
export class PointConsumptionRuleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '套餐ID', default: 0 })
  packageId: number;

  @Column({ comment: '功能ID', length: 50 })
  functionId: string;

  @Column({ comment: '普通对话模型(model3)消耗率', default: 0 })
  model3Rate: number;

  @Column({ comment: '高级对话模型(model4)消耗率', default: 0 })
  model4Rate: number;

  @Column({ comment: '绘画模型消耗率', default: 0 })
  drawMjRate: number;

  @Column({ comment: '规则状态 0:禁用 1:启用', default: 1 })
  status: number;

  @Column({ comment: '是否可用 0:不可用 1:可用', default: 1 })
  isAvailable: number;

  @Column({ comment: '最大同时执行任务数', default: 1 })
  maxConcurrentTasks: number;

  @Column({ comment: '规则描述', nullable: true, length: 255 })
  description: string;

  @Column({ comment: '创建时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createTime: Date;

  @Column({ comment: '更新时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updateTime: Date;
} 