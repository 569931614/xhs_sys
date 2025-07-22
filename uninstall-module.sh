#!/bin/bash
# 该脚本用于删除指定的npm模块

# 检查是否提供了模块名
if [ -z "$1" ]; then
  echo "错误: 请指定要删除的模块名称"
  echo "用法: $0 <模块名称> [部署目录]"
  exit 1
fi

# 模块名称
MODULE_NAME="$1"

# 服务部署目录，可以通过第二个参数指定
DEPLOY_DIR=${2:-"/www/wwwroot/20250421_xhs_pro_sys"}
echo "开始从 $DEPLOY_DIR 删除模块 $MODULE_NAME..."

# 进入部署目录
cd $DEPLOY_DIR || { echo "无法进入部署目录 $DEPLOY_DIR"; exit 1; }

# 停止PM2服务
echo "停止当前运行的服务..."
pm2 stop all

# 删除模块
echo "删除模块 $MODULE_NAME..."
npm uninstall $MODULE_NAME

# 检查模块是否已删除
if [ -d "node_modules/$MODULE_NAME" ]; then
  echo "❌ 警告: 模块 $MODULE_NAME 可能未成功删除，尝试手动删除..."
  rm -rf "node_modules/$MODULE_NAME"
  
  if [ -d "node_modules/$MODULE_NAME" ]; then
    echo "❌ 手动删除失败，请检查权限问题"
  else
    echo "✅ 手动删除成功"
  fi
else
  echo "✅ 模块 $MODULE_NAME 已成功删除"
fi

# 更新package.json (移除依赖项)
echo "更新package.json..."
node -e "const pkg=require('./package.json'); delete pkg.dependencies['$MODULE_NAME']; require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

echo "删除完成."
echo "是否要重启服务? (y/n)"
read -r answer
if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
  echo "重启服务..."
  pm2 restart all
  echo "服务已重启."
else
  echo "未重启服务."
fi 