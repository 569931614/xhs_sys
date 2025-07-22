"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const invitation_entity_1 = require("./invitation.entity");
const invitation_service_1 = require("./invitation.service");
const invitation_controller_1 = require("./invitation.controller");
const user_entity_1 = require("../user/user.entity");
const channelLevel_entity_1 = require("../channelLevel/channelLevel.entity");
const channelCommission_entity_1 = require("../channelCommission/channelCommission.entity");
const user_module_1 = require("../user/user.module");
const channel_level_service_1 = require("./channel-level.service");
const channel_level_entity_1 = require("./channel-level.entity");
const globalConfig_module_1 = require("../globalConfig/globalConfig.module");
let InvitationModule = class InvitationModule {
};
InvitationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                invitation_entity_1.InvitationEntity,
                user_entity_1.UserEntity,
                channelLevel_entity_1.ChannelLevelEntity,
                channelCommission_entity_1.ChannelCommissionEntity,
                channel_level_entity_1.ChannelLevel
            ]),
            (0, common_1.forwardRef)(() => user_module_1.UserModule),
            (0, common_1.forwardRef)(() => globalConfig_module_1.GlobalConfigModule),
        ],
        controllers: [invitation_controller_1.InvitationController],
        providers: [invitation_service_1.InvitationService, channel_level_service_1.ChannelLevelService],
        exports: [invitation_service_1.InvitationService],
    })
], InvitationModule);
exports.InvitationModule = InvitationModule;
