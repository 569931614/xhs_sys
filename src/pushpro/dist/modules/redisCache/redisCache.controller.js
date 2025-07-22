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
exports.RedisCacheController = void 0;
const redis_dto_1 = require("./dto/redis.dto");
const redisCache_service_1 = require("./redisCache.service");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwtAuth_guard_1 = require("../../common/auth/jwtAuth.guard");
const role_decorator_1 = require("../../common/decorator/role.decorator");
let RedisCacheController = class RedisCacheController {
    constructor(redisCacheService) {
        this.redisCacheService = redisCacheService;
    }
    set(body) {
        return this.redisCacheService.set(body);
    }
    get(body) {
        return this.redisCacheService.get(body);
    }
    async getCreativeToken() {
        const token = await this.redisCacheService.getCreativeAuthToken();
        return {
            code: 200,
            data: token,
            message: '获取创客API授权令牌成功'
        };
    }
    async setCreativeToken(body) {
        await this.redisCacheService.setCreativeAuthToken(body.token);
        return {
            code: 200,
            data: null,
            message: '设置创客API授权令牌成功'
        };
    }
};
__decorate([
    (0, common_1.Post)('set'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, role_decorator_1.RequiresRoles)(['super', 'admin']),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '设置Redis值' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [redis_dto_1.RedisDto]),
    __metadata("design:returntype", void 0)
], RedisCacheController.prototype, "set", null);
__decorate([
    (0, common_1.Get)('get'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, role_decorator_1.RequiresRoles)(['super', 'admin']),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '获取Redis值' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [redis_dto_1.RedisDto]),
    __metadata("design:returntype", void 0)
], RedisCacheController.prototype, "get", null);
__decorate([
    (0, common_1.Get)('getCreativeToken'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, role_decorator_1.RequiresRoles)(['super', 'admin']),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '获取创客API授权令牌' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取令牌', type: String }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RedisCacheController.prototype, "getCreativeToken", null);
__decorate([
    (0, common_1.Post)('setCreativeToken'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, role_decorator_1.RequiresRoles)(['super', 'admin']),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '设置创客API授权令牌' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功设置令牌' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisCacheController.prototype, "setCreativeToken", null);
RedisCacheController = __decorate([
    (0, swagger_1.ApiTags)('Redis缓存'),
    (0, common_1.Controller)('redisCache'),
    __metadata("design:paramtypes", [redisCache_service_1.RedisCacheService])
], RedisCacheController);
exports.RedisCacheController = RedisCacheController;
