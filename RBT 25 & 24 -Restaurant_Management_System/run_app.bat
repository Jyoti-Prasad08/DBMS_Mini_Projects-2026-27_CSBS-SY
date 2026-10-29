@echo off
title Restaurant Management System - DBMS Project
cd /d "%~dp0"

echo ========================================================
echo   Launching Restaurant Management System (Streamlit)
echo ========================================================
echo.

:: Automatically unblock any pyd DLLs if Application Control or SmartScreen flagged them
powershell -NoProfile -Command "Get-ChildItem -Path '%LOCALAPPDATA%\Programs\Python\Python313\Lib\site-packages' -Recurse -Filter '*.pyd' -ErrorAction SilentlyContinue | Unblock-File" 2>nul

python -m streamlit run app.py

pause
