import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCustomPageDto {
  @ApiProperty({ description: '页面标题', example: '我的页面' })
  @IsNotEmpty({ message: '页面标题不能为空' })
  @IsString()
  title: string;

  @ApiProperty({ description: '页面路径', example: 'https://www.example.com 或 /mypage' })
  @IsNotEmpty({ message: '页面路径不能为空' })
  @IsString()
  path: string;

  @ApiProperty({ description: '页面类型（0: 外部链接, 1: 内部页面）', example: 0 })
  @IsOptional()
  @IsNumber()
  type?: number;

  @ApiProperty({ description: '页面图标', example: 'icon-park:page' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ description: '描述信息', example: '这是一个自定义页面' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '排序值', example: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({ description: '状态(0: 禁用, 1: 启用)', example: 1 })
  @IsOptional()
  @IsNumber()
  status?: number;

  @ApiProperty({ description: '允许访问的用户类型ID数组', example: [1, 2], required: false })
  @IsOptional()
  @IsArray()
  userTypes?: number[];
}

export class UpdateCustomPageDto extends CreateCustomPageDto {
  @ApiProperty({ description: 'ID', example: 1 })
  @IsOptional()
  @IsNumber()
  id?: number;
}

export class CustomPageListDto {
  @ApiProperty({ description: '当前页数', example: 1 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number;

  @ApiProperty({ description: '每页数量', example: 10 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  size?: number;

  @ApiProperty({ description: '页面标题搜索', example: '首页' })
  @IsOptional()
  @IsString()
  title?: string;
}

export class CustomPageDetailDto {
  @ApiProperty({ description: 'ID', example: 1 })
  @IsNotEmpty({ message: 'ID不能为空' })
  @IsNumber()
  id: number;
} 