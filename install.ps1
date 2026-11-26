param(
  [switch]$DryRun,
  [switch]$Status,
  [switch]$Uninstall,
  [switch]$RemovePlugin,
  [switch]$RestartApp,
  [switch]$PluginOnly
)

$ErrorActionPreference = "Stop"

$ScriptPath = if ($PSCommandPath) { $PSCommandPath } else { $MyInvocation.MyCommand.Path }
$LocalRepoRoot = if ($ScriptPath) { Split-Path -Parent $ScriptPath } else { $null }
$IsLocalRepo = [bool](
  $LocalRepoRoot -and
  (Test-Path (Join-Path $LocalRepoRoot "plugin.json")) -and
  (Test-Path (Join-Path $LocalRepoRoot "skills\rudex\scripts\install.js"))
)

$RepoOwner = "Ivan0967pro"
$RepoName = "Rudex"
$Branch = if ($env:RUDEX_BRANCH) { $env:RUDEX_BRANCH } else { "main" }

function Find-AntigravityExe {
  $candidates = @()
  if ($IsMacOS) {
    $homeDir = if ($env:HOME) { $env:HOME } else { $env:USERPROFILE }
    $candidates += "/Applications/Antigravity.app/Contents/MacOS/Antigravity"
    if ($homeDir) {
      $candidates += (Join-Path $homeDir "Applications/Antigravity.app/Contents/MacOS/Antigravity")
      $candidates += (Join-Path $homeDir "Applications/Google Antigravity.app/Contents/MacOS/Google Antigravity")
    }
    $candidates += "/Applications/Google Antigravity.app/Contents/MacOS/Google Antigravity"
  } elseif ($IsLinux) {
    $homeDir = if ($env:HOME) { $env:HOME } else { $env:USERPROFILE }
    $candidates += "/usr/bin/antigravity"
    $candidates += "/usr/bin/Antigravity"
    $candidates += "/usr/local/bin/antigravity"
    $candidates += "/opt/antigravity/antigravity"
    $candidates += "/opt/Antigravity/Antigravity"
    if ($homeDir) {
      $candidates += (Join-Path $homeDir ".local/share/antigravity/antigravity")
    }
  } else {
    $candidates += @(
      (Join-Path $env:LOCALAPPDATA "Programs\antigravity\Antigravity.exe"),
      (Join-Path $env:LOCALAPPDATA "Antigravity\Antigravity.exe"),
      (Join-Path $env:ProgramFiles "antigravity\Antigravity.exe"),
      (Join-Path $env:ProgramFiles "Antigravity\Antigravity.exe"),
      (Join-Path ${env:ProgramFiles(x86)} "Antigravity\Antigravity.exe")
    )
  }
  foreach ($c in $candidates) {
    if ($c -and (Test-Path $c)) { return $c }
  }
  return $null
}

