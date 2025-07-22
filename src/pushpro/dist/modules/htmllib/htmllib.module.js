"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlLibModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const html_render_controller_1 = require("./html-render.controller");
const html_render_service_1 = require("./html-render.service");
const htmllib_entity_1 = require("./htmllib.entity");
const render_task_entity_1 = require("./entities/render-task.entity");
const globalConfig_module_1 = require("../globalConfig/globalConfig.module");
const ai_api_module_1 = require("../ai/ai_api.module");
const ai_api_entity_1 = require("../ai/ai_api.entity");
const openaiChat_service_1 = require("../ai/openaiChat.service");
const htmllib_controller_1 = require("./htmllib.controller");
const htmllib_service_1 = require("./htmllib.service");
let HtmlLibModule = class HtmlLibModule {
};
HtmlLibModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([htmllib_entity_1.HtmlTemplateEntity, ai_api_entity_1.ImageUrlMappingEntity, render_task_entity_1.RenderTask]),
            globalConfig_module_1.GlobalConfigModule,
            (0, common_1.forwardRef)(() => ai_api_module_1.AiApiModule)
        ],
        controllers: [html_render_controller_1.HtmlRenderController, htmllib_controller_1.HtmlLibController],
        providers: [html_render_service_1.HtmlRenderService, openaiChat_service_1.OpenAIChatService, htmllib_service_1.HtmlLibService],
        exports: [html_render_service_1.HtmlRenderService, htmllib_service_1.HtmlLibService]
    })
], HtmlLibModule);
exports.HtmlLibModule = HtmlLibModule;
