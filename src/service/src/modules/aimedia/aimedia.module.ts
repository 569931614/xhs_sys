import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AiTopicController } from './aiTopicController';
import { AiTopicService } from './aiTopicService';
import { AiTopicEntity } from './entities/aiTopic.entity';
import { AiModule } from '../ai/ai.module';
import { AppModule } from '../app/app.module';
import { ConfigEntity } from '../globalConfig/config.entity';
import { AppEntity } from '../app/app.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiTopicEntity, ConfigEntity, AppEntity]),
    ConfigModule,
    AiModule,
    AppModule,
  ],
  controllers: [
    AiTopicController,
  ],
  providers: [
    AiTopicService,
  ],
  exports: [
    AiTopicService,
  ],
})
export class AiMediaModule {} 