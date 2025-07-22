import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountAnalysisController } from './accountAnalysis.controller';
import { AccountAnalysisService } from './accountAnalysis.service';
import { FxTask } from './entities/fx-task.entity';
import { AiModule } from '../ai/ai.module';
import { GlobalConfigModule } from '../globalConfig/globalConfig.module';
import { AppEntity } from '../app/app.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FxTask, AppEntity]),
    AiModule,
    GlobalConfigModule
  ],
  controllers: [AccountAnalysisController],
  providers: [AccountAnalysisService],
  exports: [AccountAnalysisService]
})
export class AccountAnalysisModule {} 