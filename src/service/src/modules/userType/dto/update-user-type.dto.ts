import { IsNotEmpty, IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserTypeDto {
  @IsOptional()
  @IsString({ message: '类型名称必须是字符串' })
  @Length(1, 50, { message: '类型名称长度在1-50之间' })
  name?: string;

  @IsOptional()
  @IsString({ message: '类型描述必须是字符串' })
  @Length(0, 200, { message: '类型描述长度不能超过200' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: '状态必须是数字' })
  status?: number;
} 