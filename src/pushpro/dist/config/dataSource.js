"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSourceOptions = void 0;
const typeorm_1 = require("typeorm");
const config_1 = require("@nestjs/config");
const path = require("path");
const configService = new config_1.ConfigService();
exports.dataSourceOptions = {
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
const dataSource = new typeorm_1.DataSource(exports.dataSourceOptions);
exports.default = dataSource;
