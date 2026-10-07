@echo off
title Phim Cua Toi - 1-Click Launcher
chcp 65001 >nul
cls

echo ====================================================================
echo             PHIM CUA TOI - CHƯƠNG TRÌNH KHỞI CHẠY 1 NHẤP
echo ====================================================================
echo.
echo  Kiem tra Node.js va thu vien project...
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [LOI] May chua cai dat Node.js!
    echo Vui long cai dat Node.js tư https://nodejs.org/ de chay du an Phim Cua Toi.
    pause
    exit /b 1
)

set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

if not exist "node_modules\" (
    echo [THONG BAO] Dang cai dat cac thu vien npm (npm install)...
    call npm install
)

echo.
echo [OK] Dang chay du an Phim Cua Toi (Vite + Express Server)...
call npm run dev:all

echo.
pause
