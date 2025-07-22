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
var ImageUploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageUploadService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");
const url_1 = require("url");
const uuid_1 = require("uuid");
const ai_api_entity_1 = require("./ai_api.entity");
let ImageUploadService = ImageUploadService_1 = class ImageUploadService {
    constructor(imageUrlMappingRepository) {
        this.imageUrlMappingRepository = imageUrlMappingRepository;
        this.logger = new common_1.Logger(ImageUploadService_1.name);
        this.superbedToken = '9ae5bd6bfd964c45893cd7e45561da26';
        this.superbedApiUrl = 'https://api.superbed.cc/upload';
        this.logger.log('ImageUploadService 初始化');
    }
    cleanUrl(url) {
        try {
            const parsedUrl = new url_1.URL(url);
            let cleanedUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`;
            if (cleanedUrl.length > 1000) {
                const urlHash = require('crypto').createHash('md5').update(cleanedUrl).digest('hex');
                this.logger.warn(`URL过长(${cleanedUrl.length}字符)，使用哈希值替代: ${urlHash}`);
                cleanedUrl = `${parsedUrl.protocol}//${parsedUrl.host}/hash_${urlHash}`;
            }
            return cleanedUrl;
        }
        catch (error) {
            this.logger.error(`清理URL时出错: ${error.message}`);
            if (url.length > 1000) {
                const urlHash = require('crypto').createHash('md5').update(url).digest('hex');
                this.logger.warn(`无法解析的URL过长(${url.length}字符)，使用哈希值替代: ${urlHash}`);
                return `hash_${urlHash}`;
            }
            return url;
        }
    }
    async getImageUrlMapping(url) {
        try {
            const cleanedUrl = this.cleanUrl(url);
            const mapping = await this.imageUrlMappingRepository.findOne({
                where: { cleanedUrl }
            });
            return mapping ? mapping.uploadedUrl : null;
        }
        catch (error) {
            this.logger.error(`获取URL映射时出错: ${error.message}`);
            return null;
        }
    }
    async addImageUrlMapping(originalUrl, uploadedUrl) {
        try {
            const cleanedUrl = this.cleanUrl(originalUrl);
            const existingMapping = await this.imageUrlMappingRepository.findOne({
                where: { cleanedUrl }
            });
            if (existingMapping) {
                existingMapping.uploadedUrl = uploadedUrl;
                existingMapping.updatedAt = new Date();
                await this.imageUrlMappingRepository.save(existingMapping);
                this.logger.log(`更新URL映射: ${cleanedUrl} -> ${uploadedUrl}`);
            }
            else {
                const mapping = new ai_api_entity_1.ImageUrlMappingEntity();
                mapping.cleanedUrl = cleanedUrl;
                mapping.uploadedUrl = uploadedUrl;
                mapping.mappingCreatedAt = new Date();
                mapping.createdAt = new Date();
                mapping.updatedAt = new Date();
                await this.imageUrlMappingRepository.save(mapping);
                this.logger.log(`添加URL映射: ${cleanedUrl} -> ${uploadedUrl}`);
            }
        }
        catch (error) {
            this.logger.error(`保存URL映射时出错: ${error.message}`);
        }
    }
    async downloadImage(url) {
        try {
            const tempDir = path.join(os.tmpdir(), 'xhs_aiweb_images');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const fileExt = path.extname(url) || '.jpg';
            const fileName = `${(0, uuid_1.v4)()}${fileExt}`;
            const savePath = path.join(tempDir, fileName);
            this.logger.log(`开始下载图片: ${url}`);
            const response = await axios_1.default.get(url, { responseType: 'arraybuffer' });
            fs.writeFileSync(savePath, response.data);
            this.logger.log(`图片已保存到: ${savePath}`);
            return savePath;
        }
        catch (error) {
            this.logger.error(`下载图片失败: ${error.message}`);
            return null;
        }
    }
    async uploadImageFromUrl(imageUrl) {
        try {
            if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
                this.logger.error(`错误: 无效的URL格式: ${imageUrl}`);
                return { original_url: imageUrl };
            }
            const cleanedUrl = this.cleanUrl(imageUrl);
            const existingUrl = await this.getImageUrlMapping(cleanedUrl);
            if (existingUrl) {
                this.logger.log(`找到已存在的图片URL映射: ${cleanedUrl} -> ${existingUrl}`);
                return { original_url: existingUrl };
            }
            this.logger.log(`开始上传图片URL: ${imageUrl}`);
            const formData = new FormData();
            formData.append('token', this.superbedToken);
            formData.append('src', imageUrl);
            try {
                const response = await axios_1.default.post(this.superbedApiUrl, {
                    token: this.superbedToken,
                    src: imageUrl
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000
                });
                this.logger.log(`响应状态码: ${response.status}`);
                this.logger.log(`响应内容: ${JSON.stringify(response.data)}`);
                if (response.status === 200) {
                    const result = response.data;
                    if (result.err === 1) {
                        this.logger.warn(`超级图床API错误: ${result.msg}`);
                        this.logger.log('尝试下载图片到本地后再上传');
                        const localFilePath = await this.downloadImage(imageUrl);
                        if (localFilePath) {
                            const localUploadResult = await this.uploadLocalFile(localFilePath);
                            if (localUploadResult && localUploadResult.original_url) {
                                this.logger.log(`本地文件上传成功，新URL: ${localUploadResult.original_url}`);
                                return localUploadResult;
                            }
                        }
                        this.logger.error('本地下载和上传失败，使用原始URL');
                        return { original_url: imageUrl };
                    }
                    const newImageUrl = result.url;
                    if (newImageUrl) {
                        this.logger.log(`上传成功，图片URL: ${newImageUrl}`);
                        await this.addImageUrlMapping(cleanedUrl, newImageUrl);
                        return { original_url: newImageUrl };
                    }
                    else {
                        this.logger.error('上传成功但未返回URL信息，使用原始URL');
                        return { original_url: imageUrl };
                    }
                }
                else {
                    this.logger.error(`上传失败: ${JSON.stringify(response.data)}，使用原始URL`);
                    return { original_url: imageUrl };
                }
            }
            catch (requestError) {
                this.logger.error(`图床请求失败: ${requestError.message}，尝试下载到本地后上传`);
                const localFilePath = await this.downloadImage(imageUrl);
                if (localFilePath) {
                    const localUploadResult = await this.uploadLocalFile(localFilePath);
                    if (localUploadResult && localUploadResult.original_url) {
                        this.logger.log(`本地文件上传成功，新URL: ${localUploadResult.original_url}`);
                        return localUploadResult;
                    }
                }
                this.logger.error('本地下载和上传失败，使用原始URL');
                return { original_url: imageUrl };
            }
        }
        catch (error) {
            this.logger.error(`上传过程中发生错误: ${error.message}，使用原始URL`);
            return { original_url: imageUrl };
        }
    }
    async uploadLocalFile(filePath) {
        try {
            this.logger.log(`[DEBUG] 待上传文件路径: ${filePath}`);
            this.logger.log(`[DEBUG] 文件是否存在: ${fs.existsSync(filePath)}`);
            if (!fs.existsSync(filePath)) {
                this.logger.error(`错误: 文件不存在: ${filePath}`);
                return null;
            }
            const fileSize = fs.statSync(filePath).size;
            this.logger.log(`[DEBUG] 文件大小: ${fileSize}`);
            if (fileSize === 0) {
                this.logger.error('错误: 文件大小为0');
                return null;
            }
            this.logger.log(`开始上传图片: ${filePath}`);
            this.logger.log(`文件大小: ${fileSize} 字节`);
            const fileData = fs.readFileSync(filePath);
            const fileName = path.basename(filePath);
            this.logger.log(`[DEBUG] 读取文件完成，文件名: ${fileName}`);
            const formData = new FormData();
            formData.append('token', this.superbedToken);
            this.logger.log(`[DEBUG] formData 添加 token: ${this.superbedToken}`);
            const blob = new Blob([fileData]);
            formData.append('file', blob, fileName);
            this.logger.log(`[DEBUG] formData 添加 file: ${fileName}`);
            this.logger.log(`[DEBUG] 即将向 ${this.superbedApiUrl} 发送 axios 请求...`);
            const response = await axios_1.default.post(this.superbedApiUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            this.logger.log(`响应状态码: ${response.status}`);
            this.logger.debug(`响应内容: ${JSON.stringify(response.data)}`);
            if (response.status === 200) {
                const result = response.data;
                let imageUrl = result.url || (result.data && result.data.url) || (Array.isArray(result.data) && result.data[0] && result.data[0].url);
                this.logger.log(`[DEBUG] 提取到 imageUrl: ${imageUrl}`);
                this.logger.log('[DEBUG] superbed完整响应内容: ' + JSON.stringify(result));
                if (imageUrl && /^https?:\/\//.test(imageUrl)) {
                    this.logger.log(`上传成功，图片URL: ${imageUrl}`);
                    await this.addImageUrlMapping(filePath, imageUrl);
                    return { original_url: imageUrl };
                }
                else {
                    this.logger.error('上传成功但未返回有效的super图床外链！');
                    this.logger.error('完整响应内容: ' + JSON.stringify(result));
                    return null;
                }
            }
            else {
                this.logger.error(`上传失败: ${JSON.stringify(response.data)}`);
                return null;
            }
        }
        catch (error) {
            this.logger.error(`上传过程中发生错误: ${error.message}`);
            return null;
        }
        finally {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    this.logger.log(`临时文件已删除: ${filePath}`);
                }
            }
            catch (error) {
                this.logger.warn(`删除临时文件失败: ${error.message}`);
            }
        }
    }
    async uploadToPicgo(imagePathOrUrl) {
        try {
            if (imagePathOrUrl.startsWith('http://') || imagePathOrUrl.startsWith('https://')) {
                const cleanedUrl = this.cleanUrl(imagePathOrUrl);
                const originalUrl = await this.getImageUrlMapping(cleanedUrl);
                if (originalUrl) {
                    this.logger.log(`找到已存在的图片URL映射: ${cleanedUrl} -> ${originalUrl}`);
                    return { original_url: originalUrl };
                }
                return this.uploadImageFromUrl(imagePathOrUrl);
            }
            return this.uploadLocalFile(imagePathOrUrl);
        }
        catch (error) {
            this.logger.error(`上传过程中发生错误: ${error.message}`);
            return null;
        }
    }
    async uploadToSuperbed(imagePathOrUrl) {
        try {
            const result = await this.uploadToPicgo(imagePathOrUrl);
            if (result && result.original_url) {
                return { url: result.original_url };
            }
            return null;
        }
        catch (error) {
            this.logger.error(`上传到超级图床失败: ${error.message}`);
            return null;
        }
    }
    async uploadFileFromUrl(options) {
        try {
            const result = await this.uploadImageFromUrl(options.url);
            if (result) {
                return { url: result.original_url };
            }
            return null;
        }
        catch (error) {
            this.logger.error(`通过URL上传文件失败: ${error.message}`);
            return null;
        }
    }
    async uploadFile(file, dir) {
        try {
            const dirInfo = dir ? `(目录: ${dir})` : '';
            this.logger.log(`开始从Buffer上传图片${dirInfo}`);
            const tempDir = path.join(os.tmpdir(), 'xhs_aiweb_images');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            let fileExt = '.jpg';
            if (file.mimetype) {
                if (file.mimetype.includes('png')) {
                    fileExt = '.png';
                }
                else if (file.mimetype.includes('jpeg') || file.mimetype.includes('jpg')) {
                    fileExt = '.jpg';
                }
                else if (file.mimetype.includes('gif')) {
                    fileExt = '.gif';
                }
                else if (file.mimetype.includes('webp')) {
                    fileExt = '.webp';
                }
            }
            const fileName = `${(0, uuid_1.v4)()}${fileExt}`;
            const filePath = path.join(tempDir, fileName);
            fs.writeFileSync(filePath, file.buffer);
            this.logger.log(`临时文件已保存: ${filePath}`);
            const result = await this.uploadLocalFile(filePath);
            if (result && result.original_url) {
                this.logger.log(`Buffer上传成功: ${result.original_url}`);
                return result.original_url;
            }
            else {
                this.logger.error('Buffer上传失败');
                return null;
            }
        }
        catch (error) {
            this.logger.error(`Buffer上传过程中发生错误: ${error.message}`);
            return null;
        }
    }
};
ImageUploadService = ImageUploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ai_api_entity_1.ImageUrlMappingEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ImageUploadService);
exports.ImageUploadService = ImageUploadService;
