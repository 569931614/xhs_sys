"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiApiModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ai_api_controller_1 = require("./ai_api.controller");
const ai_api_service_1 = require("./ai_api.service");
const ai_api_entity_1 = require("./ai_api.entity");
const redisCache_module_1 = require("../redisCache/redisCache.module");
const upload_module_1 = require("../upload/upload.module");
const image_upload_service_1 = require("./image-upload.service");
const promptlib_entity_1 = require("../promptlib/promptlib.entity");
const backup_models_module_1 = require("../models/backup-models.module");
const openaiChat_service_1 = require("./openaiChat.service");
const globalConfig_module_1 = require("../globalConfig/globalConfig.module");
const app_entity_1 = require("../app/app.entity");
let AiApiModule = class AiApiModule {
};
AiApiModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                ai_api_entity_1.AiImageTaskEntity,
                ai_api_entity_1.AiGeneratedImageEntity,
                ai_api_entity_1.ImageUrlMappingEntity,
                promptlib_entity_1.PromptTemplateEntity,
                app_entity_1.AppEntity
            ]),
            redisCache_module_1.RedisCacheModule,
            upload_module_1.UploadModule,
            backup_models_module_1.BackupModelsModule,
            globalConfig_module_1.GlobalConfigModule
        ],
        controllers: [ai_api_controller_1.AiApiController],
        providers: [ai_api_service_1.AiApiService, image_upload_service_1.ImageUploadService, openaiChat_service_1.OpenAIChatService],
        exports: [ai_api_service_1.AiApiService, image_upload_service_1.ImageUploadService],
    })
], AiApiModule);
exports.AiApiModule = AiApiModule;
