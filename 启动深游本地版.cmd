@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 深游 SHENYOU 本地版
echo 正在启动深游本地版...
echo 启动完成后，请打开 http://127.0.0.1:3001
echo 使用期间请保持此窗口开启。
echo.
npm.cmd run dev:local
