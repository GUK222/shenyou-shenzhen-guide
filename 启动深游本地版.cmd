@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 深游 SHENYOU 本地版
start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "$url='http://127.0.0.1:3001'; 1..90 | ForEach-Object { try { if ((Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1).StatusCode -eq 200) { Start-Process $url; break } } catch {}; Start-Sleep -Seconds 1 }"
echo 正在启动深游本地版，请稍候...
echo 准备完成后会自动打开 http://127.0.0.1:3001
echo 关闭此窗口即可停止应用。
npm.cmd run dev:local
