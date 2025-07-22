import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ai_topic_settings')
export class AiTopicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ nullable: true, default: '' })
  industry: string;

  @Column({ nullable: true, default: '' })
  audience: string;

  @Column({ nullable: true, default: '' })
  product: string;

  @Column({ nullable: true, default: '' })
  location: string;

  @Column({ name: 'pain_point', nullable: true, default: '' })
  painPoint: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 