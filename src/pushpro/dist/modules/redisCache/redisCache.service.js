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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheService = void 0;
const common_1 = require("@nestjs/common");
let RedisCacheService = class RedisCacheService {
    constructor(redisClient) {
        this.redisClient = redisClient;
        this.logger = new common_1.Logger('RedisCacheService');
    }
    async get(body) {
        const { key } = body;
        this.logger.debug(`获取Redis键: ${key}`);
        const res = await this.redisClient.get(key);
        return await this.redisClient.get(key);
    }
    async set(body, time) {
        try {
            const { key, val } = body;
            this.logger.debug(`设置Redis键: ${key}, 值长度: ${(val === null || val === void 0 ? void 0 : val.length) || 0}`);
            await this.redisClient.set(key, val);
            if (time) {
                this.logger.debug(`设置键 ${key} 过期时间: ${time}秒`);
                await this.redisClient.expire(key, time);
            }
            return;
        }
        catch (error) {
            this.logger.error(`设置Redis键失败: ${error.message}`);
            throw new common_1.HttpException(error, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getJwtSecret() {
        this.logger.debug('尝试从Redis获取JWT密钥');
        const secret = await this.redisClient.get('JWT_SECRET');
        if (!secret) {
            this.logger.error('JWT密钥未在Redis中找到');
            throw new Error('JWT secret not found in Redis');
        }
        this.logger.debug('成功获取JWT密钥');
        return secret;
    }
    async ttl(key) {
        return await this.redisClient.ttl(key);
    }
    async del(body) {
        const { key } = body;
        this.logger.debug(`删除Redis键: ${key}`);
        await this.redisClient.del(key);
        return;
    }
    async saveToken(userId, token) {
        this.logger.debug(`保存用户 ${userId} 的令牌`);
        const tokens = await this.redisClient.zRange(`tokens:${userId}`, 0, -1);
        if (tokens.length > 0) {
            this.logger.debug(`用户 ${userId} 已有 ${tokens.length} 个令牌，将进行失效处理`);
            await this.invalidateTokens(userId, tokens);
        }
        this.logger.debug(`将令牌保存到 token:${userId}`);
        await this.redisClient.set(`token:${userId}`, token);
        this.logger.debug(`令牌保存成功`);
    }
    async invalidateTokens(userId, tokens) {
        this.logger.debug(`开始使 ${tokens.length} 个旧令牌失效，用户ID: ${userId}`);
        for (const token of tokens) {
            this.logger.debug(`使令牌失效: token:${userId}:${token.substring(0, 10)}...`);
            await this.redisClient.del(`token:${userId}:${token}`);
        }
        this.logger.debug(`所有旧令牌已失效`);
    }
    async checkTokenAuth(token, req) {
        const { id: userId, role } = req.user;
        this.logger.debug(`检查令牌授权，用户ID: ${userId}, 角色: ${role}`);
        if (role === 'visitor') {
            this.logger.debug(`访客角色，无需验证令牌，直接放行`);
            return true;
        }
        const storedToken = await this.redisClient.get(`token:${userId}`);
        this.logger.debug(`从Redis获取的令牌: ${storedToken ? (storedToken.substring(0, 10) + '...') : 'null'}`);
        this.logger.debug(`当前请求的令牌: ${token ? (token.substring(0, 10) + '...') : 'null'}`);
        if (storedToken === null) {
            this.logger.debug(`首次设置令牌: token:${userId}`);
            await this.redisClient.set(`token:${userId}`, token);
            return true;
        }
        if (storedToken !== token) {
            this.logger.warn(`令牌不匹配，用户ID: ${userId}, 角色: ${role}`);
            if (['super', 'admin'].includes(role)) {
                this.logger.debug(`管理员角色 ${role}，白名单免检，允许访问`);
                return true;
            }
            this.logger.error(`令牌验证失败，检测到多设备登录，用户ID: ${userId}`);
            throw new common_1.HttpException('您已在其他设备覆盖登录、请您重新登录！', common_1.HttpStatus.UNAUTHORIZED);
        }
        this.logger.debug(`令牌验证成功，用户ID: ${userId}`);
        return true;
    }
    async getCreativeAuthToken() {
        this.logger.debug('尝试从Redis获取创客API授权令牌');
        const token = await this.redisClient.get('CREATIVE_AUTH_TOKEN');
        if (!token) {
            this.logger.debug('创客API令牌未在Redis中找到，使用默认值');
            const defaultToken = 'ZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKemRXSWlPaUo3WENKemRHRnRjRndpT2pFM05EZzVNamMyTmpJek5qQXNYQ0owWlhKdGFXNWhiRndpT2pBc1hDSjFjMlZ5U1dSY0lqb3lOREl3T1RjeU5YMGlMQ0pwWVhRaU9qRTNORGc1TWpjMk5qSXNJbVY0Y0NJNk1UYzFNVFV4T1RZMk1uMC5QbDNTakRzdkUyeUF3YTFTNDh1NG5ocTF4MHliRlYzb2lySDAteGE4bUFr';
            await this.set({
                key: 'CREATIVE_AUTH_TOKEN',
                val: defaultToken
            });
            return defaultToken;
        }
        this.logger.debug('成功获取创客API授权令牌');
        return token;
    }
    async setCreativeAuthToken(token) {
        this.logger.debug('设置创客API授权令牌');
        await this.set({
            key: 'CREATIVE_AUTH_TOKEN',
            val: token
        });
        this.logger.debug('创客API授权令牌设置成功');
    }
};
RedisCacheService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [Object])
], RedisCacheService);
exports.RedisCacheService = RedisCacheService;
