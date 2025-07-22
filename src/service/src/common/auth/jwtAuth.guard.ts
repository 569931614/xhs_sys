import { GlobalConfigService } from '@/modules/globalConfig/globalConfig.service';
import { RedisCacheService } from '@/modules/redisCache/redisCache.service';
import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import * as jwt from 'jsonwebtoken';

import { AuthService } from '../../modules/auth/auth.service';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

// 定义JWT解码后的用户数据结构
interface JwtUser {
  username: string;
  id: number;
  email?: string;
  role?: string;
  openId?: string;
  client?: string;
  phone?: string;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger('JwtAuthGuard');

  constructor(
    private redisCacheService: RedisCacheService,
    private readonly moduleRef: ModuleRef,
    private readonly globalConfigService: GlobalConfigService,
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const path = request.path || request.url;
    this.logger.debug(`处理请求路径: ${path}`);
    
    // 检查是否是公开接口
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // 如果是公开接口，直接放行
    if (isPublic) {
      this.logger.debug(`公开接口: ${path}, 允许访问`);
      return true;
    }
    
    if (!this.redisCacheService) {
      this.logger.debug('Redis缓存服务未初始化，尝试获取...');
      this.redisCacheService = this.moduleRef.get(RedisCacheService, {
        strict: false,
      });
    }
    
    // TODO 域名检测
    const domain = request.headers['x-website-domain'];
    this.logger.debug(`请求域名: ${domain || '未提供'}`);
    
    const token = this.extractToken(request);
    if (!token) {
      this.logger.warn(`认证失败: 未提供token - 路径: ${path}`);
      throw new HttpException(
        '认证失败: 未提供token或格式错误',
        HttpStatus.UNAUTHORIZED
      );
    }
    this.logger.debug(`提取到token: ${token.substring(0, 10)}... 进行验证`);
    
    try {
      request.user = await this.validateToken(token);
      this.logger.debug(`Token验证成功，用户ID: ${request.user?.id}`);
      
      await this.redisCacheService.checkTokenAuth(token, request);
      this.logger.debug(`Token授权检查通过`);
      
      return true;
    } catch (error) {
      this.logger.error(`Token验证或授权检查失败: ${error.message || error}`);
      throw error;
    }
  }

  private extractToken(request): string | null {
    if (!request.headers.authorization) {
      this.logger.debug('没有找到authorization头');
      if (request.headers.fingerprint) {
        this.logger.debug(`找到指纹识别: ${request.headers.fingerprint}`);
        let id = request.headers.fingerprint;
        /* 超过mysql最大值进行截取 */
        if (id > 2147483647) {
          id = id.toString().slice(-9);
          id = Number(String(Number(id)));
          this.logger.debug(`调整后的指纹ID: ${id}`);
        }
        const token = this.authService.createTokenFromFingerprint(id);
        this.logger.debug(`从指纹创建token成功`);
        return token;
      }
      return null;
    }
    const parts = request.headers.authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      this.logger.debug(`Authorization格式错误: ${request.headers.authorization}`);
      return null;
    }
    return parts[1];
  }

  private async validateToken(token: string): Promise<JwtUser> {
    try {
      const secret = await this.redisCacheService.getJwtSecret();
      this.logger.debug('成功获取JWT密钥');
      const decoded = jwt.verify(token, secret) as JwtUser;
      this.logger.debug(`JWT验证成功，用户: ${decoded.username}, ID: ${decoded.id}`);
      return decoded;
    } catch (error) {
      this.logger.error(`JWT验证失败: ${error.message}`);
      throw new HttpException(
        '亲爱的用户,请登录后继续操作,我们正在等您的到来！',
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      this.logger.error(`认证处理错误: ${err?.message || '用户未授权'}`);
      if (info) {
        this.logger.error(`认证信息: ${JSON.stringify(info)}`);
      }
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
