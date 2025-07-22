"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiMediaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const aiTopicController_1 = require("./aiTopicController");
const aiTopicService_1 = require("./aiTopicService");
const aiTopic_entity_1 = require("./entities/aiTopic.entity");
const ai_module_1 = require("../ai/ai.module");
const app_module_1 = require("../app/app.module");
const config_entity_1 = require("../globalConfig/config.entity");
const app_entity_1 = require("../app/app.entity");
let AiMediaModule = class AiMediaModule {
};
AiMediaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([aiTopic_entity_1.AiTopicEntity, config_entity_1.ConfigEntity, app_entity_1.AppEntity]),
            config_1.ConfigModule,
            ai_module_1.AiModule,
            app_module_1.AppModule,
        ],
        controllers: [
            aiTopicController_1.AiTopicController,
        ],
        providers: [
            aiTopicService_1.AiTopicService,
        ],
        exports: [
            aiTopicService_1.AiTopicService,
        ],
    })
], AiMediaModule);
exports.AiMediaModule = AiMediaModule;
