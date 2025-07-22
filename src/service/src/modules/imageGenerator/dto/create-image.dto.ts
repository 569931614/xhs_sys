import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateImageDto {
  @ApiProperty({ description: '主标题内容', example: '0基础小白如何做自媒体' })
  @IsNotEmpty({ message: '主标题不能为空' })
  @IsString()
  title: string;

  @ApiProperty({ description: '智能ID', example: 267 })
  @IsNumber()
  intellectId: number;

  @ApiProperty({ description: '请求ID', example: '用户ID_智能ID_时间戳' })
  @IsOptional()
  @IsString()
  requestId?: string;
  
  @ApiProperty({ description: '当前页码，用于继续生成功能', example: 1 })
  @IsOptional()
  @IsNumber()
  pageNo?: number;
  
  @ApiProperty({ description: '前一次任务的ID，用于继续生成功能', example: 12345 })
  @IsOptional()
  @IsNumber()
  previousTaskId?: number;
  
  @ApiProperty({ 
    description: '额外字段，用于不同模式的额外输入', 
    example: { 
      subtitle: '副标题', 
      paragraph1Title: '段落1标题',
      paragraph1Content: '段落1内容' 
    },
    required: false
  })
  @IsOptional()
  additionalFields?: Record<string, string>;
} 