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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const note_entity_1 = require("./note.entity");
const notetype_entity_1 = require("./notetype.entity");
const notetemplate_entity_1 = require("./notetemplate.entity");
const note_template_relation_entity_1 = require("./note-template-relation.entity");
const xhs_service_1 = require("../xhs/xhs.service");
const htmllib_entity_1 = require("../htmllib/htmllib.entity");
let NoteService = class NoteService {
    constructor(noteRepository, noteTypeRepository, noteTemplateRepository, noteTemplateRelationRepository, htmlTemplateRepository, xhsService) {
        this.noteRepository = noteRepository;
        this.noteTypeRepository = noteTypeRepository;
        this.noteTemplateRepository = noteTemplateRepository;
        this.noteTemplateRelationRepository = noteTemplateRelationRepository;
        this.htmlTemplateRepository = htmlTemplateRepository;
        this.xhsService = xhsService;
    }
    async create(createNoteDto) {
        const noteType = await this.noteTypeRepository.findOne({ where: { id: createNoteDto.typeId } });
        if (!noteType) {
            throw new common_1.HttpException('笔记类型不存在', common_1.HttpStatus.BAD_REQUEST);
        }
        if (createNoteDto.noteId &&
            (!createNoteDto.title || !createNoteDto.content || !createNoteDto.coverImage)) {
            try {
                const xhsPost = await this.xhsService.findOne(createNoteDto.noteId);
                if (xhsPost) {
                    if (!createNoteDto.title) {
                        createNoteDto.title = xhsPost.title;
                    }
                    if (!createNoteDto.content) {
                        createNoteDto.content = xhsPost.content;
                    }
                    if (!createNoteDto.coverImage && xhsPost.images && xhsPost.images.length > 0) {
                        createNoteDto.coverImage = xhsPost.images[0];
                    }
                }
            }
            catch (error) {
                console.error('从xhs_posts获取数据失败:', error);
            }
        }
        const note = this.noteRepository.create(Object.assign(Object.assign({}, createNoteDto), { botId: createNoteDto.botId || null, paramsType: createNoteDto.paramsType || null }));
        console.log('创建笔记数据:', JSON.stringify(note));
        const savedNote = await this.noteRepository.save(note);
        if (createNoteDto.htmlTemplates && createNoteDto.htmlTemplates.length > 0) {
            console.log(`为新创建的笔记(ID=${savedNote.id})添加HTML模板关联`);
            console.log('HTML模板数据:', JSON.stringify(createNoteDto.htmlTemplates));
            try {
                await this.saveNoteHtmlTemplateRelations(savedNote.id, createNoteDto.htmlTemplates);
            }
            catch (error) {
                console.error(`为新笔记添加HTML模板关联失败:`, error);
            }
        }
        return savedNote;
    }
    async findAll(query) {
        try {
            const { page = 1, pageSize = 10, title, typeId, status, botId, orderBy = 'createTime', orderDirection = 'DESC' } = query;
            const where = {};
            if (title) {
                where.title = (0, typeorm_2.Like)(`%${title}%`);
            }
            if (typeId !== undefined && typeId !== null) {
                where.typeId = typeId;
            }
            if (status !== undefined) {
                where.status = status;
            }
            if (botId !== undefined && botId !== null && botId !== '') {
                where.botId = botId;
            }
            const total = await this.noteRepository.count({ where });
            const items = await this.noteRepository.find({
                where,
                relations: ['type'],
                skip: (page - 1) * pageSize,
                take: pageSize,
                order: { [orderBy]: orderDirection }
            });
            const processedItems = items.map(item => {
                const { type } = item, rest = __rest(item, ["type"]);
                return Object.assign(Object.assign({}, rest), { type, typeName: type ? type.name : null });
            });
            for (const item of processedItems) {
                try {
                    const htmlTemplates = await this.getNoteHtmlTemplates(item.id);
                    if (htmlTemplates && htmlTemplates.length > 0) {
                        item.htmlTemplates = htmlTemplates.map(template => ({
                            id: template.id,
                            name: template.name,
                            isRepeatable: template.isRepeatable || false,
                            thumbnailPath: template.thumbnailPath || '',
                        }));
                    }
                    else {
                        item.htmlTemplates = [];
                    }
                }
                catch (error) {
                    console.error(`获取笔记ID=${item.id}的HTML模板失败:`, error);
                    item.htmlTemplates = [];
                }
            }
            return {
                items: processedItems,
                total,
                page,
                pageSize,
            };
        }
        catch (error) {
            console.error('查询笔记列表失败:', error);
            throw new Error(`查询笔记列表失败: ${error.message}`);
        }
    }
    async findOne(id) {
        const note = await this.noteRepository.findOne({
            where: { id },
            relations: ['type']
        });
        if (!note) {
            throw new common_1.HttpException('笔记不存在', common_1.HttpStatus.NOT_FOUND);
        }
        const result = Object.assign(Object.assign({}, note), { typeName: note.type ? note.type.name : null });
        try {
            const htmlTemplates = await this.getNoteHtmlTemplates(id);
            if (htmlTemplates && htmlTemplates.length > 0) {
                result.htmlTemplates = htmlTemplates.map(template => ({
                    id: template.id,
                    name: template.name,
                    isRepeatable: template.isRepeatable || false,
                    thumbnailPath: template.thumbnailPath || '',
                }));
            }
            else {
                result.htmlTemplates = [];
            }
        }
        catch (error) {
            console.error(`获取笔记ID=${id}的HTML模板失败:`, error);
            result.htmlTemplates = [];
        }
        return result;
    }
    async update(id, updateNoteDto) {
        const note = await this.findOne(id);
        if (updateNoteDto.typeId) {
            const noteType = await this.noteTypeRepository.findOne({ where: { id: updateNoteDto.typeId } });
            if (!noteType) {
                throw new common_1.HttpException('笔记类型不存在', common_1.HttpStatus.BAD_REQUEST);
            }
        }
        if (updateNoteDto.noteId &&
            (!updateNoteDto.title || !updateNoteDto.content || !updateNoteDto.coverImage)) {
            try {
                const xhsPost = await this.xhsService.findOne(updateNoteDto.noteId);
                if (xhsPost) {
                    if (!updateNoteDto.title) {
                        updateNoteDto.title = xhsPost.title;
                    }
                    if (!updateNoteDto.content) {
                        updateNoteDto.content = xhsPost.content;
                    }
                    if (!updateNoteDto.coverImage && xhsPost.images && xhsPost.images.length > 0) {
                        updateNoteDto.coverImage = xhsPost.images[0];
                    }
                }
            }
            catch (error) {
                console.error('从xhs_posts获取数据失败:', error);
            }
        }
        if (updateNoteDto.botId !== undefined) {
            note.botId = updateNoteDto.botId;
        }
        if (updateNoteDto.paramsType !== undefined) {
            note.paramsType = updateNoteDto.paramsType;
        }
        const updatedNote = Object.assign(note, updateNoteDto);
        console.log('更新笔记数据:', JSON.stringify(updatedNote));
        const savedNote = await this.noteRepository.save(updatedNote);
        if (updateNoteDto.htmlTemplates !== undefined) {
            console.log(`处理笔记(ID=${id})的HTML模板关联更新`);
            console.log('提交的HTML模板数据:', JSON.stringify(updateNoteDto.htmlTemplates));
            try {
                const deleteResult = await this.noteTemplateRelationRepository.delete({ noteId: id });
                console.log(`删除旧的模板关联结果:`, deleteResult);
                if (updateNoteDto.htmlTemplates && updateNoteDto.htmlTemplates.length > 0) {
                    await this.saveNoteHtmlTemplateRelations(id, updateNoteDto.htmlTemplates);
                }
                else {
                    console.log(`笔记(ID=${id})不需要关联HTML模板`);
                }
            }
            catch (error) {
                console.error(`更新笔记(ID=${id})的HTML模板关联失败:`, error);
            }
        }
        return savedNote;
    }
    async remove(id) {
        const result = await this.noteRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.HttpException('笔记不存在', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async getNoteTemplates(noteId) {
        const relations = await this.noteTemplateRelationRepository.find({
            where: { noteId },
            relations: ['template'],
        });
        return relations.map(relation => (Object.assign(Object.assign({}, relation.template), { isRepeatable: relation.isRepeatable })));
    }
    async getNoteHtmlTemplates(noteId) {
        try {
            console.log(`获取笔记(ID=${noteId})关联的HTML模板列表`);
            const relations = await this.noteTemplateRelationRepository.find({
                where: { noteId }
            });
            console.log(`找到${relations.length}个模板关联关系`);
            if (relations.length === 0) {
                return [];
            }
            const templates = [];
            for (const relation of relations) {
                try {
                    const htmlTemplate = await this.htmlTemplateRepository.findOne({
                        where: { id: relation.templateId }
                    });
                    if (htmlTemplate) {
                        templates.push(Object.assign(Object.assign({}, htmlTemplate), { isRepeatable: relation.isRepeatable }));
                        console.log(`成功获取模板ID=${relation.templateId}的详细信息`);
                    }
                    else {
                        console.log(`未找到模板ID=${relation.templateId}的详细信息`);
                    }
                }
                catch (error) {
                    console.error(`获取HTML模板详情失败, 模板ID: ${relation.templateId}`, error);
                }
            }
            console.log(`最终返回${templates.length}个HTML模板详情`);
            return templates;
        }
        catch (error) {
            console.error('获取笔记关联的HTML模板列表失败:', error);
            throw new common_1.HttpException('获取HTML模板列表失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async saveNoteHtmlTemplateRelations(noteId, templates) {
        console.log(`开始保存笔记(ID=${noteId})的HTML模板关联，模板数量: ${templates.length}`);
        console.log('模板数据:', JSON.stringify(templates));
        try {
            try {
                const existingRelations = await this.noteTemplateRelationRepository.find({
                    where: { noteId: noteId }
                });
                if (existingRelations.length > 0) {
                    console.log(`发现${existingRelations.length}个已存在的关联关系，准备删除`);
                    const deleteResult = await this.noteTemplateRelationRepository.delete({ noteId: noteId });
                    console.log(`删除结果:`, deleteResult);
                }
                else {
                    console.log(`没有找到现有的关联关系，可以直接添加新关系`);
                }
            }
            catch (deleteError) {
                console.error(`删除现有关联关系时出错: ${deleteError.message}`);
            }
            const validTemplates = [];
            for (const template of templates) {
                try {
                    const exists = await this.htmlTemplateRepository.findOne({ where: { id: template.id } });
                    if (!exists) {
                        console.error(`模板ID=${template.id}不存在，跳过关联`);
                        continue;
                    }
                    console.log(`验证模板ID=${template.id}存在，添加到有效模板列表`);
                    validTemplates.push(template);
                }
                catch (error) {
                    console.error(`验证模板ID=${template.id}时出错: ${error.message}`);
                }
            }
            if (validTemplates.length === 0) {
                console.error(`没有找到有效的模板，无法创建关联关系`);
                return;
            }
            console.log(`有${validTemplates.length}个有效模板需要创建关联关系`);
            const relations = validTemplates.map(template => {
                return this.noteTemplateRelationRepository.create({
                    noteId: noteId,
                    templateId: template.id,
                    isRepeatable: template.isRepeatable || false
                });
            });
            console.log(`准备保存${relations.length}个模板关联关系`);
            const savedRelations = await this.noteTemplateRelationRepository.save(relations);
            console.log(`成功保存${savedRelations.length}个模板关联关系`);
            try {
                const checkRelations = await this.noteTemplateRelationRepository.find({
                    where: { noteId: noteId }
                });
                console.log(`验证结果: 笔记ID=${noteId}现有${checkRelations.length}个模板关联关系`);
                for (const relation of checkRelations) {
                    console.log(`- 关联关系ID=${relation.id}, 笔记ID=${relation.noteId}, 模板ID=${relation.templateId}, 可重复=${relation.isRepeatable}`);
                }
            }
            catch (checkError) {
                console.error(`验证保存结果时出错: ${checkError.message}`);
            }
            return;
        }
        catch (error) {
            console.error(`保存笔记HTML模板关联失败:`, error);
            throw new common_1.HttpException(`保存模板关联失败: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findAllByIds(query, noteIds) {
        try {
            const { page = 1, pageSize = 10, title, typeId, status, botId, orderBy = 'createTime', orderDirection = 'DESC' } = query;
            const where = {
                id: (0, typeorm_2.In)(noteIds)
            };
            if (title) {
                where.title = (0, typeorm_2.Like)(`%${title}%`);
            }
            if (typeId !== undefined && typeId !== null) {
                where.typeId = typeId;
            }
            if (status !== undefined) {
                where.status = status;
            }
            if (botId !== undefined && botId !== null && botId !== '') {
                where.botId = botId;
            }
            const total = await this.noteRepository.count({ where });
            const items = await this.noteRepository.find({
                where,
                relations: ['type'],
                skip: (page - 1) * pageSize,
                take: pageSize,
                order: { [orderBy]: orderDirection }
            });
            const processedItems = items.map(item => {
                const { type } = item, rest = __rest(item, ["type"]);
                return Object.assign(Object.assign({}, rest), { type, typeName: type ? type.name : null });
            });
            for (const item of processedItems) {
                try {
                    const htmlTemplates = await this.getNoteHtmlTemplates(item.id);
                    if (htmlTemplates && htmlTemplates.length > 0) {
                        item.htmlTemplates = htmlTemplates.map(template => ({
                            id: template.id,
                            name: template.name,
                            isRepeatable: template.isRepeatable || false,
                            thumbnailPath: template.thumbnailPath || '',
                        }));
                    }
                    else {
                        item.htmlTemplates = [];
                    }
                }
                catch (error) {
                    console.error(`获取笔记ID=${item.id}的HTML模板失败:`, error);
                    item.htmlTemplates = [];
                }
            }
            return {
                items: processedItems,
                total,
                page,
                pageSize,
            };
        }
        catch (error) {
            console.error('根据ID列表查询笔记失败:', error);
            throw new Error(`根据ID列表查询笔记失败: ${error.message}`);
        }
    }
};
NoteService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(note_entity_1.Note)),
    __param(1, (0, typeorm_1.InjectRepository)(notetype_entity_1.NoteType)),
    __param(2, (0, typeorm_1.InjectRepository)(notetemplate_entity_1.NoteTemplate)),
    __param(3, (0, typeorm_1.InjectRepository)(note_template_relation_entity_1.NoteTemplateRelation)),
    __param(4, (0, typeorm_1.InjectRepository)(htmllib_entity_1.HtmlTemplateEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        xhs_service_1.XhsService])
], NoteService);
exports.NoteService = NoteService;
