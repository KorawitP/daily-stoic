@echo off
chcp 65001 >nul
title Deploy The Daily Stoic to GitHub Pages
echo ========================================================
echo   กำลังบิลด์และอัปเดต The Daily Stoic ขึ้น GitHub Pages...
echo ========================================================

cd /d "%~dp0webapp"
call "C:\Program Files\nodejs\npm.cmd" run build

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build ล้มเหลว กรุณาตรวจสอบโค้ด
    pause
    exit /b %ERRORLEVEL%
)

cd /d "%~dp0webapp\dist"
"C:\Program Files\Git\cmd\git.exe" add -A
"C:\Program Files\Git\cmd\git.exe" commit -m "Update Daily Stoic PWA"
"C:\Program Files\Git\cmd\git.exe" push origin gh-pages

cd /d "%~dp0"
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "Update project files"
"C:\Program Files\Git\cmd\git.exe" push origin main

echo ========================================================
echo   อัปเดตเรียบร้อยแล้ว! เว็บไซต์ออนไลน์ที่:
echo   https://korawitp.github.io/daily-stoic/
echo ========================================================
pause
