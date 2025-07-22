import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { XhsPost } from './xhs.entity';
import { XhsService } from './xhs.service';
import { XhsController } from './xhs.controller';
import { XhsAutoController } from './xhs-auto.controller';
import { XhsAutoService } from './xhs-auto.service';
import { XhsActivity } from './xhs-activity.entity';
import { XhsActivityPost } from './xhs-activity-post.entity';
import { XhsActivityService } from './xhs-activity.service';
import { XhsActivityController } from './xhs-activity.controller';
import { XhsProductFactoryController } from './xhs-product-factory.controller';
import { XhsProductFactoryService } from './xhs-product-factory.service';
import { XhsProductFactory } from './xhs-product-factory.entity';
import { IdGeneratorService } from './id-generator.service';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CozeModule } from '../coze/coze.module';
import { XhsSignature } from './xhs-signature.entity';
import { PointConsumptionRuleModule } from '../pointConsumptionRule/pointConsumptionRule.module';
import { UserBalanceModule } from '../userBalance/userBalance.module';
import { GlobalConfigModule } from '../globalConfig/globalConfig.module';
import { MaterialModule } from '../material/material.module';
import { RedisCacheModule } from '../redisCache/redisCache.module';
import { AiApiModule } from '../ai/ai_api.module';
import { Note } from '../xiaohongshu/note.entity';
import { XiaohongshuModule } from '../xiaohongshu/xiaohongshu.module';
import { HtmlLibModule } from '../htmllib/htmllib.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      XhsPost, 
      XhsActivity, 
      XhsActivityPost,
      XhsProductFactory,
      XhsSignature,
      Note
    ]),
    ConfigModule,
    ScheduleModule.forRoot(),
    CozeModule,
    PointConsumptionRuleModule,
    UserBalanceModule,
    GlobalConfigModule,
    MaterialModule,
    RedisCacheModule,
    AiApiModule,
    UploadModule,
    forwardRef(() => XiaohongshuModule),
    forwardRef(() => HtmlLibModule)
  ],
  controllers: [
    XhsController, 
    XhsAutoController, 
    XhsActivityController,
    XhsProductFactoryController
  ],
  providers: [
    XhsService, 
    XhsAutoService,
    XhsActivityService,
    XhsProductFactoryService,
    IdGeneratorService
  ],
  exports: [
    XhsService, 
    XhsAutoService,
    XhsActivityService,
    XhsProductFactoryService,
    IdGeneratorService
  ],
})
export class XhsModule {} 