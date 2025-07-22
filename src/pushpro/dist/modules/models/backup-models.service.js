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
var BackupModelsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupModelsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const backup_models_entity_1 = require("./backup-models.entity");
const redisCache_service_1 = require("../redisCache/redisCache.service");
let BackupModelsService = BackupModelsService_1 = class BackupModelsService {
    constructor(backupModelsRepository, redisCacheService) {
        this.backupModelsRepository = backupModelsRepository;
        this.redisCacheService = redisCacheService;
        this.logger = new common_1.Logger(BackupModelsService_1.name);
        this.CACHE_KEY_PREFIX = 'backup_models:';
    }
    async findAll(page = 1, pageSize = 10) {
        const [items, total] = await this.backupModelsRepository.findAndCount({
            order: { createdAt: 'DESC' },
            take: pageSize,
            skip: (page - 1) * pageSize,
        });
        return {
            items,
            total,
        };
    }
    async findOne(id) {
        const model = await this.backupModelsRepository.findOne({
            where: { id },
        });
        if (!model) {
            throw new common_1.HttpException('备用模型不存在', common_1.HttpStatus.BAD_REQUEST);
        }
        return model;
    }
    async create(createDto) {
        const existModel = await this.backupModelsRepository.findOne({
            where: { name: createDto.name },
        });
        if (existModel) {
            throw new common_1.HttpException('该模型名称已存在', common_1.HttpStatus.BAD_REQUEST);
        }
        const newModel = this.backupModelsRepository.create(createDto);
        const result = await this.backupModelsRepository.save(newModel);
        await this.clearModelTypeCache(createDto.modelType);
        this.logger.log(`创建备用模型成功，已清除类型 ${createDto.modelType} 的缓存`);
        return result;
    }
    async update(updateDto) {
        const { id } = updateDto;
        const existModel = await this.backupModelsRepository.findOne({
            where: { id },
        });
        if (!existModel) {
            throw new common_1.HttpException('备用模型不存在', common_1.HttpStatus.BAD_REQUEST);
        }
        const nameExists = await this.backupModelsRepository.findOne({
            where: {
                name: updateDto.name,
                id: (0, typeorm_2.Not)(id)
            },
        });
        if (nameExists) {
            throw new common_1.HttpException('该模型名称已存在', common_1.HttpStatus.BAD_REQUEST);
        }
        const originalType = existModel.modelType;
        Object.assign(existModel, updateDto);
        const result = await this.backupModelsRepository.save(existModel);
        await this.clearModelTypeCache(originalType);
        if (updateDto.modelType && originalType !== updateDto.modelType) {
            await this.clearModelTypeCache(updateDto.modelType);
            this.logger.log(`更新备用模型时类型发生变化，清除原类型 ${originalType} 和新类型 ${updateDto.modelType} 的缓存`);
        }
        else {
            this.logger.log(`更新备用模型成功，清除类型 ${originalType} 的缓存`);
        }
        return result;
    }
    async updateStatus(updateStatusDto) {
        const { id, status } = updateStatusDto;
        const model = await this.backupModelsRepository.findOne({
            where: { id },
        });
        if (!model) {
            throw new common_1.HttpException('备用模型不存在', common_1.HttpStatus.BAD_REQUEST);
        }
        model.status = status;
        const result = await this.backupModelsRepository.save(model);
        await this.clearModelTypeCache(model.modelType);
        this.logger.log(`更新备用模型状态成功，清除类型 ${model.modelType} 的缓存`);
        return result;
    }
    async delete(deleteDto) {
        const { id } = deleteDto;
        const model = await this.backupModelsRepository.findOne({
            where: { id },
        });
        if (!model) {
            throw new common_1.HttpException('备用模型不存在', common_1.HttpStatus.BAD_REQUEST);
        }
        const modelType = model.modelType;
        const result = await this.backupModelsRepository.remove(model);
        await this.clearModelTypeCache(modelType);
        this.logger.log(`删除备用模型成功，清除类型 ${modelType} 的缓存`);
        return result;
    }
    async findByType(modelType) {
        const cacheKey = `${this.CACHE_KEY_PREFIX}type:${modelType}`;
        try {
            const cachedModels = await this.redisCacheService.get({ key: cacheKey });
            if (cachedModels) {
                this.logger.log(`从缓存获取到类型 ${modelType} 的备用模型`);
                return JSON.parse(cachedModels);
            }
        }
        catch (error) {
            this.logger.warn(`获取缓存失败: ${error.message}`);
        }
        const models = await this.backupModelsRepository.find({
            where: { modelType, status: 1 },
            order: { priority: 'ASC', createdAt: 'DESC' },
        });
        if (models && models.length > 0) {
            try {
                await this.redisCacheService.set({ key: cacheKey, val: JSON.stringify(models) }, 3600);
                this.logger.log(`类型 ${modelType} 的备用模型已缓存，有效期1小时`);
            }
            catch (error) {
                this.logger.warn(`缓存备用模型失败: ${error.message}`);
            }
        }
        return models;
    }
    async findByTypeWithoutPriority(modelType) {
        const cacheKey = `${this.CACHE_KEY_PREFIX}type:${modelType}:no_priority`;
        try {
            const cachedModels = await this.redisCacheService.get({ key: cacheKey });
            if (cachedModels) {
                this.logger.log(`从缓存获取到类型 ${modelType} 的备用模型（不使用priority排序）`);
                return JSON.parse(cachedModels);
            }
        }
        catch (error) {
            this.logger.warn(`获取缓存失败: ${error.message}`);
        }
        const models = await this.backupModelsRepository.find({
            where: { modelType, status: 1 },
            order: { createdAt: 'DESC' },
        });
        if (models && models.length > 0) {
            try {
                await this.redisCacheService.set({ key: cacheKey, val: JSON.stringify(models) }, 3600);
                this.logger.log(`类型 ${modelType} 的备用模型已缓存（不使用priority排序），有效期1小时`);
            }
            catch (error) {
                this.logger.warn(`缓存备用模型失败: ${error.message}`);
            }
        }
        return models;
    }
    async search(keyword, page = 1, pageSize = 10) {
        const [items, total] = await this.backupModelsRepository.findAndCount({
            where: [
                { name: (0, typeorm_2.Like)(`%${keyword}%`) },
                { baseUrl: (0, typeorm_2.Like)(`%${keyword}%`) },
            ],
            order: { createdAt: 'DESC' },
            take: pageSize,
            skip: (page - 1) * pageSize,
        });
        return {
            items,
            total,
        };
    }
    async clearModelTypeCache(modelType) {
        if (!modelType)
            return;
        const cacheKey = `${this.CACHE_KEY_PREFIX}type:${modelType}`;
        try {
            await this.redisCacheService.del({ key: cacheKey });
            this.logger.log(`已清除类型 ${modelType} 的备用模型缓存`);
        }
        catch (error) {
            this.logger.error(`清除缓存失败: ${error.message}`);
        }
    }
};
BackupModelsService = BackupModelsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(backup_models_entity_1.BackupModelsEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        redisCache_service_1.RedisCacheService])
], BackupModelsService);
exports.BackupModelsService = BackupModelsService;
