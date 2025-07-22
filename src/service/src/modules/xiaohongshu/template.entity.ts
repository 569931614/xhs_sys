import { BaseEntity } from 'src/common/entity/baseEntity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'xhs_templates' })
export class XhsTemplateEntity extends BaseEntity {
  @Column({ comment: '模板名称', length: 100 })
  name: string;

  @Column({ comment: '模板文件路径', length: 255 })
  filePath: string;

  @Column({ comment: '文件大小(KB)', default: 0 })
  fileSize: number;

  @Column({ comment: '可替换图片数量', default: 0 })
  imageCount: number;

  @Column({ comment: '可替换文本数量', default: 0 })
  textCount: number;

  @Column({ comment: '可替换文本详情(JSON格式)', type: 'text', nullable: true })
  textDetails: string;

  @Column({ comment: '状态: 0-禁用, 1-启用', default: 1 })
  status: number;

  @Column({ comment: '使用次数', default: 0 })
  usageCount: number;
} 