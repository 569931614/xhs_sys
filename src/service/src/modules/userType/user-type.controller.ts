import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUserTypeDto } from './dto/create-user-type.dto';
import { UpdateUserTypeDto } from './dto/update-user-type.dto';
import { UserTypeService } from './user-type.service';

@ApiTags('用户类型')
@Controller('system/user-type')
export class UserTypeController {
  constructor(private readonly userTypeService: UserTypeService) {}

  @Post()
  @ApiOperation({ summary: '创建用户类型' })
  async create(@Body() createUserTypeDto: CreateUserTypeDto) {
    const data = await this.userTypeService.create(createUserTypeDto);
    return {
      code: 200,
      message: '创建成功',
      data,
    };
  }

  @Get('list')
  @ApiOperation({ summary: '获取用户类型列表' })
  async findAll(@Query() query) {
    const data = await this.userTypeService.findAll(query);
    return {
      code: 200,
      message: '获取成功',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个用户类型' })
  async findOne(@Param('id') id: string) {
    const data = await this.userTypeService.findOne(+id);
    return {
      code: 200,
      message: '获取成功',
      data,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户类型' })
  async update(@Param('id') id: string, @Body() updateUserTypeDto: UpdateUserTypeDto) {
    const data = await this.userTypeService.update(+id, updateUserTypeDto);
    return {
      code: 200,
      message: '更新成功',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户类型' })
  async remove(@Param('id') id: string) {
    await this.userTypeService.remove(+id);
    return {
      code: 200,
      message: '删除成功',
    };
  }
} 