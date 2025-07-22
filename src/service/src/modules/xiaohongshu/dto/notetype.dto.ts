import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class CreateNoteTypeDto {
  @ApiProperty({ description: '类型名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '类型描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '排序', required: false, default: 0 })
  @IsInt()
  @IsOptional()
  sort?: number;

  @ApiProperty({ description: '状态', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  status?: boolean;
}

export class UpdateNoteTypeDto extends CreateNoteTypeDto {
  @ApiProperty({ description: '类型ID' })
  @IsInt()
  id: number;
}

export class NoteTypeQueryDto {
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

  @ApiProperty({ description: '类型名称', required: false })
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