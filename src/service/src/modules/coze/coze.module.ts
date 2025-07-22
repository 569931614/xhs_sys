import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CozeEntity } from './coze.entity';
import { CozeController } from './coze.controller';
import { CozeService } from './coze.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CozeEntity]),
    HttpModule,
  ],
  controllers: [CozeController],
  providers: [CozeService],
  exports: [CozeService],
})
export class CozeModule {} 