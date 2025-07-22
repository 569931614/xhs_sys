#!/bin/bash
# 该脚本用于确保所有必要的依赖都已安装

# 设置部署目录
DEPLOY_DIR=${1:-"/www/wwwroot/20250421_xhs_pro_sys"}
echo "正在检查和安装依赖，部署目录: $DEPLOY_DIR"

# 进入部署目录
cd $DEPLOY_DIR || { echo "无法进入部署目录 $DEPLOY_DIR"; exit 1; }

# 确保安装关键依赖 - 单独安装以确保成功
echo "安装关键依赖..."
npm install python-shell --save
npm install express-xml-bodyparser --save

# 安装package.json中的所有依赖
echo "安装所有项目依赖..."
npm install

# 验证关键依赖是否安装成功
echo "验证关键依赖安装..."
if [ -d "node_modules/python-shell" ]; then
    echo "✅ python-shell安装成功！"
else
    echo "❌ 警告: python-shell未安装成功，请手动检查。"
fi

if [ -d "node_modules/express-xml-bodyparser" ]; then
    echo "✅ express-xml-bodyparser安装成功！"
else
    echo "❌ 警告: express-xml-bodyparser未安装成功，请手动检查。"
fi

echo "依赖安装完成。"
echo "如果仍有缺失依赖，可以运行: npm install <依赖名称> --save" 