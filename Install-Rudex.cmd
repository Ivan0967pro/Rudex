@echo off
chcp 65001 >nul
set "SCRIPT_DIR=%~dp0"
set "USER_ARGS=%*"
setlocal EnableDelayedExpansion

echo ========================================================
echo   Rudex v4.0.0 -- Installer ^& Antigravity Patcher
echo ========================================================
echo.

set "INSTALL_JS=!SCRIPT_DIR!skills\rudex\scripts\install.js"
if not exist "!INSTALL_JS!" (
  echo [ERROR] Installer script not found: !INSTALL_JS!
  pause
  exit /b 1
)

set "AGY_EXE="
if exist "%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe" set "AGY_EXE=%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe"
if not defined AGY_EXE if exist "%LOCALAPPDATA%\Antigravity\Antigravity.exe" set "AGY_EXE=%LOCALAPPDATA%\Antigravity\Antigravity.exe"
if not defined AGY_EXE if exist "%ProgramFiles%\antigravity\Antigravity.exe" set "AGY_EXE=%ProgramFiles%\antigravity\Antigravity.exe"
if not defined AGY_EXE if exist "%ProgramFiles%\Antigravity\Antigravity.exe" set "AGY_EXE=%ProgramFiles%\Antigravity\Antigravity.exe"
if not defined AGY_EXE if exist "%ProgramFiles(x86)%\Antigravity\Antigravity.exe" set "AGY_EXE=%ProgramFiles(x86)%\Antigravity\Antigravity.exe"

set "RUNTIME_MODE="
where node >nul 2>&1
if not errorlevel 1 (
  set "RUNTIME_MODE=node"
) else if defined AGY_EXE (
  set "RUNTIME_MODE=electron"
) else (
  echo [ERROR] Neither Node.js nor Antigravity.exe was found.
  echo Please install Antigravity or Node.js first.
  pause
  exit /b 1
)

set "WAS_RUNNING=0"
tasklist /FI "IMAGENAME eq Antigravity.exe" 2>nul | find /I "Antigravity.exe" >nul
if not errorlevel 1 set "WAS_RUNNING=1"

set "FORCE_CLOSE=0"
echo !USER_ARGS! | findstr /I /C:"--force" /C:"-f" >nul
if not errorlevel 1 set "FORCE_CLOSE=1"

if "!WAS_RUNNING!"=="1" (
  if "!FORCE_CLOSE!"=="1" (
    echo Stopping running Antigravity process...
    taskkill /F /IM Antigravity.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
  ) else (
    echo Antigravity is currently running. Close it now to safely apply files?
    choice /C YN /M "Close Antigravity and install Rudex now"
    if !ERRORLEVEL! equ 1 (
      taskkill /F /IM Antigravity.exe >nul 2>&1
      timeout /t 2 /nobreak >nul
    ) else (
      echo Continuing without closing Antigravity -- restart Antigravity manually afterward.
      set "WAS_RUNNING=0"
    )
  )
)

echo Applying Rudex localization, studio, and hooks...
if "!RUNTIME_MODE!"=="node" (
  node "!INSTALL_JS!" --sync-plugin !USER_ARGS!
) else (
  set "ELECTRON_RUN_AS_NODE=1"
  "!AGY_EXE!" "!INSTALL_JS!" --sync-plugin !USER_ARGS!
  set "ELECTRON_RUN_AS_NODE="
)
set "EXIT_CODE=!ERRORLEVEL!"

if !EXIT_CODE! neq 0 (
  echo.
  echo [ERROR] Installation failed with code !EXIT_CODE!.
  pause
  exit /b !EXIT_CODE!
)

echo.
echo Rudex v4.0.0 installed cleanly!
if "!WAS_RUNNING!"=="1" if defined AGY_EXE (
  echo Relaunching Antigravity...
  start "" "!AGY_EXE!"
) else (
  echo Launch or restart Antigravity to activate Rudex.
)
timeout /t 3 /nobreak >nul
exit /b 0
