# push.ps1
$ErrorActionPreference = 'Stop'

Write-Host "Auto Push to GitHub: https://github.com/owaistoru/cal-time-billing" -ForegroundColor Cyan
# Ensure we run from the script's directory
Set-Location -Path $PSScriptRoot

# Require Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "`nERROR: Git is not installed or not on PATH." -ForegroundColor Red
  Read-Host "`nPress Enter to close..."
  exit 1
}

# Init repo/remote on first run
if (-not (Test-Path ".git")) {
  git init
  git branch -M main | Out-Null
  git remote add origin https://github.com/owaistoru/cal-time-billing.git
}

# A safe default identity if none is configured (edit if you want)
if (-not (git config user.name))  { git config user.name  "Owais" }
if (-not (git config user.email)) { git config user.email "no-reply@example.com" }

Write-Host "`n[ADD] Staging changes..." -ForegroundColor Yellow
git add -A

# Commit only if there are changes
$pending = git status --porcelain
if ([string]::IsNullOrWhiteSpace($pending)) {
  Write-Host "[COMMIT] Nothing to commit." -ForegroundColor DarkYellow
} else {
  $stamp = Get-Date -Format 'yyyy-MM-dd HH-mm-ss'   # no colons -> safe for shells
  $msg   = "auto: $stamp"
  Write-Host "[COMMIT] $msg" -ForegroundColor Yellow
  git commit -m $msg
}

# Pull/rebase (ignore error on first run if branch doesn't exist yet)
try { git pull --rebase origin main | Out-Null } catch {}

Write-Host "[PUSH] Pushing to origin/main..." -ForegroundColor Yellow
git push -u origin main

Write-Host "`nDone." -ForegroundColor Green
Read-Host "Press Enter to close..."
