import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 3306),
  username: configService.get('DB_USERNAME', 'root'),
  password: configService.get('DB_PASSWORD', '123456'),
  database: configService.get('DB_DATABASE', 'chatgpt_web'),
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../migrations/**/*{.ts,.js}')],
  synchronize: false,
  logging: ['error'],
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource; 