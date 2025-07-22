import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('la_fx_task')
export class FxTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  task_id: string;

  @Column({ nullable: true })
  external_id: number;

  @Column()
  type_name: string;

  @Column({ length: 500 })
  fx_url: string;

  @Column({ type: 'text', nullable: true })
  fx_content: string;

  @Column({ type: 'text', nullable: true })
  fx_content_jj: string;

  @Column({ type: 'text', nullable: true })
  ip_content: string;

  @Column({ type: 'text', nullable: true })
  ip_html_content: string;

  @Column({ default: 1 })
  timeout: number;

  @Column()
  status: string;

  @Column({ type: 'datetime' })
  create_time: Date;

  @Column({ type: 'datetime', nullable: true })
  update_time: Date;
  
  @Column({ nullable: true })
  account_name: string;
  
  @Column({ nullable: true })
  followers_count: string;
  
  @Column({ nullable: true })
  likes_count: string;
} 