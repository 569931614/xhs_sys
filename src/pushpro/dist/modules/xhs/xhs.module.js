"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XhsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const xhs_entity_1 = require("./xhs.entity");
const xhs_service_1 = require("./xhs.service");
const xhs_controller_1 = require("./xhs.controller");
const xhs_auto_controller_1 = require("./xhs-auto.controller");
const xhs_auto_service_1 = require("./xhs-auto.service");
const xhs_activity_entity_1 = require("./xhs-activity.entity");
const xhs_activity_post_entity_1 = require("./xhs-activity-post.entity");
const xhs_activity_service_1 = require("./xhs-activity.service");
const xhs_activity_controller_1 = require("./xhs-activity.controller");
const xhs_product_factory_controller_1 = require("./xhs-product-factory.controller");
const xhs_product_factory_service_1 = require("./xhs-product-factory.service");
const xhs_product_factory_entity_1 = require("./xhs-product-factory.entity");
const id_generator_service_1 = require("./id-generator.service");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const coze_module_1 = require("../coze/coze.module");
const xhs_signature_entity_1 = require("./xhs-signature.entity");
const pointConsumptionRule_module_1 = require("../pointConsumptionRule/pointConsumptionRule.module");
const userBalance_module_1 = require("../userBalance/userBalance.module");
const globalConfig_module_1 = require("../globalConfig/globalConfig.module");
const material_module_1 = require("../material/material.module");
const redisCache_module_1 = require("../redisCache/redisCache.module");
const ai_api_module_1 = require("../ai/ai_api.module");
const note_entity_1 = require("../xiaohongshu/note.entity");
const xiaohongshu_module_1 = require("../xiaohongshu/xiaohongshu.module");
const htmllib_module_1 = require("../htmllib/htmllib.module");
const upload_module_1 = require("../upload/upload.module");
let XhsModule = class XhsModule {
};
XhsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                xhs_entity_1.XhsPost,
                xhs_activity_entity_1.XhsActivity,
                xhs_activity_post_entity_1.XhsActivityPost,
                xhs_product_factory_entity_1.XhsProductFactory,
                xhs_signature_entity_1.XhsSignature,
                note_entity_1.Note
            ]),
            config_1.ConfigModule,
            schedule_1.ScheduleModule.forRoot(),
            coze_module_1.CozeModule,
            pointConsumptionRule_module_1.PointConsumptionRuleModule,
            userBalance_module_1.UserBalanceModule,
            globalConfig_module_1.GlobalConfigModule,
            material_module_1.MaterialModule,
            redisCache_module_1.RedisCacheModule,
            ai_api_module_1.AiApiModule,
            upload_module_1.UploadModule,
            (0, common_1.forwardRef)(() => xiaohongshu_module_1.XiaohongshuModule),
            (0, common_1.forwardRef)(() => htmllib_module_1.HtmlLibModule)
        ],
        controllers: [
            xhs_controller_1.XhsController,
            xhs_auto_controller_1.XhsAutoController,
            xhs_activity_controller_1.XhsActivityController,
            xhs_product_factory_controller_1.XhsProductFactoryController
        ],
        providers: [
            xhs_service_1.XhsService,
            xhs_auto_service_1.XhsAutoService,
            xhs_activity_service_1.XhsActivityService,
            xhs_product_factory_service_1.XhsProductFactoryService,
            id_generator_service_1.IdGeneratorService
        ],
        exports: [
            xhs_service_1.XhsService,
            xhs_auto_service_1.XhsAutoService,
            xhs_activity_service_1.XhsActivityService,
            xhs_product_factory_service_1.XhsProductFactoryService,
            id_generator_service_1.IdGeneratorService
        ],
    })
], XhsModule);
exports.XhsModule = XhsModule;
