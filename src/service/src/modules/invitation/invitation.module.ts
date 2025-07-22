import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationEntity } from './invitation.entity';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { UserEntity } from '../user/user.entity';
import { ChannelLevelEntity } from '../channelLevel/channelLevel.entity';
import { ChannelCommissionEntity } from '../channelCommission/channelCommission.entity';
import { UserModule } from '../user/user.module';
import { ChannelLevelService } from './channel-level.service';
import { ChannelLevel } from './channel-level.entity';
import { GlobalConfigModule } from '../globalConfig/globalConfig.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvitationEntity, 
      UserEntity, 
      ChannelLevelEntity,
      ChannelCommissionEntity,
      ChannelLevel
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => GlobalConfigModule),
  ],
  controllers: [InvitationController],
  providers: [InvitationService, ChannelLevelService],
  exports: [InvitationService],
})
export class InvitationModule {} 