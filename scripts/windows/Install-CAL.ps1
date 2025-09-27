# scripts/windows/Install-CAL.ps1
# Installs Node LTS + PostgreSQL via winget if missing, installs npm deps,
# writes .env files, initializes DB, and creates desktop shortcut.

$ErrorActionPreference = 'Stop'

# Repo root
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Resolve-Path (Join-Path $here "..\..")

Write-Host "Repo: $repo"

function Ensure-Exe($name) {
  $p = Get-Command $name -ErrorAction SilentlyContinue
  return [bool]$p
}

function WingetInstalled() {
  return (Get-Command winget -ErrorAction SilentlyContinue) -ne $null
}

function Ensure-Node() {
  if (Ensure-Exe node) { Write-Host "Node present: $(node -v)"; return }
  if (-not (WingetInstalled)) {
    throw "winget not available; cannot auto-install Node. Install Node LTS manually and rerun."
  }
  Write-Host "Installing Node.js LTS via winget..."
  winget install -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
  if (-not (Ensure-Exe node)) { throw "Node install failed" }
}

function Ensure-Postgres() {
  # If psql exists, assume Postgres is present
  if (Ensure-Exe psql) { Write-Host "PostgreSQL client present (psql)."; return }
  if (-not (WingetInstalled)) {
    Write-Host "winget not available; skipping PostgreSQL auto-install."
    return
  }
  Write-Host "Installing PostgreSQL via winget (this may show a UI)..."
  # Two known IDs; attempt both
  try { winget install -e --id PostgreSQL.PostgreSQL --silent --accept-package-agreements --accept-source-agreements } catch {}
  if (-not (Ensure-Exe psql)) {
    try { winget install -e --id EnterpriseDB.PostgreSQL --silent --accept-package-agreements --accept-source-agreements } catch {}
  }
  if (Ensure-Exe psql) { Write-Host "PostgreSQL installed." } else { Write-Host "PostgreSQL not installed (winget failed). You can still run with an existing DB." }
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
  } finally { Pop-Location }
}

Ensure-Node
Ensure-Postgres

# Install deps
NpmInstall (Join-Path $repo "backend")
NpmInstall (Join-Path $repo "frontend")

# Backend .env
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

# Frontend .env (optional; unused when serving dist)
$frontendEnv = Join-Path $repo "frontend\.env.local"
if (-not (Test-Path $frontendEnv)) {
@"
# If you do not proxy /api, you can set:
# VITE_API_BASE=http://localhost:3001
"@ | Set-Content -Encoding UTF8 $frontendEnv
}

# Build frontend (so backend can serve it)
Push-Location (Join-Path $repo "frontend")
try { & cmd /c "npm run build" } finally { Pop-Location }

# Initialize DB (best-effort)
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo "scripts\windows\Init-Database.ps1") `
  -DbName "cal_time_billing" -AdminUser "postgres" -AdminPassword "postgres"

# Create desktop shortcut
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo "scripts\windows\Create-Shortcut.ps1")

Write-Host "Install complete."
