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
exports.NoteTemplateService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notetemplate_entity_1 = require("./notetemplate.entity");
let NoteTemplateService = class NoteTemplateService {
    constructor(noteTemplateRepository) {
        this.noteTemplateRepository = noteTemplateRepository;
    }
    async create(createNoteTemplateDto) {
        const noteTemplate = this.noteTemplateRepository.create(createNoteTemplateDto);
        return this.noteTemplateRepository.save(noteTemplate);
    }
    async findAll(query) {
        const { page = 1, pageSize = 10, name, status } = query;
        const skip = (page - 1) * pageSize;
        const queryBuilder = this.noteTemplateRepository.createQueryBuilder('noteTemplate');
        if (name) {
            queryBuilder.andWhere('noteTemplate.name LIKE :name', { name: `%${name}%` });
        }
        if (status !== undefined) {
            queryBuilder.andWhere('noteTemplate.status = :status', { status });
        }
        const [items, total] = await queryBuilder
            .orderBy('noteTemplate.sort', 'ASC')
            .addOrderBy('noteTemplate.createTime', 'DESC')
            .skip(skip)
            .take(pageSize)
            .getManyAndCount();
        return {
            items,
            total,
            page,
            pageSize,
        };
    }
    async findOne(id) {
        const noteTemplate = await this.noteTemplateRepository.findOne({ where: { id } });
        if (!noteTemplate) {
            throw new common_1.HttpException('笔记页面模板不存在', common_1.HttpStatus.NOT_FOUND);
        }
        return noteTemplate;
    }
    async update(id, updateNoteTemplateDto) {
        const noteTemplate = await this.findOne(id);
        const updatedNoteTemplate = Object.assign(noteTemplate, updateNoteTemplateDto);
        return this.noteTemplateRepository.save(updatedNoteTemplate);
    }
    async remove(id) {
        const result = await this.noteTemplateRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.HttpException('笔记页面模板不存在', common_1.HttpStatus.NOT_FOUND);
        }
    }
};
NoteTemplateService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notetemplate_entity_1.NoteTemplate)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], NoteTemplateService);
exports.NoteTemplateService = NoteTemplateService;
