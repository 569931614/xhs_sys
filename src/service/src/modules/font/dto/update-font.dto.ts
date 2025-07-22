import { PartialType } from '@nestjs/mapped-types';
import { CreateFontDto } from './create-font.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber } from 'class-validator';

export class UpdateFontDto extends PartialType(CreateFontDto) {
  @ApiProperty({ description: '字体ID' })
  @IsNumber()
  @IsOptional()
  id?: number;
} 