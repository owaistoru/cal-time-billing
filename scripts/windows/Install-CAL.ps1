# scripts/windows/Install-CAL.ps1
# Avoid strict-mode conflicts with npm.ps1 by invoking npm via cmd.exe

$ErrorActionPreference = 'Stop'

# Repo root
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Resolve-Path (Join-Path $here "..\..")

Write-Host "Repo: $repo"

function Ensure-Node {
  try {
    $v = & node -v 2>$null
    if (-not $v) { throw "Node not found" }
    Write-Host "Node found: $v"
  } catch {
    Write-Warning "Node.js not found. Install Node 18+ from https://nodejs.org/ then re-run."
    exit 1
  }
}

function NpmInstall($dir) {
  Push-Location $dir
  try {
    if (Test-Path package-lock.json) {
      Write-Host "npm ci in $dir"
      & cmd /c "npm ci"
    } else {
      Write-Host "npm install in $dir"
      & cmd /c "npm install"
    }
  } finally {
    Pop-Location
  }
}

Ensure-Node

# Install deps
NpmInstall (Join-Path $repo "backend")
NpmInstall (Join-Path $repo "frontend")

# Backend .env (edit DB URL for your local Postgres if needed)
$backendEnv = Join-Path $repo "backend\.env"
if (-not (Test-Path $backendEnv)) {
  $jwt = -join ((65..90)+(97..122)+(48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
@"
PORT=3001
DATABASE_URL=postgres://postgres:postgres@localhost:5432/cal_time_billing
JWT_SECRET=$jwt
"@ | Set-Content -Encoding UTF8 $backendEnv
  Write-Host "Wrote $backendEnv"
}

# Frontend .env (optional)
$frontendEnv = Join-Path $repo "frontend\.env.local"
if (-not (Test-Path $frontendEnv)) {
@"
# If you do not proxy /api, uncomment:
# VITE_API_BASE=http://localhost:3001
"@ | Set-Content -Encoding UTF8 $frontendEnv
  Write-Host "Wrote $frontendEnv"
}

# Create desktop shortcut
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo "scripts\windows\Create-Shortcut.ps1")
Write-Host "Done. Desktop shortcut created."
