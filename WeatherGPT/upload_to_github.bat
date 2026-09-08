@echo off
title WeatherGPT - GitHub Uploader
echo ========================================================
echo        WeatherGPT GitHub Upload Assistant
echo ========================================================
echo.

:: Check if Git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed on your computer.
    echo.
    echo Solution:
    echo 1. You can upload files directly on https://github.com using your web browser (Drag and Drop).
    echo 2. OR download and install Git from: https://git-scm.com/download/win
    echo.
    pause
    exit /b
)

echo [OK] Git is detected!
echo.
set /p REPO_URL="Enter your GitHub Repository URL (e.g. https://github.com/username/WeatherGPT.git): "

if "%REPO_URL%"=="" (
    echo [ERROR] No URL entered. Please run again and paste your GitHub repository URL.
    pause
    exit /b
)

echo.
echo [1/4] Initializing Git...
cd /d "%~dp0"
if not exist ".git\" (
    git init
)

echo [2/4] Adding files (excluding .env and node_modules)...
git add .

echo [3/4] Creating commit...
git commit -m "WeatherGPT: Intelligent Multilingual Weather Assistant"

echo [4/4] Connecting to GitHub and pushing...
git branch -M main
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo   SUCCESS! WeatherGPT is now uploaded to your GitHub!
    echo ========================================================
) else (
    echo [NOTE] Push failed. If GitHub asked for a password, note that GitHub
    echo requires a Personal Access Token or browser login instead of your password.
)
echo.
pause
