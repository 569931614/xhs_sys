import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsNumberString } from 'class-validator';

export class XhsAutoNoteListDto {
  @IsOptional()
  @IsNumberString()
  isUsed?: string;

  @IsOptional()
  limit?: number;

  @IsOptional()
  page?: number;
  
  @IsOptional()
  @IsString()
  identifier?: string;
  
  @IsOptional()
  @IsString()
  id?: string;
  
  @IsOptional()
  @IsString()
  platform?: string;
  
  @IsOptional()
  @IsString()
  isSequential?: string;
}

export class XhsAutoNoteDetailDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class XhsAutoCreateNoteDto {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images: string[];

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  video?: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsOptional()
  @IsString()
  identifier?: string;
  
  @IsOptional()
  userId?: number;

  @IsOptional()
  @IsBoolean()
  isPublish?: boolean;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  supplier?: string;
}

export class XhsAutoUpdateNoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  video?: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsOptional()
  @IsString()
  identifier?: string;

  @IsOptional()
  @IsBoolean()
  isUsed?: boolean;

  @IsOptional()
  @IsString()
  supplier?: string;
}

export class XhsAutoDeleteNoteDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class XhsAutoMarkUsedDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}

// 获取抖音跳转链接的DTO
export class XhsAutoDouyinSchemaDto {
  @IsString()
  @IsNotEmpty()
  id: string;
  
  @IsOptional()
  @IsString()
  userId?: string;
  
  @IsOptional()
  @IsString()
  activityId?: string;
} 