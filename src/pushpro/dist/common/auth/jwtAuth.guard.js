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
exports.JwtAuthGuard = void 0;
const globalConfig_service_1 = require("../../modules/globalConfig/globalConfig.service");
const redisCache_service_1 = require("../../modules/redisCache/redisCache.service");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const passport_1 = require("@nestjs/passport");
const jwt = require("jsonwebtoken");
const auth_service_1 = require("../../modules/auth/auth.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let JwtAuthGuard = class JwtAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    constructor(redisCacheService, moduleRef, globalConfigService, authService, reflector) {
        super();
        this.redisCacheService = redisCacheService;
        this.moduleRef = moduleRef;
        this.globalConfigService = globalConfigService;
        this.authService = authService;
        this.reflector = reflector;
        this.logger = new common_1.Logger('JwtAuthGuard');
    }
    async canActivate(context) {
        var _a;
        const request = context.switchToHttp().getRequest();
        const path = request.path || request.url;
        this.logger.debug(`处理请求路径: ${path}`);
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            this.logger.debug(`公开接口: ${path}, 允许访问`);
            return true;
        }
        if (!this.redisCacheService) {
            this.logger.debug('Redis缓存服务未初始化，尝试获取...');
            this.redisCacheService = this.moduleRef.get(redisCache_service_1.RedisCacheService, {
                strict: false,
            });
        }
        const domain = request.headers['x-website-domain'];
        this.logger.debug(`请求域名: ${domain || '未提供'}`);
        const token = this.extractToken(request);
        if (!token) {
            this.logger.warn(`认证失败: 未提供token - 路径: ${path}`);
            throw new common_1.HttpException('认证失败: 未提供token或格式错误', common_1.HttpStatus.UNAUTHORIZED);
        }
        this.logger.debug(`提取到token: ${token.substring(0, 10)}... 进行验证`);
        try {
            request.user = await this.validateToken(token);
            this.logger.debug(`Token验证成功，用户ID: ${(_a = request.user) === null || _a === void 0 ? void 0 : _a.id}`);
            await this.redisCacheService.checkTokenAuth(token, request);
            this.logger.debug(`Token授权检查通过`);
            return true;
        }
        catch (error) {
            this.logger.error(`Token验证或授权检查失败: ${error.message || error}`);
            throw error;
        }
    }
    extractToken(request) {
        if (!request.headers.authorization) {
            this.logger.debug('没有找到authorization头');
            if (request.headers.fingerprint) {
                this.logger.debug(`找到指纹识别: ${request.headers.fingerprint}`);
                let id = request.headers.fingerprint;
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
    async validateToken(token) {
        try {
            const secret = await this.redisCacheService.getJwtSecret();
            this.logger.debug('成功获取JWT密钥');
            const decoded = jwt.verify(token, secret);
            this.logger.debug(`JWT验证成功，用户: ${decoded.username}, ID: ${decoded.id}`);
            return decoded;
        }
        catch (error) {
            this.logger.error(`JWT验证失败: ${error.message}`);
            throw new common_1.HttpException('亲爱的用户,请登录后继续操作,我们正在等您的到来！', common_1.HttpStatus.UNAUTHORIZED);
        }
    }
    handleRequest(err, user, info) {
        if (err || !user) {
            this.logger.error(`认证处理错误: ${(err === null || err === void 0 ? void 0 : err.message) || '用户未授权'}`);
            if (info) {
                this.logger.error(`认证信息: ${JSON.stringify(info)}`);
            }
            throw err || new common_1.UnauthorizedException();
        }
        return user;
    }
};
JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redisCache_service_1.RedisCacheService,
        core_1.ModuleRef,
        globalConfig_service_1.GlobalConfigService,
        auth_service_1.AuthService,
        core_1.Reflector])
], JwtAuthGuard);
exports.JwtAuthGuard = JwtAuthGuard;
