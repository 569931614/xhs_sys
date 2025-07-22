import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { OrderEntity } from '../order/order.entity';

@Entity('channel_commission')
export class ChannelCommissionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  orderId: number;

  @Column()
  inviteeId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '佣金金额' })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '订单金额' })
  orderAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, comment: '佣金比例' })
  commissionRate: number;

  @Column({ default: 1, comment: '佣金等级: 1-一级, 2-二级, 3-三级' })
  level: number;

  @Column({ default: 0, comment: '状态: 0-未结算, 1-已结算, -1-已取消' })
  status: number;

  @Column({ nullable: true, comment: '结算时间' })
  settledAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'inviteeId' })
  invitee: UserEntity;

  @ManyToOne(() => OrderEntity)
  @JoinColumn({ name: 'orderId' })
  order: OrderEntity;
} 