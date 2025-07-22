import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Note } from './note.entity';

@Entity('xiaohongshu_note_view')
export class NoteView {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: '笔记ID' })
  noteId: number;

  @ManyToOne(() => Note, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'noteId' })
  note: Note;

  @Column({ type: 'varchar', length: 100, comment: '用户ID' })
  userId: string;

  @CreateDateColumn({ comment: '预览时间' })
  createTime: Date;
} 