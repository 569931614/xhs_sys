import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './order.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { CramiPackageEntity } from '../crami/cramiPackage.entity';
import { UserEntity } from '../user/user.entity';
import { PayModule } from '../pay/pay.module';
import { InvitationModule } from '../invitation/invitation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, CramiPackageEntity, UserEntity]),
    forwardRef(() => PayModule),
    InvitationModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
