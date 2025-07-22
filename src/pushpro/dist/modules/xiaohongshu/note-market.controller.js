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
var NoteTemplateMarketController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteTemplateMarketController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const note_service_1 = require("./note.service");
const note_dto_1 = require("./dto/note.dto");
const jwtAuth_guard_1 = require("../../common/auth/jwtAuth.guard");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const note_like_entity_1 = require("./note-like.entity");
const note_view_entity_1 = require("./note-view.entity");
const note_entity_1 = require("./note.entity");
const note_favorite_entity_1 = require("./note-favorite.entity");
const typeorm_3 = require("typeorm");
let NoteTemplateMarketController = NoteTemplateMarketController_1 = class NoteTemplateMarketController {
    constructor(noteService, noteLikeRepository, noteViewRepository, noteRepository, noteFavoriteRepository) {
        this.noteService = noteService;
        this.noteLikeRepository = noteLikeRepository;
        this.noteViewRepository = noteViewRepository;
        this.noteRepository = noteRepository;
        this.noteFavoriteRepository = noteFavoriteRepository;
        this.logger = new common_1.Logger(NoteTemplateMarketController_1.name);
    }
    async findAll(query, req) {
        var _a, _b, _c;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        this.logger.log(`用户 ${userId} 请求笔记模板市场列表，参数: ${JSON.stringify(query)}`);
        try {
            if (query.favoriteOnly && userId) {
                this.logger.log(`用户 ${userId} 请求查看收藏的笔记`);
                const userFavorites = await this.noteFavoriteRepository.find({
                    where: { userId: userId.toString() }
                });
                if (!userFavorites || userFavorites.length === 0) {
                    this.logger.log(`用户 ${userId} 没有收藏任何笔记，返回空列表`);
                    return {
                        code: 0,
                        message: '获取成功',
                        data: {
                            items: [],
                            total: 0,
                            page: query.page || 1,
                            pageSize: query.pageSize || 10
                        }
                    };
                }
                const favoriteNoteIds = userFavorites.map(favorite => favorite.noteId);
                this.logger.log(`用户 ${userId} 收藏的笔记ID: ${favoriteNoteIds.join(', ')}`);
                const marketQuery = Object.assign(Object.assign({}, query), { status: true, noteIds: favoriteNoteIds });
                if (!marketQuery.orderBy) {
                    marketQuery.orderBy = 'createTime';
                    marketQuery.orderDirection = 'DESC';
                }
                if (marketQuery.botId === '') {
                    delete marketQuery.botId;
                    this.logger.log('移除空的botId参数');
                }
                this.logger.log(`处理后的查询参数: ${JSON.stringify(marketQuery)}`);
                const result = await this.noteService.findAllByIds(marketQuery, favoriteNoteIds);
                if (query.withUserStatus && result && result.items && result.items.length > 0) {
                    this.logger.log(`查询用户 ${userId} 对 ${result.items.length} 个笔记的收藏和点赞状态`);
                    const noteIds = result.items.map((note) => note.id);
                    const userLikes = await this.noteLikeRepository.find({
                        where: {
                            noteId: (0, typeorm_3.In)(noteIds),
                            userId: userId.toString()
                        }
                    });
                    const likeMap = new Map(userLikes.map(like => [like.noteId, true]));
                    result.items.forEach((note) => {
                        note.userStatus = {
                            liked: likeMap.has(note.id),
                            favorited: true
                        };
                    });
                    this.logger.log(`已添加用户状态信息到笔记列表`);
                }
                this.logger.log(`返回 ${((_b = result === null || result === void 0 ? void 0 : result.items) === null || _b === void 0 ? void 0 : _b.length) || 0} 个收藏的笔记`);
                return {
                    code: 0,
                    message: '获取成功',
                    data: result
                };
            }
            const marketQuery = Object.assign(Object.assign({}, query), { status: true });
            if (!marketQuery.orderBy) {
                marketQuery.orderBy = 'createTime';
                marketQuery.orderDirection = 'DESC';
            }
            if (marketQuery.botId === '') {
                delete marketQuery.botId;
                this.logger.log('移除空的botId参数');
            }
            this.logger.log(`处理后的查询参数: ${JSON.stringify(marketQuery)}`);
            const result = await this.noteService.findAll(marketQuery);
            let templateCount = 0;
            if (result && result.items) {
                result.items.forEach((item) => {
                    var _a;
                    templateCount += ((_a = item.htmlTemplates) === null || _a === void 0 ? void 0 : _a.length) || 0;
                });
            }
            if (query.withUserStatus && result && result.items && result.items.length > 0 && userId) {
                this.logger.log(`查询用户 ${userId} 对 ${result.items.length} 个笔记的收藏和点赞状态`);
                const noteIds = result.items.map((note) => note.id);
                const userLikes = await this.noteLikeRepository.find({
                    where: {
                        noteId: (0, typeorm_3.In)(noteIds),
                        userId: userId.toString()
                    }
                });
                const userFavorites = await this.noteFavoriteRepository.find({
                    where: {
                        noteId: (0, typeorm_3.In)(noteIds),
                        userId: userId.toString()
                    }
                });
                const likeMap = new Map(userLikes.map(like => [like.noteId, true]));
                const favoriteMap = new Map(userFavorites.map(favorite => [favorite.noteId, true]));
                result.items.forEach((note) => {
                    note.userStatus = {
                        liked: likeMap.has(note.id),
                        favorited: favoriteMap.has(note.id)
                    };
                });
                this.logger.log(`已添加用户状态信息到笔记列表`);
            }
            this.logger.log(`返回 ${((_c = result === null || result === void 0 ? void 0 : result.items) === null || _c === void 0 ? void 0 : _c.length) || 0} 个笔记，共包含 ${templateCount} 个HTML模板引用`);
            return {
                code: 0,
                message: '获取成功',
                data: result
            };
        }
        catch (error) {
            this.logger.error(`获取笔记模板市场列表失败: ${error.message}`, error.stack);
            return {
                code: 1,
                message: '获取模板列表失败，请稍后重试',
                data: {
                    items: [],
                    total: 0,
                    page: query.page || 1,
                    pageSize: query.pageSize || 10
                }
            };
        }
    }
    async findOne(id, req, query) {
        var _a, _b;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        this.logger.log(`用户 ${userId} 请求笔记ID: ${id} 的详情`);
        try {
            const note = await this.noteService.findOne(id);
            if (!note.status) {
                return {
                    code: 1,
                    message: '笔记不存在或已下架',
                    data: null,
                };
            }
            await this.recordView(id, userId.toString());
            if (query.withUserStatus && userId) {
                this.logger.log(`查询用户 ${userId} 对笔记 ${id} 的收藏和点赞状态`);
                const existingLike = await this.noteLikeRepository.findOne({
                    where: { noteId: id, userId: userId.toString() }
                });
                const existingFavorite = await this.noteFavoriteRepository.findOne({
                    where: { noteId: id, userId: userId.toString() }
                });
                note.userStatus = {
                    liked: !!existingLike,
                    favorited: !!existingFavorite
                };
                this.logger.log(`已添加用户状态信息到笔记详情`);
            }
            this.logger.log(`返回笔记详情，包含${((_b = note.htmlTemplates) === null || _b === void 0 ? void 0 : _b.length) || 0}个HTML模板`);
            return {
                code: 0,
                message: '获取成功',
                data: note,
            };
        }
        catch (error) {
            this.logger.error(`获取笔记详情失败: ${error.message}`, error.stack);
            return {
                code: 1,
                message: '获取笔记详情失败',
                data: null,
            };
        }
    }
    async likeNote(id, req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        this.logger.log(`用户 ${userId} 点赞笔记ID: ${id}`);
        try {
            const note = await this.noteRepository.findOne({ where: { id, status: true } });
            if (!note) {
                return {
                    code: 1,
                    message: '笔记不存在或已下架',
                    data: null,
                };
            }
            const existingLike = await this.noteLikeRepository.findOne({
                where: { noteId: id, userId: userId.toString() }
            });
            if (existingLike) {
                return {
                    code: 0,
                    message: '您已经点赞过此笔记',
                    data: { likesCount: note.likesCount },
                };
            }
            await this.noteLikeRepository.save({
                noteId: id,
                userId: userId.toString(),
            });
            note.likesCount += 1;
            await this.noteRepository.save(note);
            return {
                code: 0,
                message: '点赞成功',
                data: { likesCount: note.likesCount },
            };
        }
        catch (error) {
            this.logger.error(`点赞笔记出错: ${error.message}`, error.stack);
            return {
                code: 1,
                message: '点赞失败',
                data: null,
            };
        }
    }
    async unlikeNote(id, req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        this.logger.log(`用户 ${userId} 取消点赞笔记ID: ${id}`);
        try {
            const note = await this.noteRepository.findOne({ where: { id, status: true } });
            if (!note) {
                return {
                    code: 1,
                    message: '笔记不存在或已下架',
                    data: null,
                };
            }
            const existingLike = await this.noteLikeRepository.findOne({
                where: { noteId: id, userId: userId.toString() }
            });
            if (!existingLike) {
                return {
                    code: 0,
                    message: '您尚未点赞此笔记',
                    data: { likesCount: note.likesCount },
                };
            }
            await this.noteLikeRepository.remove(existingLike);
            note.likesCount = Math.max(0, note.likesCount - 1);
            await this.noteRepository.save(note);
            return {
                code: 0,
                message: '取消点赞成功',
                data: { likesCount: note.likesCount },
            };
        }
        catch (error) {
            this.logger.error(`取消点赞笔记出错: ${error.message}`, error.stack);
            return {
                code: 1,
                message: '取消点赞失败',
                data: null,
            };
        }
    }
    async getLikeStatus(id, req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        try {
            const existingLike = await this.noteLikeRepository.findOne({
                where: { noteId: id, userId: userId.toString() }
            });
            return {
                code: 0,
                message: '获取成功',
                data: {
                    liked: !!existingLike
                },
            };
        }
        catch (error) {
            this.logger.error(`获取点赞状态出错: ${error.message}`, error.stack);
            return {
                code: 1,
                message: '获取点赞状态失败',
                data: null,
            };
        }
    }
    async getFavoriteStatus(id, req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        this.logger.log(`用户 ${userId} 获取笔记ID: ${id} 的收藏状态`);
        try {
            const existingFavorite = await this.noteFavoriteRepository.findOne({
                where: { noteId: id, userId: userId.toString() }
            });
            return {
                code: 0,
                message: '获取收藏状态成功',
                data: { favorited: !!existingFavorite }
            };
        }
        catch (error) {
            this.logger.error(`获取收藏状态出错: ${error.message}`, error.stack);
            return {
                code: 1,
                message: '获取收藏状态失败',
                data: { favorited: false }
            };
        }
    }
    async favoriteNote(id, req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        this.logger.log(`用户 ${userId} 收藏笔记ID: ${id}`);
        try {
            const note = await this.noteRepository.findOne({ where: { id, status: true } });
            if (!note) {
                return {
                    code: 1,
                    message: '笔记不存在或已下架',
                    data: null,
                };
            }
            const existingFavorite = await this.noteFavoriteRepository.findOne({
                where: { noteId: id, userId: userId.toString() }
            });
            if (existingFavorite) {
                return {
                    code: 0,
                    message: '您已经收藏过此笔记',
                    data: { favorited: true }
                };
            }
            await this.noteFavoriteRepository.save({
                noteId: id,
                userId: userId.toString(),
            });
            return {
                code: 0,
                message: '收藏成功',
                data: { favorited: true }
            };
        }
        catch (error) {
            this.logger.error(`收藏笔记出错: ${error.message}`, error.stack);
            return {
                code: 1,
                message: '收藏失败',
                data: null
            };
        }
    }
    async unfavoriteNote(id, req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        this.logger.log(`用户 ${userId} 取消收藏笔记ID: ${id}`);
        try {
            const existingFavorite = await this.noteFavoriteRepository.findOne({
                where: { noteId: id, userId: userId.toString() }
            });
            if (!existingFavorite) {
                return {
                    code: 0,
                    message: '您尚未收藏此笔记',
                    data: { favorited: false }
                };
            }
            await this.noteFavoriteRepository.remove(existingFavorite);
            return {
                code: 0,
                message: '取消收藏成功',
                data: { favorited: false }
            };
        }
        catch (error) {
            this.logger.error(`取消收藏笔记出错: ${error.message}`, error.stack);
            return {
                code: 1,
                message: '取消收藏失败',
                data: null
            };
        }
    }
    async recordView(noteId, userId) {
        try {
            await this.noteViewRepository.save({
                noteId,
                userId,
            });
            const note = await this.noteRepository.findOne({ where: { id: noteId } });
            if (note) {
                note.viewsCount += 1;
                await this.noteRepository.save(note);
            }
        }
        catch (error) {
            this.logger.error(`记录预览操作失败: ${error.message}`, error.stack);
        }
    }
};
__decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('list'),
    (0, swagger_1.ApiOperation)({ summary: '获取笔记模板市场列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [note_dto_1.NoteQueryDto, Object]),
    __metadata("design:returntype", Promise)
], NoteTemplateMarketController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取笔记模板详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], NoteTemplateMarketController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)(':id/like'),
    (0, swagger_1.ApiOperation)({ summary: '点赞笔记模板' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '点赞成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], NoteTemplateMarketController.prototype, "likeNote", null);
__decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)(':id/unlike'),
    (0, swagger_1.ApiOperation)({ summary: '取消点赞笔记模板' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '取消点赞成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], NoteTemplateMarketController.prototype, "unlikeNote", null);
__decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)(':id/like-status'),
    (0, swagger_1.ApiOperation)({ summary: '获取用户对笔记模板的点赞状态' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], NoteTemplateMarketController.prototype, "getLikeStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)(':id/favorite-status'),
    (0, swagger_1.ApiOperation)({ summary: '获取用户对笔记模板的收藏状态' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], NoteTemplateMarketController.prototype, "getFavoriteStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)(':id/favorite'),
    (0, swagger_1.ApiOperation)({ summary: '收藏笔记模板' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '收藏成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], NoteTemplateMarketController.prototype, "favoriteNote", null);
__decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)(':id/unfavorite'),
    (0, swagger_1.ApiOperation)({ summary: '取消收藏笔记模板' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '取消收藏成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], NoteTemplateMarketController.prototype, "unfavoriteNote", null);
NoteTemplateMarketController = NoteTemplateMarketController_1 = __decorate([
    (0, swagger_1.ApiTags)('笔记模板市场'),
    (0, common_1.Controller)('xiaohongshu/note-template-market'),
    __param(1, (0, typeorm_1.InjectRepository)(note_like_entity_1.NoteLike)),
    __param(2, (0, typeorm_1.InjectRepository)(note_view_entity_1.NoteView)),
    __param(3, (0, typeorm_1.InjectRepository)(note_entity_1.Note)),
    __param(4, (0, typeorm_1.InjectRepository)(note_favorite_entity_1.NoteFavorite)),
    __metadata("design:paramtypes", [note_service_1.NoteService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], NoteTemplateMarketController);
exports.NoteTemplateMarketController = NoteTemplateMarketController;
