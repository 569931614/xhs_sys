import { config } from 'dotenv';
import * as mysql from 'mysql2/promise';

// 加载环境变量
config();

async function resetTables() {
  console.log('开始重置AI相关数据表...');
  
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
    console.log('备份现有数据...');
    
    // 备份ai_image_tasks表数据
    const [tasks] = await connection.query('SELECT * FROM ai_image_tasks');
    console.log(`备份了 ${Array.isArray(tasks) ? tasks.length : 0} 条任务数据`);
    
    // 备份ai_generated_images表数据
    const [images] = await connection.query('SELECT * FROM ai_generated_images');
    console.log(`备份了 ${Array.isArray(images) ? images.length : 0} 条图片数据`);

    // 备份ai_image_url_mappings表数据
    try {
      const [mappings] = await connection.query('SELECT * FROM ai_image_url_mappings');
      console.log(`备份了 ${Array.isArray(mappings) ? mappings.length : 0} 条URL映射数据`);
    } catch (error) {
      console.log('URL映射表不存在，无需备份');
    }
    
    console.log('删除现有表...');
    
    // 删除表（先删除有外键约束的表）
    await connection.query('DROP TABLE IF EXISTS ai_generated_images');
    await connection.query('DROP TABLE IF EXISTS ai_image_url_mappings');
    await connection.query('DROP TABLE IF EXISTS ai_image_tasks');
    
    console.log('表已删除，等待应用程序重启后自动重建表...');
    console.log('提示: 需要重启应用程序以应用新的实体定义并重建表结构');
    console.log('重启后建议运行 checkTables.ts 检查表结构是否正确');
    
  } catch (error) {
    console.error('重置表时出错:', error);
  } finally {
    // 关闭连接
    await connection.end();
    console.log('数据库连接已关闭');
  }
}

// 执行重置
resetTables().catch(error => {
  console.error('执行重置时出错:', error);
  process.exit(1);
}); 