import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ImageGeneratorController } from './image-generator.controller';
import { ImageGeneratorService } from './image-generator.service';
import { ImageGeneratorTask } from './image-generator.entity';
import { ImageDownloadUrl } from './image-download-url.entity';
import { RedisCacheModule } from '../redisCache/redisCache.module';
import { AiApiModule } from '../ai/ai_api.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ImageGeneratorTask, ImageDownloadUrl]),
    HttpModule,
    RedisCacheModule,
    AiApiModule
  ],
  controllers: [ImageGeneratorController],
  providers: [ImageGeneratorService],
  exports: [ImageGeneratorService],
})
export class ImageGeneratorModule {} 