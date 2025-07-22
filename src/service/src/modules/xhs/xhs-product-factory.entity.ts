import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('xhs_product_factory')
export class XhsProductFactory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ comment: '用户ID' })
  userId: string;

  @Column({ comment: '品牌产品', length: 100 })
  brandProduct: string;

  @Column({ comment: '标题', length: 100 })
  title: string;

  @Column({ comment: '活动ID', length: 50 })
  activityId: string;

  @Column({ comment: '文件ID列表', type: 'simple-array', nullable: true })
  fileIds: string[];

  @Column({ comment: '模板ID列表', type: 'simple-array', nullable: true })
  templateIds: string[];

  @Column({ comment: '补充信息', type: 'text', nullable: true })
  information: string;

  @Column({ comment: '选中的模板ID', length: 100, nullable: true })
  selectedTemplateId: string;

  @Column({ comment: '参数类型', length: 50, nullable: true, default: 'normal' })
  paramsType: string;

  @Column({ comment: 'Coze执行ID', length: 100, nullable: true })
  executeId: string;

  @Column({ comment: '工作流ID', length: 100, default: 'xhs_product_factory' })
  workflowId: string;

  @Column({ comment: '状态', default: 'pending' })
  status: string; // pending, running, completed, failed

  @Column({ comment: '生成结果', type: 'text', nullable: true })
  result: string;

  @Column({ comment: '原始工作流完整结果', type: 'text', nullable: true })
  rawResult: string;

  @Column({ comment: '错误信息', length: 255, nullable: true })
  error: string;

  @Column({ comment: '笔记ID', length: 50, nullable: true })
  noteId: string;

  @Column({ comment: '积分扣除类型', nullable: true })
  deductType: number;

  @Column({ comment: '积分扣除数量', nullable: true })
  deductAmount: number;

  @Column({ comment: '是否已退款', default: false })
  refunded: boolean;

  @Column({ comment: '批次ID', length: 50, nullable: true })
  batchId: string;

  @Column({ comment: '批次总数量', nullable: true, default: 1 })
  batchCount: number;

  @Column({ comment: '批次当前索引', nullable: true, default: 1 })
  batchIndex: number;

  @Column({ comment: 'API调用失败计数', nullable: true, default: 0 })
  apiFailCount: number;

  @Column({ comment: '是否已弃用', default: false })
  isDiscarded: boolean;

  @Column({ comment: '创建时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createTime: Date;

  @Column({ comment: '更新时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updateTime: Date;
} 