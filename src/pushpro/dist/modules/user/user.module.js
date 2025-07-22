"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const chatGroup_entity_1 = require("../chatGroup/chatGroup.entity");
const chatLog_entity_1 = require("../chatLog/chatLog.entity");
const cramiPackage_entity_1 = require("../crami/cramiPackage.entity");
const config_entity_1 = require("../globalConfig/config.entity");
const redisCache_service_1 = require("../redisCache/redisCache.service");
const accountLog_entity_1 = require("../userBalance/accountLog.entity");
const balance_entity_1 = require("../userBalance/balance.entity");
const fingerprint_entity_1 = require("../userBalance/fingerprint.entity");
const userBalance_entity_1 = require("../userBalance/userBalance.entity");
const verifycation_entity_1 = require("../verification/verifycation.entity");
const user_controller_1 = require("./user.controller");
const user_entity_1 = require("./user.entity");
const user_service_1 = require("./user.service");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const invitation_entity_1 = require("../invitation/invitation.entity");
const invitation_module_1 = require("../invitation/invitation.module");
const verification_module_1 = require("../verification/verification.module");
const globalConfig_module_1 = require("../globalConfig/globalConfig.module");
const userBalance_module_1 = require("../userBalance/userBalance.module");
const mailer_module_1 = require("../mailer/mailer.module");
const verification_service_1 = require("../verification/verification.service");
let UserModule = class UserModule {
};
UserModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.UserEntity,
                verifycation_entity_1.VerifycationEntity,
                balance_entity_1.BalanceEntity,
                accountLog_entity_1.AccountLogEntity,
                config_entity_1.ConfigEntity,
                cramiPackage_entity_1.CramiPackageEntity,
                userBalance_entity_1.UserBalanceEntity,
                fingerprint_entity_1.FingerprintLogEntity,
                chatLog_entity_1.ChatLogEntity,
                chatGroup_entity_1.ChatGroupEntity,
                invitation_entity_1.InvitationEntity
            ]),
            config_1.ConfigModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'ai-plus',
                signOptions: { expiresIn: '24h' },
            }),
            (0, common_1.forwardRef)(() => verification_module_1.VerificationModule),
            (0, common_1.forwardRef)(() => globalConfig_module_1.GlobalConfigModule),
            (0, common_1.forwardRef)(() => userBalance_module_1.UserBalanceModule),
            (0, common_1.forwardRef)(() => mailer_module_1.MailerModule),
            (0, common_1.forwardRef)(() => invitation_module_1.InvitationModule),
        ],
        controllers: [user_controller_1.UserController],
        providers: [
            user_service_1.UserService,
            verification_service_1.VerificationService,
            redisCache_service_1.RedisCacheService,
        ],
        exports: [user_service_1.UserService, typeorm_1.TypeOrmModule],
    })
], UserModule);
exports.UserModule = UserModule;
