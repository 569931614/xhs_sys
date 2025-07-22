import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { GlobalConfigModule } from '../globalConfig/globalConfig.module';

@Module({
  imports: [GlobalConfigModule],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {} 