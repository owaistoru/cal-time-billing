@echo off
REM push.bat - launcher for PowerShell script
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0push.ps1"
