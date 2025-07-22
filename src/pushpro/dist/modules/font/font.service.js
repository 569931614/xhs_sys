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
exports.FontService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const font_entity_1 = require("./entities/font.entity");
const axios_1 = require("axios");
let FontService = class FontService {
    constructor(fontRepository) {
        this.fontRepository = fontRepository;
    }
    async create(createFontDto) {
        const existFont = await this.fontRepository.findOne({
            where: { code: createFontDto.code },
        });
        if (existFont) {
            throw new common_1.HttpException('字体代码已存在', common_1.HttpStatus.BAD_REQUEST);
        }
        const font = this.fontRepository.create(createFontDto);
        return this.fontRepository.save(font);
    }
    async findAll(query) {
        const { page = 1, pageSize = 10, name, code, type, status, source, orderBy = 'createTime', orderDirection = 'DESC' } = query;
        const queryBuilder = this.fontRepository.createQueryBuilder('font');
        if (name) {
            queryBuilder.andWhere('font.name LIKE :name', { name: `%${name}%` });
        }
        if (code) {
            queryBuilder.andWhere('font.code LIKE :code', { code: `%${code}%` });
        }
        if (type) {
            queryBuilder.andWhere('font.type = :type', { type });
        }
        if (status !== undefined) {
            queryBuilder.andWhere('font.status = :status', { status });
        }
        if (source) {
            queryBuilder.andWhere('font.source = :source', { source });
        }
        const total = await queryBuilder.getCount();
        queryBuilder
            .orderBy(`font.${orderBy}`, orderDirection)
            .skip((page - 1) * pageSize)
            .take(pageSize);
        const items = await queryBuilder.getMany();
        return {
            items,
            total,
            page,
            pageSize,
        };
    }
    async findOne(id) {
        const font = await this.fontRepository.findOne({ where: { id } });
        if (!font) {
            throw new common_1.HttpException('字体不存在', common_1.HttpStatus.NOT_FOUND);
        }
        return font;
    }
    async update(id, updateFontDto) {
        const font = await this.fontRepository.findOne({ where: { id } });
        if (!font) {
            throw new common_1.HttpException('字体不存在', common_1.HttpStatus.NOT_FOUND);
        }
        if (updateFontDto.code && updateFontDto.code !== font.code) {
            const existFont = await this.fontRepository.findOne({
                where: { code: updateFontDto.code },
            });
            if (existFont && existFont.id !== id) {
                throw new common_1.HttpException('字体代码已存在', common_1.HttpStatus.BAD_REQUEST);
            }
        }
        Object.assign(font, updateFontDto);
        return this.fontRepository.save(font);
    }
    async remove(id) {
        const font = await this.fontRepository.findOne({ where: { id } });
        if (!font) {
            throw new common_1.HttpException('字体不存在', common_1.HttpStatus.NOT_FOUND);
        }
        await this.fontRepository.remove(font);
    }
    async batchRemove(ids) {
        await this.fontRepository.delete(ids);
    }
    async toggleStatus(id) {
        const font = await this.fontRepository.findOne({ where: { id } });
        if (!font) {
            throw new common_1.HttpException('字体不存在', common_1.HttpStatus.NOT_FOUND);
        }
        font.status = !font.status;
        return this.fontRepository.save(font);
    }
    async fetchFontsFromApi() {
        try {
            const response = await axios_1.default.get('https://poster.mofabiji.com/api/font');
            if (response.data.code !== 0 || !response.data.success) {
                throw new common_1.HttpException('获取字体数据失败: ' + response.data.message, common_1.HttpStatus.BAD_REQUEST);
            }
            const fontsData = response.data.data;
            let savedCount = 0;
            for (const key in fontsData) {
                const fontData = fontsData[key];
                const existFont = await this.fontRepository.findOne({
                    where: { code: fontData.code },
                });
                if (!existFont) {
                    const urlParts = fontData.url.split('.');
                    const fontType = urlParts.length > 1 ? urlParts[urlParts.length - 1] : 'ttf';
                    const newFont = this.fontRepository.create({
                        name: fontData.name,
                        code: fontData.code,
                        preview: fontData.preview,
                        url: fontData.url,
                        type: fontType,
                        status: true,
                        sort: 0,
                        source: 'api',
                        remark: '从API自动获取',
                    });
                    await this.fontRepository.save(newFont);
                    savedCount++;
                }
            }
            return {
                success: true,
                message: `成功从API获取并保存了${savedCount}个字体`,
                total: savedCount,
            };
        }
        catch (error) {
            throw new common_1.HttpException(`获取字体数据失败: ${error.message || '未知错误'}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAllAvailableFonts() {
        return this.fontRepository.find({
            where: { status: true },
            order: { sort: 'ASC', createTime: 'DESC' },
        });
    }
};
FontService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(font_entity_1.FontEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], FontService);
exports.FontService = FontService;
