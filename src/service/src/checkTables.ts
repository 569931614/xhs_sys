import { config } from 'dotenv';
import * as mysql from 'mysql2/promise';

// 加载环境变量
config();

async function checkTables() {
  // 创建数据库连接
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
  });

  console.log('数据库连接成功');

  try {
    // 查询所有表
    const [tables] = await connection.query('SHOW TABLES');
    console.log('数据库中的表:');
    console.log(tables);
    
    // 检查特定表是否存在
    const aiTaskTableName = 'ai_image_tasks';
    const [taskTable] = await connection.query(`SHOW TABLES LIKE '${aiTaskTableName}'`);
    if (Array.isArray(taskTable) && taskTable.length > 0) {
      console.log(`表 ${aiTaskTableName} 存在`);
      
      // 查询表结构
      const [columns] = await connection.query(`DESCRIBE ${aiTaskTableName}`);
      console.log(`表 ${aiTaskTableName} 的结构:`);
      console.log(columns);

      // 查询表中的索引
      const [taskIndices] = await connection.query(`SHOW INDEX FROM ${aiTaskTableName}`);
      console.log(`表 ${aiTaskTableName} 的索引:`);
      console.log(taskIndices);
    } else {
      console.log(`表 ${aiTaskTableName} 不存在`);
    }
    
    // 检查图片表是否存在
    const aiImageTableName = 'ai_generated_images';
    const [imageTable] = await connection.query(`SHOW TABLES LIKE '${aiImageTableName}'`);
    if (Array.isArray(imageTable) && imageTable.length > 0) {
      console.log(`表 ${aiImageTableName} 存在`);
      
      // 查询表结构
      const [imageColumns] = await connection.query(`DESCRIBE ${aiImageTableName}`);
      console.log(`表 ${aiImageTableName} 的结构:`);
      console.log(imageColumns);

      // 查询表中的索引
      const [imageIndices] = await connection.query(`SHOW INDEX FROM ${aiImageTableName}`);
      console.log(`表 ${aiImageTableName} 的索引:`);
      console.log(imageIndices);

      // 查询表中的外键
      try {
        const [fkInfo] = await connection.query(`
          SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE REFERENCED_TABLE_SCHEMA = '${process.env.DB_DATABASE}'
          AND TABLE_NAME = '${aiImageTableName}'
        `);
        console.log(`表 ${aiImageTableName} 的外键:`);
        console.log(fkInfo);
      } catch (error) {
        console.error('查询外键信息时出错:', error);
      }
    } else {
      console.log(`表 ${aiImageTableName} 不存在`);
    }

    // 检查URL映射表是否存在
    const aiMappingTableName = 'ai_image_url_mappings';
    const [mappingTable] = await connection.query(`SHOW TABLES LIKE '${aiMappingTableName}'`);
    if (Array.isArray(mappingTable) && mappingTable.length > 0) {
      console.log(`表 ${aiMappingTableName} 存在`);
      
      // 查询表结构
      const [mappingColumns] = await connection.query(`DESCRIBE ${aiMappingTableName}`);
      console.log(`表 ${aiMappingTableName} 的结构:`);
      console.log(mappingColumns);

      // 查询表中的索引
      const [mappingIndices] = await connection.query(`SHOW INDEX FROM ${aiMappingTableName}`);
      console.log(`表 ${aiMappingTableName} 的索引:`);
      console.log(mappingIndices);
    } else {
      console.log(`表 ${aiMappingTableName} 不存在`);
    }

    // 查看表中记录数
    const [taskCount] = await connection.query(`SELECT COUNT(*) as count FROM ${aiTaskTableName}`);
    console.log(`表 ${aiTaskTableName} 中的记录数:`, taskCount);

    const [imageCount] = await connection.query(`SELECT COUNT(*) as count FROM ${aiImageTableName}`);
    console.log(`表 ${aiImageTableName} 中的记录数:`, imageCount);

    if (Array.isArray(mappingTable) && mappingTable.length > 0) {
      const [mappingCount] = await connection.query(`SELECT COUNT(*) as count FROM ${aiMappingTableName}`);
      console.log(`表 ${aiMappingTableName} 中的记录数:`, mappingCount);
    }
  } catch (error) {
    console.error('查询数据库时出错:', error);
  } finally {
    // 关闭连接
    await connection.end();
    console.log('数据库连接已关闭');
  }
}

// 执行检查
checkTables().catch(error => {
  console.error('执行检查时出错:', error);
  process.exit(1);
}); 