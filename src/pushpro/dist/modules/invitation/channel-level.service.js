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
var ChannelLevelService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelLevelService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const channel_level_entity_1 = require("./channel-level.entity");
let ChannelLevelService = ChannelLevelService_1 = class ChannelLevelService {
    constructor(channelLevelRepository) {
        this.channelLevelRepository = channelLevelRepository;
        this.logger = new common_1.Logger(ChannelLevelService_1.name);
        this.initDefaultChannelLevel();
    }
    async initDefaultChannelLevel() {
        try {
            const count = await this.channelLevelRepository.count();
            if (count === 0) {
                const defaultLevel = new channel_level_entity_1.ChannelLevel();
                defaultLevel.name = '普通代理';
                defaultLevel.commissionRate = 10;
                defaultLevel.order = 1;
                defaultLevel.remark = '默认渠道等级';
                defaultLevel.isActive = true;
                await this.channelLevelRepository.save(defaultLevel);
                this.logger.log('已创建默认渠道等级');
            }
        }
        catch (error) {
            this.logger.error(`初始化默认渠道等级失败: ${error.message}`, error.stack);
        }
    }
    async create(createDto) {
        try {
            const existing = await this.channelLevelRepository.findOne({ where: { name: createDto.name } });
            if (existing) {
                throw new common_1.HttpException('渠道等级名称已存在', common_1.HttpStatus.BAD_REQUEST);
            }
            const level = new channel_level_entity_1.ChannelLevel();
            level.name = createDto.name;
            level.commissionRate = createDto.commissionRate;
            level.order = createDto.order || 0;
            level.remark = createDto.remark;
            level.isActive = true;
            return this.channelLevelRepository.save(level);
        }
        catch (error) {
            this.logger.error(`创建渠道等级失败: ${error.message}`, error.stack);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('创建渠道等级失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async update(id, updateDto) {
        try {
            const level = await this.channelLevelRepository.findOne({ where: { id } });
            if (!level) {
                throw new common_1.HttpException('渠道等级不存在', common_1.HttpStatus.NOT_FOUND);
            }
            if (updateDto.name && updateDto.name !== level.name) {
                const existing = await this.channelLevelRepository.findOne({ where: { name: updateDto.name } });
                if (existing && existing.id !== id) {
                    throw new common_1.HttpException('渠道等级名称已存在', common_1.HttpStatus.BAD_REQUEST);
                }
            }
            Object.assign(level, updateDto);
            return this.channelLevelRepository.save(level);
        }
        catch (error) {
            this.logger.error(`更新渠道等级失败: ${error.message}`, error.stack);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('更新渠道等级失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findAll(query) {
        try {
            const { page = 1, size = 10, name, isActive } = query;
            const skip = (page - 1) * size;
            const where = {};
            if (name) {
                where.name = (0, typeorm_2.Like)(`%${name}%`);
            }
            if (isActive !== undefined) {
                where.isActive = isActive;
            }
            const [rows, count] = await this.channelLevelRepository.findAndCount({
                where,
                skip,
                take: size,
                order: { order: 'ASC' },
            });
            return { rows, count };
        }
        catch (error) {
            this.logger.error(`查询渠道等级失败: ${error.message}`, error.stack);
            throw new common_1.HttpException('查询渠道等级失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findOne(id) {
        try {
            const level = await this.channelLevelRepository.findOne({ where: { id } });
            if (!level) {
                throw new common_1.HttpException('渠道等级不存在', common_1.HttpStatus.NOT_FOUND);
            }
            return level;
        }
        catch (error) {
            this.logger.error(`查询渠道等级失败: ${error.message}`, error.stack);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('查询渠道等级失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async remove(id) {
        try {
            const level = await this.channelLevelRepository.findOne({ where: { id } });
            if (!level) {
                throw new common_1.HttpException('渠道等级不存在', common_1.HttpStatus.NOT_FOUND);
            }
            await this.channelLevelRepository.remove(level);
        }
        catch (error) {
            this.logger.error(`删除渠道等级失败: ${error.message}`, error.stack);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('删除渠道等级失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findAllActive() {
        try {
            return this.channelLevelRepository.find({
                where: { isActive: true },
                order: { order: 'ASC' },
            });
        }
        catch (error) {
            this.logger.error(`查询活跃渠道等级失败: ${error.message}`, error.stack);
            throw new common_1.HttpException('查询活跃渠道等级失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getCommissionRate(channelLevelId) {
        try {
            if (!channelLevelId) {
                return 10;
            }
            const level = await this.channelLevelRepository.findOne({ where: { id: channelLevelId } });
            if (!level || !level.isActive) {
                return 10;
            }
            return level.commissionRate;
        }
        catch (error) {
            this.logger.error(`获取返佣比例失败: ${error.message}`, error.stack);
            return 10;
        }
    }
};
ChannelLevelService = ChannelLevelService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(channel_level_entity_1.ChannelLevel)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ChannelLevelService);
exports.ChannelLevelService = ChannelLevelService;
