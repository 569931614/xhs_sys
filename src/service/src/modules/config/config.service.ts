import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigEntity } from '../globalConfig/config.entity';
import { RedisCacheService } from '../redisCache/redisCache.service';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);

  constructor(
    @InjectRepository(ConfigEntity)
    private readonly configRepo: Repository<ConfigEntity>,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  // 缓存键前缀
  private readonly CACHE_KEY_PREFIX = 'config:';
  // 缓存过期时间 1小时
  private readonly CACHE_EXPIRE_TIME = 3600;

  /**
   * 获取外部API密钥
   * @returns 外部API密钥
   */
  async getExternalApiKey(): Promise<string> {
    try {
      // 先从缓存中获取
      const cacheKey = `${this.CACHE_KEY_PREFIX}externalApiKey`;
      let apiKey = await this.redisCacheService.get(cacheKey);
      
      if (!apiKey) {
        // 如果缓存中没有，从数据库中获取
        const config = await this.configRepo.findOne({
          where: { configKey: 'externalApiKey' },
        });
        
        apiKey = config?.configVal || '';
        
        // 将获取到的密钥存入缓存
        if (apiKey) {
          await this.redisCacheService.set({
            key: cacheKey,
            val: apiKey,
            ttl: this.CACHE_EXPIRE_TIME
          });
        }
      }
      
      return apiKey;
    } catch (error) {
      this.logger.error(`获取外部API密钥失败: ${error.message}`, error.stack);
      return '';
    }
  }

  /**
   * 获取配置
   * @param key 配置键
   * @returns 配置值
   */
  async findConfigByKey(key: string) {
    // 先从缓存中获取
    const cacheKey = `${this.CACHE_KEY_PREFIX}${key}`;
    let cacheValue = await this.redisCacheService.get(cacheKey);
    
    if (cacheValue) {
      return { configKey: key, configVal: cacheValue };
    }
    
    // 如果缓存中没有，从数据库中获取
    const result = await this.configRepo.findOne({
      where: { configKey: key },
    });
    
    // 将结果存入缓存
    if (result) {
      await this.redisCacheService.set({
        key: cacheKey,
        val: result.configVal,
        ttl: this.CACHE_EXPIRE_TIME
      });
    }
    
    return result;
  }

  /**
   * 批量获取配置
   * @param keys 配置键数组
   * @returns 配置值对象
   */
  async findConfigsByKeys(keys: string[]) {
    const result = {};
    
    for (const key of keys) {
      const config = await this.findConfigByKey(key);
      if (config) {
        result[key] = config.configVal;
      }
    }
    
    return result;
  }

  /**
   * 获取系统配置
   * @returns 系统配置
   */
  async getSystemConfig() {
    const configs = await this.configRepo.find();
    const result = {};
    
    for (const config of configs) {
      result[config.configKey] = config.configVal;
    }
    
    return result;
  }

  /**
   * 设置配置
   * @param key 配置键
   * @param value 配置值
   */
  async setConfig(key: string, value: string) {
    const existConfig = await this.configRepo.findOne({
      where: { configKey: key },
    });
    
    if (existConfig) {
      existConfig.configVal = value;
      await this.configRepo.save(existConfig);
    } else {
      const newConfig = new ConfigEntity();
      newConfig.configKey = key;
      newConfig.configVal = value;
      await this.configRepo.save(newConfig);
    }
    
    // 更新缓存
    const cacheKey = `${this.CACHE_KEY_PREFIX}${key}`;
    await this.redisCacheService.set({
      key: cacheKey,
      val: value,
      ttl: this.CACHE_EXPIRE_TIME
    });
  }

  /**
   * 删除配置
   * @param key 配置键
   */
  async deleteConfig(key: string) {
    const existConfig = await this.configRepo.findOne({
      where: { configKey: key },
    });
    
    if (existConfig) {
      await this.configRepo.remove(existConfig);
      
      // 删除缓存
      const cacheKey = `${this.CACHE_KEY_PREFIX}${key}`;
      await this.redisCacheService.del(cacheKey);
    }
  }
} 