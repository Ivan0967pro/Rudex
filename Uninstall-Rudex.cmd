@echo off
chcp 65001 >nul
set "SCRIPT_DIR=%~dp0"
set "USER_ARGS=%*"
setlocal EnableDelayedExpansion

echo ========================================================
echo   Rudex v5.0.2 -- Uninstaller (Restore English UI)
echo ========================================================
echo.

set "UNINSTALL_JS=!SCRIPT_DIR!skills\rudex\scripts\uninstall.js"
if not exist "!UNINSTALL_JS!" (
  echo [ERROR] Uninstaller script not found: !UNINSTALL_JS!
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
  echo [ERROR] Neither Node.js nor Antigravity.exe was found to run uninstall.js.
  pause
  exit /b 1
)

set "WAS_RUNNING=0"
tasklist /FI "IMAGENAME eq Antigravity.exe" 2>nul | find /I "Antigravity.exe" >nul
if not errorlevel 1 set "WAS_RUNNING=1"

if "!WAS_RUNNING!"=="1" (
  echo Closing Antigravity before restoring stock English UI...
  taskkill /F /IM Antigravity.exe >nul 2>&1
  ping -n 3 127.0.0.1 >nul
)

if "!RUNTIME_MODE!"=="node" (
  node "!UNINSTALL_JS!" %*
) else (
  set "ELECTRON_RUN_AS_NODE=1"
  set "ELECTRON_NO_ASAR=1"
  "!AGY_EXE!" "!UNINSTALL_JS!" %*
  set "ELECTRON_RUN_AS_NODE="
  set "ELECTRON_NO_ASAR="
)
set "EXIT_CODE=!ERRORLEVEL!"

if !EXIT_CODE! neq 0 (
  echo.
  echo [ERROR] Uninstall finished with errors (code !EXIT_CODE!).
  pause
  exit /b !EXIT_CODE!
)

echo.
echo Stock English Antigravity UI restored cleanly.
if "!WAS_RUNNING!"=="1" if defined AGY_EXE (
  choice /C YN /M "Launch Antigravity now"
  if !ERRORLEVEL! equ 1 start "" "!AGY_EXE!"
)
ping -n 3 127.0.0.1 >nul
exit /b 0
