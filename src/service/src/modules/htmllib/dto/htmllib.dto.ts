import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsArray, IsObject, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHtmlTemplateDto {
  @ApiProperty({ example: '商品详情页', description: '模板名称' })
  @IsNotEmpty({ message: '模板名称不能为空' })
  @IsString({ message: '模板名称必须是字符串' })
  name: string;

  @ApiProperty({ example: '<div>HTML模板代码</div>', description: 'HTML代码' })
  @IsNotEmpty({ message: 'HTML代码不能为空' })
  @IsString({ message: 'HTML代码必须是字符串' })
  htmlCode: string;

  @ApiProperty({ example: 3, description: '可替换的图片数量' })
  @IsNotEmpty({ message: '可替换的图片数量不能为空' })
  @IsNumber({}, { message: '可替换的图片数量必须是数字' })
  imageCount: number;

  @ApiProperty({ 
    example: ['标题', '描述', '价格'], 
    description: '可替换的文本内容列表', 
    required: false 
  })
  @IsOptional()
  @IsArray({ message: '可替换文本必须是数组' })
  @IsString({ each: true, message: '文本项必须是字符串' })
  textDetails?: string[];

  @ApiProperty({ example: '/uploads/thumbnails/template1.jpg', description: '缩略图路径', required: false })
  @IsOptional()
  @IsString({ message: '缩略图路径必须是字符串' })
  thumbnailPath?: string;

  @ApiProperty({ example: 1, description: '使用应用工作流：1-启用，0-禁用', required: false })
  @IsOptional()
  @IsNumber({}, { message: '状态必须是数字' })
  status?: number;

  @ApiProperty({ example: false, description: '是否需要AI补充文案', required: false })
  @IsOptional()
  @IsBoolean({ message: '是否需要AI补充文案必须是布尔值' })
  needAiContent?: boolean;
  
  @ApiProperty({ 
    example: ['https://example.com/bg1.jpg', 'https://example.com/bg2.jpg'], 
    description: '背景图片URL列表', 
    required: false 
  })
  @IsOptional()
  @IsArray({ message: '背景图片URL必须是数组' })
  @IsString({ each: true, message: '背景图片URL必须是字符串' })
  backgroundImages?: string[];
}

export class UpdateHtmlTemplateDto {
  @ApiProperty({ example: 1, description: '模板ID' })
  @IsNotEmpty({ message: '模板ID不能为空' })
  @IsNumber({}, { message: '模板ID必须是数字' })
  @Type(() => Number)
  id: number;

  @ApiProperty({ example: '商品详情页', description: '模板名称', required: false })
  @IsOptional()
  @IsString({ message: '模板名称必须是字符串' })
  name?: string;

  @ApiProperty({ example: '<div>更新后的HTML模板代码</div>', description: 'HTML代码', required: false })
  @IsOptional()
  @IsString({ message: 'HTML代码必须是字符串' })
  htmlCode?: string;

  @ApiProperty({ example: 3, description: '可替换的图片数量', required: false })
  @IsOptional()
  @IsNumber({}, { message: '可替换的图片数量必须是数字' })
  imageCount?: number;

  @ApiProperty({ 
    example: ['标题', '描述', '价格'], 
    description: '可替换的文本内容列表', 
    required: false 
  })
  @IsOptional()
  @IsArray({ message: '可替换文本必须是数组' })
  @IsString({ each: true, message: '文本项必须是字符串' })
  textDetails?: string[];

  @ApiProperty({ example: '/uploads/thumbnails/template1-new.jpg', description: '缩略图路径', required: false })
  @IsOptional()
  @IsString({ message: '缩略图路径必须是字符串' })
  thumbnailPath?: string;

  @ApiProperty({ example: 1, description: '使用应用工作流：1-启用，0-禁用', required: false })
  @IsOptional()
  @IsNumber({}, { message: '状态必须是数字' })
  status?: number;

  @ApiProperty({ example: false, description: '是否需要AI补充文案', required: false })
  @IsOptional()
  @IsBoolean({ message: '是否需要AI补充文案必须是布尔值' })
  needAiContent?: boolean;
  
  @ApiProperty({ 
    example: ['https://example.com/bg1.jpg', 'https://example.com/bg2.jpg'], 
    description: '背景图片URL列表', 
    required: false 
  })
  @IsOptional()
  @IsArray({ message: '背景图片URL必须是数组' })
  @IsString({ each: true, message: '背景图片URL必须是字符串' })
  backgroundImages?: string[];
}

export class QueryHtmlTemplateDto {
  @ApiProperty({ example: 1, description: '页码', required: false })
  @IsOptional()
  @IsNumber({}, { message: '页码必须是数字' })
  @Type(() => Number)
  page?: number;

  @ApiProperty({ example: 10, description: '每页条数', required: false })
  @IsOptional()
  @IsNumber({}, { message: '每页条数必须是数字' })
  @Type(() => Number)
  pageSize?: number;

  @ApiProperty({ example: '商品', description: '模板名称关键词', required: false })
  @IsOptional()
  @IsString({ message: '模板名称必须是字符串' })
  name?: string;

  @ApiProperty({ example: 1, description: '使用应用工作流：1-启用，0-禁用', required: false })
  @IsOptional()
  @IsNumber({}, { message: '状态必须是数字' })
  @Type(() => Number)
  status?: number;
}

export class DeleteHtmlTemplateDto {
  @ApiProperty({ example: 1, description: '模板ID' })
  @IsNotEmpty({ message: '模板ID不能为空' })
  @IsNumber({}, { message: '模板ID必须是数字' })
  @Type(() => Number)
  id: number;
} 