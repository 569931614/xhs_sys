import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TextReplacementItem } from './dto/htmllib-render.dto';

export class RenderTemplateToImageDto {
  @ApiProperty({ example: 'pic_4_1', description: '模板名称' })
  @IsNotEmpty({ message: '模板名称不能为空' })
  @IsString({ message: '模板名称必须是字符串' })
  templateName: string;

  @ApiProperty({ 
    example: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'], 
    description: '替换图片的URL数组', 
    required: false 
  })
  @IsOptional()
  @IsArray({ message: '图片数组必须是数组' })
  @IsString({ each: true, message: '图片URL必须是字符串' })
  imageUrls?: string[];

  @ApiProperty({ 
    type: [TextReplacementItem],
    example: [
      { placeholder: '可替换文本1', replaceWith: '是一个非常好用的产品' },
      { placeholder: '可替换文本2', replaceWith: '值得购买' }
    ], 
    description: '文本替换对照表', 
    required: false 
  })
  @IsOptional()
  @IsArray({ message: '文本替换对照表必须是数组' })
  @ValidateNested({ each: true })
  @Type(() => TextReplacementItem)
  textReplacements?: TextReplacementItem[];

  @ApiProperty({ 
    example: false, 
    description: '是否通过元素ID进行文本替换，当为true时，placeholder将被视为元素ID', 
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: 'useId必须是布尔值' })
  useId?: boolean;

  @ApiProperty({ example: 1200, description: '图片宽度（像素）', required: false })
  @IsOptional()
  @IsNumber({}, { message: '宽度必须是数字' })
  width?: number;

  @ApiProperty({ example: 0, description: '图片高度（像素），0表示自动计算', required: false })
  @IsOptional()
  @IsNumber({}, { message: '高度必须是数字' })
  height?: number;

  @ApiProperty({ example: 90, description: '图片质量(1-100)', required: false })
  @IsOptional()
  @IsNumber({}, { message: '质量必须是数字' })
  quality?: number;

  @ApiProperty({ example: 'png', description: '图片类型', enum: ['jpeg', 'png'], required: false })
  @IsOptional()
  @IsEnum(['jpeg', 'png'], { message: '图片类型必须是jpeg或png' })
  type?: 'jpeg' | 'png';

  @ApiProperty({ example: '.main-content', description: '选择器，用于指定转换HTML中的特定元素', required: false })
  @IsOptional()
  @IsString({ message: '选择器必须是字符串' })
  selector?: string;

  @ApiProperty({ example: false, description: '是否使用AI生成内容', required: false })
  @IsOptional()
  @IsBoolean({ message: 'generateAiContent必须是布尔值' })
  generateAiContent?: boolean;

  @ApiProperty({ example: '这是一段用于生成HTML内容的提示文本', description: '额外的内容，将与HTML模板代码结合作为提示词', required: false })
  @IsOptional()
  @IsString({ message: 'content必须是字符串' })
  content?: string;

  @ApiProperty({ example: true, description: '是否上传到Super图床', required: false })
  @IsOptional()
  @IsBoolean({ message: 'uploadToSuperbed必须是布尔值' })
  uploadToSuperbed?: boolean;

  @ApiProperty({ example: true, description: '是否自动检测HTML宽度', required: false })
  @IsOptional()
  @IsBoolean({ message: 'useAutoWidth必须是布尔值' })
  useAutoWidth?: boolean;
} 