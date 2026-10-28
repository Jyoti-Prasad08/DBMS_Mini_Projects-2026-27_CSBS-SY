@echo off
title Smart Parking Management System
color 0A
cd /d "%~dp0"

echo =====================================================================
echo         SMART PARKING MANAGEMENT SYSTEM - LAUNCHER
echo =====================================================================
echo.

:: 1. Check Python installation
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Python is not installed or not added to your system PATH.
    echo Please install Python 3.10+ and check "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

:: 2. Check and auto-install mysql-connector-python if needed
python -c "import mysql.connector" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [INFO] Installing required package 'mysql-connector-python'...
    python -m pip install mysql-connector-python
    if %ERRORLEVEL% neq 0 (
        color 0C
        echo [ERROR] Failed to install mysql-connector-python.
        echo Please ensure you have internet access and pip installed.
        echo.
        pause
        exit /b 1
    )
)

:: 3. Launch Application
echo [INFO] Starting Smart Parking Management System...
echo.
python main.py

:: 4. If application exited with error, keep window open so error can be inspected
if %ERRORLEVEL% neq 0 (
    color 0C
    echo.
    echo [NOTICE] Application closed with an exit code: %ERRORLEVEL%
    pause
)

