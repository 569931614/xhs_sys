"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiProtected = exports.API_PROTECTED_KEY = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_guard_1 = require("../auth/api.guard");
exports.API_PROTECTED_KEY = 'api_protected';
function ApiProtected(description) {
    return (0, common_1.applyDecorators)((0, common_1.SetMetadata)(exports.API_PROTECTED_KEY, true), (0, common_1.UseGuards)(api_guard_1.ApiKeyGuard), (0, swagger_1.ApiOperation)({
        summary: description || '需要API密钥认证的端点',
    }), (0, swagger_1.ApiHeader)({
        name: 'x-api-key',
        description: 'API认证密钥',
        required: true,
    }), (0, swagger_1.ApiQuery)({
        name: 'apiKey',
        description: 'API认证密钥(如果请求头中未提供)',
        required: false,
        type: String,
    }));
}
exports.ApiProtected = ApiProtected;
