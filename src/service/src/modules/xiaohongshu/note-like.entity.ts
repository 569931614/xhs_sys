import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Note } from './note.entity';

@Entity('xiaohongshu_note_like')
@Unique(['noteId', 'userId']) // 确保一个用户只能给一个笔记点赞一次
export class NoteLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: '笔记ID' })
  noteId: number;

  @ManyToOne(() => Note, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'noteId' })
  note: Note;

  @Column({ type: 'varchar', length: 100, comment: '用户ID' })
  userId: string;

  @CreateDateColumn({ comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updateTime: Date;
} 