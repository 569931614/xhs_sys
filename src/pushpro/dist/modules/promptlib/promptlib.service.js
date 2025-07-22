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
exports.PromptLibService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const promptlib_entity_1 = require("./promptlib.entity");
let PromptLibService = class PromptLibService {
    constructor(promptTemplateRepository) {
        this.promptTemplateRepository = promptTemplateRepository;
    }
    async createPromptTemplate(dto) {
        const existTemplate = await this.promptTemplateRepository.findOne({
            where: { identifier: dto.identifier },
        });
        if (existTemplate) {
            throw new common_1.HttpException('提示词标识已存在', common_1.HttpStatus.BAD_REQUEST);
        }
        const template = this.promptTemplateRepository.create(Object.assign(Object.assign({}, dto), { status: dto.status || 1 }));
        await this.promptTemplateRepository.save(template);
        return template;
    }
    async updatePromptTemplate(dto) {
        const template = await this.promptTemplateRepository.findOne({
            where: { id: dto.id },
        });
        if (!template) {
            throw new common_1.HttpException('提示词模板不存在', common_1.HttpStatus.BAD_REQUEST);
        }
        if (dto.identifier && dto.identifier !== template.identifier) {
            const existTemplate = await this.promptTemplateRepository.findOne({
                where: { identifier: dto.identifier },
            });
            if (existTemplate && existTemplate.id !== dto.id) {
                throw new common_1.HttpException('提示词标识已存在', common_1.HttpStatus.BAD_REQUEST);
            }
        }
        await this.promptTemplateRepository.update(dto.id, Object.assign({}, dto));
        return await this.promptTemplateRepository.findOne({
            where: { id: dto.id },
        });
    }
    async queryPromptTemplates(query) {
        const { page = 1, pageSize = 10, identifier, modelName, status } = query;
        const queryBuilder = this.promptTemplateRepository.createQueryBuilder('template');
        if (identifier) {
            queryBuilder.andWhere('template.identifier LIKE :identifier', { identifier: `%${identifier}%` });
        }
        if (modelName) {
            queryBuilder.andWhere('template.modelName LIKE :modelName', { modelName: `%${modelName}%` });
        }
        if (status !== undefined) {
            queryBuilder.andWhere('template.status = :status', { status });
        }
        const [items, total] = await queryBuilder
            .orderBy('template.createdAt', 'DESC')
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        return {
            items,
            total,
            page,
            pageSize,
        };
    }
    async getPromptTemplate(id) {
        const template = await this.promptTemplateRepository.findOne({
            where: { id },
        });
        if (!template) {
            throw new common_1.HttpException('提示词模板不存在', common_1.HttpStatus.BAD_REQUEST);
        }
        return template;
    }
    async deletePromptTemplate(dto) {
        const template = await this.promptTemplateRepository.findOne({
            where: { id: dto.id },
        });
        if (!template) {
            throw new common_1.HttpException('提示词模板不存在', common_1.HttpStatus.BAD_REQUEST);
        }
        await this.promptTemplateRepository.remove(template);
        return { success: true };
    }
};
PromptLibService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(promptlib_entity_1.PromptTemplateEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PromptLibService);
exports.PromptLibService = PromptLibService;
