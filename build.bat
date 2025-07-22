@echo off
echo 开始执行构建过程...

echo 构建admin项目...
cd /d F:\AICode\test_99ai\src\admin
call pnpm build

echo 构建chat项目...
cd /d F:\AICode\test_99ai\src\chat
call pnpm build

echo 构建service项目...
cd /d F:\AICode\test_99ai\src\service
call pnpm build

echo 清空目标文件夹...
if exist "F:\AICode\test_99ai\src\pushpro\public\admin" (
    del /q /s /f "F:\AICode\test_99ai\src\pushpro\public\admin\*.*"
) else (
    mkdir "F:\AICode\test_99ai\src\pushpro\public\admin"
)

if exist "F:\AICode\test_99ai\src\pushpro\public\chat" (
    del /q /s /f "F:\AICode\test_99ai\src\pushpro\public\chat\*.*"
) else (
    mkdir "F:\AICode\test_99ai\src\pushpro\public\chat"
)

if exist "F:\AICode\test_99ai\src\pushpro\dist" (
    rd /s /q "F:\AICode\test_99ai\src\pushpro\dist"
)

echo 复制文件...
xcopy "F:\AICode\test_99ai\src\admin\dist\*" "F:\AICode\test_99ai\src\pushpro\public\admin\" /s /e /y
xcopy "F:\AICode\test_99ai\src\chat\dist\*" "F:\AICode\test_99ai\src\pushpro\public\chat\" /s /e /y
xcopy "F:\AICode\test_99ai\src\service\dist" "F:\AICode\test_99ai\src\pushpro\dist\" /s /e /y

echo 构建和复制过程完成！
pause 