import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateFontTable1717654321123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'font',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: '主键id',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            comment: '字体名称',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '100',
            comment: '字体代码',
          },
          {
            name: 'preview',
            type: 'varchar',
            length: '500',
            isNullable: true,
            comment: '预览图URL',
          },
          {
            name: 'url',
            type: 'varchar',
            length: '500',
            comment: '字体文件URL',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            default: "'ttf'",
            comment: '字体类型',
          },
          {
            name: 'status',
            type: 'boolean',
            default: true,
            comment: '状态',
          },
          {
            name: 'sort',
            type: 'int',
            default: 0,
            comment: '排序',
          },
          {
            name: 'source',
            type: 'varchar',
            length: '50',
            default: "'api'",
            comment: '来源',
          },
          {
            name: 'remark',
            type: 'varchar',
            length: '500',
            isNullable: true,
            comment: '备注',
          },
          {
            name: 'createTime',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            comment: '创建时间',
          },
          {
            name: 'updateTime',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            comment: '更新时间',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('font');
  }
} 