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
var ConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_entity_1 = require("../globalConfig/config.entity");
const redisCache_service_1 = require("../redisCache/redisCache.service");
let ConfigService = ConfigService_1 = class ConfigService {
    constructor(configRepo, redisCacheService) {
        this.configRepo = configRepo;
        this.redisCacheService = redisCacheService;
        this.logger = new common_1.Logger(ConfigService_1.name);
        this.CACHE_KEY_PREFIX = 'config:';
        this.CACHE_EXPIRE_TIME = 3600;
    }
    async getExternalApiKey() {
        try {
            const cacheKey = `${this.CACHE_KEY_PREFIX}externalApiKey`;
            let apiKey = await this.redisCacheService.get(cacheKey);
            if (!apiKey) {
                const config = await this.configRepo.findOne({
                    where: { configKey: 'externalApiKey' },
                });
                apiKey = (config === null || config === void 0 ? void 0 : config.configVal) || '';
                if (apiKey) {
                    await this.redisCacheService.set({
                        key: cacheKey,
                        val: apiKey,
                        ttl: this.CACHE_EXPIRE_TIME
                    });
                }
            }
            return apiKey;
        }
        catch (error) {
            this.logger.error(`获取外部API密钥失败: ${error.message}`, error.stack);
            return '';
        }
    }
    async findConfigByKey(key) {
        const cacheKey = `${this.CACHE_KEY_PREFIX}${key}`;
        let cacheValue = await this.redisCacheService.get(cacheKey);
        if (cacheValue) {
            return { configKey: key, configVal: cacheValue };
        }
        const result = await this.configRepo.findOne({
            where: { configKey: key },
        });
        if (result) {
            await this.redisCacheService.set({
                key: cacheKey,
                val: result.configVal,
                ttl: this.CACHE_EXPIRE_TIME
            });
        }
        return result;
    }
    async findConfigsByKeys(keys) {
        const result = {};
        for (const key of keys) {
            const config = await this.findConfigByKey(key);
            if (config) {
                result[key] = config.configVal;
            }
        }
        return result;
    }
    async getSystemConfig() {
        const configs = await this.configRepo.find();
        const result = {};
        for (const config of configs) {
            result[config.configKey] = config.configVal;
        }
        return result;
    }
    async setConfig(key, value) {
        const existConfig = await this.configRepo.findOne({
            where: { configKey: key },
        });
        if (existConfig) {
            existConfig.configVal = value;
            await this.configRepo.save(existConfig);
        }
        else {
            const newConfig = new config_entity_1.ConfigEntity();
            newConfig.configKey = key;
            newConfig.configVal = value;
            await this.configRepo.save(newConfig);
        }
        const cacheKey = `${this.CACHE_KEY_PREFIX}${key}`;
        await this.redisCacheService.set({
            key: cacheKey,
            val: value,
            ttl: this.CACHE_EXPIRE_TIME
        });
    }
    async deleteConfig(key) {
        const existConfig = await this.configRepo.findOne({
            where: { configKey: key },
        });
        if (existConfig) {
            await this.configRepo.remove(existConfig);
            const cacheKey = `${this.CACHE_KEY_PREFIX}${key}`;
            await this.redisCacheService.del(cacheKey);
        }
    }
};
ConfigService = ConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(config_entity_1.ConfigEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        redisCache_service_1.RedisCacheService])
], ConfigService);
exports.ConfigService = ConfigService;
