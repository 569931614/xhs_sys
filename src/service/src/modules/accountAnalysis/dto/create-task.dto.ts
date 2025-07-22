import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum PlatformType {
  DOUYIN = 'douyin',
  XIAOHONGSHU = 'xiaohongshu',
}

export class CreateTaskDto {
  @ApiProperty({ 
    description: '平台类型，可选，不提供时会自动从链接判断', 
    enum: PlatformType, 
    required: false
  })
  @IsEnum(PlatformType)
  @IsOptional()
  platform?: PlatformType;

  @ApiProperty({ 
    description: '平台名称，可选，不提供时会自动设置', 
    example: '抖音', 
    required: false 
  })
  @IsString()
  @IsOptional()
  type_name?: string;

  @ApiProperty({ 
    description: '账号链接，系统会自动从链接判断是抖音还是小红书', 
    example: 'https://www.douyin.com/user/MS4wLjABxxxxxx'
  })
  @IsString()
  @IsNotEmpty({ message: '账号链接不能为空' })
  link: string;

  @ApiProperty({ description: '分析模式', example: '10', required: false })
  @IsString()
  @IsOptional()
  mode?: string;

  // 用户ID将在控制器中从当前登录用户信息中获取
  user_id?: number;
} 