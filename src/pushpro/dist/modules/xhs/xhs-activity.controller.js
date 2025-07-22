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
exports.XhsActivityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const xhs_activity_service_1 = require("./xhs-activity.service");
const xhs_activity_dto_1 = require("./dto/xhs-activity.dto");
const jwtAuth_guard_1 = require("../../common/auth/jwtAuth.guard");
let XhsActivityController = class XhsActivityController {
    constructor(activityService) {
        this.activityService = activityService;
    }
    async getStats(req) {
        var _a;
        console.log('getStats：', req.user);
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 0;
        return this.activityService.getActivityStats(userId);
    }
    async ensureDefault(req) {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 0;
        return this.activityService.ensureDefaultActivity(userId);
    }
    async create(createDto, req) {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 0;
        return this.activityService.create(createDto, userId);
    }
    async findAll(queryDto, req) {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 0;
        queryDto.userId = userId;
        return this.activityService.findAll(queryDto);
    }
    async findOne(id) {
        return this.activityService.findOne(id);
    }
    async update(id, updateDto) {
        return this.activityService.update(id, updateDto);
    }
    async remove(id) {
        return this.activityService.remove(id);
    }
    async addPost(id, dto) {
        return this.activityService.addPostToActivity(id, dto.postId.toString());
    }
    async removePost(id, postId) {
        return this.activityService.removePostFromActivity(id, postId.toString());
    }
    async getPosts(id) {
        return this.activityService.getActivityPosts(id);
    }
};
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: '获取活动统计信息' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], XhsActivityController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)('ensure-default'),
    (0, swagger_1.ApiOperation)({ summary: '确保有默认活动' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], XhsActivityController.prototype, "ensureDefault", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建活动' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [xhs_activity_dto_1.CreateXhsActivityDto, Object]),
    __metadata("design:returntype", Promise)
], XhsActivityController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取活动列表' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [xhs_activity_dto_1.QueryXhsActivityDto, Object]),
    __metadata("design:returntype", Promise)
], XhsActivityController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取活动详情' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '活动ID' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], XhsActivityController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新活动' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '活动ID' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, xhs_activity_dto_1.UpdateXhsActivityDto]),
    __metadata("design:returntype", Promise)
], XhsActivityController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除活动' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '活动ID' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], XhsActivityController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/posts'),
    (0, swagger_1.ApiOperation)({ summary: '添加笔记到活动' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '活动ID' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, xhs_activity_dto_1.AddPostToActivityDto]),
    __metadata("design:returntype", Promise)
], XhsActivityController.prototype, "addPost", null);
__decorate([
    (0, common_1.Delete)(':id/posts/:postId'),
    (0, swagger_1.ApiOperation)({ summary: '从活动中移除笔记' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '活动ID' }),
    (0, swagger_1.ApiParam)({ name: 'postId', description: '笔记ID' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], XhsActivityController.prototype, "removePost", null);
__decorate([
    (0, common_1.Get)(':id/posts'),
    (0, swagger_1.ApiOperation)({ summary: '获取活动的所有笔记' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '活动ID' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], XhsActivityController.prototype, "getPosts", null);
XhsActivityController = __decorate([
    (0, swagger_1.ApiTags)('小红书活动类型'),
    (0, common_1.Controller)('xhs/activities'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [xhs_activity_service_1.XhsActivityService])
], XhsActivityController);
exports.XhsActivityController = XhsActivityController;
