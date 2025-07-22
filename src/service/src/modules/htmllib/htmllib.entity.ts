import { BaseEntity } from 'src/common/entity/baseEntity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'html_templates' })
export class HtmlTemplateEntity extends BaseEntity {
  @Column({ length: 100, comment: '模板名称' })
  name: string;

  @Column({ type: 'text', comment: 'HTML代码' })
  htmlCode: string;

  @Column({ type: 'int', default: 0, comment: '可替换的图片数量' })
  imageCount: number;

  @Column({ type: 'json', nullable: true, comment: '可替换的文本内容列表，存储为字符串数组' })
  textDetails: string;

  @Column({ length: 255, nullable: true, comment: '缩略图路径' })
  thumbnailPath: string;

  @Column({ default: 1, comment: '使用应用工作流：1-启用，0-禁用' })
  status: number;

  @Column({ default: false, comment: '是否需要AI补充文案' })
  needAiContent: boolean;
  
  @Column({ type: 'json', nullable: true, comment: '背景图片URL列表，存储为字符串数组' })
  backgroundImages: string;
} 