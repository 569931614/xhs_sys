"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiTopicEntity = void 0;
const typeorm_1 = require("typeorm");
let AiTopicEntity = class AiTopicEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AiTopicEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", Number)
], AiTopicEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: '' }),
    __metadata("design:type", String)
], AiTopicEntity.prototype, "industry", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: '' }),
    __metadata("design:type", String)
], AiTopicEntity.prototype, "audience", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: '' }),
    __metadata("design:type", String)
], AiTopicEntity.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: '' }),
    __metadata("design:type", String)
], AiTopicEntity.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pain_point', nullable: true, default: '' }),
    __metadata("design:type", String)
], AiTopicEntity.prototype, "painPoint", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], AiTopicEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], AiTopicEntity.prototype, "updatedAt", void 0);
AiTopicEntity = __decorate([
    (0, typeorm_1.Entity)('ai_topic_settings')
], AiTopicEntity);
exports.AiTopicEntity = AiTopicEntity;
