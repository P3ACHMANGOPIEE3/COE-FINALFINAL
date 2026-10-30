@echo off
title COE-Pay Local Server
cd /d "%~dp0"
echo ========================================================================
echo  COE-Pay: Centralized Payment Authorization, Collection & Monitoring
echo  ICCT Colleges Foundation, Inc. - College of Engineering
echo ========================================================================
echo.
echo Launching COE-Pay local web server...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Server encountered an error. Press any key to exit.
    pause
)
