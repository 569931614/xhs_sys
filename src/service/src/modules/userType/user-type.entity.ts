import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'user_type' })
export class UserTypeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '类型名称', length: 50 })
  name: string;

  @Column({ comment: '类型描述', length: 200, default: '' })
  description: string;

  @Column({ comment: '状态 0-禁用 1-启用', default: 1 })
  status: number;

  @CreateDateColumn({ comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updateTime: Date;
} 