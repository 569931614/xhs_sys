import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger('AuthGuard');

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取请求对象
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const path = request.path || request.url;
    
    this.logger.debug(`[全局守卫] 处理请求路径: ${path}`);
    
    // 检查是否是公开接口
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // 如果是公开接口，直接放行
    if (isPublic) {
      this.logger.debug(`[全局守卫] 公开接口: ${path}, 允许访问`);
      return true;
    }

    // 检查请求头中是否包含Authorization
    const authHeader = request.headers.authorization;
    
    // 检查请求是否来自服务静态文件路径，如果是则放行
    if (path.startsWith('/file/') || path.includes('/assets/')) {
      this.logger.debug(`[全局守卫] 静态资源请求: ${path}, 允许访问`);
      return true;
    }
    
    if (!authHeader) {
      this.logger.warn(`[全局守卫] 没有找到authorization头，请求路径: ${path}`);
      
      // 检查是否是API请求，API请求应该返回401，而不是重定向
      if (path.startsWith('/api/') || path.startsWith('/xhs/')) {
        this.logger.debug(`[全局守卫] API请求未授权: ${path}`);
        return false;
      }
      
      // 检查如果是浏览器直接访问的页面请求，执行重定向到登录页
      if (request.headers.accept && request.headers.accept.includes('text/html')) {
        this.logger.debug(`[全局守卫] 浏览器请求未授权，重定向到登录页: ${path}`);
        response.writeHead(302, { Location: '/login' });
        response.end();
        return false;
      }
      
      return false;
    }

    // 验证token格式
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      this.logger.warn(`[全局守卫] 授权头格式错误: ${authHeader.substring(0, 15)}...`);
      return false;
    }

    this.logger.debug(`[全局守卫] 授权验证通过: ${path}`);
    return true;
  }
} 