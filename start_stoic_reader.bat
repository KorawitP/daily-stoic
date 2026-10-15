@echo off
chcp 65001 >nul
title The Daily Stoic Reader (Thai Edition)
echo ========================================================
echo   The Daily Stoic: 366 วันแห่งปัญญาและการใช้ชีวิต
echo   กำลังเปิดระบบเว็บแอปพลิเคชันส่วนตัว...
echo ========================================================
cd /d "%~dp0webapp"
echo เปิดเบราว์เซอร์ไปที่ http://localhost:5173 ...
timeout /t 2 /nobreak >nul
start http://localhost:5173
"C:\Program Files\nodejs\npm.cmd" run dev
pause
