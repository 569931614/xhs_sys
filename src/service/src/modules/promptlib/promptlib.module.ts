import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromptTemplateEntity } from './promptlib.entity';
import { PromptLibService } from './promptlib.service';
import { PromptLibController } from './promptlib.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PromptTemplateEntity])],
  controllers: [PromptLibController],
  providers: [PromptLibService],
  exports: [PromptLibService],
})
export class PromptLibModule {} 