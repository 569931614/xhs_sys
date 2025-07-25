"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const ai_api_module_1 = require("./ai_api.module");
const upload_module_1 = require("../upload/upload.module");
const globalConfig_module_1 = require("../globalConfig/globalConfig.module");
const openaiChat_service_1 = require("./openaiChat.service");
let AiModule = class AiModule {
};
AiModule = __decorate([
    (0, common_1.Module)({
        imports: [ai_api_module_1.AiApiModule, upload_module_1.UploadModule, globalConfig_module_1.GlobalConfigModule],
        providers: [openaiChat_service_1.OpenAIChatService],
        exports: [ai_api_module_1.AiApiModule, openaiChat_service_1.OpenAIChatService],
    })
], AiModule);
exports.AiModule = AiModule;
