@echo off
title WeatherGPT Launcher
echo ========================================================
echo        Starting WeatherGPT AI Assistant...
echo ========================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [NOTE] Node.js is not found on your system PATH.
    echo Opening WeatherGPT directly in your browser...
    start "" "%~dp0frontend\index.html"
    echo.
    echo Opened! Enjoy WeatherGPT.
    pause
    exit /b
)

:: If Node is installed, navigate to project folder
cd /d "%~dp0"

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Installing required dependencies (first-time setup)...
    call npm install
)

echo [INFO] Starting WeatherGPT Backend & Web Server...
echo [INFO] Server will be available at http://localhost:3000
echo.

:: Open browser after 2 seconds in background
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

:: Run the Express server
node backend/server.js
pause
