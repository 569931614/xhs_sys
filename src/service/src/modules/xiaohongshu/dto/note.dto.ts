import { IsString, IsOptional, IsInt, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class NoteTemplateDto {
  @ApiProperty({ description: '模板ID' })
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiProperty({ description: '是否可重复使用', default: false })
  @IsBoolean()
  isRepeatable: boolean;
}

export class CreateNoteDto {
  @ApiProperty({ description: '笔记标题', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '笔记类型ID' })
  @IsInt()
  @Type(() => Number)
  typeId: number;

  @ApiProperty({ description: '封面图URL', required: false })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiProperty({ description: '笔记内容', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: '排序', required: false, default: 0 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sort?: number;

  @ApiProperty({ description: '状态', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @ApiProperty({ description: '笔记ID，用于外部系统关联', required: false })
  @IsString()
  @IsOptional()
  noteId?: string;

  @ApiProperty({ description: 'Coze Bot ID', required: false })
  @IsString()
  @IsOptional()
  botId?: string;
  
  @ApiProperty({ description: '工作流参数类型', required: false })
  @IsString()
  @IsOptional()
  paramsType?: string;

  @ApiProperty({ description: '关联的模板列表', required: false, type: [NoteTemplateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoteTemplateDto)
  @IsOptional()
  htmlTemplates?: NoteTemplateDto[];
}

export class UpdateNoteDto extends CreateNoteDto {
  @ApiProperty({ description: '笔记ID' })
  @IsInt()
  @Type(() => Number)
  id: number;
}

export class NoteQueryDto {
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

  @ApiProperty({ description: '笔记标题', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '笔记类型ID', required: false })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  typeId?: number;

  @ApiProperty({ description: '状态', required: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  status?: boolean;

  @ApiProperty({ description: 'Coze Bot ID', required: false })
  @IsString()
  @IsOptional()
  botId?: string;
  
  @ApiProperty({ description: '工作流参数类型', required: false })
  @IsString()
  @IsOptional()
  paramsType?: string;

  @ApiProperty({ description: '排序字段', required: false, enum: ['createTime', 'updateTime', 'likesCount', 'viewsCount', 'title'] })
  @IsString()
  @IsOptional()
  orderBy?: string;

  @ApiProperty({ description: '排序方向', required: false, enum: ['ASC', 'DESC'] })
  @IsString()
  @IsOptional()
  orderDirection?: string;

  @ApiProperty({ description: '是否包含用户状态（收藏和点赞）', required: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  withUserStatus?: boolean;

  @ApiProperty({ description: '是否只显示用户已收藏的笔记', required: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  favoriteOnly?: boolean;

  @ApiProperty({ description: '关联的模板列表', required: false, type: [NoteTemplateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoteTemplateDto)
  @IsOptional()
  htmlTemplates?: NoteTemplateDto[];
} 