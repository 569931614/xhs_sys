"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const allExceptions_filter_1 = require("./common/filters/allExceptions.filter");
const typeOrmQueryFailed_filter_1 = require("./common/filters/typeOrmQueryFailed.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const custom_logger_service_1 = require("./common/logger/custom-logger.service");
const initDatabase_1 = require("./modules/database/initDatabase");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const compression = require("compression");
const crypto_1 = require("crypto");
const Dotenv = require("dotenv");
const ioredis_1 = require("ioredis");
const app_module_1 = require("./app.module");
const express = require("express");
const path_1 = require("path");
const fs = require("fs");
const xmlBodyParser = require("express-xml-bodyparser");
Dotenv.config({ path: '.env' });
async function bootstrap() {
    try {
        const redis = new ioredis_1.default({
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD,
            db: Number(process.env.REDIS_DB || 0),
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });
        const existingSecret = await redis.get('JWT_SECRET');
        if (!existingSecret) {
            const jwtSecret = (0, crypto_1.randomBytes)(256).toString('base64');
            common_1.Logger.log('Generating and setting new JWT_SECRET');
            await redis.set('JWT_SECRET', jwtSecret);
        }
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        try {
            await (0, initDatabase_1.initDatabase)();
        }
        catch (error) {
            common_1.Logger.error('数据库初始化失败:', error);
            process.exit(1);
        }
        app.setGlobalPrefix('api');
        app.useLogger(app.get(custom_logger_service_1.CustomLoggerService));
        app.use(compression());
        app.use(xmlBodyParser());
        const publicPath = (0, path_1.join)(__dirname, '..', 'public');
        const adminPath = (0, path_1.join)(publicPath, 'admin');
        const chatPath = (0, path_1.join)(publicPath, 'chat');
        const filePath = (0, path_1.join)(publicPath, 'file');
        if (!fs.existsSync(adminPath)) {
            common_1.Logger.warn(`Admin静态文件目录不存在: ${adminPath}`, 'Main');
            fs.mkdirSync(adminPath, { recursive: true });
        }
        if (!fs.existsSync(chatPath)) {
            common_1.Logger.warn(`Chat静态文件目录不存在: ${chatPath}`, 'Main');
            fs.mkdirSync(chatPath, { recursive: true });
        }
        if (!fs.existsSync(filePath)) {
            common_1.Logger.warn(`filePath静态文件目录不存在: ${filePath}`, 'Main');
            fs.mkdirSync(filePath, { recursive: true });
        }
        app.use('/admin', express.static(adminPath, { index: 'index.html' }));
        app.use('/chat', express.static(chatPath, { index: 'index.html' }));
        app.use('/file', express.static(filePath));
        app.use((req, res, next) => {
            if (req.path.startsWith('/xhs/') || req.path.startsWith('/xhs-auto/')) {
                const originalUrl = req.url;
                req.url = `/api${req.url}`;
                req.originalUrl = originalUrl;
                common_1.Logger.debug(`URL重写: ${originalUrl} → ${req.url}`, 'URL重写中间件');
                next();
            }
            else if (req.path.startsWith('/api/')) {
                next();
            }
            else if (req.path.startsWith('/admin') && !req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|json|woff|woff2|ttf|eot)$/)) {
                res.sendFile((0, path_1.join)(adminPath, 'index.html'));
            }
            else if (req.path.startsWith('/chat') && !req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|json|woff|woff2|ttf|eot)$/)) {
                res.sendFile((0, path_1.join)(chatPath, 'index.html'));
            }
            else if (req.path === '/') {
                res.redirect('/admin/');
            }
            else {
                next();
            }
        });
        app.enableCors({
            origin: '*',
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            preflightContinue: false,
            optionsSuccessStatus: 204,
        });
        app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
        app.useGlobalFilters(new typeOrmQueryFailed_filter_1.TypeOrmQueryFailedFilter());
        app.useGlobalFilters(new allExceptions_filter_1.AllExceptionsFilter());
        app.useGlobalPipes(new common_1.ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: false,
        }));
        app.getHttpAdapter().getInstance().set('views', 'templates/pages');
        app.getHttpAdapter().getInstance().set('view engine', 'hbs');
        const PORT = process.env.PORT || 3000;
        const server = await app.listen(PORT, () => {
            common_1.Logger.log(`服务启动成功: http://localhost:${PORT}`, 'Main');
            common_1.Logger.log(`管理后台: http://localhost:${PORT}/admin`, 'Main');
            common_1.Logger.log(`聊天页面: http://localhost:${PORT}/chat`, 'Main');
        });
        server.timeout = 5 * 60 * 1000;
    }
    catch (error) {
        common_1.Logger.error('启动失败:', error);
        process.exit(1);
    }
}
bootstrap();
