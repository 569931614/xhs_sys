import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { XhsProductFactoryController } from './xhs-product-factory.controller';
import { XhsProductFactoryService } from './xhs-product-factory.service';
import { XhsActivity } from './xhs-activity.entity';
import { XhsProductFactory } from './xhs-product-factory.entity';
import { CozeService } from '../coze/coze.service';
import { UserBalanceModule } from '../userBalance/userBalance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([XhsActivity, XhsProductFactory]),
    UserBalanceModule,
  ],
  controllers: [XhsProductFactoryController],
  providers: [XhsProductFactoryService, CozeService],
  exports: [XhsProductFactoryService],
})
export class XhsProductFactoryModule {} 