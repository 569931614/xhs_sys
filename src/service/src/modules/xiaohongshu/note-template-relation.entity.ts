import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Note } from './note.entity';
import { HtmlTemplateEntity } from '../../modules/htmllib/htmllib.entity';

@Entity('xiaohongshu_note_template_relation')
export class NoteTemplateRelation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: '笔记ID' })
  noteId: number;

  @ManyToOne(() => Note, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'noteId' })
  note: Note;

  @Column({ type: 'int', comment: 'HTML模板ID' })
  templateId: number;

  @ManyToOne(() => HtmlTemplateEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'templateId' })
  template: HtmlTemplateEntity;

  @Column({ type: 'boolean', default: false, comment: '是否可重复使用' })
  isRepeatable: boolean;

  @CreateDateColumn({ comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updateTime: Date;
} 