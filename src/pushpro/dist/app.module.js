"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const abort_interceptor_1 = require("./common/interceptors/abort.interceptor");
const custom_logger_service_1 = require("./common/logger/custom-logger.service");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const fetch = require("isomorphic-fetch");
const app_module_1 = require("./modules/app/app.module");
const auth_module_1 = require("./modules/auth/auth.module");
const autoreply_module_1 = require("./modules/autoreply/autoreply.module");
const badWords_module_1 = require("./modules/badWords/badWords.module");
const chat_module_1 = require("./modules/chat/chat.module");
const chatGroup_module_1 = require("./modules/chatGroup/chatGroup.module");
const chatLog_module_1 = require("./modules/chatLog/chatLog.module");
const coze_module_1 = require("./modules/coze/coze.module");
const crami_module_1 = require("./modules/crami/crami.module");
const customPage_module_1 = require("./modules/customPage/customPage.module");
const database_module_1 = require("./modules/database/database.module");
const font_module_1 = require("./modules/font/font.module");
const globalConfig_module_1 = require("./modules/globalConfig/globalConfig.module");
const invitation_module_1 = require("./modules/invitation/invitation.module");
const models_module_1 = require("./modules/models/models.module");
const backup_models_module_1 = require("./modules/models/backup-models.module");
const official_module_1 = require("./modules/official/official.module");
const order_module_1 = require("./modules/order/order.module");
const pay_module_1 = require("./modules/pay/pay.module");
const plugin_module_1 = require("./modules/plugin/plugin.module");
const redisCache_module_1 = require("./modules/redisCache/redisCache.module");
const signin_module_1 = require("./modules/signin/signin.module");
const statistic_module_1 = require("./modules/statistic/statistic.module");
const task_module_1 = require("./modules/task/task.module");
const upload_module_1 = require("./modules/upload/upload.module");
const user_module_1 = require("./modules/user/user.module");
const userBalance_module_1 = require("./modules/userBalance/userBalance.module");
const user_type_module_1 = require("./modules/userType/user-type.module");
const verification_module_1 = require("./modules/verification/verification.module");
const xhs_module_1 = require("./modules/xhs/xhs.module");
const jwtAuth_guard_1 = require("./common/auth/jwtAuth.guard");
const ai_api_module_1 = require("./modules/ai/ai_api.module");
const promptlib_module_1 = require("./modules/promptlib/promptlib.module");
const xiaohongshu_module_1 = require("./modules/xiaohongshu/xiaohongshu.module");
const ai_module_1 = require("./modules/ai/ai.module");
const aimedia_module_1 = require("./modules/aimedia/aimedia.module");
const material_module_1 = require("./modules/material/material.module");
const userFunction_module_1 = require("./modules/userFunction/userFunction.module");
const accountAnalysis_module_1 = require("./modules/accountAnalysis/accountAnalysis.module");
const htmllib_module_1 = require("./modules/htmllib/htmllib.module");
const image_generator_module_1 = require("./modules/imageGenerator/image-generator.module");
global.fetch = fetch;
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            app_module_1.AppModule,
            database_module_1.DatabaseModule,
            globalConfig_module_1.GlobalConfigModule,
            redisCache_module_1.RedisCacheModule,
            user_module_1.UserModule,
            auth_module_1.AuthModule,
            models_module_1.ModelsModule,
            backup_models_module_1.BackupModelsModule,
            chat_module_1.ChatModule,
            official_module_1.OfficialModule,
            autoreply_module_1.AutoreplyModule,
            chatLog_module_1.ChatLogModule,
            plugin_module_1.PluginModule,
            crami_module_1.CramiModule,
            order_module_1.OrderModule,
            pay_module_1.PayModule,
            chatGroup_module_1.ChatGroupModule,
            userBalance_module_1.UserBalanceModule,
            customPage_module_1.CustomPageModule,
            signin_module_1.SigninModule,
            statistic_module_1.StatisticModule,
            badWords_module_1.BadWordsModule,
            user_type_module_1.UserTypeModule,
            verification_module_1.VerificationModule,
            task_module_1.TaskModule,
            upload_module_1.UploadModule,
            xhs_module_1.XhsModule,
            coze_module_1.CozeModule,
            ai_api_module_1.AiApiModule,
            promptlib_module_1.PromptLibModule,
            xiaohongshu_module_1.XiaohongshuModule,
            invitation_module_1.InvitationModule,
            ai_module_1.AiModule,
            aimedia_module_1.AiMediaModule,
            material_module_1.MaterialModule,
            userFunction_module_1.UserFunctionModule,
            accountAnalysis_module_1.AccountAnalysisModule,
            htmllib_module_1.HtmlLibModule,
            font_module_1.FontModule,
            image_generator_module_1.ImageGeneratorModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwtAuth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: abort_interceptor_1.AbortInterceptor,
            },
            custom_logger_service_1.CustomLoggerService,
        ],
    })
], AppModule);
exports.AppModule = AppModule;
