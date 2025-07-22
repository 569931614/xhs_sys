import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class BasePage {
  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiProperty({ description: '每页条数', required: false, default: 10 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  pageSize?: number = 10;
} 