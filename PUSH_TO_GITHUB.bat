@echo off
title Dong Bo PhimCuaToi Len GitHub
chcp 65001 >nul
cls

echo ====================================================================
echo      DONG BO DU AN PHIM CUA TOI LEN GITHUB & VERCEL AUTO-DEPLOY
echo ====================================================================
echo.
echo Repo: https://github.com/nhhuan90-ux/phimcuatoi.git
echo Branch: main
echo.

cd /d "%~dp0"

echo [1/3] Kiem tra trang thai Git...
"C:\Program Files\Git\cmd\git.exe" status
echo.

echo [2/3] Dang day code len GitHub (git push origin main)...
echo Neu trinh duyet mo ra cua so dang nhap GitHub, vui long chon 'Sign in with your browser'.
echo.
"C:\Program Files\Git\cmd\git.exe" push -u origin main

if errorlevel 1 (
    echo.
    echo ====================================================================
    echo [LOI] Khong the day code len GitHub.
    echo Vui long kiem tra quyen truy cap repo hoac su dung Personal Access Token.
    echo ====================================================================
) else (
    echo.
    echo ====================================================================
    echo [THANH CONG] Da day code len GitHub thanh cong!
    echo Vercel se tu dong nhan commit moi va tien hanh Deploy len web chinh.
    echo ====================================================================
)

echo.
pause
