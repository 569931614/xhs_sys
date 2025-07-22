import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointConsumptionRuleService } from './pointConsumptionRule.service';
import { PointConsumptionRuleEntity } from './pointConsumptionRule.entity';
import { ConfigEntity } from '../globalConfig/config.entity';
import { PointConsumptionRuleController } from './pointConsumptionRule.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PointConsumptionRuleEntity, ConfigEntity]),
  ],
  controllers: [PointConsumptionRuleController],
  providers: [PointConsumptionRuleService],
  exports: [PointConsumptionRuleService],
})
export class PointConsumptionRuleModule {} 