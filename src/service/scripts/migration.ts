import dataSource from '../src/config/dataSource';

async function runMigrations() {
  try {
    await dataSource.initialize();
    console.log('数据源已初始化');
    
    await dataSource.runMigrations();
    console.log('数据库迁移成功完成');
    
    await dataSource.destroy();
    console.log('数据源连接已关闭');
    
    process.exit(0);
  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  }
}

runMigrations(); 