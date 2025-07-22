import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateTaskDto {
  @ApiProperty({ 
    example: '**--- 用户输入区 ---**\n1.  **`{{BRAND_PRODUCT}}`**: [{{string1}}]\n2.  **`{{TOPIC}}`**: [{{string2}}]', 
    description: '提示词模板，可以包含{{stringN}}格式的变量', 
    required: true 
  })
  @IsNotEmpty({ message: '提示词不能为空' })
  @IsString({ message: '提示词必须是字符串' })
  prompt: string;

  @ApiProperty({ 
    example: ['产品名称', '主题描述'], 
    description: '用于替换模板中{{stringN}}的变量值', 
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray({ message: '变量必须是数组' })
  variables?: string[];

  @ApiProperty({ 
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'], 
    description: '图片URL列表，可以是单个URL字符串或URL数组', 
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => {
    // 如果是字符串，转换为数组
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  image_url?: string | string[];
}

export class CreateTaskByTemplateDto {
  @ApiProperty({ 
    example: '小红书爆款模板', 
    description: '提示词模板名称，系统会根据名称从小红书工厂提示词模板库中获取对应的提示词和模型配置', 
    required: true 
  })
  @IsNotEmpty({ message: '提示词模板名称不能为空' })
  @IsString({ message: '提示词模板名称必须是字符串' })
  template_name: string;

  @ApiProperty({ 
    example: ['产品名称', '主题描述'], 
    description: '用于替换模板中{{stringN}}的变量值', 
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray({ message: '变量必须是数组' })
  variables?: string[];

  @ApiProperty({ 
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'], 
    description: '图片URL列表，可以是单个URL字符串或URL数组', 
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => {
    // 如果是字符串，转换为数组
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  image_url?: string | string[];
}

export class GetTaskResultDto {
  @ApiProperty({ example: '10', description: '请求超时时间(秒)', required: false })
  @IsOptional()
  @IsString()
  timeout?: string;

  @ApiProperty({ example: 'user123', description: '用户UUID', required: false })
  @IsOptional()
  @IsString()
  uuid?: string;

  @ApiProperty({ example: 'platform123', description: '平台ID', required: false })
  @IsOptional()
  @IsString()
  platform_id?: string;

  @ApiProperty({ example: 'feishu123', description: '飞书ID', required: false })
  @IsOptional()
  @IsString()
  feishu_id?: string;

  @ApiProperty({ example: 'bot123', description: '机器人ID', required: false })
  @IsOptional()
  @IsString()
  bot_id?: string;
}

/**
 * API请求选项DTO
 * 用于发送API请求时传递所需参数
 */
export class ApiRequestOptionsDto {
  @ApiProperty({ 
    description: '提示词', 
    required: true 
  })
  @IsNotEmpty({ message: '提示词不能为空' })
  @IsString({ message: '提示词必须是字符串' })
  prompt: string;

  @ApiProperty({ 
    description: '基础URL地址', 
    required: true,
    example: 'https://api.openai.com'
  })
  @IsNotEmpty({ message: '基础URL不能为空' })
  @IsString({ message: '基础URL必须是字符串' })
  baseUrl: string;

  @ApiProperty({ 
    description: 'API密钥', 
    required: true,
    example: 'sk-xxxx'
  })
  @IsNotEmpty({ message: 'API密钥不能为空' })
  @IsString({ message: 'API密钥必须是字符串' })
  apiKey: string;

  @ApiProperty({ 
    description: '模型名称', 
    required: true,
    example: 'gpt-4o-image'
  })
  @IsNotEmpty({ message: '模型名称不能为空' })
  @IsString({ message: '模型名称必须是字符串' })
  model: string;

  @ApiProperty({ 
    description: '请求方式',
    enum: ['stream', 'sync'],
    default: 'stream',
    required: false
  })
  @IsOptional()
  @IsEnum(['stream', 'sync'], { message: '请求方式必须是stream或sync' })
  requestMethod?: string;

  @ApiProperty({ 
    description: '请求类型',
    enum: ['chat', 'edit', 'image'],
    default: 'chat',
    required: false
  })
  @IsOptional()
  @IsEnum(['chat', 'edit', 'image'], { message: '请求类型必须是chat、edit或image' })
  requestType?: string;

  @ApiProperty({ 
    description: '图像比例(仅图像请求时有效)',
    example: '2:3',
    required: false
  })
  @IsOptional()
  @IsString({ message: '比例必须是字符串' })
  ratio?: string;

  @ApiProperty({ 
    description: '图片URL数组',
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray({ message: '图片URL必须是数组' })
  imageUrls?: string[];
  
  @ApiProperty({ 
    description: 'API请求预设值',
    required: false,
    type: 'object'
  })
  @IsOptional()
  presetValues?: any;
}