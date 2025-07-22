import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('note_favorite')
export class NoteFavorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '笔记ID' })
  noteId: number;

  @Column({ comment: '用户ID' })
  userId: string;

  @CreateDateColumn({ comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updateTime: Date;
} 