import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { GlobalConfigModule } from '../globalConfig/globalConfig.module';
import { CozeModule } from '../coze/coze.module';

@Module({
  imports: [GlobalConfigModule, CozeModule],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
