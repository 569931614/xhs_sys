import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePromptTemplateDto {
  @ApiProperty({ example: 'xhs_title_gen', description: '提示词标识' })
  @IsNotEmpty({ message: '提示词标识不能为空' })
  @IsString({ message: '提示词标识必须是字符串' })
  identifier: string;

  @ApiProperty({ example: '请根据以下内容生成一个吸引人的小红书标题，字数在15字以内：{{content}}', description: '提示词内容' })
  @IsNotEmpty({ message: '提示词内容不能为空' })
  @IsString({ message: '提示词内容必须是字符串' })
  prompt: string;

  @ApiProperty({ example: 'gpt-3.5-turbo', description: '使用的模型名称' })
  @IsNotEmpty({ message: '模型名称不能为空' })
  @IsString({ message: '模型名称必须是字符串' })
  modelName: string;

  @ApiProperty({ example: 1, description: '模板状态：1-启用，0-禁用', default: 1 })
  @IsOptional()
  @IsNumber({}, { message: '状态必须是数字' })
  status?: number;

  @ApiProperty({ example: '你是一个专业的图像生成助手，需要严格按照我的要求生成图片', description: 'API请求预设值', required: false })
  @IsOptional()
  @IsString({ message: 'API请求预设值必须是字符串' })
  presetValues?: string;
}

export class UpdatePromptTemplateDto {
  @ApiProperty({ example: 1, description: '模板ID' })
  @IsNotEmpty({ message: '模板ID不能为空' })
  @IsNumber({}, { message: '模板ID必须是数字' })
  id: number;

  @ApiProperty({ example: 'xhs_title_gen', description: '提示词标识' })
  @IsOptional()
  @IsString({ message: '提示词标识必须是字符串' })
  identifier?: string;

  @ApiProperty({ example: '请根据以下内容生成一个吸引人的小红书标题，字数在15字以内：{{content}}', description: '提示词内容' })
  @IsOptional()
  @IsString({ message: '提示词内容必须是字符串' })
  prompt?: string;

  @ApiProperty({ example: 'gpt-3.5-turbo', description: '使用的模型名称' })
  @IsOptional()
  @IsString({ message: '模型名称必须是字符串' })
  modelName?: string;

  @ApiProperty({ example: 1, description: '模板状态：1-启用，0-禁用' })
  @IsOptional()
  @IsNumber({}, { message: '状态必须是数字' })
  status?: number;

  @ApiProperty({ example: '你是一个专业的图像生成助手，需要严格按照我的要求生成图片', description: 'API请求预设值', required: false })
  @IsOptional()
  @IsString({ message: 'API请求预设值必须是字符串' })
  presetValues?: string;
}

export class QueryPromptTemplateDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '页码必须是数字' })
  page?: number;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '每页数量必须是数字' })
  pageSize?: number;

  @ApiProperty({ description: '提示词标识', required: false })
  @IsOptional()
  @IsString({ message: '提示词标识必须是字符串' })
  identifier?: string;

  @ApiProperty({ description: '模型名称', required: false })
  @IsOptional()
  @IsString({ message: '模型名称必须是字符串' })
  modelName?: string;

  @ApiProperty({ description: '状态：1-启用，0-禁用', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '状态必须是数字' })
  status?: number;
}

export class DeletePromptTemplateDto {
  @ApiProperty({ example: 1, description: '模板ID' })
  @IsNotEmpty({ message: '模板ID不能为空' })
  @IsNumber({}, { message: '模板ID必须是数字' })
  id: number;
} 