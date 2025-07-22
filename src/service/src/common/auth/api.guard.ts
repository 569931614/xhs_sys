import { Injectable, CanActivate, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);
  
  constructor(private configService: ConfigService) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);
    
    if (!apiKey) {
      this.logger.warn('API请求未提供认证密钥');
      throw new UnauthorizedException('访问此接口需要提供有效的API密钥');
    }
    
    // 从全局配置中获取外部API认证密钥
    const validApiKey = await this.getValidApiKey();
    
    if (!validApiKey) {
      this.logger.warn('系统未配置外部API认证密钥');
      throw new UnauthorizedException('系统未配置外部API认证密钥');
    }
    
    if (apiKey !== validApiKey) {
      this.logger.warn('无效的API密钥');
      throw new UnauthorizedException('无效的API密钥');
    }
    
    return true;
  }
  
  private extractApiKey(request: Request): string | undefined {
    // 尝试从请求头中提取API密钥
    const apiKey = request.headers['x-api-key'] as string;
    
    // 如果请求头中没有API密钥，尝试从查询参数中提取
    if (!apiKey && request.query && request.query.apiKey) {
      return request.query.apiKey as string;
    }
    
    return apiKey;
  }
  
  private async getValidApiKey(): Promise<string> {
    try {
      // 从配置服务中获取API密钥
      const systemConfig = await this.configService.get('system');
      return systemConfig?.externalApiKey || '';
    } catch (error) {
      this.logger.error('获取API密钥配置失败', error.stack);
      return '';
    }
  }
} 