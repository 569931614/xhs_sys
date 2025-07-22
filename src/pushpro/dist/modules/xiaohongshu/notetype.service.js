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
exports.NoteTypeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notetype_entity_1 = require("./notetype.entity");
let NoteTypeService = class NoteTypeService {
    constructor(noteTypeRepository) {
        this.noteTypeRepository = noteTypeRepository;
    }
    async create(createNoteTypeDto) {
        const noteType = this.noteTypeRepository.create(createNoteTypeDto);
        return this.noteTypeRepository.save(noteType);
    }
    async findAll(query) {
        const { page = 1, pageSize = 10, name, status } = query;
        const skip = (page - 1) * pageSize;
        const queryBuilder = this.noteTypeRepository.createQueryBuilder('noteType');
        if (name) {
            queryBuilder.andWhere('noteType.name LIKE :name', { name: `%${name}%` });
        }
        if (status !== undefined) {
            queryBuilder.andWhere('noteType.status = :status', { status });
        }
        const [items, total] = await queryBuilder
            .orderBy('noteType.sort', 'ASC')
            .addOrderBy('noteType.createTime', 'DESC')
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
        const noteType = await this.noteTypeRepository.findOne({ where: { id } });
        if (!noteType) {
            throw new common_1.HttpException('笔记类型不存在', common_1.HttpStatus.NOT_FOUND);
        }
        return noteType;
    }
    async update(id, updateNoteTypeDto) {
        const noteType = await this.findOne(id);
        const updatedNoteType = Object.assign(noteType, updateNoteTypeDto);
        return this.noteTypeRepository.save(updatedNoteType);
    }
    async remove(id) {
        const result = await this.noteTypeRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.HttpException('笔记类型不存在', common_1.HttpStatus.NOT_FOUND);
        }
    }
};
NoteTypeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notetype_entity_1.NoteType)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], NoteTypeService);
exports.NoteTypeService = NoteTypeService;
