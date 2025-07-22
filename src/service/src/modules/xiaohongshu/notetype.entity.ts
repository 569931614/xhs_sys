import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('xiaohongshu_notetype')
export class NoteType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, comment: '类型名称' })
  name: string;

  @Column({ type: 'text', nullable: true, comment: '类型描述' })
  description: string;

  @Column({ type: 'int', default: 0, comment: '排序' })
  sort: number;

  @Column({ type: 'boolean', default: true, comment: '状态：true-启用，false-禁用' })
  status: boolean;

  @CreateDateColumn({ comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updateTime: Date;
} 