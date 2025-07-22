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
exports.Material = exports.MaterialFolder = void 0;
const typeorm_1 = require("typeorm");
let MaterialFolder = class MaterialFolder {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MaterialFolder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], MaterialFolder.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'create_time' }),
    __metadata("design:type", Date)
], MaterialFolder.prototype, "createTime", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'update_time' }),
    __metadata("design:type", Date)
], MaterialFolder.prototype, "updateTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], MaterialFolder.prototype, "count", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', nullable: true }),
    __metadata("design:type", String)
], MaterialFolder.prototype, "userId", void 0);
MaterialFolder = __decorate([
    (0, typeorm_1.Entity)('material_folders')
], MaterialFolder);
exports.MaterialFolder = MaterialFolder;
let Material = class Material {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Material.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Material.prototype, "fileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'coze_file_id', length: 255 }),
    __metadata("design:type", String)
], Material.prototype, "cozeFileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Material.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'preview_url', length: 1000 }),
    __metadata("design:type", String)
], Material.prototype, "previewUrl", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Material.prototype, "size", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Material.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'folder_id' }),
    __metadata("design:type", String)
], Material.prototype, "folderId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'upload_time' }),
    __metadata("design:type", Date)
], Material.prototype, "uploadTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expiry_time' }),
    __metadata("design:type", Date)
], Material.prototype, "expiryTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'valid' }),
    __metadata("design:type", String)
], Material.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', nullable: true }),
    __metadata("design:type", String)
], Material.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => MaterialFolder),
    (0, typeorm_1.JoinColumn)({ name: 'folder_id' }),
    __metadata("design:type", MaterialFolder)
], Material.prototype, "folder", void 0);
Material = __decorate([
    (0, typeorm_1.Entity)('materials')
], Material);
exports.Material = Material;
