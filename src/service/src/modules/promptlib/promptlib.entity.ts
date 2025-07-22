import { BaseEntity } from 'src/common/entity/baseEntity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'prompt_templates' })
export class PromptTemplateEntity extends BaseEntity {
  @Column({ length: 50, comment: '提示词标识' })
  identifier: string;

  @Column({ type: 'text', comment: '提示词内容' })
  prompt: string;

  @Column({ length: 100, comment: '使用的模型名称' })
  modelName: string;

  @Column({ default: 1, comment: '模板状态：1-启用，0-禁用' })
  status: number;

  @Column({ type: 'text', nullable: true, comment: 'API请求预设值JSON' })
  presetValues: string;
} 