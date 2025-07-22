import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HtmlRenderController } from './html-render.controller';
import { HtmlRenderService } from './html-render.service';
import { HtmlTemplateEntity } from './htmllib.entity';
import { RenderTask } from './entities/render-task.entity';
import { GlobalConfigModule } from '../globalConfig/globalConfig.module';
import { AiApiModule } from '../ai/ai_api.module';
import { ImageUrlMappingEntity } from '../ai/ai_api.entity';
import { OpenAIChatService } from '../ai/openaiChat.service';
import { HtmlLibController } from './htmllib.controller';
import { HtmlLibService } from './htmllib.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([HtmlTemplateEntity, ImageUrlMappingEntity, RenderTask]),
    GlobalConfigModule,
    forwardRef(() => AiApiModule)
  ],
  controllers: [HtmlRenderController, HtmlLibController],
  providers: [HtmlRenderService, OpenAIChatService, HtmlLibService],
  exports: [HtmlRenderService, HtmlLibService]
})
export class HtmlLibModule {} 