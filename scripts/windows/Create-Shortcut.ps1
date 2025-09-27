# scripts/windows/Create-Shortcut.ps1
$ErrorActionPreference = 'Stop'

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = (Resolve-Path (Join-Path $here "..\..")).Path
$bat  = (Resolve-Path (Join-Path $repo "scripts\windows\Start-CAL.bat")).Path
$desktop  = [Environment]::GetFolderPath('Desktop')
$linkPath = Join-Path $desktop "CAL Time Billing.lnk"

# Use custom icon if present, else shell32
$iconCandidate = Join-Path $repo "assets\cal.ico"
if (Test-Path $iconCandidate) {
  $icon = $iconCandidate
} else {
  $icon = "$env:WINDIR\System32\shell32.dll,43"
}

# Sanity check: launcher must exist
if (-not (Test-Path $bat)) {
  throw "Launcher not found at: $bat"
}

$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut($linkPath)
$sc.TargetPath     = $bat
$sc.WorkingDirectory = $repo
$sc.IconLocation   = $icon
$sc.Description    = "Start CAL Time Billing (DB + servers + browser)"
$sc.Save()

Write-Host "Shortcut created at $linkPath"
