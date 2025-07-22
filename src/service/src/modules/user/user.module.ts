import { Global, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGroupEntity } from '../chatGroup/chatGroup.entity';
import { ChatLogEntity } from '../chatLog/chatLog.entity';
import { CramiPackageEntity } from '../crami/cramiPackage.entity';
import { ConfigEntity } from '../globalConfig/config.entity';
import { RedisCacheService } from '../redisCache/redisCache.service';
import { AccountLogEntity } from '../userBalance/accountLog.entity';
import { BalanceEntity } from '../userBalance/balance.entity';
import { FingerprintLogEntity } from '../userBalance/fingerprint.entity';
import { UserBalanceEntity } from '../userBalance/userBalance.entity';
import { VerifycationEntity } from '../verification/verifycation.entity';
import { UserController } from './user.controller';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { InvitationEntity } from '../invitation/invitation.entity';
import { InvitationModule } from '../invitation/invitation.module';
import { VerificationModule } from '../verification/verification.module';
import { GlobalConfigModule } from '../globalConfig/globalConfig.module';
import { UserBalanceModule } from '../userBalance/userBalance.module';
import { MailerModule } from '../mailer/mailer.module';
import { VerificationService } from '../verification/verification.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      VerifycationEntity,
      BalanceEntity,
      AccountLogEntity,
      ConfigEntity,
      CramiPackageEntity,
      UserBalanceEntity,
      FingerprintLogEntity,
      ChatLogEntity,
      ChatGroupEntity,
      InvitationEntity
    ]),
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'ai-plus',
      signOptions: { expiresIn: '24h' },
    }),
    forwardRef(() => VerificationModule),
    forwardRef(() => GlobalConfigModule),
    forwardRef(() => UserBalanceModule),
    forwardRef(() => MailerModule),
    forwardRef(() => InvitationModule),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    VerificationService,
    RedisCacheService,
  ],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}
