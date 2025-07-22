import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTypeController } from './user-type.controller';
import { UserTypeEntity } from './user-type.entity';
import { UserTypeService } from './user-type.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserTypeEntity])],
  controllers: [UserTypeController],
  providers: [UserTypeService],
  exports: [UserTypeService],
})
export class UserTypeModule {} 