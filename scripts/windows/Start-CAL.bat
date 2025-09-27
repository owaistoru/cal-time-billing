@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

REM Resolve repo root
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%\..\.."
set "REPO_DIR=%CD%"
popd

echo Repo: %REPO_DIR%
echo Checking PostgreSQL service...

powershell -NoProfile -ExecutionPolicy Bypass -Command " $svc = Get-Service ^| Where-Object { `$_.Name -like 'postgresql*' -or `$_.Name -like 'postgres*' } ^| Select-Object -First 1; if ($svc) { if ($svc.Status -ne 'Running') { Start-Service $svc.Name; Start-Sleep -Seconds 2; Write-Host 'Started:' $svc.Name } else { Write-Host 'PostgreSQL already running:' $svc.Name } } else { Write-Host 'No PostgreSQL service found. Skipping.' } "

REM Start backend only (serves static frontend)
start "CAL Backend" cmd /k "cd /d %REPO_DIR%\backend && npm run start"

REM Open app
start "" http://localhost:5000/

endlocal
