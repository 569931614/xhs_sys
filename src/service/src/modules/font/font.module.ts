import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FontController } from './font.controller';
import { FontService } from './font.service';
import { FontEntity } from './entities/font.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FontEntity])],
  controllers: [FontController],
  providers: [FontService],
  exports: [FontService],
})
export class FontModule {} 