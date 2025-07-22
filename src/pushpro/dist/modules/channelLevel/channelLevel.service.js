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
exports.ChannelLevelService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const channelLevel_entity_1 = require("./channelLevel.entity");
let ChannelLevelService = class ChannelLevelService {
    constructor(channelLevelRepository) {
        this.channelLevelRepository = channelLevelRepository;
    }
    async getAllLevels() {
        return this.channelLevelRepository.find({
            where: { status: 1 },
            order: { level: 'ASC' },
        });
    }
    async getLevelById(id) {
        return this.channelLevelRepository.findOne({
            where: { id, status: 1 },
        });
    }
    async getLevelByLevel(level) {
        return this.channelLevelRepository.findOne({
            where: { level, status: 1 },
        });
    }
    async calculateCommissionRatio(userLevel, commissionLevel) {
        const levelConfig = await this.getLevelByLevel(userLevel);
        if (!levelConfig) {
            return 0;
        }
        switch (commissionLevel) {
            case 1:
                return levelConfig.levelOneRatio;
            case 2:
                return levelConfig.levelTwoRatio;
            case 3:
                return levelConfig.levelThreeRatio;
            default:
                return 0;
        }
    }
};
ChannelLevelService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(channelLevel_entity_1.ChannelLevelEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ChannelLevelService);
exports.ChannelLevelService = ChannelLevelService;
