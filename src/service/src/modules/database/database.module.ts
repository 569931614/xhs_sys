import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () =>
        ({
          type: 'mysql',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT, 10),
          username: process.env.DB_USER,
          password: process.env.DB_PASS,
          database: process.env.DB_DATABASE,
          entities: [__dirname + '/../**/*.entity{.ts,.js}', __dirname + '/../**/*.entities{.ts,.js}'],
          synchronize: false,
          logging: ['error', 'warn'],
          charset: 'utf8mb4',
          timezone: '+08:00',
          extra: {
            charset: 'utf8mb4',
            collation: 'utf8mb4_general_ci',
            supportBigNumbers: true,
            bigNumberStrings: false,
            foreign_key_checks: 0 // 禁用外键检查
          }
        } as DataSourceOptions),
    }),
  ],
  providers: [DatabaseService],
})
export class DatabaseModule implements OnModuleInit {
  constructor(private readonly connection: DataSource) {}
  private readonly logger = new Logger(DatabaseModule.name);

  onModuleInit(): void {
    const { database } = this.connection.options;
    this.logger.log(`MySQL数据库 ${database} 已连接`);
    this.logger.log(`数据库同步已启用，实体将自动同步到数据库`);
    
    const entities = this.connection.entityMetadatas;
    this.logger.log(`已加载 ${entities.length} 个实体`);
    
    for (const entity of entities) {
      this.logger.debug(`- 实体: ${entity.name}, 表名: ${entity.tableName}`);
    }
  }
}
