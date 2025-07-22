import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialController } from './material.controller';
import { MaterialService } from './material.service';
import { Material, MaterialFolder } from './material.entities';
import { CozeModule } from '../coze/coze.module';
import { UploadModule } from '../upload/upload.module';
import { AiApiModule } from '../ai/ai_api.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Material, MaterialFolder]),
    CozeModule,
    UploadModule,
    AiApiModule,
  ],
  controllers: [MaterialController],
  providers: [MaterialService],
  exports: [MaterialService],
})
export class MaterialModule {} 