import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CustomPageService } from '../customPage.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class UserTypeAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly customPageService: CustomPageService,
    private readonly userService: UserService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const { path } = req.params;
      
      // 通过路径获取自定义页面信息
      const customPage = await this.customPageService.findByPath(path);
      
      // 如果自定义页面被禁用，则拒绝访问
      if (customPage.status === 0) {
        throw new HttpException('页面已禁用', HttpStatus.FORBIDDEN);
      }
      
      // 如果没有设置用户类型限制(userTypes为null或空数组)，则所有用户都可访问
      if (!customPage.userTypes || customPage.userTypes.length === 0) {
        return next();
      }
      
      // 获取当前用户信息
      // 如果请求中包含用户信息（已登录用户）
      if (req.user && req.user.id) {
        const user = await this.userService.getUserById(req.user.id);
        
        // 如果用户不存在，则拒绝访问
        if (!user) {
          throw new HttpException('用户不存在', HttpStatus.UNAUTHORIZED);
        }
        
        // 如果用户类型包含在允许访问列表中，则允许访问
        if (user.userType && customPage.userTypes.includes(user.userType)) {
          return next();
        }
      }
      
      // 如果以上条件都不满足，则拒绝访问
      throw new HttpException('没有权限访问该页面', HttpStatus.FORBIDDEN);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('页面访问出错', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 