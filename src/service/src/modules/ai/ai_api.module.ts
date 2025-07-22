import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiApiController } from './ai_api.controller';
import { AiApiService } from './ai_api.service';
import { AiImageTaskEntity, AiGeneratedImageEntity, ImageUrlMappingEntity } from './ai_api.entity';
import { RedisCacheModule } from '../redisCache/redisCache.module';
import { UploadModule } from '../upload/upload.module';
import { ImageUploadService } from './image-upload.service';
import { PromptTemplateEntity } from '../promptlib/promptlib.entity';
import { BackupModelsModule } from '../models/backup-models.module';
import { OpenAIChatService } from './openaiChat.service';
import { GlobalConfigModule } from '../globalConfig/globalConfig.module';
import { AppEntity } from '../app/app.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiImageTaskEntity, 
      AiGeneratedImageEntity, 
      ImageUrlMappingEntity,
      PromptTemplateEntity,
      AppEntity
    ]),
    RedisCacheModule,
    UploadModule,
    BackupModelsModule,
    GlobalConfigModule
  ],
  controllers: [AiApiController],
  providers: [AiApiService, ImageUploadService, OpenAIChatService],
  exports: [AiApiService, ImageUploadService],
})
export class AiApiModule {} 