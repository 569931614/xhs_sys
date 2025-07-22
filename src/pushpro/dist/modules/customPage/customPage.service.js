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
exports.CustomPageService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customPage_entity_1 = require("./customPage.entity");
const redisCache_service_1 = require("../redisCache/redisCache.service");
let CustomPageService = class CustomPageService {
    constructor(customPageRepository, redisCacheService) {
        this.customPageRepository = customPageRepository;
        this.redisCacheService = redisCacheService;
        this.CACHE_KEY_ENABLED_PAGES = 'custom_page:enabled_pages';
        this.CACHE_EXPIRE_TIME = 60 * 60;
    }
    async create(createCustomPageDto) {
        const customPage = this.customPageRepository.create(createCustomPageDto);
        const result = await this.customPageRepository.save(customPage);
        await this.invalidateCache();
        return result;
    }
    async update(id, updateCustomPageDto) {
        await this.customPageRepository.update(id, updateCustomPageDto);
        await this.invalidateCache();
        return this.findById(id);
    }
    async remove(id) {
        await this.customPageRepository.delete(id);
        await this.invalidateCache();
    }
    async findAll(query) {
        const page = query.page || 1;
        const size = query.size || 10;
        const skip = (page - 1) * size;
        const queryBuilder = this.customPageRepository.createQueryBuilder('customPage');
        if (query.title) {
            queryBuilder.where('customPage.title LIKE :title', { title: `%${query.title}%` });
        }
        queryBuilder.skip(skip).take(size)
            .orderBy('customPage.order', 'ASC')
            .addOrderBy('customPage.createTime', 'DESC');
        const [list, total] = await queryBuilder.getManyAndCount();
        return { list, total };
    }
    async findById(id) {
        return this.customPageRepository.findOne({ where: { id } });
    }
    async findByPath(path) {
        return this.customPageRepository.findOne({ where: { path } });
    }
    async getEnabledPages() {
        try {
            const cachedData = await this.redisCacheService.get({ key: this.CACHE_KEY_ENABLED_PAGES });
            if (cachedData) {
                return JSON.parse(cachedData);
            }
        }
        catch (error) {
            console.error('Redis缓存获取失败', error);
        }
        const pages = await this.customPageRepository.find({
            where: { status: 1 },
            order: { order: 'ASC', createTime: 'DESC' },
        });
        try {
            await this.redisCacheService.set({ key: this.CACHE_KEY_ENABLED_PAGES, val: JSON.stringify(pages) }, this.CACHE_EXPIRE_TIME);
        }
        catch (error) {
            console.error('Redis缓存设置失败', error);
        }
        return pages;
    }
    async invalidateCache() {
        try {
            await this.redisCacheService.del({ key: this.CACHE_KEY_ENABLED_PAGES });
        }
        catch (error) {
            console.error('Redis缓存清除失败', error);
        }
    }
};
CustomPageService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customPage_entity_1.CustomPage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        redisCache_service_1.RedisCacheService])
], CustomPageService);
exports.CustomPageService = CustomPageService;
