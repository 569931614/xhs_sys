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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserTypeAuthMiddleware = void 0;
const common_1 = require("@nestjs/common");
const customPage_service_1 = require("../customPage.service");
const user_service_1 = require("../../user/user.service");
let UserTypeAuthMiddleware = class UserTypeAuthMiddleware {
    constructor(customPageService, userService) {
        this.customPageService = customPageService;
        this.userService = userService;
    }
    async use(req, res, next) {
        try {
            const { path } = req.params;
            const customPage = await this.customPageService.findByPath(path);
            if (customPage.status === 0) {
                throw new common_1.HttpException('页面已禁用', common_1.HttpStatus.FORBIDDEN);
            }
            if (!customPage.userTypes || customPage.userTypes.length === 0) {
                return next();
            }
            if (req.user && req.user.id) {
                const user = await this.userService.getUserById(req.user.id);
                if (!user) {
                    throw new common_1.HttpException('用户不存在', common_1.HttpStatus.UNAUTHORIZED);
                }
                if (user.userType && customPage.userTypes.includes(user.userType)) {
                    return next();
                }
            }
            throw new common_1.HttpException('没有权限访问该页面', common_1.HttpStatus.FORBIDDEN);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('页面访问出错', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
UserTypeAuthMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [customPage_service_1.CustomPageService,
        user_service_1.UserService])
], UserTypeAuthMiddleware);
exports.UserTypeAuthMiddleware = UserTypeAuthMiddleware;
