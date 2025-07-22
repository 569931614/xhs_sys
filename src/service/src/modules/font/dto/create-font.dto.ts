import { IsString, IsOptional, IsBoolean, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFontDto {
  @ApiProperty({ description: '字体名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '字体代码' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: '预览图URL' })
  @IsString()
  @IsOptional()
  preview?: string;

  @ApiProperty({ description: '字体文件URL' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ description: '字体类型', default: 'ttf' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: '状态', default: true })
  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @ApiProperty({ description: '排序', default: 0 })
  @IsNumber()
  @IsOptional()
  sort?: number;

  @ApiProperty({ description: '来源', default: 'api' })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
} 