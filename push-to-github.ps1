# push-to-github.ps1
$ErrorActionPreference = "Stop"
$REPO_URL = "https://github.com/owaistoru/cal-time-billing.git"

Set-Location -Path $PSScriptRoot

Write-Host "`n── Auto Push to GitHub: $REPO_URL ──`n"

# Ensure git exists
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git is not installed or not in PATH. Install from https://git-scm.com/downloads"
}

# Init repo if needed
if (-not (Test-Path ".git")) {
  git init | Out-Null
}

# Checkout/ensure main
$cur = (git rev-parse --abbrev-ref HEAD 2>$null)
if ($LASTEXITCODE -ne 0 -or $cur -ne "main") {
  git checkout -B main | Out-Null
}

# Minimal identity if missing
$name = (git config user.name 2>$null)
if (-not $name) { git config user.name "Owais" | Out-Null }
$email = (git config user.email 2>$null)
if (-not $email) { git config user.email "owaistoru@users.noreply.github.com" | Out-Null }

# .gitignore
if (-not (Test-Path ".gitignore")) {
@"
# Node
node_modules/
dist/
build/
.cache/
.vite/
npm-debug.log*
yarn-error.log*
pnpm-debug.log*

# Env
.env
.env.*
!.env.example

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Editors
.vscode/
.idea/

# Coverage
coverage/
"@ | Out-File -Encoding utf8 ".gitignore"
}

# Untrack env files
git rm --cached -f .env        2>$null | Out-Null
git rm --cached -f backend/.env 2>$null | Out-Null
git rm --cached -f frontend/.env 2>$null | Out-Null

# Remote origin
try {
  $current = git remote get-url origin 2>$null
} catch { $current = $null }

if (-not $current) {
  git remote add origin $REPO_URL | Out-Null
} elseif ($current -ne $REPO_URL) {
  git remote set-url origin $REPO_URL | Out-Null
}

# Add/commit/push
git add -A
git commit -m "Automated push from push-to-github.ps1" 2>$null | Out-Null
git push -u origin main

Write-Host "`n✅  Pushed this folder to $REPO_URL"
Write-Host "✅  Done.`n"
