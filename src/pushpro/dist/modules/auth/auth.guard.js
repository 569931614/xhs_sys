"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let AuthGuard = class AuthGuard {
    constructor(reflector) {
        this.reflector = reflector;
        this.logger = new common_1.Logger('AuthGuard');
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const path = request.path || request.url;
        this.logger.debug(`[全局守卫] 处理请求路径: ${path}`);
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            this.logger.debug(`[全局守卫] 公开接口: ${path}, 允许访问`);
            return true;
        }
        const authHeader = request.headers.authorization;
        if (path.startsWith('/file/') || path.includes('/assets/')) {
            this.logger.debug(`[全局守卫] 静态资源请求: ${path}, 允许访问`);
            return true;
        }
        if (!authHeader) {
            this.logger.warn(`[全局守卫] 没有找到authorization头，请求路径: ${path}`);
            if (path.startsWith('/api/') || path.startsWith('/xhs/')) {
                this.logger.debug(`[全局守卫] API请求未授权: ${path}`);
                return false;
            }
            if (request.headers.accept && request.headers.accept.includes('text/html')) {
                this.logger.debug(`[全局守卫] 浏览器请求未授权，重定向到登录页: ${path}`);
                response.writeHead(302, { Location: '/login' });
                response.end();
                return false;
            }
            return false;
        }
        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer' || !token) {
            this.logger.warn(`[全局守卫] 授权头格式错误: ${authHeader.substring(0, 15)}...`);
            return false;
        }
        this.logger.debug(`[全局守卫] 授权验证通过: ${path}`);
        return true;
    }
};
AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], AuthGuard);
exports.AuthGuard = AuthGuard;
