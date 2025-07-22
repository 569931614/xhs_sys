import { RedisDto } from './dto/redis.dto';
import { RedisCacheService } from './redisCache.service';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwtAuth.guard';
import { RequiresRoles } from '../../common/decorator/role.decorator';

@ApiTags('Redis缓存')
@Controller('redisCache')
export class RedisCacheController {
  constructor(private readonly redisCacheService: RedisCacheService) {}

  @Post('set')
  @UseGuards(JwtAuthGuard)
  @RequiresRoles(['super', 'admin'])
  @ApiBearerAuth()
  @ApiOperation({ summary: '设置Redis值' })
  set(@Body() body: RedisDto) {
    return this.redisCacheService.set(body);
  }

  @Get('get')
  @UseGuards(JwtAuthGuard)
  @RequiresRoles(['super', 'admin'])
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取Redis值' })
  get(@Query() body: RedisDto) {
    return this.redisCacheService.get(body);
  }

  @Get('getCreativeToken')
  @UseGuards(JwtAuthGuard)
  @RequiresRoles(['super', 'admin'])
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取创客API授权令牌' })
  @ApiResponse({ status: 200, description: '成功获取令牌', type: String })
  async getCreativeToken() {
    const token = await this.redisCacheService.getCreativeAuthToken();
    return {
      code: 200,
      data: token,
      message: '获取创客API授权令牌成功'
    };
  }

  @Post('setCreativeToken')
  @UseGuards(JwtAuthGuard)
  @RequiresRoles(['super', 'admin'])
  @ApiBearerAuth()
  @ApiOperation({ summary: '设置创客API授权令牌' })
  @ApiResponse({ status: 200, description: '成功设置令牌' })
  async setCreativeToken(@Body() body: { token: string }) {
    await this.redisCacheService.setCreativeAuthToken(body.token);
    return {
      code: 200,
      data: null,
      message: '设置创客API授权令牌成功'
    };
  }
}
