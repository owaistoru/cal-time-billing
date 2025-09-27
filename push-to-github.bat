@echo off
setlocal ENABLEDELAYEDEXPANSION

REM === CONFIG ===
set REPO_URL=https://github.com/owaistoru/cal-time-billing.git

REM === Move to the folder where this script lives (project root) ===
pushd "%~dp0"

echo.
echo ───────────────────────────────────────────────────────────────
echo  Auto Push to GitHub: %REPO_URL%
echo ───────────────────────────────────────────────────────────────
echo.

REM === Check git availability ===
where git >NUL 2>&1
if errorlevel 1 (
  echo [ERROR] Git is not installed or not in PATH.
  echo         Install Git from https://git-scm.com/downloads and run again.
  echo.
  pause
  exit /b 1
)

REM === Initialize repository if needed ===
if not exist ".git" (
  echo [INIT] Initializing git repository...
  git init
)

REM === Ensure we're on 'main' branch ===
git rev-parse --abbrev-ref HEAD >NUL 2>&1
if errorlevel 1 (
  git checkout -B main
) else (
  for /f %%b in ('git rev-parse --abbrev-ref HEAD') do set CURBR=%%b
  if /I not "!CURBR!"=="main" (
    echo [BRANCH] Switching/creating 'main' branch...
    git checkout -B main
  )
)

REM === Basic user identity if missing (local to repo) ===
for /f "delims=" %%i in ('git config user.name 2^>NUL') do set GITNAME=%%i
if not defined GITNAME (
  git config user.name "Owais"
)

for /f "delims=" %%i in ('git config user.email 2^>NUL') do set GITEMAIL=%%i
if not defined GITEMAIL (
  git config user.email "owaistoru@users.noreply.github.com"
)

REM === Create a sane .gitignore if missing ===
if not exist ".gitignore" (
  echo [WRITE] Creating .gitignore ...
  > ".gitignore" (
    echo # Node
    echo node_modules/
    echo dist/
    echo build/
    echo .cache/
    echo .vite/
    echo npm-debug.log*
    echo yarn-error.log*
    echo pnpm-debug.log*
    echo
    echo # Env
    echo .env
    echo .env.*
    echo !.env.example
    echo
    echo # OS
    echo .DS_Store
    echo Thumbs.db
    echo
    echo # Logs
    echo logs/
    echo *.log
    echo
    echo # Editors
    echo .vscode/
    echo .idea/
    echo
    echo # Coverage
    echo coverage/
  )
)

REM === Make sure env files are not tracked ===
git rm --cached -f .env        >NUL 2>&1
git rm --cached -f backend\.env >NUL 2>&1
git rm --cached -f frontend\.env >NUL 2>&1

REM === Set / fix remote origin to the desired URL ===
for /f "delims=" %%r in ('git remote get-url origin 2^>NUL') do set CURRENT_REMOTE=%%r
if not defined CURRENT_REMOTE (
  echo [REMOTE] Adding origin -> %REPO_URL%
  git remote add origin %REPO_URL%
) else (
  if /I not "%CURRENT_REMOTE%"=="%REPO_URL%" (
    echo [REMOTE] Updating origin URL -> %REPO_URL%
    git remote set-url origin %REPO_URL%
  )
)

REM === Stage and commit ===
echo [ADD] Staging changes...
git add -A

echo [COMMIT] Committing (if there are changes)...
git commit -m "Automated push from push-to-github.bat" >NUL 2>&1
if errorlevel 1 (
  echo [COMMIT] Nothing to commit (working tree clean).
)

REM === Push ===
echo [PUSH] Pushing to GitHub (main)...
git push -u origin main
if errorlevel 1 (
  echo.
  echo [ERROR] Push failed. If prompted for credentials, use a GitHub Personal Access Token
  echo         as the password (Settings -> Developer settings -> Personal access tokens).
  echo.
  pause
  exit /b 1
)

echo.
echo ✅  Pushed this folder to %REPO_URL%
echo ✅  Done.
echo.
pause

popd
endlocal
