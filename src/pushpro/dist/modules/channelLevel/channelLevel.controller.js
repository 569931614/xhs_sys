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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelLevelController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const channelLevel_service_1 = require("./channelLevel.service");
let ChannelLevelController = class ChannelLevelController {
    constructor(channelLevelService) {
        this.channelLevelService = channelLevelService;
    }
    async getAllLevels() {
        return await this.channelLevelService.getAllLevels();
    }
};
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取所有渠道等级' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取渠道等级列表' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChannelLevelController.prototype, "getAllLevels", null);
ChannelLevelController = __decorate([
    (0, swagger_1.ApiTags)('渠道等级'),
    (0, common_1.Controller)('channel-level'),
    __metadata("design:paramtypes", [channelLevel_service_1.ChannelLevelService])
], ChannelLevelController);
exports.ChannelLevelController = ChannelLevelController;
