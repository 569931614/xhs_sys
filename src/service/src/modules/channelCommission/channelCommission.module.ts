import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelCommissionController } from './channelCommission.controller';
import { ChannelCommissionService } from './channelCommission.service';
import { ChannelCommissionEntity } from './channelCommission.entity';
import { InvitationModule } from '../invitation/invitation.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChannelCommissionEntity]),
    InvitationModule,
    UserModule,
  ],
  controllers: [ChannelCommissionController],
  providers: [ChannelCommissionService],
  exports: [ChannelCommissionService],
})
export class ChannelCommissionModule {} 