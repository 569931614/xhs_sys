"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelCommissionModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const channelCommission_controller_1 = require("./channelCommission.controller");
const channelCommission_service_1 = require("./channelCommission.service");
const channelCommission_entity_1 = require("./channelCommission.entity");
const invitation_module_1 = require("../invitation/invitation.module");
const user_module_1 = require("../user/user.module");
let ChannelCommissionModule = class ChannelCommissionModule {
};
ChannelCommissionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([channelCommission_entity_1.ChannelCommissionEntity]),
            invitation_module_1.InvitationModule,
            user_module_1.UserModule,
        ],
        controllers: [channelCommission_controller_1.ChannelCommissionController],
        providers: [channelCommission_service_1.ChannelCommissionService],
        exports: [channelCommission_service_1.ChannelCommissionService],
    })
], ChannelCommissionModule);
exports.ChannelCommissionModule = ChannelCommissionModule;
