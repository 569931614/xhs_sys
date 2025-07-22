import { Global, Module, forwardRef } from '@nestjs/common';
import { PayController } from './pay.controller';
import { PayService } from './pay.service';
import { OrderEntity } from '../order/order.entity';
import { CramiPackageEntity } from '../crami/cramiPackage.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderModule } from '../order/order.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, CramiPackageEntity]),
    forwardRef(() => OrderModule),
  ],
  controllers: [PayController],
  providers: [PayService],
  exports: [PayService],
})
export class PayModule {}
