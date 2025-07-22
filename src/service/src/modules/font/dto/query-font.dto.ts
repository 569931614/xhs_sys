import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryFontDto {
  @ApiProperty({ description: '字体名称', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '字体代码', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ description: '字体类型', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: '状态', required: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  status?: boolean;

  @ApiProperty({ description: '来源', required: false })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false, default: 10 })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  pageSize?: number = 10;

  @ApiProperty({ description: '排序字段', required: false, default: 'createTime' })
  @IsString()
  @IsOptional()
  orderBy?: string = 'createTime';

  @ApiProperty({ description: '排序方式', required: false, default: 'DESC' })
  @IsString()
  @IsOptional()
  orderDirection?: 'ASC' | 'DESC' = 'DESC';
} 