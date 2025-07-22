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
exports.XhsActivityService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const xhs_activity_entity_1 = require("./xhs-activity.entity");
const xhs_activity_post_entity_1 = require("./xhs-activity-post.entity");
const xhs_entity_1 = require("./xhs.entity");
let XhsActivityService = class XhsActivityService {
    constructor(activityRepository, activityPostRepository, postRepository) {
        this.activityRepository = activityRepository;
        this.activityPostRepository = activityPostRepository;
        this.postRepository = postRepository;
    }
    generateRandomId(prefix = 'a') {
        const timestamp = Date.now().toString().slice(-6);
        const randomStr = Math.random().toString(36).substring(2, 7);
        return `${prefix}_${timestamp}${randomStr}`;
    }
    async create(createDto, userId) {
        if (!createDto.id) {
            createDto.id = this.generateRandomId();
        }
        const activity = this.activityRepository.create(Object.assign(Object.assign({}, createDto), { userId }));
        if (activity.isDefault) {
            await this.activityRepository.update({ userId, isDefault: true }, { isDefault: false });
        }
        return this.activityRepository.save(activity);
    }
    async ensureDefaultActivity(userId) {
        const defaultActivity = await this.activityRepository.findOne({
            where: { userId, isDefault: true },
        });
        if (defaultActivity) {
            return defaultActivity;
        }
        const activity = this.activityRepository.create({
            id: this.generateRandomId('d'),
            name: '日常使用',
            type: 'normal',
            status: 'active',
            isDefault: true,
            userId,
        });
        return this.activityRepository.save(activity);
    }
    async findAll(queryDto) {
        const { name, type, status, isDefault, userId } = queryDto;
        const queryBuilder = this.activityRepository.createQueryBuilder('activity');
        if (userId !== undefined) {
            queryBuilder.andWhere('activity.userId = :userId', { userId });
        }
        if (name) {
            queryBuilder.andWhere('activity.name LIKE :name', { name: `%${name}%` });
        }
        if (type) {
            queryBuilder.andWhere('activity.type = :type', { type });
        }
        if (status) {
            queryBuilder.andWhere('activity.status = :status', { status });
        }
        if (isDefault !== undefined) {
            queryBuilder.andWhere('activity.isDefault = :isDefault', { isDefault });
        }
        queryBuilder.orderBy('activity.isDefault', 'DESC');
        queryBuilder.addOrderBy('activity.createTime', 'DESC');
        return queryBuilder.getMany();
    }
    async findOne(id) {
        const activity = await this.activityRepository.findOne({
            where: { id },
        });
        if (!activity) {
            throw new common_1.NotFoundException(`活动ID ${id} 不存在`);
        }
        return activity;
    }
    async update(id, updateDto) {
        const activity = await this.findOne(id);
        if (updateDto.status && activity.isDefault) {
            if (updateDto.status !== 'active') {
                throw new Error('默认活动只能设置为活跃状态');
            }
        }
        if (updateDto.isDefault) {
            await this.activityRepository.update({ userId: activity.userId, isDefault: true }, { isDefault: false });
        }
        await this.activityRepository.update(id, updateDto);
        return this.findOne(id);
    }
    async remove(id) {
        const activity = await this.findOne(id);
        if (activity.isDefault) {
            throw new Error('不能删除默认活动');
        }
        await this.activityRepository.remove(activity);
    }
    async addPostToActivity(activityId, postId) {
        await this.findOne(activityId);
        const post = await this.postRepository.findOne({
            where: { id: postId },
        });
        if (!post) {
            throw new common_1.NotFoundException(`笔记ID ${postId} 不存在`);
        }
        post.identifier = activityId;
        return this.postRepository.save(post);
    }
    async removePostFromActivity(activityId, postId) {
        const post = await this.postRepository.findOne({
            where: { id: postId, identifier: activityId },
        });
        if (!post) {
            throw new common_1.NotFoundException(`活动 ${activityId} 中不存在笔记 ${postId}`);
        }
        post.identifier = null;
        await this.postRepository.save(post);
    }
    async getActivityPosts(activityId) {
        await this.findOne(activityId);
        const queryBuilder = this.postRepository.createQueryBuilder('post');
        queryBuilder.where('post.identifier = :activityId', { activityId });
        return queryBuilder.getMany();
    }
    async getActivityStats(userId) {
        await this.ensureDefaultActivity(userId);
        const activities = await this.activityRepository.find({
            where: { userId },
            order: { isDefault: 'DESC', createTime: 'DESC' },
        });
        const result = [];
        for (const activity of activities) {
            const activityPosts = await this.getActivityPosts(activity.id);
            let posts = activityPosts;
            if (activity.isDefault && posts.length === 0) {
                posts = await this.postRepository.createQueryBuilder('post')
                    .where('post.userId = :userId', { userId })
                    .andWhere('(post.identifier IS NULL OR post.identifier = \'\')')
                    .getMany();
            }
            const totalNotes = posts.length;
            const availableNotes = posts.filter(post => !post.isUsed).length;
            const publishedNotes = posts.filter(post => post.isUsed).length;
            result.push({
                id: activity.id,
                name: activity.name,
                type: activity.type,
                status: activity.status,
                isDefault: activity.isDefault,
                totalNotes,
                availableNotes,
                publishedNotes,
            });
        }
        return result;
    }
};
XhsActivityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(xhs_activity_entity_1.XhsActivity)),
    __param(1, (0, typeorm_1.InjectRepository)(xhs_activity_post_entity_1.XhsActivityPost)),
    __param(2, (0, typeorm_1.InjectRepository)(xhs_entity_1.XhsPost)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], XhsActivityService);
exports.XhsActivityService = XhsActivityService;
