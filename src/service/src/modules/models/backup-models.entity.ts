import { BaseEntity } from 'src/common/entity/baseEntity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'backup_models' })
export class BackupModelsEntity extends BaseEntity {
  @Column({ comment: '模型名称' })
  name: string;

  @Column({ comment: '请求地址', length: 500 })
  baseUrl: string;

  @Column({ comment: 'API Key', length: 500 })
  apiKey: string;

  @Column({ comment: '模型类型: text(文字), image(图文), video(视频)', default: 'text' })
  modelType: string;

  @Column({ comment: '使用的模型', length: 100, default: 'gpt-4o-image' })
  model: string;

  @Column({ comment: '状态: 0-禁用, 1-启用', default: 1 })
  status: number;

  @Column({ comment: '优先级：数字越小优先级越高', default: 10 })
  priority: number;
} 