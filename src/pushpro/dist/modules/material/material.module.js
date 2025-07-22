"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const material_controller_1 = require("./material.controller");
const material_service_1 = require("./material.service");
const material_entities_1 = require("./material.entities");
const coze_module_1 = require("../coze/coze.module");
const upload_module_1 = require("../upload/upload.module");
const ai_api_module_1 = require("../ai/ai_api.module");
let MaterialModule = class MaterialModule {
};
MaterialModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([material_entities_1.Material, material_entities_1.MaterialFolder]),
            coze_module_1.CozeModule,
            upload_module_1.UploadModule,
            ai_api_module_1.AiApiModule,
        ],
        controllers: [material_controller_1.MaterialController],
        providers: [material_service_1.MaterialService],
        exports: [material_service_1.MaterialService],
    })
], MaterialModule);
exports.MaterialModule = MaterialModule;
