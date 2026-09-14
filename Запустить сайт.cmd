@echo off
setlocal
title Zemledelets - localhost:8080
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local.ps1" %*
if errorlevel 1 pause
endlocal
