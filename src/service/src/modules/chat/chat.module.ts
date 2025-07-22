import { Global, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiPptService } from '../ai/aiPPT';
import { CogVideoService } from '../ai/cogVideo.service';
import { FluxDrawService } from '../ai/fluxDraw.service';
import { LumaVideoService } from '../ai/lumaVideo.service';
import { MidjourneyService } from '../ai/midjourneyDraw.service';
import { OpenAIChatService } from '../ai/openaiChat.service';
import { OpenAIDrawService } from '../ai/openaiDraw.service';
import { StableDiffusionService } from '../ai/stableDiffusion.service';
import { SunoService } from '../ai/suno.service';
import { AppEntity } from '../app/app.entity';
import { ChatGroupEntity } from '../chatGroup/chatGroup.entity';
import { ChatLogEntity } from '../chatLog/chatLog.entity';
import { ChatLogService } from '../chatLog/chatLog.service';
import { CramiPackageEntity } from '../crami/cramiPackage.entity';
import { ConfigEntity } from '../globalConfig/config.entity';
import { PluginEntity } from '../plugin/plugin.entity';
import { RedisCacheService } from '../redisCache/redisCache.service';
import { UserEntity } from '../user/user.entity';
import { AccountLogEntity } from '../userBalance/accountLog.entity';
import { BalanceEntity } from '../userBalance/balance.entity';
import { FingerprintLogEntity } from '../userBalance/fingerprint.entity';
import { UserBalanceEntity } from '../userBalance/userBalance.entity';
import { VerifycationEntity } from '../verification/verifycation.entity';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { netSearchService } from '../ai/netSearch.service';
import { InvitationModule } from '../invitation/invitation.module';
import { InvitationEntity } from '../invitation/invitation.entity';
import { UserModule } from '../user/user.module';
import { UserBalanceModule } from '../userBalance/userBalance.module';
import { VerificationModule } from '../verification/verification.module';
import { MailerModule } from '../mailer/mailer.module';
import { UploadModule } from '../upload/upload.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BalanceEntity,
      UserEntity,
      PluginEntity,
      VerifycationEntity,
      ChatLogEntity,
      AccountLogEntity,
      ConfigEntity,
      CramiPackageEntity,
      ChatGroupEntity,
      AppEntity,
      UserBalanceEntity,
      FingerprintLogEntity,
      InvitationEntity,
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => InvitationModule),
    forwardRef(() => UserBalanceModule),
    forwardRef(() => VerificationModule),
    forwardRef(() => MailerModule),
    UploadModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    OpenAIChatService,
    StableDiffusionService,
    MidjourneyService,
    OpenAIDrawService,
    LumaVideoService,
    CogVideoService,
    FluxDrawService,
    AiPptService,
    netSearchService,
    RedisCacheService,
    ChatLogService,
    SunoService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
