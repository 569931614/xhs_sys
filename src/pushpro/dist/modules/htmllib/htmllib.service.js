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
var HtmlLibService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlLibService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const htmllib_entity_1 = require("./htmllib.entity");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const util_1 = require("util");
const mkdirAsync = (0, util_1.promisify)(fs.mkdir);
const writeFileAsync = (0, util_1.promisify)(fs.writeFile);
const existsAsync = (0, util_1.promisify)(fs.exists);
let HtmlLibService = HtmlLibService_1 = class HtmlLibService {
    constructor(htmlTemplateRepository) {
        this.htmlTemplateRepository = htmlTemplateRepository;
        this.logger = new common_1.Logger(HtmlLibService_1.name);
        this.uploadDir = path.join(process.cwd(), 'public', 'file', 'html_templates');
        this.ensureUploadDirExists();
    }
    async ensureUploadDirExists() {
        try {
            if (!await existsAsync(this.uploadDir)) {
                await mkdirAsync(this.uploadDir, { recursive: true });
                this.logger.log(`创建上传目录: ${this.uploadDir}`);
            }
        }
        catch (error) {
            this.logger.error(`创建上传目录失败: ${error.message}`);
        }
    }
    generateUniqueFilename(originalname) {
        const timestamp = new Date().getTime();
        const randomStr = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(originalname);
        const sanitizedName = path.basename(originalname, ext)
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(0, 20);
        return `${timestamp}_${randomStr}_${sanitizedName}${ext}`;
    }
    async createHtmlTemplate(dto) {
        const textDetails = dto.textDetails || [];
        const backgroundImages = dto.backgroundImages || [];
        const template = this.htmlTemplateRepository.create(Object.assign(Object.assign({}, dto), { textDetails: JSON.stringify(textDetails), backgroundImages: JSON.stringify(backgroundImages), status: dto.status || 1 }));
        await this.htmlTemplateRepository.save(template);
        return template;
    }
    async updateHtmlTemplate(dto) {
        const template = await this.htmlTemplateRepository.findOne({
            where: { id: dto.id },
        });
        if (!template) {
            throw new common_1.HttpException('HTML模板不存在', common_1.HttpStatus.BAD_REQUEST);
        }
        const updateData = Object.assign({}, dto);
        if (dto.textDetails) {
            updateData.textDetails = JSON.stringify(dto.textDetails);
        }
        if (dto.backgroundImages) {
            updateData.backgroundImages = JSON.stringify(dto.backgroundImages);
        }
        if (dto.status !== undefined) {
            updateData.status = dto.status;
        }
        this.logger.log(`更新HTML模板 ID: ${dto.id}, 状态值: ${updateData.status}`);
        await this.htmlTemplateRepository.update(dto.id, updateData);
        return await this.htmlTemplateRepository.findOne({
            where: { id: dto.id },
        });
    }
    async queryHtmlTemplates(query) {
        const { page = 1, pageSize = 10, name, status } = query;
        const queryBuilder = this.htmlTemplateRepository.createQueryBuilder('template');
        if (name) {
            queryBuilder.andWhere('template.name LIKE :name', { name: `%${name}%` });
        }
        if (status !== undefined) {
            queryBuilder.andWhere('template.status = :status', { status });
        }
        const [items, total] = await queryBuilder
            .orderBy('template.createdAt', 'DESC')
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        const processedItems = items.map(item => {
            try {
                const textDetails = JSON.parse(item.textDetails || '[]');
                const backgroundImages = JSON.parse(item.backgroundImages || '[]');
                return Object.assign(Object.assign({}, item), { textDetailsArray: textDetails, backgroundImagesArray: backgroundImages });
            }
            catch (e) {
                return Object.assign(Object.assign({}, item), { textDetailsArray: [], backgroundImagesArray: [] });
            }
        });
        return {
            items: processedItems,
            total,
            page,
            pageSize,
        };
    }
    async getHtmlTemplate(id) {
        const template = await this.htmlTemplateRepository.findOne({
            where: { id },
        });
        if (!template) {
            throw new common_1.HttpException('HTML模板不存在', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const textDetails = JSON.parse(template.textDetails || '[]');
            const backgroundImages = JSON.parse(template.backgroundImages || '[]');
            return Object.assign(Object.assign({}, template), { textDetailsArray: textDetails, backgroundImagesArray: backgroundImages });
        }
        catch (e) {
            return Object.assign(Object.assign({}, template), { textDetailsArray: [], backgroundImagesArray: [] });
        }
    }
    async deleteHtmlTemplate(dto) {
        const template = await this.htmlTemplateRepository.findOne({
            where: { id: dto.id },
        });
        if (!template) {
            throw new common_1.HttpException('HTML模板不存在', common_1.HttpStatus.BAD_REQUEST);
        }
        await this.htmlTemplateRepository.remove(template);
        return { success: true };
    }
    async uploadThumbnail(file) {
        try {
            if (!file) {
                throw new common_1.HttpException('未检测到上传文件', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!file.buffer || !file.originalname) {
                throw new common_1.HttpException('文件数据不完整', common_1.HttpStatus.BAD_REQUEST);
            }
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
            const fileExt = path.extname(file.originalname).toLowerCase();
            if (!allowedExtensions.includes(fileExt)) {
                throw new common_1.HttpException('只支持图片格式文件(.jpg, .jpeg, .png, .gif)', common_1.HttpStatus.BAD_REQUEST);
            }
            await this.ensureUploadDirExists();
            const filename = this.generateUniqueFilename(file.originalname);
            const filePath = path.join(this.uploadDir, filename);
            await writeFileAsync(filePath, file.buffer);
            const relativePath = path.join('public', 'file', 'html_templates', filename).replace(/\\/g, '/');
            this.logger.log(`缩略图上传成功: ${relativePath}`);
            return relativePath;
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error(`缩略图上传失败: ${error.message}`);
            throw new common_1.HttpException('缩略图上传失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
HtmlLibService = HtmlLibService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(htmllib_entity_1.HtmlTemplateEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], HtmlLibService);
exports.HtmlLibService = HtmlLibService;
