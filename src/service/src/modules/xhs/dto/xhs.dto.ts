import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateXhsPostDto {
  @IsString()
  @ApiProperty({ description: '类型', example: 'normal' })
  type: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: '标题', example: '这是一篇小红书笔记', required: false })
  title: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: '内容', example: '这是笔记内容', required: false })
  content: string;

  @IsArray()
  @ApiProperty({ description: '图片URL', type: [String], example: [] })
  images: string[];

  @IsString()
  @IsOptional()
  @ApiProperty({ description: '视频URL', required: false })
  video?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: '封面URL', required: false })
  cover?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: '标识符', required: false })
  identifier?: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ description: '是否已使用', default: false, required: false })
  isUsed?: boolean;
  
  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: '用户ID', required: false })
  userId?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: '活动ID', required: false })
  activityId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: '供应商', required: false })
  supplier?: string;
}

export class UpdateXhsPostDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ description: '类型', example: 'normal', required: false })
  type?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: '标题', example: '这是一篇小红书笔记', required: false })
  title?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: '内容', example: '这是笔记内容', required: false })
  content?: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({ description: '图片URL', type: [String], example: [], required: false })
  images?: string[];

  @IsString()
  @IsOptional()
  @ApiProperty({ description: '视频URL', required: false })
  video?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: '封面URL', required: false })
  cover?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: '标识符', required: false })
  identifier?: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ description: '是否已使用', default: false, required: false })
  isUsed?: boolean;
  
  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: '用户ID', required: false })
  userId?: number;
  
  @IsString()
  @IsOptional()
  @ApiProperty({ description: '活动ID', required: false })
  activityId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: '供应商', required: false })
  supplier?: string;
}

export class XhsPostListDto {
  @IsOptional()
  @IsBoolean()
  isUsed?: boolean | string | number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: '用户ID', required: false })
  userId?: number;
  
  @IsOptional()
  @IsBoolean()
  @ApiProperty({ description: '只查询自己的笔记', required: false, default: false })
  selfOnly?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '笔记标题', required: false })
  title?: string;
  
  @IsOptional()
  @IsString()
  @ApiProperty({ description: '平台', required: false, enum: ['xhs', 'douyin'] })
  platform?: string;
} 