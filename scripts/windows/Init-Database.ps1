# scripts/windows/Init-Database.ps1
param(
  [string]$DbName = "cal_time_billing",
  [string]$Host = "localhost",
  [string]$Port = "5432",
  [string]$AdminUser = "postgres",
  [string]$AdminPassword = "postgres"
)

$ErrorActionPreference = "Stop"

# Find psql
$psql = (Get-Command psql -ErrorAction SilentlyContinue)?.Source
if (-not $psql) {
  Write-Host "psql not found on PATH; skipping DB init."
  exit 0
}

# Build env for password
$env:PGPASSWORD = $AdminPassword

# Create DB if not exists
try {
  & $psql -h $Host -p $Port -U $AdminUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName'" | Out-Null
  $exists = $LASTEXITCODE -eq 0
  if (-not $exists) {
    Write-Host "Creating database $DbName..."
    & $psql -h $Host -p $Port -U $AdminUser -d postgres -c "CREATE DATABASE $DbName"
  } else {
    Write-Host "Database $DbName already exists."
  }
} catch { Write-Host "DB existence check failed; continuing..." }

# Run schema if present
$repo = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$schema1 = Join-Path $repo "backend\scripts\schema.sql"
$schema2 = Join-Path $repo "backend\scripts\init.sql"

$schemaFile = $null
if (Test-Path $schema1) { $schemaFile = $schema1 }
elseif (Test-Path $schema2) { $schemaFile = $schema2 }

if ($schemaFile) {
  Write-Host "Applying schema: $schemaFile"
  & $psql -h $Host -p $Port -U $AdminUser -d $DbName -f $schemaFile
} else {
  Write-Host "No schema file found (backend\scripts\schema.sql or init.sql). Skipping schema import."
}
