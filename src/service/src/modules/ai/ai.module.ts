import { Module } from '@nestjs/common';
import { AiApiModule } from './ai_api.module';
import { UploadModule } from '../upload/upload.module';
import { GlobalConfigModule } from '../globalConfig/globalConfig.module';
import { OpenAIChatService } from './openaiChat.service';

@Module({
  imports: [AiApiModule, UploadModule, GlobalConfigModule],
  providers: [OpenAIChatService],
  exports: [AiApiModule, OpenAIChatService],
})
export class AiModule {} 