import { AbortInterceptor } from '@/common/interceptors/abort.interceptor';
import { CustomLoggerService } from '@/common/logger/custom-logger.service';
import { Global, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import * as fetch from 'isomorphic-fetch';
import { AppModule as ApplicationModule } from './modules/app/app.module';
import { AuthModule } from './modules/auth/auth.module';
import { AutoreplyModule } from './modules/autoreply/autoreply.module';
import { BadWordsModule } from './modules/badWords/badWords.module';
import { ChatModule } from './modules/chat/chat.module';
import { ChatGroupModule } from './modules/chatGroup/chatGroup.module';
import { ChatLogModule } from './modules/chatLog/chatLog.module';
import { CozeModule } from './modules/coze/coze.module';
import { CramiModule } from './modules/crami/crami.module';
import { CustomPageModule } from './modules/customPage/customPage.module';
import { DatabaseModule } from './modules/database/database.module';
import { FontModule } from './modules/font/font.module';
import { GlobalConfigModule } from './modules/globalConfig/globalConfig.module';
import { InvitationModule } from './modules/invitation/invitation.module';
import { ModelsModule } from './modules/models/models.module';
import { BackupModelsModule } from './modules/models/backup-models.module';
import { OfficialModule } from './modules/official/official.module';
import { OrderModule } from './modules/order/order.module';
import { PayModule } from './modules/pay/pay.module';
import { PluginModule } from './modules/plugin/plugin.module';
import { RedisCacheModule } from './modules/redisCache/redisCache.module';
import { SigninModule } from './modules/signin/signin.module';
import { StatisticModule } from './modules/statistic/statistic.module';
import { TaskModule } from './modules/task/task.module';
import { UploadModule } from './modules/upload/upload.module';
import { UserModule } from './modules/user/user.module';
import { UserBalanceModule } from './modules/userBalance/userBalance.module';
import { UserTypeModule } from './modules/userType/user-type.module';
import { VerificationModule } from './modules/verification/verification.module';
import { XhsModule } from './modules/xhs/xhs.module';
import { JwtAuthGuard } from './common/auth/jwtAuth.guard';
import { AiApiModule } from './modules/ai/ai_api.module';
import { PromptLibModule } from './modules/promptlib/promptlib.module';
import { XiaohongshuModule } from './modules/xiaohongshu/xiaohongshu.module';
import { AiModule } from './modules/ai/ai.module';
import { AiMediaModule } from './modules/aimedia/aimedia.module';
import { MaterialModule } from './modules/material/material.module';
import { UserFunctionModule } from './modules/userFunction/userFunction.module';
import { AccountAnalysisModule } from './modules/accountAnalysis/accountAnalysis.module';
import { HtmlLibModule } from './modules/htmllib/htmllib.module';
import { ImageGeneratorModule } from './modules/imageGenerator/image-generator.module';

global.fetch = fetch;

@Module({
  imports: [
    ApplicationModule,
    DatabaseModule,
    GlobalConfigModule,
    RedisCacheModule,
    UserModule,
    AuthModule,
    ModelsModule,
    BackupModelsModule,
    ChatModule,
    OfficialModule,
    AutoreplyModule,
    ChatLogModule,
    PluginModule,
    CramiModule,
    OrderModule,
    PayModule,
    ChatGroupModule,
    UserBalanceModule,
    CustomPageModule,
    SigninModule,
    StatisticModule,
    BadWordsModule,
    UserTypeModule,
    VerificationModule,
    TaskModule,
    UploadModule,
    XhsModule,
    CozeModule,
    AiApiModule,
    PromptLibModule,
    XiaohongshuModule,
    InvitationModule,
    AiModule,
    AiMediaModule,
    MaterialModule,
    UserFunctionModule,
    AccountAnalysisModule,
    HtmlLibModule,
    FontModule,
    ImageGeneratorModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AbortInterceptor,
    },
    CustomLoggerService,
  ],
})
export class AppModule {}
