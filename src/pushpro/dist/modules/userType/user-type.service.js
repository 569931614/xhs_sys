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
exports.UserTypeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_type_entity_1 = require("./user-type.entity");
let UserTypeService = class UserTypeService {
    constructor(userTypeRepository) {
        this.userTypeRepository = userTypeRepository;
    }
    async create(createUserTypeDto) {
        const { name } = createUserTypeDto;
        const existType = await this.userTypeRepository.findOne({ where: { name } });
        if (existType) {
            throw new common_1.HttpException('用户类型名称已存在', common_1.HttpStatus.BAD_REQUEST);
        }
        const newUserType = this.userTypeRepository.create(createUserTypeDto);
        return this.userTypeRepository.save(newUserType);
    }
    async findAll(query = {}) {
        const { name, page = 1, size = 10 } = query;
        const where = {};
        if (name) {
            where.name = (0, typeorm_2.Like)(`%${name}%`);
        }
        const [list, total] = await this.userTypeRepository.findAndCount({
            where,
            order: { createTime: 'DESC' },
            skip: (page - 1) * size,
            take: size,
        });
        return { list, total };
    }
    async findOne(id) {
        const userType = await this.userTypeRepository.findOne({ where: { id } });
        if (!userType) {
            throw new common_1.HttpException('用户类型不存在', common_1.HttpStatus.NOT_FOUND);
        }
        return userType;
    }
    async update(id, updateUserTypeDto) {
        const userType = await this.findOne(id);
        if (updateUserTypeDto.name && updateUserTypeDto.name !== userType.name) {
            const existType = await this.userTypeRepository.findOne({
                where: { name: updateUserTypeDto.name }
            });
            if (existType && existType.id !== id) {
                throw new common_1.HttpException('用户类型名称已存在', common_1.HttpStatus.BAD_REQUEST);
            }
        }
        const updatedUserType = this.userTypeRepository.merge(userType, updateUserTypeDto);
        return this.userTypeRepository.save(updatedUserType);
    }
    async remove(id) {
        const userType = await this.findOne(id);
        await this.userTypeRepository.remove(userType);
    }
};
UserTypeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_type_entity_1.UserTypeEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UserTypeService);
exports.UserTypeService = UserTypeService;
