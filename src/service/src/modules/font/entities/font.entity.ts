import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('font')
export class FontEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '字体名称', length: 100 })
  name: string;

  @Column({ comment: '字体代码', length: 100 })
  code: string;

  @Column({ comment: '预览图URL', length: 500, nullable: true })
  preview: string;

  @Column({ comment: '字体文件URL', length: 500 })
  url: string;

  @Column({ comment: '字体类型', length: 50, default: 'ttf' })
  type: string;

  @Column({ comment: '状态', default: true })
  status: boolean;

  @Column({ comment: '排序', default: 0 })
  sort: number;

  @Column({ comment: '来源', length: 50, default: 'api' })
  source: string;

  @Column({ comment: '备注', length: 500, nullable: true })
  remark: string;

  @CreateDateColumn({ comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updateTime: Date;
} 