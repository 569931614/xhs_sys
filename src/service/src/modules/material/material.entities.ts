import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('material_folders')
export class MaterialFolder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date;

  @UpdateDateColumn({ name: 'update_time' })
  updateTime: Date;

  @Column({ default: 0 })
  count: number;

  @Column({ name: 'user_id', nullable: true })
  userId: string;
}

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  fileId: string;

  @Column({ name: 'coze_file_id', length: 255 })
  cozeFileId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'preview_url', length: 1000 })
  previewUrl: string;

  @Column()
  size: number;

  @Column({ length: 50 })
  type: string;

  @Column({ name: 'folder_id' })
  folderId: string;

  @CreateDateColumn({ name: 'upload_time' })
  uploadTime: Date;

  @Column({ name: 'expiry_time' })
  expiryTime: Date;

  @Column({ length: 20, default: 'valid' })
  status: 'valid' | 'expired';

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => MaterialFolder)
  @JoinColumn({ name: 'folder_id' })
  folder: MaterialFolder;
} 