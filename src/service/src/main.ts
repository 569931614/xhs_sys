import { AllExceptionsFilter } from '@/common/filters/allExceptions.filter';
import { TypeOrmQueryFailedFilter } from '@/common/filters/typeOrmQueryFailed.filter';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
// import { createSwagger } from '@/common/swagger';
import { CustomLoggerService } from '@/common/logger/custom-logger.service';
import { initDatabase } from '@/modules/database/initDatabase';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as compression from 'compression';
import { randomBytes } from 'crypto';
import * as Dotenv from 'dotenv';
import Redis from 'ioredis';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';
import * as xmlBodyParser from 'express-xml-bodyparser';
Dotenv.config({ path: '.env' });

async function bootstrap() {
  try {
    const redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
      db: Number(process.env.REDIS_DB || 0),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    // 尝试获取现有的 JWT_SECRET
    const existingSecret = await redis.get('JWT_SECRET');

    if (!existingSecret) {
      // 如果不存在，生成新的 JWT_SECRET
      const jwtSecret = randomBytes(256).toString('base64');
      Logger.log('Generating and setting new JWT_SECRET');
      await redis.set('JWT_SECRET', jwtSecret);
    }

    const app = await NestFactory.create(AppModule);
    
    try {
      await initDatabase();
    } catch (error) {
      Logger.error('数据库初始化失败:', error);
      process.exit(1);
    }

    // 设置全局前缀
    app.setGlobalPrefix('api');

    // 根据环境变量设置全局 Logger
    app.useLogger(app.get(CustomLoggerService));

    app.use(compression());
    app.use(xmlBodyParser());
    // 静态文件目录
    const publicPath = join(__dirname, '..', 'public');
    const adminPath = join(publicPath, 'admin');
    const chatPath = join(publicPath, 'chat');
    const filePath = join(publicPath, 'file');

    // 确保目录存在
    if (!fs.existsSync(adminPath)) {
      Logger.warn(`Admin静态文件目录不存在: ${adminPath}`, 'Main');
      fs.mkdirSync(adminPath, { recursive: true });
    }
    
    if (!fs.existsSync(chatPath)) {
      Logger.warn(`Chat静态文件目录不存在: ${chatPath}`, 'Main');
      fs.mkdirSync(chatPath, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
      Logger.warn(`filePath静态文件目录不存在: ${filePath}`, 'Main');
      fs.mkdirSync(filePath, { recursive: true });
    }

    // 注册静态资源中间件
    app.use('/admin', express.static(adminPath, { index: 'index.html' }));
    app.use('/chat', express.static(chatPath, { index: 'index.html' }));
    app.use('/file', express.static(filePath));

    // 添加中间件处理URL重写和路由
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      // 重写非标准API路径
      if (req.path.startsWith('/xhs/') || req.path.startsWith('/xhs-auto/')) {
        const originalUrl = req.url;
        req.url = `/api${req.url}`;
        
        // 保存原始URL以便后续可能需要
        req.originalUrl = originalUrl;
        
        // 记录URL重写日志以便调试
        Logger.debug(`URL重写: ${originalUrl} → ${req.url}`, 'URL重写中间件');
        
        next();
      } 
      // 正常API路径
      else if (req.path.startsWith('/api/')) {
        next();
      }
      // 处理admin路由的HTML5 history模式 
      else if (req.path.startsWith('/admin') && !req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|json|woff|woff2|ttf|eot)$/)) {
        res.sendFile(join(adminPath, 'index.html'));
      }
      // 处理chat路由的HTML5 history模式
      else if (req.path.startsWith('/chat') && !req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|json|woff|woff2|ttf|eot)$/)) {
        res.sendFile(join(chatPath, 'index.html'));
      }
      // 根路由重定向到admin
      else if (req.path === '/') {
        res.redirect('/admin/');
      }
      else {
        next();
      }
    });

    // 启用并配置 CORS
    app.enableCors({
      origin: '*', // 或者配置允许的具体域名
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    // app.enableCors();
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new TypeOrmQueryFailedFilter());
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }));
    app.getHttpAdapter().getInstance().set('views', 'templates/pages');
    app.getHttpAdapter().getInstance().set('view engine', 'hbs');

    const PORT = process.env.PORT || 3000;

    // createSwagger(app);
    const server = await app.listen(PORT, () => {
      // Logger.log(`服务启动成功: http://localhost:${PORT}/wagger/docs`, 'Main');
      Logger.log(`服务启动成功: http://localhost:${PORT}`, 'Main');
      Logger.log(`管理后台: http://localhost:${PORT}/admin`, 'Main');
      Logger.log(`聊天页面: http://localhost:${PORT}/chat`, 'Main');
    });
    server.timeout = 5 * 60 * 1000;
  } catch (error) {
    Logger.error('启动失败:', error);
    process.exit(1);
  }
}

bootstrap();
