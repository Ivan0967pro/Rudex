function Install-AntigravityRu {
    $ErrorActionPreference = 'Stop'

    $RepoOwner = "Ivan0967pro"
    $RepoName = "antigravity-ru"
    $Branch = if ($env:AGY_RU_BRANCH) { $env:AGY_RU_BRANCH } else { "main" }
    $PluginOnly = ($env:AGY_RU_PLUGIN_ONLY -eq "1")

    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

    $zipUrl = "https://github.com/$RepoOwner/$RepoName/archive/refs/heads/$Branch.zip"
    $tempRoot = Join-Path $env:TEMP ("antigravity-ru-" + [guid]::NewGuid().ToString("N"))
    $zipPath = Join-Path $tempRoot "plugin.zip"
    $extractDir = Join-Path $tempRoot "src"
    $logOut = Join-Path $tempRoot "install-stdout.log"
    $logErr = Join-Path $tempRoot "install-stderr.log"

    New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null
    New-Item -ItemType Directory -Path $extractDir -Force | Out-Null

    try {
        Write-Host "[Antigravity RU] Downloading plugin from GitHub ($RepoOwner/$RepoName@$Branch)..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing

        Write-Host "[Antigravity RU] Extracting archive..." -ForegroundColor Cyan
        Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force

        $manifest = Get-ChildItem -Path $extractDir -Filter "plugin.json" -Recurse -File | Select-Object -First 1
        if (-not $manifest) {
            throw "Could not find plugin.json inside downloaded archive."
        }
        $sourceDir = $manifest.Directory.FullName

        $pluginsParent = Join-Path $env:USERPROFILE ".gemini\config\plugins"
        $pluginDir = Join-Path $pluginsParent "antigravity-ru"
        if (-not (Test-Path $pluginsParent)) {
            New-Item -ItemType Directory -Path $pluginsParent -Force | Out-Null
        }
        if (Test-Path $pluginDir) {
            Remove-Item -Path $pluginDir -Recurse -Force
        }
        New-Item -ItemType Directory -Path $pluginDir -Force | Out-Null

        Get-ChildItem -Path $sourceDir -Force | ForEach-Object {
            if ($_.Name -ne ".git") {
                Copy-Item -Path $_.FullName -Destination $pluginDir -Recurse -Force
            }
        }

        Write-Host "[Antigravity RU] Plugin registered at: $pluginDir" -ForegroundColor Green

        if ($PluginOnly) {
            Write-Host "[Antigravity RU] Plugin-only mode complete (AGY_RU_PLUGIN_ONLY=1)." -ForegroundColor Green
            return
        }

        $scriptPath = Join-Path $pluginDir "skills\antigravity-ru\scripts\install-ru.js"
        if (-not (Test-Path $scriptPath)) {
            throw "Installer script not found at: $scriptPath"
        }

        $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
        $runtimeExe = $null
        $useElectronAsNode = $false

        if ($nodeCmd) {
            $runtimeExe = $nodeCmd.Source
        } else {
            $candidates = @(
                (Join-Path $env:LOCALAPPDATA "Programs\antigravity\Antigravity.exe"),
                (Join-Path $env:LOCALAPPDATA "Antigravity\Antigravity.exe"),
                (Join-Path $env:ProgramFiles "Antigravity\Antigravity.exe"),
                (Join-Path ${env:ProgramFiles(x86)} "Antigravity\Antigravity.exe")
            ) | Where-Object { $_ -and (Test-Path $_) }

            $runtimeExe = $candidates | Select-Object -First 1
            $useElectronAsNode = $true
        }

        if (-not $runtimeExe) {
            throw "Neither Node.js nor Antigravity.exe was found. Install Antigravity first and re-run."
        }

        Write-Host "[Antigravity RU] Applying Russian UI localization..." -ForegroundColor Cyan

        $prevElectronNode = $env:ELECTRON_RUN_AS_NODE
        $hadElectronNode = Test-Path Env:ELECTRON_RUN_AS_NODE
        try {
            if ($useElectronAsNode) {
                $env:ELECTRON_RUN_AS_NODE = "1"
            } elseif ($hadElectronNode) {
                Remove-Item Env:ELECTRON_RUN_AS_NODE
            }

            $proc = Start-Process -FilePath $runtimeExe `
                -ArgumentList @("`"$scriptPath`"", "--sync-plugin") `
                -Wait -NoNewWindow -PassThru `
                -RedirectStandardOutput $logOut `
                -RedirectStandardError $logErr
        } finally {
            if ($hadElectronNode) {
                $env:ELECTRON_RUN_AS_NODE = $prevElectronNode
            } else {
                Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
            }
        }

        $outLines = @()
        if (Test-Path $logOut) {
            $outLines = Get-Content -Path $logOut -Encoding UTF8 -ErrorAction SilentlyContinue
            if ($outLines) { $outLines | ForEach-Object { Write-Host $_ } }
        }
        if (Test-Path $logErr) {
            $errLines = Get-Content -Path $logErr -Encoding UTF8 -ErrorAction SilentlyContinue
            if ($errLines) { $errLines | ForEach-Object { Write-Host $_ -ForegroundColor Yellow } }
        }

        if ($proc.ExitCode -ne 0) {
            throw "Localization script exited with code $($proc.ExitCode)."
        }

        $status = $null
        $activatorPath = $null
        $agyExe = $null
        foreach ($line in $outLines) {
            if ($line -match '^STATUS=(.+)$') { $status = $Matches[1].Trim() }
            elseif ($line -match '^ACTIVATOR_PATH=(.+)$') { $activatorPath = $Matches[1].Trim() }
            elseif ($line -match '^AGY_EXE=(.+)$') { $agyExe = $Matches[1].Trim() }
        }

        if ($status -eq "LOCKED_NEEDS_ACTIVATOR" -and $activatorPath -and (Test-Path $activatorPath)) {
            Write-Host "[Antigravity RU] Activating Russian UI and restarting Antigravity..." -ForegroundColor Green
            Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "`"$activatorPath`"")
            return
        }

        if ($agyExe -and (Test-Path $agyExe)) {
            $running = Get-Process -Name "Antigravity" -ErrorAction SilentlyContinue
            if ($running) {
                Write-Host "[Antigravity RU] Restarting Antigravity to load Russian UI..." -ForegroundColor Green
                $restartCmd = "timeout /t 1 /nobreak >nul & taskkill /IM Antigravity.exe >nul 2>&1 & timeout /t 2 /nobreak >nul & taskkill /F /IM Antigravity.exe >nul 2>&1 & start `"`" `"$agyExe`""
                Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", $restartCmd)
            } else {
                Write-Host "[Antigravity RU] Launching Antigravity..." -ForegroundColor Green
                Start-Process -FilePath $agyExe
            }
            return
        }

        Write-Host "[Antigravity RU] Installation complete! Please restart Antigravity." -ForegroundColor Green
    } finally {
        if (Test-Path $tempRoot) {
            Remove-Item -Path $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

Install-AntigravityRu
