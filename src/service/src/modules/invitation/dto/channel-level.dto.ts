import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateChannelLevelDto {
  @ApiProperty({ description: '渠道等级名称', example: '普通代理' })
  @IsNotEmpty({ message: '渠道等级名称不能为空' })
  @IsString()
  name: string;

  @ApiProperty({ description: '返佣比例（百分比）', example: 10 })
  @IsNotEmpty({ message: '返佣比例不能为空' })
  @IsNumber()
  @Min(0, { message: '返佣比例不能小于0%' })
  @Max(100, { message: '返佣比例不能大于100%' })
  commissionRate: number;

  @ApiProperty({ description: '排序', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  order: number;

  @ApiProperty({ description: '备注说明', required: false })
  @IsOptional()
  @IsString()
  remark: string;
}

export class UpdateChannelLevelDto extends CreateChannelLevelDto {
  @ApiProperty({ description: '是否启用', required: false })
  @IsOptional()
  isActive: boolean;
}

export class ChannelLevelQueryDto {
  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  page: number = 1;

  @ApiProperty({ description: '每页条数', required: false, default: 10 })
  @IsOptional()
  @IsNumber()
  size: number = 10;

  @ApiProperty({ description: '渠道等级名称', required: false })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ description: '是否启用', required: false })
  @IsOptional()
  isActive: boolean;
} 