import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { HtmlRenderDto } from './htmllib-render.dto';

export class AsyncRenderResponseDto {
  @ApiProperty({ description: '异步任务ID' })
  taskId: string;

  @ApiProperty({ description: '任务状态', enum: ['pending', 'processing', 'completed', 'failed'] })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiProperty({ description: '任务创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '任务结果', required: false })
  result?: any;

  @ApiProperty({ description: '生成的HTML内容', required: false })
  htmlContent?: string;

  @ApiProperty({ description: '错误信息', required: false })
  errorMessage?: string;

  @ApiProperty({ description: '任务完成时间', required: false })
  completedAt?: Date;
}

export class TaskQueryDto {
  @ApiProperty({ description: '异步任务ID' })
  @IsString()
  @IsUUID()
  taskId: string;
}

export class AsyncRenderDto extends HtmlRenderDto {
  @ApiProperty({ description: '是否立即返回任务ID', default: true })
  @IsOptional()
  async?: boolean;
} 