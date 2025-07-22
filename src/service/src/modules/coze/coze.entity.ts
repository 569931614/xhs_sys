import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entity/baseEntity';

@Entity('coze')
export class CozeEntity extends BaseEntity {
  @Column({ comment: 'Coze Workflow ID', length: 255, unique: true })
  workflowId: string;

  @Column({ comment: '名称描述', length: 255 })
  name: string;

  @Column({ comment: 'Coze 公钥', length: 512 })
  publicKey: string;

  @Column({ comment: 'Coze 私钥', length: 2048 })
  secretKey: string;

  @Column({ comment: '客户端ID', length: 255, nullable: true })
  clientId: string;

  @Column({ comment: '空间ID', length: 255, nullable: true })
  spaceId: string;

  @Column({ comment: '状态', type: 'tinyint', default: 1 })
  status: number;
} 