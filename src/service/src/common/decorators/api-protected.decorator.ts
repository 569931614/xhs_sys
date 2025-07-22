import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { ApiKeyGuard } from '../auth/api.guard';

// API保护元数据键
export const API_PROTECTED_KEY = 'api_protected';

/**
 * API保护装饰器
 * 用于标记需要API密钥认证的API端点
 * @param description API操作描述
 */
export function ApiProtected(description?: string) {
  return applyDecorators(
    SetMetadata(API_PROTECTED_KEY, true),
    UseGuards(ApiKeyGuard),
    ApiOperation({
      summary: description || '需要API密钥认证的端点',
    }),
    ApiHeader({
      name: 'x-api-key',
      description: 'API认证密钥',
      required: true,
    }),
    ApiQuery({
      name: 'apiKey',
      description: 'API认证密钥(如果请求头中未提供)',
      required: false,
      type: String,
    }),
  );
} 