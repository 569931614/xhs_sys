@echo off
echo 启动99AI服务...

cd src\service

REM 检查.env文件是否存在
if not exist ".env" (
    echo 警告：.env 文件不存在，将使用默认配置！
)

echo 正在安装依赖...
call pnpm install

REM 确保安装关键依赖
echo 确保安装关键依赖...
call pnpm add python-shell
call pnpm add express-xml-bodyparser

echo 正在停止已有服务...
call npx pm2 stop all
call npx pm2 delete all

echo 正在构建项目...
call pnpm build

echo 正在启动服务...
call pnpm start

echo 服务已启动，请查看日志获取详细信息
pause 