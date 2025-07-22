"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateNoteFavoriteTable1718356800000 = void 0;
const typeorm_1 = require("typeorm");
class CreateNoteFavoriteTable1718356800000 {
    async up(queryRunner) {
        const tableExists = await queryRunner.hasTable('note_favorite');
        if (tableExists) {
            console.log('note_favorite表已存在，跳过创建');
            return;
        }
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'note_favorite',
            columns: [
                {
                    name: 'id',
                    type: 'int',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'increment',
                },
                {
                    name: 'noteId',
                    type: 'int',
                    comment: '笔记ID',
                },
                {
                    name: 'userId',
                    type: 'varchar',
                    length: '255',
                    comment: '用户ID',
                },
                {
                    name: 'createTime',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                    comment: '创建时间',
                },
                {
                    name: 'updateTime',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                    onUpdate: 'CURRENT_TIMESTAMP',
                    comment: '更新时间',
                },
            ],
            indices: [
                {
                    name: 'idx_note_favorite_user',
                    columnNames: ['noteId', 'userId'],
                    isUnique: true,
                },
            ],
        }), true);
        try {
            await queryRunner.createForeignKey('note_favorite', new typeorm_1.TableForeignKey({
                columnNames: ['noteId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'note',
                onDelete: 'CASCADE',
            }));
        }
        catch (error) {
            console.warn('无法创建外键约束，可能是参考表不存在或结构不匹配:', error);
        }
    }
    async down(queryRunner) {
        await queryRunner.dropTable('note_favorite', true);
    }
}
exports.CreateNoteFavoriteTable1718356800000 = CreateNoteFavoriteTable1718356800000;
