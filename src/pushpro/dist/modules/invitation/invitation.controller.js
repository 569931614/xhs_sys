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
var InvitationController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwtAuth_guard_1 = require("../../common/auth/jwtAuth.guard");
const invitation_service_1 = require("./invitation.service");
const acceptInvitation_dto_1 = require("./dto/acceptInvitation.dto");
const passport_1 = require("@nestjs/passport");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const globalConfig_service_1 = require("../globalConfig/globalConfig.service");
let InvitationController = InvitationController_1 = class InvitationController {
    constructor(invitationService, globalConfigService) {
        this.invitationService = invitationService;
        this.globalConfigService = globalConfigService;
        this.logger = new common_1.Logger(InvitationController_1.name);
    }
    async getInviteLink(req) {
        try {
            const userId = req.user.id;
            const inviteCode = await this.invitationService.getInviteLink(userId);
            const configDomain = await this.globalConfigService.getConfigs(['siteUrl']);
            this.logger.log(`从全局配置获取域名: ${configDomain}`);
            const domain = configDomain || req.headers.origin || 'http://localhost:9002';
            this.logger.log(`最终使用域名: ${domain}`);
            const inviteLink = `${domain}/chat#/chat?invite=${inviteCode.split('invite=')[1]}`;
            return inviteLink;
        }
        catch (error) {
            this.logger.error(`获取邀请链接失败: ${error.message}`, error.stack);
            throw new common_1.HttpException(error.message || '获取邀请链接失败', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getInviteList(req) {
        try {
            const userId = req.user.id;
            console.log(`正在获取用户ID ${userId} 的邀请列表`);
            const list = await this.invitationService.getInviteList(userId);
            console.log(`用户ID ${userId} 的邀请列表:`, JSON.stringify(list));
            let responseData = [];
            if (Array.isArray(list)) {
                responseData = list;
            }
            else if (list && typeof list === 'object') {
                responseData = [list];
            }
            return {
                code: 200,
                message: '获取成功',
                data: responseData,
                success: true,
            };
        }
        catch (error) {
            console.error(`获取邀请列表错误: ${error.message}`, error.stack);
            throw new common_1.HttpException(error.message || '获取邀请列表失败', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getInviteStats(req) {
        try {
            const userId = req.user.id;
            const stats = await this.invitationService.getInviteStats(userId);
            return {
                code: 200,
                message: '获取成功',
                data: stats,
                success: true,
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '获取邀请统计失败', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async acceptInvitation(acceptDto) {
        try {
            const { inviteCode, userId } = acceptDto;
            const result = await this.invitationService.acceptInvitation(inviteCode, userId);
            return {
                code: 200,
                message: '接受邀请成功',
                data: result,
                success: true,
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '接受邀请失败', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getDirectInvitees(req) {
        const userId = req.user.id;
        return await this.invitationService.getDirectInvitees(userId);
    }
    async getInviter(req) {
        const userId = req.user.id;
        return await this.invitationService.getInviter(userId);
    }
    async getTotalInvitees(req) {
        const userId = req.user.id;
        const directCount = await this.invitationService.getDirectInvitees(userId).then(invitees => invitees.length);
        return {
            directCount,
            totalCount: await this.invitationService.countTotalInvitees(userId)
        };
    }
    async getMyInvitations(req, paginationDto) {
        const userId = req.user.id;
        return this.invitationService.getUserInvitations(userId, paginationDto);
    }
    async getInvitationCount(req) {
        const userId = req.user.id;
        const count = await this.invitationService.getUserInvitationCount(userId);
        return { count };
    }
    async getMyInviter(req) {
        const userId = req.user.id;
        return this.invitationService.getUserInviter(userId);
    }
};
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取邀请链接' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('link'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "getInviteLink", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取邀请列表' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "getInviteList", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取邀请统计信息' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "getInviteStats", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '接受邀请' }),
    (0, common_1.Post)('accept'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [acceptInvitation_dto_1.AcceptInvitationDto]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "acceptInvitation", null);
__decorate([
    (0, common_1.Get)('direct-invitees'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '获取直接邀请的用户列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取邀请列表' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "getDirectInvitees", null);
__decorate([
    (0, common_1.Get)('inviter'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '获取我的邀请人' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取邀请人信息' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "getInviter", null);
__decorate([
    (0, common_1.Get)('count'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '获取我邀请的总人数' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取邀请总人数' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "getTotalInvitees", null);
__decorate([
    (0, common_1.Get)('my-invitations'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '获取我的邀请记录' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取邀请记录' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "getMyInvitations", null);
__decorate([
    (0, common_1.Get)('count'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '获取我的邀请总人数' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取邀请总人数' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "getInvitationCount", null);
__decorate([
    (0, common_1.Get)('my-inviter'),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '获取我的邀请人' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取邀请人信息' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "getMyInviter", null);
InvitationController = InvitationController_1 = __decorate([
    (0, swagger_1.ApiTags)('邀请系统'),
    (0, common_1.Controller)('invitation'),
    __metadata("design:paramtypes", [invitation_service_1.InvitationService,
        globalConfig_service_1.GlobalConfigService])
], InvitationController);
exports.InvitationController = InvitationController;
