import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBackupModelDto {
  @ApiProperty({ description: '模型名称' })
  @IsNotEmpty({ message: '模型名称不能为空' })
  @IsString()
  name: string;

  @ApiProperty({ description: '请求地址' })
  @IsNotEmpty({ message: '请求地址不能为空' })
  @IsString()
  baseUrl: string;

  @ApiProperty({ description: 'API Key' })
  @IsNotEmpty({ message: 'API Key不能为空' })
  @IsString()
  apiKey: string;

  @ApiProperty({ description: '模型类型', enum: ['text', 'image', 'video'], default: 'text' })
  @IsNotEmpty({ message: '模型类型不能为空' })
  @IsEnum(['text', 'image', 'video'], { message: '模型类型不正确' })
  modelType: string;

  @ApiProperty({ description: '使用的模型', default: 'gpt-4o-image' })
  @IsOptional()
  @IsString()
  model: string;

  @ApiProperty({ description: '状态：0-禁用, 1-启用', default: 1 })
  @IsOptional()
  @IsNumber()
  status: number;

  @ApiProperty({ description: '优先级：数字越小优先级越高', default: 10 })
  @IsOptional()
  @IsNumber()
  priority: number;

  @ApiProperty({ description: '请求方式', enum: ['stream', 'sync'], default: 'stream' })
  @IsOptional()
  @IsEnum(['stream', 'sync'], { message: '请求方式不正确' })
  requestMethod: string;

  @ApiProperty({ description: '请求类型', enum: ['chat', 'edit', 'image'], default: 'chat' })
  @IsOptional()
  @IsEnum(['chat', 'edit', 'image'], { message: '请求类型不正确' })
  requestType: string;
}

export class UpdateBackupModelDto extends CreateBackupModelDto {
  @ApiProperty({ description: '模型ID' })
  @IsNotEmpty({ message: '模型ID不能为空' })
  @IsNumber()
  id: number;
}

export class UpdateBackupModelStatusDto {
  @ApiProperty({ description: '模型ID' })
  @IsNotEmpty({ message: '模型ID不能为空' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '状态：0-禁用, 1-启用' })
  @IsNotEmpty({ message: '状态不能为空' })
  @IsNumber()
  status: number;
}

export class DeleteBackupModelDto {
  @ApiProperty({ description: '模型ID' })
  @IsNotEmpty({ message: '模型ID不能为空' })
  @IsNumber()
  id: number;
} 