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
var ApiKeyGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ApiKeyGuard = ApiKeyGuard_1 = class ApiKeyGuard {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(ApiKeyGuard_1.name);
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const apiKey = this.extractApiKey(request);
        if (!apiKey) {
            this.logger.warn('API请求未提供认证密钥');
            throw new common_1.UnauthorizedException('访问此接口需要提供有效的API密钥');
        }
        const validApiKey = await this.getValidApiKey();
        if (!validApiKey) {
            this.logger.warn('系统未配置外部API认证密钥');
            throw new common_1.UnauthorizedException('系统未配置外部API认证密钥');
        }
        if (apiKey !== validApiKey) {
            this.logger.warn('无效的API密钥');
            throw new common_1.UnauthorizedException('无效的API密钥');
        }
        return true;
    }
    extractApiKey(request) {
        const apiKey = request.headers['x-api-key'];
        if (!apiKey && request.query && request.query.apiKey) {
            return request.query.apiKey;
        }
        return apiKey;
    }
    async getValidApiKey() {
        try {
            const systemConfig = await this.configService.get('system');
            return (systemConfig === null || systemConfig === void 0 ? void 0 : systemConfig.externalApiKey) || '';
        }
        catch (error) {
            this.logger.error('获取API密钥配置失败', error.stack);
            return '';
        }
    }
};
ApiKeyGuard = ApiKeyGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ApiKeyGuard);
exports.ApiKeyGuard = ApiKeyGuard;
