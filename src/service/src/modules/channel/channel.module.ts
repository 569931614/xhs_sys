import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationEntity } from '../invitation/invitation.entity';
import { InvitationController } from '../invitation/invitation.controller';
import { InvitationService } from '../invitation/invitation.service';
import { ChannelLevelEntity } from '../channelLevel/channelLevel.entity';
import { ChannelLevelController } from '../channelLevel/channelLevel.controller';
import { ChannelLevelService } from '../channelLevel/channelLevel.service';
import { ChannelCommissionEntity } from '../channelCommission/channelCommission.entity';
import { ChannelCommissionController } from '../channelCommission/channelCommission.controller';
import { ChannelCommissionService } from '../channelCommission/channelCommission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvitationEntity,
      ChannelLevelEntity,
      ChannelCommissionEntity
    ]),
  ],
  controllers: [
    InvitationController,
    ChannelLevelController,
    ChannelCommissionController
  ],
  providers: [
    InvitationService,
    ChannelLevelService,
    ChannelCommissionService
  ],
  exports: [
    InvitationService,
    ChannelLevelService,
    ChannelCommissionService
  ],
})
export class ChannelModule {} 