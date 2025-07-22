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
exports.ChannelLevelController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwtAuth_guard_1 = require("../../common/auth/jwtAuth.guard");
const channel_level_service_1 = require("./channel-level.service");
const channel_level_dto_1 = require("./dto/channel-level.dto");
let ChannelLevelController = class ChannelLevelController {
    constructor(channelLevelService) {
        this.channelLevelService = channelLevelService;
    }
    async create(createDto) {
        const result = await this.channelLevelService.create(createDto);
        return {
            code: 200,
            message: '创建成功',
            data: result,
            success: true,
        };
    }
    async update(id, updateDto) {
        const result = await this.channelLevelService.update(id, updateDto);
        return {
            code: 200,
            message: '更新成功',
            data: result,
            success: true,
        };
    }
    async findAll(query) {
        const result = await this.channelLevelService.findAll(query);
        return {
            code: 200,
            message: '查询成功',
            data: result,
            success: true,
        };
    }
    async findOne(id) {
        const result = await this.channelLevelService.findOne(id);
        return {
            code: 200,
            message: '查询成功',
            data: result,
            success: true,
        };
    }
    async remove(id) {
        await this.channelLevelService.remove(id);
        return {
            code: 200,
            message: '删除成功',
            success: true,
        };
    }
    async findAllActive() {
        const result = await this.channelLevelService.findAllActive();
        return {
            code: 200,
            message: '查询成功',
            data: result,
            success: true,
        };
    }
};
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '创建渠道等级' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [channel_level_dto_1.CreateChannelLevelDto]),
    __metadata("design:returntype", Promise)
], ChannelLevelController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '更新渠道等级' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, channel_level_dto_1.UpdateChannelLevelDto]),
    __metadata("design:returntype", Promise)
], ChannelLevelController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '查询渠道等级列表' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [channel_level_dto_1.ChannelLevelQueryDto]),
    __metadata("design:returntype", Promise)
], ChannelLevelController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '查询渠道等级详情' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ChannelLevelController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '删除渠道等级' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ChannelLevelController.prototype, "remove", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取所有可用渠道等级' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('list/active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChannelLevelController.prototype, "findAllActive", null);
ChannelLevelController = __decorate([
    (0, swagger_1.ApiTags)('渠道管理'),
    (0, common_1.Controller)('channel-level'),
    __metadata("design:paramtypes", [channel_level_service_1.ChannelLevelService])
], ChannelLevelController);
exports.ChannelLevelController = ChannelLevelController;
