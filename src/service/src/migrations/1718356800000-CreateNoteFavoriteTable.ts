import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateNoteFavoriteTable1718356800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 检查表是否已存在
    const tableExists = await queryRunner.hasTable('note_favorite');
    if (tableExists) {
      console.log('note_favorite表已存在，跳过创建');
      return;
    }

    // 创建note_favorite表
    await queryRunner.createTable(
      new Table({
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
      }),
      true,
    );

    // 尝试添加外键约束，如果失败则忽略
    try {
      await queryRunner.createForeignKey(
        'note_favorite',
        new TableForeignKey({
          columnNames: ['noteId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'note',
          onDelete: 'CASCADE',
        }),
      );
    } catch (error) {
      console.warn('无法创建外键约束，可能是参考表不存在或结构不匹配:', error);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('note_favorite', true);
  }
} 