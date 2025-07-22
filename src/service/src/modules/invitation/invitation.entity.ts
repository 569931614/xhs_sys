import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity('invitation')
export class InvitationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  inviterId: number;

  @Column()
  inviteeId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '邀请产生的总消费金额' })
  totalAmount: number;

  @Column({ default: 0, comment: '邀请产生的订单数量' })
  orderCount: number;

  @Column({ default: 1, comment: '层级关系: 1-直属(目前系统只支持一级关系)' })
  level: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '充值金额' })
  rechargeAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '佣金金额' })
  commissionAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'inviterId' })
  inviter: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'inviteeId' })
  invitee: UserEntity;
}