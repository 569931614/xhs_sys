import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CozeCreateDto {
  @ApiProperty({ description: 'Coze Workflow ID' })
  @IsNotEmpty({ message: 'Workflow ID不能为空' })
  @IsString()
  workflowId: string;

  @ApiProperty({ description: '名称描述' })
  @IsNotEmpty({ message: '名称不能为空' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Coze 公钥' })
  @IsNotEmpty({ message: '公钥不能为空' })
  @IsString()
  publicKey: string;

  @ApiProperty({ description: 'Coze 私钥' })
  @IsNotEmpty({ message: '私钥不能为空' })
  @IsString()
  secretKey: string;

  @ApiProperty({ description: '客户端ID' })
  @IsNotEmpty({ message: '客户端ID不能为空' })
  @IsString()
  clientId: string;

  @ApiProperty({ description: '空间ID' })
  @IsNotEmpty({ message: '空间ID不能为空' })
  @IsString()
  spaceId: string;
}

export class CozeUpdateDto {
  @ApiProperty({ description: 'Coze Workflow ID' })
  @IsOptional()
  @IsString()
  workflowId?: string;

  @ApiProperty({ description: '名称描述' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Coze 公钥' })
  @IsOptional()
  @IsString()
  publicKey?: string;

  @ApiProperty({ description: 'Coze 私钥' })
  @IsOptional()
  @IsString()
  secretKey?: string;

  @ApiProperty({ description: '客户端ID' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ description: '空间ID' })
  @IsOptional()
  @IsString()
  spaceId?: string;

  @ApiProperty({ description: '状态', enum: [0, 1] })
  @IsOptional()
  status?: number;
}

export class CozeListDto {
  @ApiProperty({ description: '页码', default: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ description: '每页数量', default: 10 })
  @IsOptional()
  size?: number;
}

export class CozeChatDto {
  @ApiProperty({ description: 'Coze Workflow ID' })
  @IsNotEmpty({ message: 'Workflow ID不能为空' })
  @IsString()
  workflowId: string;

  @ApiProperty({ description: '消息内容' })
  @IsNotEmpty({ message: '消息内容不能为空' })
  @IsString()
  message: string;

  @ApiProperty({ description: '会话ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;
} 