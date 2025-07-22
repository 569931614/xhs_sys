import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomPageController } from './customPage.controller';
import { CustomPageService } from './customPage.service';
import { CustomPage } from './customPage.entity';
import { RedisCacheModule } from '@/modules/redisCache/redisCache.module';
import { UserTypeModule } from '@/modules/userType/user-type.module';
import { UserModule } from '@/modules/user/user.module';
import { UserTypeAuthMiddleware } from './middlewares/user-type-auth.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomPage]),
    RedisCacheModule,
    UserTypeModule,
    UserModule,
  ],
  controllers: [CustomPageController],
  providers: [CustomPageService],
  exports: [CustomPageService],
})
export class CustomPageModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserTypeAuthMiddleware)
      .forRoutes('page/:path'); // 这里需要配置实际访问自定义页面的路由路径
  }
} 