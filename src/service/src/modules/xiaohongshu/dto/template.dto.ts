import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTemplateDto {
  @IsNotEmpty({ message: '模板名称不能为空' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: '文件路径不能为空' })
  @IsString()
  filePath: string;

  @IsNotEmpty({ message: '图片数量不能为空' })
  @IsNumber()
  imageCount: number;

  @IsNotEmpty({ message: '文本数量不能为空' })
  @IsNumber()
  textCount: number;

  @IsNotEmpty({ message: '文本详情不能为空' })
  @IsString()
  textDetails: string;

  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @IsInt()
  @IsOptional()
  status?: number;
}

export class UpdateTemplateDto {
  @IsNotEmpty({ message: 'ID不能为空' })
  @IsNumber()
  id: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  filePath?: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @IsOptional()
  @IsNumber()
  imageCount?: number;

  @IsOptional()
  @IsNumber()
  textCount?: number;

  @IsOptional()
  @IsString()
  textDetails?: string;

  @IsOptional()
  @IsInt()
  status?: number;
}

export class DeleteTemplateDto {
  @IsNotEmpty({ message: 'ID不能为空' })
  @IsNumber()
  id: number;
}

export class UpdateTemplateStatusDto {
  @IsNotEmpty({ message: 'ID不能为空' })
  @IsNumber()
  id: number;

  @IsNotEmpty({ message: '状态不能为空' })
  @IsInt()
  status: number;
} 