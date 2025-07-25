import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested, ArrayMinSize, IsBoolean, IsNumber, IsEnum, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class TextReplacementItem {
  @ApiProperty({ example: '可替换文本1', description: '模板中需要替换的原始文本' })
  @IsNotEmpty({ message: '占位符不能为空' })
  @IsString({ message: '占位符必须是字符串' })
  placeholder: string;

  @ApiProperty({ example: '这是一个非常好用的产品', description: '要替换成的内容' })
  @IsNotEmpty({ message: '替换内容不能为空' })
  @IsString({ message: '替换内容必须是字符串' })
  replaceWith: string;

  @ApiProperty({ example: false, description: '是否使用正则表达式匹配', required: false })
  @IsOptional()
  @IsBoolean({ message: 'useRegex必须是布尔值' })
  useRegex?: boolean;
}

export class ImageOptions {
  @ApiProperty({ example: 1024, description: '图片宽度（像素）', required: false })
  @IsOptional()
  @IsNumber({}, { message: '宽度必须是数字' })
  width?: number;

  @ApiProperty({ example: 0, description: '图片高度（像素），0表示自动计算', required: false })
  @IsOptional()
  @IsNumber({}, { message: '高度必须是数字' })
  height?: number;

  @ApiProperty({ example: 80, description: '图片质量(1-100)', required: false })
  @IsOptional()
  @IsNumber({}, { message: '质量必须是数字' })
  quality?: number;

  @ApiProperty({ example: 'png', description: '图片类型', enum: ['jpeg', 'png'], required: false })
  @IsOptional()
  @IsEnum(['jpeg', 'png'], { message: '图片类型必须是jpeg或png' })
  type?: 'jpeg' | 'png';

  @ApiProperty({ example: true, description: '是否上传到Super图床', required: false, default: true })
  @IsOptional()
  @IsBoolean({ message: 'uploadToSuperbed必须是布尔值' })
  uploadToSuperbed?: boolean;
}

export class HtmlRenderDto {
  @ApiProperty({ example: '商品详情页', description: '模板名称，如未提供则随机选择一个模板', required: false })
  @IsOptional()
  @IsString({ message: '模板名称必须是字符串' })
  templateName?: string;

  @ApiProperty({ 
    example: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'], 
    description: '替换图片的URL数组，按照顺序替换模板中的图片', 
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
    description: '文本替换对照表，直接指定模板中的文本及其替换内容', 
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
  
  @ApiProperty({ 
    example: false, 
    description: '是否包装HTML为完整页面，包含head和body标签等', 
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean({ message: 'wrapHtml必须是布尔值' })
  wrapHtml?: boolean;
  
  @ApiProperty({ 
    example: false, 
    description: '是否直接返回原始HTML内容（不包装为JSON）', 
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: 'rawHtml必须是布尔值' })
  rawHtml?: boolean;
  
  @ApiProperty({ 
    example: false, 
    description: '是否返回JSON格式但使用手动序列化HTML（避免转义）', 
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: 'rawJsonHtml必须是布尔值' })
  rawJsonHtml?: boolean;
  
  @ApiProperty({ 
    example: true, 
    description: '是否清理输出中的转义字符', 
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean({ message: 'cleanOutput必须是布尔值' })
  cleanOutput?: boolean;
  
  @ApiProperty({ 
    example: true, 
    description: '是否使用紧凑格式输出HTML（移除换行和多余空格）', 
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean({ message: 'compactOutput必须是布尔值' })
  compactOutput?: boolean;
  
  @ApiProperty({ 
    example: false, 
    description: '是否使用纯文本模式返回HTML（完全避免JSON序列化）', 
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: 'textMode必须是布尔值' })
  textMode?: boolean;
  
  @ApiProperty({
    example: false,
    description: '是否使用AI生成内容（忽略模板设置）',
    required: false
  })
  @IsOptional()
  @IsBoolean({ message: 'generateAiContent必须是布尔值' })
  generateAiContent?: boolean;
  
  @ApiProperty({
    example: "这是一段用于生成HTML内容的提示文本",
    description: '额外的内容，将与HTML模板代码结合作为提示词',
    required: false
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    example: false,
    description: '是否将HTML转换为图片并返回图片URL',
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: 'convertToImage必须是布尔值' })
  convertToImage?: boolean;

  @ApiProperty({
    type: ImageOptions,
    description: '图片转换选项，当convertToImage=true时使用',
    required: false
  })
  @IsOptional()
  @IsObject({ message: 'imageOptions必须是对象' })
  @ValidateNested()
  @Type(() => ImageOptions)
  imageOptions?: ImageOptions;
}

export class SvgToImageDto {
  @ApiProperty({
    example: '<svg width="100" height="100"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" /></svg>',
    description: 'SVG内容字符串'
  })
  @IsNotEmpty({ message: 'SVG内容不能为空' })
  @IsString({ message: 'SVG内容必须是字符串' })
  svgContent: string;

  @ApiProperty({ example: 800, description: '输出图片宽度（像素）', required: false })
  @IsOptional()
  @IsNumber({}, { message: '宽度必须是数字' })
  width?: number;

  @ApiProperty({ example: 600, description: '输出图片高度（像素）', required: false })
  @IsOptional()
  @IsNumber({}, { message: '高度必须是数字' })
  height?: number;

  @ApiProperty({ example: 80, description: '图片质量(1-100)', required: false })
  @IsOptional()
  @IsNumber({}, { message: '质量必须是数字' })
  quality?: number;

  @ApiProperty({ example: 'png', description: '图片类型', enum: ['jpeg', 'png'], required: false })
  @IsOptional()
  @IsEnum(['jpeg', 'png'], { message: '图片类型必须是jpeg或png' })
  type?: 'jpeg' | 'png';

  @ApiProperty({ example: true, description: '是否上传到Super图床', required: false, default: true })
  @IsOptional()
  @IsBoolean({ message: 'uploadToSuperbed必须是布尔值' })
  uploadToSuperbed?: boolean;

  @ApiProperty({ example: 2, description: '设备像素比，用于高清显示', required: false, default: 1 })
  @IsOptional()
  @IsNumber({}, { message: '设备像素比必须是数字' })
  devicePixelRatio?: number;
}