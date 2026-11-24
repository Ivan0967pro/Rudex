param(
  [switch]$DryRun,
  [switch]$Status,
  [switch]$Uninstall,
  [switch]$RemovePlugin,
  [switch]$RestartApp
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$InstallJs = Join-Path $RepoRoot "skills\rudex\scripts\install.js"
$UninstallJs = Join-Path $RepoRoot "skills\rudex\scripts\uninstall.js"

function Find-AntigravityExe {
  $candidates = @(
    (Join-Path $env:LOCALAPPDATA "Programs\antigravity\Antigravity.exe"),
    (Join-Path $env:LOCALAPPDATA "Antigravity\Antigravity.exe"),
    (Join-Path $env:ProgramFiles "antigravity\Antigravity.exe"),
    (Join-Path $env:ProgramFiles "Antigravity\Antigravity.exe"),
    (Join-Path ${env:ProgramFiles(x86)} "Antigravity\Antigravity.exe")
  )
  foreach ($c in $candidates) {
    if ($c -and (Test-Path $c)) { return $c }
  }
  return $null
}

function Invoke-RudexNode([string]$ScriptPath, [string[]]$ScriptArgs) {
  $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
  if ($nodeCmd) {
    & $nodeCmd.Source $ScriptPath @ScriptArgs
    if ($LASTEXITCODE -ne 0) { throw "Command failed with exit code $LASTEXITCODE" }
    return
  }

  $agyExe = Find-AntigravityExe
  if (-not $agyExe) {
    throw "Neither Node.js nor Antigravity.exe was found."
  }
  $prevElectronNode = $env:ELECTRON_RUN_AS_NODE
  try {
    $env:ELECTRON_RUN_AS_NODE = "1"
    & $agyExe $ScriptPath @ScriptArgs
    if ($LASTEXITCODE -ne 0) { throw "Command failed with exit code $LASTEXITCODE" }
  } finally {
    if ($null -eq $prevElectronNode) {
      Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
    } else {
      $env:ELECTRON_RUN_AS_NODE = $prevElectronNode
    }
  }
}

Write-Host "Rudex v4.0.0 -- PowerShell Installer" -ForegroundColor Cyan

if ($Status) {
  Invoke-RudexNode $InstallJs @("--status")
  exit 0
}

if ($DryRun) {
  Invoke-RudexNode $InstallJs @("--dry-run")
  exit 0
}

$wasRunning = [bool](Get-Process -Name "Antigravity" -ErrorAction SilentlyContinue)
$agyExe = Find-AntigravityExe

if ($Uninstall) {
  if ($wasRunning -and $RestartApp) {
    Stop-Process -Name "Antigravity" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
  }
  $uArgs = @()
  if ($RemovePlugin) { $uArgs += "--remove-plugin" }
  Invoke-RudexNode $UninstallJs $uArgs
  if ($wasRunning -and $RestartApp -and $agyExe) {
    Start-Process $agyExe
  }
  exit 0
}

if ($wasRunning -and $RestartApp) {
  Write-Host "Stopping running Antigravity..." -ForegroundColor Yellow
  Stop-Process -Name "Antigravity" -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
}

Invoke-RudexNode $InstallJs @("--sync-plugin")

if ($RestartApp -and $agyExe) {
  Write-Host "Starting Antigravity..." -ForegroundColor Green
  Start-Process $agyExe
} else {
  Write-Host "Done! Restart Antigravity once to apply all Rudex updates in the UI." -ForegroundColor Green
}
