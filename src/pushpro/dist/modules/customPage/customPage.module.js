"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomPageModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const customPage_controller_1 = require("./customPage.controller");
const customPage_service_1 = require("./customPage.service");
const customPage_entity_1 = require("./customPage.entity");
const redisCache_module_1 = require("../redisCache/redisCache.module");
const user_type_module_1 = require("../userType/user-type.module");
const user_module_1 = require("../user/user.module");
const user_type_auth_middleware_1 = require("./middlewares/user-type-auth.middleware");
let CustomPageModule = class CustomPageModule {
    configure(consumer) {
        consumer
            .apply(user_type_auth_middleware_1.UserTypeAuthMiddleware)
            .forRoutes('page/:path');
    }
};
CustomPageModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([customPage_entity_1.CustomPage]),
            redisCache_module_1.RedisCacheModule,
            user_type_module_1.UserTypeModule,
            user_module_1.UserModule,
        ],
        controllers: [customPage_controller_1.CustomPageController],
        providers: [customPage_service_1.CustomPageService],
        exports: [customPage_service_1.CustomPageService],
    })
], CustomPageModule);
exports.CustomPageModule = CustomPageModule;
