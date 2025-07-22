import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('html_render_tasks')
export class RenderTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 36, unique: true })
  taskId: string;

  @Column({ type: 'json', nullable: true })
  renderParams: any;

  @Column({ type: 'json', nullable: true })
  result: any;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'longtext', nullable: true })
  htmlContent: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
} 