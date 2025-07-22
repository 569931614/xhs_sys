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
exports.XhsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const xhs_entity_1 = require("./xhs.entity");
const xhs_activity_post_entity_1 = require("./xhs-activity-post.entity");
const xhs_signature_entity_1 = require("./xhs-signature.entity");
const axios_1 = require("axios");
const image_upload_service_1 = require("../ai/image-upload.service");
const id_generator_service_1 = require("./id-generator.service");
const upload_service_1 = require("../upload/upload.service");
let XhsService = class XhsService {
    constructor(xhsPostRepository, xhsActivityPostRepository, xhsSignatureRepository, dataSource, imageUploadService, idGeneratorService, uploadService) {
        this.xhsPostRepository = xhsPostRepository;
        this.xhsActivityPostRepository = xhsActivityPostRepository;
        this.xhsSignatureRepository = xhsSignatureRepository;
        this.dataSource = dataSource;
        this.imageUploadService = imageUploadService;
        this.idGeneratorService = idGeneratorService;
        this.uploadService = uploadService;
    }
    async create(createXhsPostDto, userId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            console.log('创建笔记时收到的活动ID:', {
                value: createXhsPostDto.activityId,
                type: typeof createXhsPostDto.activityId
            });
            const customId = this.idGeneratorService.generateStringId();
            console.log('生成的自定义字符串ID:', customId);
            let processedImages = [];
            if (createXhsPostDto.type === 'video') {
                console.log('视频类型笔记，清空images数组');
                createXhsPostDto.images = [];
            }
            if (createXhsPostDto.images && createXhsPostDto.images.length > 0) {
                for (const imageUrl of createXhsPostDto.images) {
                    try {
                        const uploadResult = await this.imageUploadService.uploadToPicgo(imageUrl);
                        if (uploadResult && uploadResult.original_url) {
                            processedImages.push(uploadResult.original_url);
                            console.log(`图片上传成功: ${imageUrl} -> ${uploadResult.original_url}`);
                        }
                        else {
                            processedImages.push(imageUrl);
                            console.warn(`图片上传失败，使用原始URL: ${imageUrl}`);
                        }
                    }
                    catch (error) {
                        console.error(`图片上传错误: ${error.message}`);
                        processedImages.push(imageUrl);
                    }
                }
            }
            if (createXhsPostDto.cover) {
                try {
                    const coverResult = await this.imageUploadService.uploadToPicgo(createXhsPostDto.cover);
                    if (coverResult && coverResult.original_url) {
                        createXhsPostDto.cover = coverResult.original_url;
                        console.log(`封面图片上传成功: ${createXhsPostDto.cover}`);
                    }
                }
                catch (error) {
                    console.error(`封面图片上传错误: ${error.message}`);
                }
            }
            if (createXhsPostDto.video) {
                try {
                    const processedVideoUrl = await this.processVideoUrl(createXhsPostDto.video);
                    createXhsPostDto.video = processedVideoUrl;
                    console.log(`视频处理成功: ${processedVideoUrl}`);
                }
                catch (error) {
                    console.error(`视频处理错误: ${error.message}`);
                }
            }
            const newPost = this.xhsPostRepository.create(Object.assign(Object.assign({}, createXhsPostDto), { id: customId, images: processedImages, userId: userId }));
            const savedPost = await queryRunner.manager.save(newPost);
            if (createXhsPostDto.activityId) {
                const activityPost = this.xhsActivityPostRepository.create({
                    postId: savedPost.id,
                    activityId: createXhsPostDto.activityId,
                });
                try {
                    await queryRunner.manager.save(activityPost);
                    console.log('成功创建活动关联记录', {
                        postId: savedPost.id,
                        activityId: createXhsPostDto.activityId
                    });
                }
                catch (error) {
                    console.error('创建活动关联记录失败:', error);
                }
            }
            await queryRunner.commitTransaction();
            return savedPost;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('创建笔记事务失败:', error);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async findAll(query) {
        const where = {};
        if (query) {
            if (query.title) {
                where['title'] = query.title;
            }
            if (query.userId) {
                where['userId'] = typeof query.userId === 'string' ? parseInt(query.userId, 10) : query.userId;
            }
            if (query.isUsed !== undefined) {
                const isUsedValue = query.isUsed === true || query.isUsed === '1' || query.isUsed === 1;
                if (query.platform === 'douyin') {
                    where['douyinUsed'] = isUsedValue;
                }
                else if (query.platform === 'xhs') {
                    where['isUsed'] = isUsedValue;
                }
                else {
                    where['isUsed'] = isUsedValue;
                }
            }
        }
        return await this.xhsPostRepository.find({
            where,
            order: {
                createTime: 'DESC',
            },
        });
    }
    async findNextByIdentifier(identifier, currentId, isUsed, platform, isSequential) {
        const queryBuilder = this.xhsPostRepository.createQueryBuilder('post');
        queryBuilder.where('post.identifier = :identifier', { identifier });
        if (currentId && isSequential !== '0') {
            queryBuilder.andWhere('post.id < :currentId', { currentId });
        }
        if (identifier !== undefined) {
            isUsed = '0';
        }
        queryBuilder.andWhere('post.isDiscarded = :isDiscarded', { isDiscarded: false });
        if (platform === 'douyin') {
            queryBuilder.andWhere('post.douyinUsed = :douyinUsed', { douyinUsed: false });
        }
        else if (platform === 'xhs') {
            queryBuilder.andWhere('post.isUsed = :isUsed', { isUsed: false });
        }
        else {
            queryBuilder.andWhere('(post.isUsed = :isUsed OR post.douyinUsed = :douyinUsed)', {
                isUsed: false,
                douyinUsed: false
            });
        }
        queryBuilder.orderBy('post.createTime', 'DESC');
        queryBuilder.limit(1);
        return await queryBuilder.getMany();
    }
    async findOne(id) {
        const post = await this.xhsPostRepository.findOne({ where: { id } });
        if (post) {
            const result = Object.assign(Object.assign({}, post), { xhs_status: post.isUsed, douyin_status: post.douyinUsed });
            return result;
        }
        return post;
    }
    async update(id, updateXhsPostDto) {
        var _a, _b, _c, _d, _e;
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const post = await this.findOne(id);
            if (!post) {
                throw new Error('笔记不存在');
            }
            console.log('开始更新笔记:', {
                id,
                originalTitle: post.title,
                originalContentLength: ((_a = post.content) === null || _a === void 0 ? void 0 : _a.length) || 0,
                originalImagesCount: ((_b = post.images) === null || _b === void 0 ? void 0 : _b.length) || 0,
                updateTitle: updateXhsPostDto.title ? '有更新' : '无更新',
                updateContent: updateXhsPostDto.content ? '有更新' : '无更新',
                updateImagesCount: ((_c = updateXhsPostDto.images) === null || _c === void 0 ? void 0 : _c.length) || 0
            });
            if (updateXhsPostDto.images && updateXhsPostDto.images.length > 0) {
                const processedImages = [];
                for (const imageUrl of updateXhsPostDto.images) {
                    try {
                        if (imageUrl.startsWith('http') &&
                            (imageUrl.includes('picgo') ||
                                imageUrl.includes('cdn') ||
                                imageUrl.includes('oss') ||
                                imageUrl.includes('cos'))) {
                            processedImages.push(imageUrl);
                            console.log(`更新操作 - 使用现有CDN图片: ${imageUrl}`);
                        }
                        else {
                            const uploadResult = await this.imageUploadService.uploadToPicgo(imageUrl);
                            if (uploadResult && uploadResult.original_url) {
                                processedImages.push(uploadResult.original_url);
                                console.log(`更新操作 - 图片上传成功: ${imageUrl} -> ${uploadResult.original_url}`);
                            }
                            else {
                                processedImages.push(imageUrl);
                                console.warn(`更新操作 - 图片上传失败，使用原始URL: ${imageUrl}`);
                            }
                        }
                    }
                    catch (error) {
                        console.error(`更新操作 - 图片上传错误: ${error.message}`);
                        processedImages.push(imageUrl);
                    }
                }
                updateXhsPostDto.images = processedImages;
            }
            else if (updateXhsPostDto.images && updateXhsPostDto.images.length === 0) {
                console.log('更新操作 - 清空所有图片');
            }
            else {
                delete updateXhsPostDto.images;
                console.log('更新操作 - 保留原有图片');
            }
            if (updateXhsPostDto.cover) {
                try {
                    if (updateXhsPostDto.cover.startsWith('http') &&
                        (updateXhsPostDto.cover.includes('picgo') ||
                            updateXhsPostDto.cover.includes('cdn') ||
                            updateXhsPostDto.cover.includes('oss') ||
                            updateXhsPostDto.cover.includes('cos'))) {
                        console.log(`更新操作 - 使用现有CDN封面图片: ${updateXhsPostDto.cover}`);
                    }
                    else {
                        const coverResult = await this.imageUploadService.uploadToPicgo(updateXhsPostDto.cover);
                        if (coverResult && coverResult.original_url) {
                            updateXhsPostDto.cover = coverResult.original_url;
                            console.log(`更新操作 - 封面图片上传成功: ${updateXhsPostDto.cover}`);
                        }
                    }
                }
                catch (error) {
                    console.error(`更新操作 - 封面图片上传错误: ${error.message}`);
                }
            }
            const updatedPost = Object.assign({}, post);
            if (updateXhsPostDto.title !== undefined)
                updatedPost.title = updateXhsPostDto.title;
            if (updateXhsPostDto.content !== undefined)
                updatedPost.content = updateXhsPostDto.content;
            if (updateXhsPostDto.images !== undefined)
                updatedPost.images = updateXhsPostDto.images;
            if (updateXhsPostDto.cover !== undefined)
                updatedPost.cover = updateXhsPostDto.cover;
            if (updateXhsPostDto.type !== undefined)
                updatedPost.type = updateXhsPostDto.type;
            if (updateXhsPostDto.video !== undefined)
                updatedPost.video = updateXhsPostDto.video;
            if (updateXhsPostDto.identifier !== undefined)
                updatedPost.identifier = updateXhsPostDto.identifier;
            if (updateXhsPostDto.supplier !== undefined)
                updatedPost.supplier = updateXhsPostDto.supplier;
            const savedPost = await queryRunner.manager.save(xhs_entity_1.XhsPost, updatedPost);
            if (updateXhsPostDto.activityId !== undefined) {
                const existingActivityPost = await this.xhsActivityPostRepository.findOne({
                    where: { postId: id }
                });
                if (existingActivityPost) {
                    if (!updateXhsPostDto.activityId) {
                        await queryRunner.manager.remove(existingActivityPost);
                        console.log(`更新操作 - 删除活动关联: ${id}`);
                    }
                    else if (existingActivityPost.activityId !== updateXhsPostDto.activityId) {
                        existingActivityPost.activityId = updateXhsPostDto.activityId;
                        await queryRunner.manager.save(existingActivityPost);
                        console.log(`更新操作 - 更新活动关联: ${id} -> ${updateXhsPostDto.activityId}`);
                    }
                }
                else if (updateXhsPostDto.activityId) {
                    const activityPost = this.xhsActivityPostRepository.create({
                        postId: id,
                        activityId: updateXhsPostDto.activityId,
                    });
                    await queryRunner.manager.save(activityPost);
                    console.log(`更新操作 - 创建活动关联: ${id} -> ${updateXhsPostDto.activityId}`);
                }
            }
            await queryRunner.commitTransaction();
            console.log('更新笔记成功:', {
                id,
                newTitle: savedPost.title,
                newContentLength: ((_d = savedPost.content) === null || _d === void 0 ? void 0 : _d.length) || 0,
                newImagesCount: ((_e = savedPost.images) === null || _e === void 0 ? void 0 : _e.length) || 0
            });
            return savedPost;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('更新笔记事务失败:', error);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async markUsed(id, platform) {
        const postId = typeof id === 'string' ? id : id.toString();
        try {
            const post = await this.xhsPostRepository.findOne({ where: { id: postId } });
            if (!post) {
                throw new Error(`找不到ID为 ${postId} 的帖子`);
            }
            if (platform === 'douyin') {
                post.douyinUsed = true;
            }
            else {
                post.isUsed = true;
            }
            return await this.xhsPostRepository.save(post);
        }
        catch (error) {
            console.error(`标记帖子ID ${postId} 为已使用时出错:`, error);
            throw error;
        }
    }
    async markDiscarded(id) {
        const postId = typeof id === 'string' ? id : id.toString();
        try {
            const post = await this.xhsPostRepository.findOne({ where: { id: postId } });
            if (!post) {
                throw new Error(`找不到ID为 ${postId} 的帖子`);
            }
            post.isDiscarded = true;
            return await this.xhsPostRepository.save(post);
        }
        catch (error) {
            console.error(`标记帖子ID ${postId} 为弃用时出错:`, error);
            throw error;
        }
    }
    async remove(id) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.manager.delete(xhs_activity_post_entity_1.XhsActivityPost, { postId: id });
            await queryRunner.manager.delete(xhs_entity_1.XhsPost, id);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async clear() {
        return await this.xhsPostRepository.clear();
    }
    async processVideoUrl(videoUrl) {
        try {
            console.log(`开始处理视频: ${videoUrl}`);
            const response = await axios_1.default.get(videoUrl, {
                responseType: 'arraybuffer',
                timeout: 60000
            });
            const urlParts = videoUrl.split('/');
            let filename = urlParts[urlParts.length - 1];
            if (filename.includes('?')) {
                filename = filename.split('?')[0];
            }
            if (!filename.includes('.')) {
                filename = `${filename}.mp4`;
            }
            const file = {
                buffer: Buffer.from(response.data),
                mimetype: response.headers['content-type'] || 'video/mp4',
                originalname: filename
            };
            const uploadedUrl = await this.uploadService.uploadFile(file, 'videos');
            console.log(`视频处理完成，上传后的URL: ${uploadedUrl}`);
            return uploadedUrl;
        }
        catch (error) {
            console.error(`视频处理失败: ${error.message}`, error);
            throw new Error(`视频处理失败: ${error.message}`);
        }
    }
};
XhsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(xhs_entity_1.XhsPost)),
    __param(1, (0, typeorm_1.InjectRepository)(xhs_activity_post_entity_1.XhsActivityPost)),
    __param(2, (0, typeorm_1.InjectRepository)(xhs_signature_entity_1.XhsSignature)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        image_upload_service_1.ImageUploadService,
        id_generator_service_1.IdGeneratorService,
        upload_service_1.UploadService])
], XhsService);
exports.XhsService = XhsService;
