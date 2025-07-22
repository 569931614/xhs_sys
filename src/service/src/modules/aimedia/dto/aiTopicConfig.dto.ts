import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class AiTopicConfig {
  @ApiProperty({ description: '行业', required: false })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiProperty({ description: '受众群体', required: false })
  @IsString()
  @IsOptional()
  audience?: string;

  @ApiProperty({ description: '产品', required: false })
  @IsString()
  @IsOptional()
  product?: string;

  @ApiProperty({ description: '地区', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: '痛点', required: false })
  @IsString()
  @IsOptional()
  painPoint?: string;
} 