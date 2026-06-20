@echo off
chcp 65001 >nul
title 旅行地图
cd /d "%~dp0"

echo ======================================
echo   🌏 我的旅行地图 — 启动中...
echo ======================================
echo.

:: 打开浏览器
start http://localhost:8080

:: 用 PowerShell 启动内置 HTTP 服务器
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"

pause
