import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupModelsController } from './backup-models.controller';
import { BackupModelsEntity } from './backup-models.entity';
import { BackupModelsService } from './backup-models.service';

@Module({
  imports: [TypeOrmModule.forFeature([BackupModelsEntity])],
  controllers: [BackupModelsController],
  providers: [BackupModelsService],
  exports: [BackupModelsService],
})
export class BackupModelsModule {} 