"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageGeneratorModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const axios_1 = require("@nestjs/axios");
const image_generator_controller_1 = require("./image-generator.controller");
const image_generator_service_1 = require("./image-generator.service");
const image_generator_entity_1 = require("./image-generator.entity");
const image_download_url_entity_1 = require("./image-download-url.entity");
const redisCache_module_1 = require("../redisCache/redisCache.module");
const ai_api_module_1 = require("../ai/ai_api.module");
let ImageGeneratorModule = class ImageGeneratorModule {
};
ImageGeneratorModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([image_generator_entity_1.ImageGeneratorTask, image_download_url_entity_1.ImageDownloadUrl]),
            axios_1.HttpModule,
            redisCache_module_1.RedisCacheModule,
            ai_api_module_1.AiApiModule
        ],
        controllers: [image_generator_controller_1.ImageGeneratorController],
        providers: [image_generator_service_1.ImageGeneratorService],
        exports: [image_generator_service_1.ImageGeneratorService],
    })
], ImageGeneratorModule);
exports.ImageGeneratorModule = ImageGeneratorModule;
