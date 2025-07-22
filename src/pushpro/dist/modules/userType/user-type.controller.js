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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserTypeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const create_user_type_dto_1 = require("./dto/create-user-type.dto");
const update_user_type_dto_1 = require("./dto/update-user-type.dto");
const user_type_service_1 = require("./user-type.service");
let UserTypeController = class UserTypeController {
    constructor(userTypeService) {
        this.userTypeService = userTypeService;
    }
    async create(createUserTypeDto) {
        const data = await this.userTypeService.create(createUserTypeDto);
        return {
            code: 200,
            message: '创建成功',
            data,
        };
    }
    async findAll(query) {
        const data = await this.userTypeService.findAll(query);
        return {
            code: 200,
            message: '获取成功',
            data,
        };
    }
    async findOne(id) {
        const data = await this.userTypeService.findOne(+id);
        return {
            code: 200,
            message: '获取成功',
            data,
        };
    }
    async update(id, updateUserTypeDto) {
        const data = await this.userTypeService.update(+id, updateUserTypeDto);
        return {
            code: 200,
            message: '更新成功',
            data,
        };
    }
    async remove(id) {
        await this.userTypeService.remove(+id);
        return {
            code: 200,
            message: '删除成功',
        };
    }
};
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建用户类型' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_type_dto_1.CreateUserTypeDto]),
    __metadata("design:returntype", Promise)
], UserTypeController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, swagger_1.ApiOperation)({ summary: '获取用户类型列表' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserTypeController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取单个用户类型' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserTypeController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新用户类型' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_type_dto_1.UpdateUserTypeDto]),
    __metadata("design:returntype", Promise)
], UserTypeController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除用户类型' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserTypeController.prototype, "remove", null);
UserTypeController = __decorate([
    (0, swagger_1.ApiTags)('用户类型'),
    (0, common_1.Controller)('system/user-type'),
    __metadata("design:paramtypes", [user_type_service_1.UserTypeService])
], UserTypeController);
exports.UserTypeController = UserTypeController;
