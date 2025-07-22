import { Module } from '@nestjs/common';
import { UserFunctionController } from './userFunction.controller';
import { UserBalanceModule } from '../userBalance/userBalance.module';
import { PointConsumptionRuleModule } from '../pointConsumptionRule/pointConsumptionRule.module';

@Module({
  imports: [UserBalanceModule, PointConsumptionRuleModule],
  controllers: [UserFunctionController],
  providers: [],
  exports: []
})
export class UserFunctionModule {} 