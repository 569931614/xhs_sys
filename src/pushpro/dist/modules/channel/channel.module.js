"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const invitation_entity_1 = require("../invitation/invitation.entity");
const invitation_controller_1 = require("../invitation/invitation.controller");
const invitation_service_1 = require("../invitation/invitation.service");
const channelLevel_entity_1 = require("../channelLevel/channelLevel.entity");
const channelLevel_controller_1 = require("../channelLevel/channelLevel.controller");
const channelLevel_service_1 = require("../channelLevel/channelLevel.service");
const channelCommission_entity_1 = require("../channelCommission/channelCommission.entity");
const channelCommission_controller_1 = require("../channelCommission/channelCommission.controller");
const channelCommission_service_1 = require("../channelCommission/channelCommission.service");
let ChannelModule = class ChannelModule {
};
ChannelModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                invitation_entity_1.InvitationEntity,
                channelLevel_entity_1.ChannelLevelEntity,
                channelCommission_entity_1.ChannelCommissionEntity
            ]),
        ],
        controllers: [
            invitation_controller_1.InvitationController,
            channelLevel_controller_1.ChannelLevelController,
            channelCommission_controller_1.ChannelCommissionController
        ],
        providers: [
            invitation_service_1.InvitationService,
            channelLevel_service_1.ChannelLevelService,
            channelCommission_service_1.ChannelCommissionService
        ],
        exports: [
            invitation_service_1.InvitationService,
            channelLevel_service_1.ChannelLevelService,
            channelCommission_service_1.ChannelCommissionService
        ],
    })
], ChannelModule);
exports.ChannelModule = ChannelModule;
