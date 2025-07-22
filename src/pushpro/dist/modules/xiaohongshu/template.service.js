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
var XhsTemplateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.XhsTemplateService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const template_entity_1 = require("./template.entity");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const util = require("util");
const writeFileAsync = util.promisify(fs.writeFile);
const unlinkAsync = util.promisify(fs.unlink);
const mkdirAsync = util.promisify(fs.mkdir);
const existsAsync = util.promisify(fs.exists);
let XhsTemplateService = XhsTemplateService_1 = class XhsTemplateService {
    constructor(templateRepository) {
        this.templateRepository = templateRepository;
        this.logger = new common_1.Logger(XhsTemplateService_1.name);
        this.uploadDir = path.join(process.cwd(), 'uploads', 'templates');
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
    generateUniqueFilename(originalFilename) {
        const ext = path.extname(originalFilename);
        const basename = path.basename(originalFilename, ext);
        const timestamp = new Date().getTime();
        const hash = crypto.createHash('md5').update(`${basename}${timestamp}`).digest('hex').substring(0, 8);
        return `${basename}-${hash}${ext}`;
    }
    async uploadTemplateFile(file) {
        try {
            if (!file) {
                throw new common_1.HttpException('未检测到上传文件', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!file.buffer || file.buffer.length === 0) {
                this.logger.error('文件内容为空或未定义');
                throw new common_1.HttpException('文件内容为空或已损坏', common_1.HttpStatus.BAD_REQUEST);
            }
            const allowedExtensions = ['.ppt', '.pptx'];
            const fileExt = path.extname(file.originalname).toLowerCase();
            if (!allowedExtensions.includes(fileExt)) {
                throw new common_1.HttpException('只支持PPT格式文件(.ppt, .pptx)', common_1.HttpStatus.BAD_REQUEST);
            }
            await this.ensureUploadDirExists();
            const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filename = this.generateUniqueFilename(safeOriginalName);
            const filePath = path.join(this.uploadDir, filename);
            this.logger.log(`准备保存文件: ${filePath}, 大小: ${file.buffer.length} 字节`);
            try {
                fs.writeFileSync(filePath, file.buffer);
                if (!fs.existsSync(filePath)) {
                    throw new Error('文件写入后无法验证');
                }
                const stats = fs.statSync(filePath);
                if (stats.size === 0) {
                    throw new Error('文件写入后大小为0字节');
                }
                this.logger.log(`文件成功保存: ${filePath}, 大小: ${stats.size} 字节`);
            }
            catch (writeError) {
                this.logger.error(`文件写入失败: ${writeError.message}`);
                throw new common_1.HttpException('文件保存失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            const relativePath = path.join('uploads', 'templates', filename).replace(/\\/g, '/');
            this.logger.log(`模板文件上传成功: ${relativePath}`);
            return relativePath;
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error(`文件上传失败: ${error.message}`, error.stack);
            throw new common_1.HttpException('文件上传失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findAll(page = 1, pageSize = 10, keyword = '') {
        try {
            const skip = (page - 1) * pageSize;
            const whereCondition = keyword
                ? { name: (0, typeorm_2.Like)(`%${keyword}%`) }
                : {};
            const total = await this.templateRepository.count({
                where: whereCondition,
            });
            const items = await this.templateRepository.find({
                where: whereCondition,
                order: { createdAt: 'DESC' },
                skip,
                take: pageSize,
            });
            return {
                items,
                total,
                page,
                pageSize
            };
        }
        catch (error) {
            this.logger.error(`获取模板列表失败: ${error.message}`);
            throw new common_1.HttpException('获取模板列表失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findOne(id) {
        const template = await this.templateRepository.findOne({
            where: { id },
        });
        if (!template) {
            throw new common_1.HttpException('模板不存在', common_1.HttpStatus.BAD_REQUEST);
        }
        return template;
    }
    async create(createDto, filePath, fileSize) {
        var _a;
        try {
            const existTemplate = await this.templateRepository.findOne({
                where: { name: createDto.name },
            });
            if (existTemplate) {
                throw new common_1.HttpException('该模板名称已存在', common_1.HttpStatus.BAD_REQUEST);
            }
            const newTemplate = this.templateRepository.create(Object.assign(Object.assign({}, createDto), { filePath,
                fileSize, status: (_a = createDto.status) !== null && _a !== void 0 ? _a : 1 }));
            return await this.templateRepository.save(newTemplate);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error(`创建模板失败: ${error.message}`);
            throw new common_1.HttpException('创建模板失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async update(updateDto, filePath, fileSize) {
        try {
            const { id } = updateDto;
            const existTemplate = await this.templateRepository.findOne({
                where: { id },
            });
            if (!existTemplate) {
                throw new common_1.HttpException('模板不存在', common_1.HttpStatus.BAD_REQUEST);
            }
            if (updateDto.name && updateDto.name !== existTemplate.name) {
                const nameExists = await this.templateRepository.findOne({
                    where: { name: updateDto.name, id: { $ne: id } },
                });
                if (nameExists) {
                    throw new common_1.HttpException('该模板名称已存在', common_1.HttpStatus.BAD_REQUEST);
                }
            }
            let updateData = Object.assign({}, updateDto);
            if (filePath) {
                updateData.filePath = filePath;
            }
            if (fileSize) {
                updateData.fileSize = fileSize;
            }
            Object.assign(existTemplate, updateData);
            return await this.templateRepository.save(existTemplate);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error(`更新模板失败: ${error.message}`);
            throw new common_1.HttpException('更新模板失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateStatus(updateStatusDto) {
        try {
            const { id, status } = updateStatusDto;
            const template = await this.templateRepository.findOne({
                where: { id },
            });
            if (!template) {
                throw new common_1.HttpException('模板不存在', common_1.HttpStatus.BAD_REQUEST);
            }
            template.status = status;
            return await this.templateRepository.save(template);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error(`更新模板状态失败: ${error.message}`);
            throw new common_1.HttpException('更新模板状态失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async delete(deleteDto) {
        try {
            const { id } = deleteDto;
            const template = await this.templateRepository.findOne({
                where: { id },
            });
            if (!template) {
                throw new common_1.HttpException('模板不存在', common_1.HttpStatus.BAD_REQUEST);
            }
            try {
                const filePath = path.join(process.cwd(), template.filePath);
                if (await existsAsync(filePath)) {
                    await unlinkAsync(filePath);
                    this.logger.log(`文件已删除: ${filePath}`);
                }
            }
            catch (error) {
                this.logger.error(`删除文件失败: ${error.message}`);
            }
            return await this.templateRepository.remove(template);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error(`删除模板失败: ${error.message}`);
            throw new common_1.HttpException('删除模板失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async incrementUsageCount(id) {
        try {
            const template = await this.templateRepository.findOne({
                where: { id },
            });
            if (!template) {
                throw new common_1.HttpException('模板不存在', common_1.HttpStatus.BAD_REQUEST);
            }
            template.usageCount += 1;
            return await this.templateRepository.save(template);
        }
        catch (error) {
            this.logger.error(`增加使用次数失败: ${error.message}`);
        }
    }
};
XhsTemplateService = XhsTemplateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(template_entity_1.XhsTemplateEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], XhsTemplateService);
exports.XhsTemplateService = XhsTemplateService;
