import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class CustomPage {
  @ApiProperty({ description: '自定义页面ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '页面标题' })
  @Column()
  title: string;

  @ApiProperty({ description: '页面路径（可以是完整URL或相对路径）' })
  @Column()
  path: string;

  @ApiProperty({ description: '页面类型（0: 外部链接, 1: 内部页面）' })
  @Column({ default: 0 })
  type: number;

  @ApiProperty({ description: '页面图标' })
  @Column({ default: 'icon-park:page' })
  icon: string;

  @ApiProperty({ description: '描述信息' })
  @Column({ default: '' })
  description: string;

  @ApiProperty({ description: '排序值' })
  @Column({ default: 0 })
  order: number;

  @ApiProperty({ description: '状态(0: 禁用, 1: 启用)' })
  @Column({ default: 1 })
  status: number;

  @ApiProperty({ description: '允许访问的用户类型ID数组，为空则所有用户可访问' })
  @Column({ type: 'simple-array', nullable: true })
  userTypes: number[];

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createTime: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updateTime: Date;
} 