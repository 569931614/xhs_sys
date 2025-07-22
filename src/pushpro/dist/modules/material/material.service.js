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
var MaterialService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const material_entities_1 = require("./material.entities");
const coze_service_1 = require("../coze/coze.service");
const upload_service_1 = require("../upload/upload.service");
const fs = require("fs");
const path = require("path");
const uuid_1 = require("uuid");
const ai_api_service_1 = require("../ai/ai_api.service");
const axios_1 = require("axios");
let MaterialService = MaterialService_1 = class MaterialService {
    constructor(materialRepository, folderRepository, cozeService, uploadService, aiApiService) {
        this.materialRepository = materialRepository;
        this.folderRepository = folderRepository;
        this.cozeService = cozeService;
        this.uploadService = uploadService;
        this.aiApiService = aiApiService;
        this.logger = new common_1.Logger(MaterialService_1.name);
    }
    async createFolder(name, userId) {
        if (!name) {
            throw new common_1.BadRequestException('文件夹名称不能为空');
        }
        const folder = this.folderRepository.create({
            name,
            count: 0,
            userId
        });
        await this.folderRepository.save(folder);
        return {
            success: true,
            data: folder,
        };
    }
    async getFolders(userId) {
        try {
            this.logger.log(`开始获取素材文件夹，用户ID: ${userId || '全部'}`);
            let query = this.folderRepository.createQueryBuilder('folder')
                .orderBy('folder.createTime', 'DESC');
            if (userId) {
                query = query.where('(folder.userId = :userId OR folder.userId IS NULL)', { userId });
            }
            const folders = await query.getMany();
            this.logger.log(`成功获取${folders.length}个素材文件夹`);
            return {
                success: true,
                data: folders,
            };
        }
        catch (error) {
            this.logger.error(`获取素材文件夹失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: `获取素材文件夹失败: ${error.message}`,
                error: error.stack
            };
        }
    }
    async getMaterials(folderId, userId) {
        try {
            this.logger.log(`开始获取素材列表, 文件夹ID: ${folderId || '所有'}, 用户ID: ${userId || '所有'}`);
            let query = this.materialRepository.createQueryBuilder('material')
                .leftJoinAndSelect('material.folder', 'folder')
                .orderBy('material.uploadTime', 'DESC');
            const whereConditions = [];
            const params = {};
            if (folderId && folderId !== '1') {
                whereConditions.push('material.folderId = :folderId');
                params.folderId = folderId;
            }
            if (userId) {
                whereConditions.push('(material.userId = :userId OR material.userId IS NULL)');
                params.userId = userId;
            }
            if (whereConditions.length > 0) {
                query = query.where(whereConditions.join(' AND '), params);
            }
            const materials = await query.getMany();
            this.logger.log(`成功获取${materials.length}个素材`);
            return {
                success: true,
                data: materials,
            };
        }
        catch (error) {
            this.logger.error(`获取素材列表失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: `获取素材列表失败: ${error.message}`,
                error: error.stack
            };
        }
    }
    async uploadMaterial(file, folderId, userId) {
        if (!file) {
            throw new common_1.BadRequestException('未检测到上传文件');
        }
        if (!folderId) {
            throw new common_1.BadRequestException('请选择文件夹');
        }
        const folder = await this.folderRepository.findOne({
            where: { id: folderId },
        });
        if (!folder) {
            throw new common_1.NotFoundException('文件夹不存在');
        }
        try {
            let fileName = file.originalname;
            try {
                if (/%[0-9A-F]{2}/i.test(fileName)) {
                    fileName = decodeURIComponent(fileName);
                }
                if (/æ|ç|ä|å|è|é|ê|ë|ì|í|î|ï|ð|ñ|ò|ó|ô|õ|ö/.test(fileName)) {
                    const buf = Buffer.from(fileName, 'latin1');
                    fileName = buf.toString('utf8');
                }
            }
            catch (encodeError) {
                this.logger.warn(`处理文件名编码失败: ${encodeError.message}，将使用原始文件名`);
            }
            const effectiveUserId = userId || folder.userId;
            if (effectiveUserId) {
                this.logger.log(`检查用户 ${effectiveUserId} 在文件夹 ${folder.id} 是否已有同名素材: ${fileName}`);
                const existingMaterial = await this.materialRepository.findOne({
                    where: {
                        name: fileName,
                        folderId: folder.id,
                        userId: effectiveUserId
                    }
                });
                if (existingMaterial) {
                    this.logger.warn(`用户 ${effectiveUserId} 在文件夹 ${folder.id} 中已有同名素材: ${fileName}`);
                    throw new common_1.BadRequestException(`已有相同名称素材，名称为：${fileName}`);
                }
                this.logger.log(`文件名检查通过: ${fileName}`);
            }
            const localResult = await this.uploadService.uploadFile(file, 'material');
            const localPath = localResult.path || localResult.filePath || localResult.url || localResult;
            this.logger.log(`获取文件链接: ${localPath}`);
            const picbedResult = await this.aiApiService['imageUploadService'].uploadToPicgo(localPath);
            if (!picbedResult || !picbedResult.original_url) {
                throw new Error('上传到图床失败');
            }
            const picbedUrl = picbedResult.original_url;
            const cozeResult = await this.cozeService.uploadFile(file.buffer, fileName, file.mimetype);
            if (!cozeResult || !cozeResult.file_id) {
                throw new Error('上传到Coze失败');
            }
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 3);
            const material = this.materialRepository.create({
                fileId: picbedUrl,
                cozeFileId: cozeResult.file_id,
                name: fileName,
                previewUrl: picbedUrl,
                size: file.size,
                type: file.mimetype,
                folderId: folder.id,
                expiryTime: expiryDate,
                status: 'valid',
                userId: userId || folder.userId,
            });
            this.logger.log(`正在保存素材，用户ID: ${userId || folder.userId || '未提供'}`);
            await this.materialRepository.save(material);
            folder.count += 1;
            await this.folderRepository.save(folder);
            return {
                success: true,
                data: material,
            };
        }
        catch (error) {
            this.logger.error(`上传素材失败: ${error.message}`, error.stack);
            throw new common_1.BadRequestException(`上传素材失败: ${error.message}`);
        }
    }
    async deleteMaterial(id) {
        if (!id) {
            throw new common_1.BadRequestException('素材ID不能为空');
        }
        const material = await this.materialRepository.findOne({
            where: { id },
            relations: ['folder'],
        });
        if (!material) {
            throw new common_1.NotFoundException('素材不存在');
        }
        try {
            await this.materialRepository.remove(material);
            if (material.folder) {
                material.folder.count = Math.max(0, material.folder.count - 1);
                await this.folderRepository.save(material.folder);
            }
            return {
                success: true,
                message: '删除成功',
            };
        }
        catch (error) {
            this.logger.error(`删除素材失败: ${error.message}`, error.stack);
            throw new common_1.BadRequestException(`删除素材失败: ${error.message}`);
        }
    }
    async deleteFolder(id, userId) {
        if (!id) {
            this.logger.error('文件夹ID不能为空');
            throw new common_1.BadRequestException('文件夹ID不能为空');
        }
        this.logger.log(`请求删除文件夹, ID: ${id}, 请求用户ID: ${userId || '未提供'}`);
        const folder = await this.folderRepository.findOne({
            where: { id },
        });
        if (!folder) {
            this.logger.error(`文件夹 ${id} 不存在`);
            throw new common_1.NotFoundException('文件夹不存在');
        }
        this.logger.log(`文件夹信息: ID=${folder.id}, 名称=${folder.name}, 拥有者ID=${folder.userId || '无'}, 素材数量=${folder.count}`);
        if (userId && folder.userId && String(folder.userId) !== String(userId)) {
            this.logger.error(`权限验证失败: 文件夹拥有者ID=${folder.userId}, 请求用户ID=${userId}`);
        }
        try {
            const materials = await this.materialRepository.find({
                where: { folderId: id },
            });
            this.logger.log(`文件夹 ${id} 包含 ${materials.length} 个素材`);
            if (materials.length > 0) {
                this.logger.log(`开始删除文件夹 ${id} 中的 ${materials.length} 个素材...`);
                await this.materialRepository.remove(materials);
                this.logger.log(`文件夹 ${id} 中的所有素材已删除`);
            }
            this.logger.log(`开始删除文件夹 ${id}...`);
            await this.folderRepository.remove(folder);
            this.logger.log(`文件夹 ${id} 已成功删除`);
            return {
                success: true,
                message: `已删除文件夹"${folder.name}"及其中的 ${materials.length} 个素材`,
            };
        }
        catch (error) {
            this.logger.error(`删除文件夹 ${id} 失败: ${error.message}`, error.stack);
            throw new common_1.BadRequestException(`删除文件夹失败: ${error.message}`);
        }
    }
    async selectMaterials(folderIds, count, userId) {
        if (!folderIds || folderIds.length === 0) {
            throw new common_1.BadRequestException('请选择至少一个文件夹');
        }
        if (!count || count <= 0) {
            count = 5;
        }
        try {
            let query = this.materialRepository.createQueryBuilder('material')
                .where('material.status = :status', { status: 'valid' });
            const hasSpecialFolder = folderIds.includes('1');
            if (!hasSpecialFolder && folderIds.length > 0 && folderIds[0] !== '') {
                query = query.andWhere('material.folderId IN (:...folderIds)', { folderIds });
            }
            if (userId) {
                query = query.andWhere('(material.userId = :userId OR material.userId IS NULL)', { userId });
            }
            const materials = await query.getMany();
            if (materials.length === 0) {
                return {
                    success: true,
                    data: [],
                    message: '未找到有效素材',
                };
            }
            const selectedMaterials = this.getRandomElements(materials, Math.min(count, materials.length));
            const checkedMaterials = await Promise.all(selectedMaterials.map(async (material) => {
                return this.ensureMaterialValid(material);
            }));
            return {
                success: true,
                data: checkedMaterials,
            };
        }
        catch (error) {
            this.logger.error(`选择素材失败: ${error.message}`, error.stack);
            throw new common_1.BadRequestException(`选择素材失败: ${error.message}`);
        }
    }
    async checkMaterialValidity(materialId, userId) {
        if (!materialId) {
            throw new common_1.BadRequestException('素材ID不能为空');
        }
        try {
            const material = await this.materialRepository.findOne({
                where: { id: materialId },
            });
            if (!material) {
                throw new common_1.NotFoundException('素材不存在');
            }
            if (userId && material.userId && String(material.userId) !== String(userId)) {
                this.logger.error(`权限验证失败: 素材拥有者ID=${material.userId}, 请求用户ID=${userId}`);
                throw new common_1.BadRequestException('没有权限访问此素材');
            }
            const updatedMaterial = await this.ensureMaterialValid(material);
            return {
                success: true,
                data: {
                    valid: updatedMaterial.status === 'valid',
                    material: updatedMaterial,
                },
            };
        }
        catch (error) {
            this.logger.error(`检查素材有效性失败: ${error.message}`, error.stack);
            throw new common_1.BadRequestException(`检查素材有效性失败: ${error.message}`);
        }
    }
    async ensureMaterialValid(material) {
        const now = new Date();
        if (material.status === 'valid' && material.expiryTime > now) {
            return material;
        }
        try {
            this.logger.log(`素材 ${material.id} 已过期，重新上传到Coze`);
            const fileUrl = material.previewUrl;
            let localFilePath;
            if (fileUrl.startsWith('http')) {
                const downloadPath = path.join(process.cwd(), 'temp', (0, uuid_1.v4)());
                await this.downloadFile(fileUrl, downloadPath);
                localFilePath = downloadPath;
            }
            else {
                localFilePath = path.join(process.cwd(), 'public', fileUrl.replace(/^\//, ''));
            }
            const fileBuffer = fs.readFileSync(localFilePath);
            const cozeResult = await this.cozeService.uploadFile(fileBuffer, material.name, material.type);
            if (!cozeResult || !cozeResult.file_id) {
                throw new Error('重新上传到Coze失败');
            }
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 3);
            material.cozeFileId = cozeResult.file_id;
            material.expiryTime = expiryDate;
            material.status = 'valid';
            await this.materialRepository.save(material);
            if (fileUrl.startsWith('http')) {
                fs.unlinkSync(localFilePath);
            }
            return material;
        }
        catch (error) {
            this.logger.error(`重新上传素材失败: ${error.message}`, error.stack);
            material.status = 'expired';
            await this.materialRepository.save(material);
            return material;
        }
    }
    async downloadFile(url, destination) {
        const { promises: fs } = require('fs');
        const axios = require('axios');
        const path = require('path');
        try {
            await fs.mkdir(path.dirname(destination), { recursive: true });
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'arraybuffer',
            });
            await fs.writeFile(destination, response.data);
        }
        catch (error) {
            this.logger.error(`下载文件失败: ${error.message}`, error.stack);
            throw error;
        }
    }
    getRandomElements(array, n) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, n);
    }
    async uploadToPicBed(imageUrl, folderId) {
        try {
            const result = await this.aiApiService['imageUploadService'].uploadToPicgo(imageUrl);
            let savedMaterial = null;
            if (result && result.original_url && folderId) {
                const material = this.materialRepository.create({
                    fileId: result.original_url,
                    cozeFileId: '',
                    name: result.original_url.split('/').pop() || '图片',
                    previewUrl: result.original_url,
                    size: 0,
                    type: '',
                    folderId: folderId,
                    expiryTime: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                    status: 'valid',
                });
                savedMaterial = await this.materialRepository.save(material);
            }
            return {
                success: true,
                data: result,
                material: savedMaterial
            };
        }
        catch (error) {
            this.logger.error(`上传图片到图床失败: ${error.message}`);
            return {
                success: false,
                message: error.message
            };
        }
    }
    async getMaterialsByFolder(folderId, userId) {
        try {
            this.logger.log(`获取文件夹 ${folderId} 中的素材，用户ID: ${userId || '未提供'}`);
            const query = this.materialRepository.createQueryBuilder('material');
            if (folderId !== '1') {
                query.where('material.folderId = :folderId', { folderId });
            }
            if (userId) {
                if (folderId !== '1') {
                    query.andWhere('(material.userId = :userId OR material.userId IS NULL)', { userId });
                }
                else {
                    query.where('(material.userId = :userId OR material.userId IS NULL)', { userId });
                }
            }
            const materials = await query.getMany();
            this.logger.log(`文件夹 ${folderId} 中找到 ${materials.length} 个素材`);
            return materials;
        }
        catch (error) {
            this.logger.error(`获取文件夹素材失败: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getMaterialById(materialId, userId) {
        try {
            this.logger.log(`获取素材详情: ${materialId}, 用户ID: ${userId || '未提供'}`);
            const material = await this.materialRepository.findOne({
                where: { id: materialId }
            });
            if (!material) {
                this.logger.warn(`素材 ${materialId} 不存在`);
                return null;
            }
            if (userId && material.userId && String(material.userId) !== String(userId)) {
                this.logger.error(`权限验证失败: 素材拥有者ID=${material.userId}, 请求用户ID=${userId}`);
                throw new common_1.BadRequestException('没有权限访问此素材');
            }
            return material;
        }
        catch (error) {
            this.logger.error(`获取素材详情失败: ${error.message}`, error.stack);
            throw error;
        }
    }
    async updateMaterialCozeId(materialId, userId) {
        try {
            this.logger.log(`更新素材 ${materialId} 的cozeFileId, 用户ID: ${userId || '未提供'}`);
            const material = await this.getMaterialById(materialId, userId);
            if (!material) {
                throw new Error(`素材 ${materialId} 不存在`);
            }
            if (userId && material.userId && String(material.userId) !== String(userId)) {
                this.logger.error(`权限验证失败: 素材拥有者ID=${material.userId}, 请求用户ID=${userId}`);
                throw new Error('没有权限访问此素材');
            }
            if (!material.previewUrl) {
                throw new Error(`素材 ${materialId} 没有可用的URL`);
            }
            const response = await axios_1.default.get(material.previewUrl, {
                responseType: 'arraybuffer'
            });
            const contentType = response.headers['content-type'] || 'image/jpeg';
            const urlParts = material.previewUrl.split('/');
            const filename = urlParts[urlParts.length - 1] || material.name || 'file';
            const fileBuffer = Buffer.from(response.data);
            const result = await this.cozeService.uploadFile(fileBuffer, filename, contentType);
            if (!result || !result.file_id) {
                throw new Error('上传到Coze失败');
            }
            material.cozeFileId = result.file_id;
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 3);
            material.expiryTime = expiryDate;
            material.status = 'valid';
            const updatedMaterial = await this.materialRepository.save(material);
            this.logger.log(`素材 ${materialId} 已更新cozeFileId: ${updatedMaterial.cozeFileId}`);
            return updatedMaterial;
        }
        catch (error) {
            this.logger.error(`更新素材cozeFileId失败: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getMaterialNamesByIds(materialIds) {
        if (!materialIds || materialIds.length === 0) {
            return {};
        }
        try {
            const materials = await this.materialRepository.find({
                where: { id: (0, typeorm_2.In)(materialIds) },
                select: ['id', 'name']
            });
            const nameMap = {};
            materials.forEach(material => {
                nameMap[material.id] = material.name;
            });
            return nameMap;
        }
        catch (error) {
            this.logger.error(`获取素材名称映射失败: ${error.message}`, error.stack);
            return {};
        }
    }
};
MaterialService = MaterialService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(material_entities_1.Material)),
    __param(1, (0, typeorm_1.InjectRepository)(material_entities_1.MaterialFolder)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        coze_service_1.CozeService,
        upload_service_1.UploadService,
        ai_api_service_1.AiApiService])
], MaterialService);
exports.MaterialService = MaterialService;
