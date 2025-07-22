"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountAnalysisModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const accountAnalysis_controller_1 = require("./accountAnalysis.controller");
const accountAnalysis_service_1 = require("./accountAnalysis.service");
const fx_task_entity_1 = require("./entities/fx-task.entity");
const ai_module_1 = require("../ai/ai.module");
const globalConfig_module_1 = require("../globalConfig/globalConfig.module");
const app_entity_1 = require("../app/app.entity");
let AccountAnalysisModule = class AccountAnalysisModule {
};
AccountAnalysisModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([fx_task_entity_1.FxTask, app_entity_1.AppEntity]),
            ai_module_1.AiModule,
            globalConfig_module_1.GlobalConfigModule
        ],
        controllers: [accountAnalysis_controller_1.AccountAnalysisController],
        providers: [accountAnalysis_service_1.AccountAnalysisService],
        exports: [accountAnalysis_service_1.AccountAnalysisService]
    })
], AccountAnalysisModule);
exports.AccountAnalysisModule = AccountAnalysisModule;
