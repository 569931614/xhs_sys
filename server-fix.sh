#!/bin/bash
# 该脚本用于在服务器上快速修复依赖问题

# 服务部署目录
DEPLOY_DIR="/www/wwwroot/20250421_xhs_pro_sys"
echo "开始修复 $DEPLOY_DIR 的依赖问题..."

# 进入部署目录
cd $DEPLOY_DIR || { echo "无法进入部署目录 $DEPLOY_DIR"; exit 1; }

# 停止PM2服务
echo "停止当前运行的服务..."
pm2 stop all

# 安装缺失的依赖
echo "安装缺失的依赖..."
npm install express-xml-bodyparser --save
npm install python-shell --save

# 其他可能缺失的常用依赖
echo "安装其他常用依赖..."
npm install body-parser --save
npm install qs --save
npm install form-data --save

# 确保所有依赖都已安装
echo "确保所有依赖都已安装..."
npm install

# 检查关键依赖是否已安装
echo "验证依赖安装状态:"
for pkg in "express-xml-bodyparser" "python-shell" "body-parser" "qs" "form-data"
do
  if [ -d "node_modules/$pkg" ]; then
    echo "✅ $pkg: 已安装"
  else
    echo "❌ $pkg: 未安装成功，请手动检查"
  fi
done

# 重启服务
echo "重启服务..."
pm2 restart all

echo "修复完成。请检查服务是否正常运行。"
echo "您可以通过 pm2 logs 查看日志输出。" 