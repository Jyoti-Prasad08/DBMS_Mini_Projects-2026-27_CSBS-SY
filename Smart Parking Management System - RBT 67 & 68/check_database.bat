@echo off
title MySQL Database Inspector - Smart Parking System
color 0B
cd /d "%~dp0"
python check_database.py
echo.
pause

