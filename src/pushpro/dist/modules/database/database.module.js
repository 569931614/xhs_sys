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
var DatabaseModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const database_service_1 = require("./database.service");
let DatabaseModule = DatabaseModule_1 = class DatabaseModule {
    constructor(connection) {
        this.connection = connection;
        this.logger = new common_1.Logger(DatabaseModule_1.name);
    }
    onModuleInit() {
        const { database } = this.connection.options;
        this.logger.log(`MySQL数据库 ${database} 已连接`);
        this.logger.log(`数据库同步已启用，实体将自动同步到数据库`);
        const entities = this.connection.entityMetadatas;
        this.logger.log(`已加载 ${entities.length} 个实体`);
        for (const entity of entities) {
            this.logger.debug(`- 实体: ${entity.name}, 表名: ${entity.tableName}`);
        }
    }
};
DatabaseModule = DatabaseModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                useFactory: () => ({
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
                        foreign_key_checks: 0
                    }
                }),
            }),
        ],
        providers: [database_service_1.DatabaseService],
    }),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], DatabaseModule);
exports.DatabaseModule = DatabaseModule;
