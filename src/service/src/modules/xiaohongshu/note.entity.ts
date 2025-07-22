import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { NoteType } from './notetype.entity';

@Entity('xiaohongshu_note')
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, comment: '笔记标题' })
  title: string;

  @Column({ type: 'int', comment: '笔记类型ID' })
  typeId: number;

  @ManyToOne(() => NoteType)
  @JoinColumn({ name: 'typeId' })
  type: NoteType;

  @Column({ type: 'text', nullable: true, comment: '封面图URL' })
  coverImage: string;

  @Column({ type: 'text', comment: '笔记内容' })
  content: string;

  @Column({ type: 'int', default: 0, comment: '排序' })
  sort: number;

  @Column({ type: 'boolean', default: true, comment: '状态：true-启用，false-禁用' })
  status: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '笔记ID，用于外部系统关联' })
  noteId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Coze Bot ID' })
  botId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '工作流参数类型' })
  paramsType: string;

  @Column({ type: 'int', default: 0, comment: '点赞次数' })
  likesCount: number;

  @Column({ type: 'int', default: 0, comment: '预览次数' })
  viewsCount: number;

  @CreateDateColumn({ comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updateTime: Date;
} 