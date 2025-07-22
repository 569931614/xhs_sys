"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XhsProductFactoryModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const xhs_product_factory_controller_1 = require("./xhs-product-factory.controller");
const xhs_product_factory_service_1 = require("./xhs-product-factory.service");
const xhs_activity_entity_1 = require("./xhs-activity.entity");
const xhs_product_factory_entity_1 = require("./xhs-product-factory.entity");
const coze_service_1 = require("../coze/coze.service");
const userBalance_module_1 = require("../userBalance/userBalance.module");
let XhsProductFactoryModule = class XhsProductFactoryModule {
};
XhsProductFactoryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([xhs_activity_entity_1.XhsActivity, xhs_product_factory_entity_1.XhsProductFactory]),
            userBalance_module_1.UserBalanceModule,
        ],
        controllers: [xhs_product_factory_controller_1.XhsProductFactoryController],
        providers: [xhs_product_factory_service_1.XhsProductFactoryService, coze_service_1.CozeService],
        exports: [xhs_product_factory_service_1.XhsProductFactoryService],
    })
], XhsProductFactoryModule);
exports.XhsProductFactoryModule = XhsProductFactoryModule;
