import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class CreateNoteTemplateDto {
  @ApiProperty({ description: '模板名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '模板内容' })
  @IsString()
  content: string;

  @ApiProperty({ description: '模板缩略图', required: false })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiProperty({ description: '排序', required: false, default: 0 })
  @IsInt()
  @IsOptional()
  sort?: number;

  @ApiProperty({ description: '状态', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  status?: boolean;
}

export class UpdateNoteTemplateDto extends CreateNoteTemplateDto {
  @ApiProperty({ description: '模板ID' })
  @IsInt()
  id: number;
}

export class NoteTemplateQueryDto {
  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ description: '每页数量', required: false, default: 10 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;

  @ApiProperty({ description: '模板名称', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '状态', required: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  status?: boolean;
} 