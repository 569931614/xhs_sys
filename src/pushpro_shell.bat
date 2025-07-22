@echo off
setlocal enabledelayedexpansion

echo 正在构建admin项目...
cd /d F:\AICode\test_99ai\src\admin
pnpm build
if errorlevel 1 (
    echo admin项目构建失败
    pause
    exit /b 1
)

echo 正在构建chat项目...
cd /d F:\AICode\test_99ai\src\chat
pnpm build
if errorlevel 1 (
    echo chat项目构建失败
    pause
    exit /b 1
)

echo 正在构建service项目...
cd /d F:\AICode\test_99ai\src\service
pnpm build
if errorlevel 1 (
    echo service项目构建失败
    pause
    exit /b 1
)

echo 正在清空并复制admin/dist到pushpro/public/admin...
if exist "F:\AICode\test_99ai\src\pushpro\public\admin" (
    rmdir /s /q "F:\AICode\test_99ai\src\pushpro\public\admin"
)
mkdir "F:\AICode\test_99ai\src\pushpro\public\admin"
robocopy "F:\AICode\test_99ai\src\admin\dist" "F:\AICode\test_99ai\src\pushpro\public\admin" /E /NFL /NDL /NJH /NJS /NP

echo 正在清空并复制chat/dist到pushpro/public/chat...
if exist "F:\AICode\test_99ai\src\pushpro\public\chat" (
    rmdir /s /q "F:\AICode\test_99ai\src\pushpro\public\chat"
)
mkdir "F:\AICode\test_99ai\src\pushpro\public\chat"
robocopy "F:\AICode\test_99ai\src\chat\dist" "F:\AICode\test_99ai\src\pushpro\public\chat" /E /NFL /NDL /NJH /NJS /NP

echo 正在清空并复制dist到pushpro...
if exist "F:\AICode\test_99ai\src\pushpro\dist" (
    rmdir /s /q "F:\AICode\test_99ai\src\pushpro\dist"
)
mkdir "F:\AICode\test_99ai\src\pushpro\dist"
robocopy "F:\AICode\test_99ai\src\service\dist" "F:\AICode\test_99ai\src\pushpro\dist" /E /NFL /NDL /NJH /NJS /NP

echo 所有操作已完成!
pause