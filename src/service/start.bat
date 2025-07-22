@echo off
echo 使用自定义 .env 配置启动 99AI 服务...

REM 检查.env文件是否存在
if not exist ".env" (
    echo 错误：.env 文件不存在！
    exit /b 1
)

REM 输出启动信息
echo 使用自定义 .env 配置启动 99AI 服务...

REM 安装依赖
echo 正在安装依赖...
call pnpm install

REM 停止
echo 正在停止...
call npx pm2 stop all

REM 删除
echo 正在删除...
call npx pm2 delete all

REM 构建项目
echo 正在构建项目...
call pnpm build

REM 启动服务
echo 正在启动服务...
call pnpm start

echo 服务已启动，请查看日志获取详细信息 