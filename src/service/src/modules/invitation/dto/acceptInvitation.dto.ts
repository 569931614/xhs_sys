import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({ description: '邀请码' })
  @IsNotEmpty({ message: '邀请码不能为空' })
  @IsString({ message: '邀请码必须是字符串' })
  inviteCode: string;

  @ApiProperty({ description: '新用户ID' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsNumber({}, { message: '用户ID必须是数字' })
  userId: number;
} 