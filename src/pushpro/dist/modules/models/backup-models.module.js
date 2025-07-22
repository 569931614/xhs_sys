"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupModelsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const backup_models_controller_1 = require("./backup-models.controller");
const backup_models_entity_1 = require("./backup-models.entity");
const backup_models_service_1 = require("./backup-models.service");
let BackupModelsModule = class BackupModelsModule {
};
BackupModelsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([backup_models_entity_1.BackupModelsEntity])],
        controllers: [backup_models_controller_1.BackupModelsController],
        providers: [backup_models_service_1.BackupModelsService],
        exports: [backup_models_service_1.BackupModelsService],
    })
], BackupModelsModule);
exports.BackupModelsModule = BackupModelsModule;
