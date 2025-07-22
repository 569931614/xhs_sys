import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('xhs_signatures')
export class XhsSignature {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: 'App Key' })
  appKey: string;

  @Column({ comment: '签名数据' })
  signature: string;

  @Column({ comment: '时间戳', type: 'varchar', length: 20 })
  timestamp: string;

  @Column({ comment: '随机数', type: 'varchar', length: 50 })
  nonce: string;

  @Column({ comment: '创建时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createTime: Date;
} 