function Invoke-RudexNode([string]$TargetScript, [string[]]$ScriptArgs) {
  $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
  if ($nodeCmd) {
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
      $captured = @(& $nodeCmd.Source $TargetScript @ScriptArgs 2>&1)
      $exitCode = $LASTEXITCODE
    } finally {
      $ErrorActionPreference = $prevEap
    }
    $outLines = @()
    foreach ($line in $captured) {
      $str = "$line"
      if ($line -is [System.Management.Automation.ErrorRecord]) {
        Write-Host $str -ForegroundColor Yellow
      } else {
        $outLines += $str
        Write-Host $str
      }
    }
    if ($exitCode -ne 0) { throw "Rudex script failed with exit code $exitCode" }
    return ,([string[]]$outLines)
  }

  $agyExe = Find-AntigravityExe
  if (-not $agyExe) {
    throw "Neither Node.js nor Antigravity.exe was found. Install Antigravity first and retry."
  }

  $tempBase = if ($env:TEMP) { $env:TEMP } else { [System.IO.Path]::GetTempPath() }
  $logDir = Join-Path $tempBase ("rudex-log-" + [Guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path $logDir -Force | Out-Null
  $logOut = Join-Path $logDir "stdout.log"
  $logErr = Join-Path $logDir "stderr.log"

  $prevElectronNode = $env:ELECTRON_RUN_AS_NODE
  $hadElectronNode = Test-Path Env:ELECTRON_RUN_AS_NODE
  $prevElectronNoAsar = $env:ELECTRON_NO_ASAR
  $hadElectronNoAsar = Test-Path Env:ELECTRON_NO_ASAR
  try {
    $env:ELECTRON_RUN_AS_NODE = "1"
    $env:ELECTRON_NO_ASAR = "1"
    $argList = @("`"$TargetScript`"") + $ScriptArgs
    $proc = Start-Process -FilePath $agyExe `
      -ArgumentList $argList `
      -Wait -NoNewWindow -PassThru `
      -RedirectStandardOutput $logOut `
      -RedirectStandardError $logErr

    $outLines = @()
    if (Test-Path $logOut) {
      $rawOut = Get-Content -Path $logOut -Encoding UTF8 -ErrorAction SilentlyContinue
      if ($rawOut) {
        $outLines = @($rawOut | ForEach-Object { "$_" })
        foreach ($line in $outLines) { Write-Host $line }
      }
    }
    if (Test-Path $logErr) {
      $rawErr = Get-Content -Path $logErr -Encoding UTF8 -ErrorAction SilentlyContinue
      if ($rawErr) {
        foreach ($line in $rawErr) { Write-Host "$line" -ForegroundColor Yellow }
      }
    }
    if ($proc.ExitCode -ne 0) {
      throw "Rudex script failed with exit code $($proc.ExitCode)"
    }
    return ,([string[]]$outLines)
  } finally {
    if ($hadElectronNode) {
      $env:ELECTRON_RUN_AS_NODE = $prevElectronNode
    } else {
      Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
    }
    if ($hadElectronNoAsar) {
      $env:ELECTRON_NO_ASAR = $prevElectronNoAsar
    } else {
      Remove-Item Env:ELECTRON_NO_ASAR -ErrorAction SilentlyContinue
    }
    Remove-Item -Path $logDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

function Wait-AntigravityExit([int]$TimeoutMs = 8000) {
  $deadline = (Get-Date).AddMilliseconds($TimeoutMs)
  while ((Get-Date) -lt $deadline) {
    $running = Get-Process -Name "Antigravity", "antigravity" -ErrorAction SilentlyContinue
    if (-not $running) { return $true }
    Start-Sleep -Milliseconds 400
  }
  return -not [bool](Get-Process -Name "Antigravity", "antigravity" -ErrorAction SilentlyContinue)
}

function Restart-AntigravityDetached([string]$ExePath) {
  if (-not $ExePath -or -not (Test-Path $ExePath)) { return }
  $running = Get-Process -Name "Antigravity", "antigravity" -ErrorAction SilentlyContinue
  if ($running) {
    Write-Host "[Rudex] Restarting Antigravity to load updated skill and UI..." -ForegroundColor Green
    if ($IsMacOS) {
      Stop-Process -Name "Antigravity", "antigravity" -Force -ErrorAction SilentlyContinue
      [void](Wait-AntigravityExit)
      $bundleDir = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $ExePath))
      if ($bundleDir -and $bundleDir.EndsWith(".app") -and (Test-Path $bundleDir)) {
        Start-Process "open" -ArgumentList @("-a", $bundleDir)
      } else {
        Start-Process "open" -ArgumentList @("-a", "Antigravity")
      }
      return
    }
    if ($IsLinux) {
      Stop-Process -Name "Antigravity", "antigravity" -Force -ErrorAction SilentlyContinue
      [void](Wait-AntigravityExit)
      Start-Process -FilePath $ExePath
      return
    }
    $wscriptExe = Join-Path $env:SystemRoot "System32\wscript.exe"
    if (Test-Path $wscriptExe) {
      $escapedExe = [regex]::Replace(($ExePath -replace '\\', '\\' -replace '"', '\"'), '[^\x20-\x7E]', { param($m) '\u' + ([int][char]$m.Value).ToString('x4') })
      $wshScript = Join-Path $env:TEMP ("rudex-restart-" + [Guid]::NewGuid().ToString("N") + ".js")
      $jsLines = @(
        "var fso = new ActiveXObject('Scripting.FileSystemObject');",
        "var sh = new ActiveXObject('WScript.Shell');",
        "var agyExe = `"$escapedExe`";",
        "function countAgy() { try { var wmi = GetObject('winmgmts:{impersonationLevel=impersonate}!\\\\.\\root\\cimv2'); return wmi.ExecQuery(`"SELECT ProcessId FROM Win32_Process WHERE Name = 'Antigravity.exe'`").Count; } catch (e) { return 0; } }",
        "try {",
        "  try { sh.Run('taskkill /IM Antigravity.exe', 0, true); } catch (e) {}",
        "  WScript.Sleep(2000);",
        "  if (countAgy() > 0) { try { sh.Run('taskkill /F /IM Antigravity.exe', 0, true); } catch (e) {} }",
        "  for (var i = 0; i < 15; i++) { if (countAgy() === 0) break; WScript.Sleep(1000); }",
        "  if (fso.FileExists(agyExe)) { sh.Run('`"' + agyExe + '`"', 1, false); }",
        "} catch (e) {} finally { try { fso.DeleteFile(WScript.ScriptFullName, true); } catch (e2) {} }",
        ""
      )
      [System.IO.File]::WriteAllText($wshScript, ($jsLines -join "`r`n"), [System.Text.Encoding]::ASCII)
      Start-Process -FilePath $wscriptExe -ArgumentList @("//B", "//Nologo", "//E:JScript", "`"$wshScript`"") -WindowStyle Hidden
      return
    }
    $restartScript = Join-Path $env:TEMP ("rudex-restart-" + [Guid]::NewGuid().ToString("N") + ".cmd")
    $cmdLines = @(
      "@echo off",
      "chcp 65001 >nul",
      "set `"AGY_EXE=$ExePath`"",
      "setlocal EnableDelayedExpansion",
      "taskkill /IM Antigravity.exe >nul 2>&1",
      "ping -n 3 127.0.0.1 >nul",
      "taskkill /F /IM Antigravity.exe >nul 2>&1",
      "for /L %%I in (1,1,12) do (",
      "  tasklist /FI `"IMAGENAME eq Antigravity.exe`" 2>nul | find /I `"Antigravity.exe`" >nul",
      "  if errorlevel 1 goto launch",
      "  ping -n 2 127.0.0.1 >nul",
      ")",
      ":launch",
      "start `"`" `"!AGY_EXE!`"",
      "del `"%~f0`" >nul 2>&1",
      ""
    )
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($restartScript, ($cmdLines -join "`r`n"), $utf8NoBom)
    Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "`"$restartScript`"") -WindowStyle Hidden
  } else {
    Write-Host "[Rudex] Starting Antigravity..." -ForegroundColor Green
    Start-Process -FilePath $ExePath
  }
}

function Test-InsideAntigravityProcess {
  try {
    $curPid = $PID
    for ($depth = 0; $depth -lt 12; $depth++) {
      $p = Get-CimInstance Win32_Process -Filter "ProcessId=$curPid" -ErrorAction SilentlyContinue
      if (-not $p -or -not $p.ParentProcessId -or $p.ParentProcessId -eq $curPid) { break }
      $parentProc = Get-Process -Id $p.ParentProcessId -ErrorAction SilentlyContinue
      if ($parentProc -and $parentProc.ProcessName -ieq "Antigravity") { return $true }
      $curPid = $p.ParentProcessId
    }
  } catch {}
  return $false
}

Write-Host "Rudex v5.0.3 -- Skill & UI Installer for Antigravity" -ForegroundColor Cyan

if ($IsLocalRepo) {
  $InstallJs = Join-Path $LocalRepoRoot "skills\rudex\scripts\install.js"
  $UninstallJs = Join-Path $LocalRepoRoot "skills\rudex\scripts\uninstall.js"

  if ($Status) {
    $null = Invoke-RudexNode $InstallJs @("--status")
    exit 0
  }

  if ($DryRun) {
    $null = Invoke-RudexNode $InstallJs @("--dry-run")
    exit 0
  }

  if ($PluginOnly) {
    $null = Invoke-RudexNode $InstallJs @("--plugin-only")
    Write-Host "[Rudex] Skill registered in Antigravity plugins." -ForegroundColor Green
    exit 0
  }

  $wasRunning = [bool](Get-Process -Name "Antigravity", "antigravity" -ErrorAction SilentlyContinue)
  $agyExe = Find-AntigravityExe

  if ($Uninstall) {
    if ($wasRunning -and $RestartApp) {
      Stop-Process -Name "Antigravity", "antigravity" -Force -ErrorAction SilentlyContinue
      [void](Wait-AntigravityExit)
    }
    $uArgs = @()
    if ($RemovePlugin) { $uArgs += "--remove-plugin" }
    $null = Invoke-RudexNode $UninstallJs $uArgs
    if ($wasRunning -and $RestartApp -and $agyExe) {
      Start-Process -FilePath $agyExe
    }
    exit 0
  }

  if ($wasRunning -and $RestartApp) {
    Write-Host "[Rudex] Closing Antigravity briefly..." -ForegroundColor Yellow
    Stop-Process -Name "Antigravity", "antigravity" -Force -ErrorAction SilentlyContinue
    [void](Wait-AntigravityExit)
  }

  $outLines = Invoke-RudexNode $InstallJs @("--sync-plugin")
  $installStatus = $null
  $activatorPath = $null
  $agyExeOut = $null
  foreach ($line in $outLines) {
    if ($line -match '^STATUS=(.+)$') { $installStatus = $Matches[1].Trim() }
    elseif ($line -match '^ACTIVATOR_PATH=(.+)$') { $activatorPath = $Matches[1].Trim() }
    elseif ($line -match '^AGY_EXE=(.+)$') { $agyExeOut = $Matches[1].Trim() }
  }
  $exeToUse = if ($agyExeOut) { $agyExeOut } else { $agyExe }

  if ($installStatus -eq "LOCKED_NEEDS_ACTIVATOR" -and $activatorPath -and (Test-Path $activatorPath)) {
    if ($RestartApp) {
      Write-Host "[Rudex] Activating Rudex UI and restarting Antigravity..." -ForegroundColor Green
      Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "`"$activatorPath`"") -WindowStyle Hidden
    } else {
      Write-Host "[Rudex] Skill synced and shell staged. Run `"$activatorPath`" (or restart Antigravity via Rudex) to unlock app.asar." -ForegroundColor Yellow
    }
    exit 0
  }

  if ($RestartApp -and $exeToUse) {
    Restart-AntigravityDetached $exeToUse
  } else {
    Write-Host "[Rudex] Skill installed! Restart Antigravity once to apply all updates in the UI." -ForegroundColor Green
  }
  exit 0
}

# Remote 1-line PowerShell installer mode (irm ... | iex)
$DoPluginOnly = $PluginOnly -or ($env:RUDEX_PLUGIN_ONLY -eq "1")
$NoRestart = ($env:RUDEX_NO_RESTART -eq "1")

[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

$tempBaseRemote = if ($env:TEMP) { $env:TEMP } else { [System.IO.Path]::GetTempPath() }
$tempRoot = Join-Path $tempBaseRemote ("rudex-install-" + [Guid]::NewGuid().ToString("N"))
$zipPath = Join-Path $tempRoot "rudex.zip"
$extractDir = Join-Path $tempRoot "extracted"
$zipUrl = "https://github.com/$RepoOwner/$RepoName/archive/refs/heads/$Branch.zip"

try {
  New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null
  Write-Host "[Rudex] Downloading Rudex skill from $RepoOwner/$RepoName ($Branch)..." -ForegroundColor Cyan
  Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing

  Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force

  $manifest = Get-ChildItem -Path $extractDir -Filter "plugin.json" -Recurse | Select-Object -First 1
  if (-not $manifest) {
    throw "Failed to locate plugin.json inside downloaded archive."
  }
  $sourceDir = $manifest.Directory.FullName
  $sourceInstallJs = Join-Path $sourceDir "skills\rudex\scripts\install.js"
  if (-not (Test-Path $sourceInstallJs)) {
    throw "Installer script missing from archive: $sourceInstallJs"
  }

  if ($DoPluginOnly) {
    $null = Invoke-RudexNode $sourceInstallJs @("--plugin-only")
    Write-Host "[Rudex] Skill installed into Antigravity (%USERPROFILE%\.gemini\config\plugins\rudex)." -ForegroundColor Green
    return
  }

  # Close running Antigravity before syncing plugin & app files when invoked from an external PowerShell
  # (prevents Windows 10 NTFS DELETE_PENDING / EPERM directory watcher locks on plugins\rudex & app.asar)
  $wasRunningRemote = [bool](Get-Process -Name "Antigravity", "antigravity" -ErrorAction SilentlyContinue)
  if ((-not $NoRestart) -and $wasRunningRemote -and (-not (Test-InsideAntigravityProcess))) {
    Write-Host "[Rudex] Closing Antigravity briefly so Windows releases file locks..." -ForegroundColor Yellow
    Stop-Process -Name "Antigravity", "antigravity" -Force -ErrorAction SilentlyContinue
    [void](Wait-AntigravityExit)
    Start-Sleep -Milliseconds 500
  }

  $env:RUDEX_ZIP_PATH = $zipPath
  $outLines = Invoke-RudexNode $sourceInstallJs @("--sync-plugin")
  Remove-Item Env:RUDEX_ZIP_PATH -ErrorAction SilentlyContinue
  $installStatus = $null
  $activatorPath = $null
  $agyExeOut = $null
  foreach ($line in $outLines) {
    if ($line -match '^STATUS=(.+)$') { $installStatus = $Matches[1].Trim() }
    elseif ($line -match '^ACTIVATOR_PATH=(.+)$') { $activatorPath = $Matches[1].Trim() }
    elseif ($line -match '^AGY_EXE=(.+)$') { $agyExeOut = $Matches[1].Trim() }
  }

  $exeToUse = if ($agyExeOut) { $agyExeOut } else { Find-AntigravityExe }

  if ($installStatus -eq "LOCKED_NEEDS_ACTIVATOR" -and $activatorPath -and (Test-Path $activatorPath)) {
    if ($NoRestart) {
      Write-Host "[Rudex] Skill files installed, but app.asar is locked by running Antigravity. Close Antigravity and run `"$activatorPath`" (or re-run this command)." -ForegroundColor Yellow
      return
    }
    Write-Host "[Rudex] Activating Rudex UI and restarting Antigravity..." -ForegroundColor Green
    Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "`"$activatorPath`"") -WindowStyle Hidden
  } elseif ((-not $NoRestart) -and $exeToUse -and (Test-Path $exeToUse)) {
    Restart-AntigravityDetached $exeToUse
  }

  $homeTarget = if ($env:USERPROFILE) { $env:USERPROFILE } else { $env:HOME }
  $pluginTarget = Join-Path $homeTarget ".gemini\config\plugins\rudex"
  Write-Host "[Rudex] Done! Rudex skill is installed in: $pluginTarget" -ForegroundColor Green
} finally {
  Remove-Item Env:RUDEX_ZIP_PATH -ErrorAction SilentlyContinue
  if (Test-Path $tempRoot) {
    Remove-Item -Path $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
