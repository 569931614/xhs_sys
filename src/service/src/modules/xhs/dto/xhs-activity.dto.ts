import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

// 活动状态枚举
enum ActivityStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

// 创建活动DTO
export class CreateXhsActivityDto {
  @ApiProperty({ description: '活动ID', example: 'a_abc123', required: false })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ description: '活动名称', example: '美食分享活动' })
  @IsString()
  name: string;

  @ApiProperty({ description: '素材类型', example: 'food', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: '状态', enum: ActivityStatus, default: ActivityStatus.ACTIVE, required: false })
  @IsEnum(ActivityStatus)
  @IsOptional()
  status?: ActivityStatus;

  @ApiProperty({ description: '是否默认活动', default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

// 查询活动列表DTO
export class QueryXhsActivityDto {
  @ApiProperty({ description: '活动名称', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '素材类型', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: '状态', enum: ActivityStatus, required: false })
  @IsEnum(ActivityStatus)
  @IsOptional()
  status?: ActivityStatus;

  @ApiProperty({ description: '是否默认活动', required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ description: '用户ID', required: false })
  @IsNumber()
  @IsOptional()
  userId?: number;
}

// 更新活动DTO
export class UpdateXhsActivityDto {
  @ApiProperty({ description: '活动名称', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '素材类型', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: '状态', enum: ActivityStatus, required: false })
  @IsEnum(ActivityStatus)
  @IsOptional()
  status?: ActivityStatus;
  
  @ApiProperty({ description: '是否默认活动', required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

// 添加笔记到活动DTO
export class AddPostToActivityDto {
  @ApiProperty({ description: '活动ID' })
  @IsString()
  activityId: string;

  @ApiProperty({ description: '笔记ID' })
  @IsNumber()
  postId: number;
}

// 活动统计DTO
export class XhsActivityStatsDto {
  @ApiProperty({ description: '活动ID' })
  id: string;

  @ApiProperty({ description: '活动名称' })
  name: string;

  @ApiProperty({ description: '素材类型' })
  type: string;

  @ApiProperty({ description: '状态' })
  status: string;

  @ApiProperty({ description: '是否默认活动' })
  isDefault: boolean;

  @ApiProperty({ description: '笔记总数' })
  totalNotes: number;

  @ApiProperty({ description: '可发布笔记数' })
  availableNotes: number;

  @ApiProperty({ description: '已发布笔记数' })
  publishedNotes: number;
} 