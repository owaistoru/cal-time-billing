@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

REM Resolve repo root from this script location
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%\..\.."
set "REPO_DIR=%CD%"
popd

echo Repo: %REPO_DIR%
echo Checking PostgreSQL service...

REM One-line PowerShell; no carets; no weird escaping
powershell -NoProfile -ExecutionPolicy Bypass -Command " $svc = Get-Service ^| Where-Object { `$_.Name -like 'postgresql*' -or `$_.Name -like 'postgres*' } ^| Select-Object -First 1; if ($svc) { if ($svc.Status -ne 'Running') { Start-Service $svc.Name; Start-Sleep -Seconds 2; Write-Host 'Started:' $svc.Name } else { Write-Host 'PostgreSQL already running:' $svc.Name } } else { Write-Host 'No PostgreSQL service found. Skipping.' } "

REM Start backend
start "CAL Backend" cmd /k "cd /d %REPO_DIR%\backend && npm run start"

REM Start frontend
start "CAL Frontend" cmd /k "cd /d %REPO_DIR%\frontend && npm run dev"

REM Open the app in the default browser
start "" http://localhost:5173/

endlocal
