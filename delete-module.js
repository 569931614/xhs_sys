/**
 * 简单的模块删除脚本
 * 用法: node delete-module.js <模块名称>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 获取要删除的模块名
const moduleName = process.argv[2];

if (!moduleName) {
  console.error('错误: 请提供要删除的模块名');
  console.log('用法: node delete-module.js <模块名称>');
  process.exit(1);
}

console.log(`开始删除模块: ${moduleName}`);

try {
  // 1. 使用npm uninstall删除模块
  console.log(`执行: npm uninstall ${moduleName}`);
  execSync(`npm uninstall ${moduleName}`, { stdio: 'inherit' });
  
  // 2. 如果文件夹仍然存在，尝试手动删除
  const modulePath = path.join('node_modules', moduleName);
  if (fs.existsSync(modulePath)) {
    console.log(`模块文件夹仍然存在，尝试手动删除...`);
    fs.rmSync(modulePath, { recursive: true, force: true });
    console.log(`已手动删除模块文件夹`);
  }
  
  // 3. 更新package.json
  console.log('更新package.json...');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = require(packageJsonPath);
    
    // 从dependencies和devDependencies中移除
    let removed = false;
    
    if (packageJson.dependencies && packageJson.dependencies[moduleName]) {
      delete packageJson.dependencies[moduleName];
      removed = true;
    }
    
    if (packageJson.devDependencies && packageJson.devDependencies[moduleName]) {
      delete packageJson.devDependencies[moduleName];
      removed = true;
    }
    
    if (removed) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`已从package.json中移除${moduleName}`);
    } else {
      console.log(`package.json中未找到${moduleName}`);
    }
  } else {
    console.log('未找到package.json文件');
  }
  
  console.log(`模块${moduleName}删除成功!`);
} catch (error) {
  console.error(`删除模块时出错: ${error.message}`);
  process.exit(1);
} 