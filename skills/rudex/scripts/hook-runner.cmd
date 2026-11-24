@echo off
set "SCRIPT_DIR=%~dp0"
set "HOOK_JS=%SCRIPT_DIR%rudex-hook.js"
setlocal EnableDelayedExpansion

where node >nul 2>&1
if not errorlevel 1 (
  node "!HOOK_JS!"
  exit /b !ERRORLEVEL!
)

set "AGY_EXE="
if exist "%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe" set "AGY_EXE=%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe"
if not defined AGY_EXE if exist "%LOCALAPPDATA%\Antigravity\Antigravity.exe" set "AGY_EXE=%LOCALAPPDATA%\Antigravity\Antigravity.exe"
if not defined AGY_EXE if exist "%ProgramFiles%\Antigravity\Antigravity.exe" set "AGY_EXE=%ProgramFiles%\Antigravity\Antigravity.exe"
if not defined AGY_EXE if exist "%ProgramFiles(x86)%\Antigravity\Antigravity.exe" set "AGY_EXE=%ProgramFiles(x86)%\Antigravity\Antigravity.exe"

if not defined AGY_EXE (
  echo {}
  exit /b 0
)

set "ELECTRON_RUN_AS_NODE=1"
set "ELECTRON_NO_ASAR=1"
"!AGY_EXE!" "!HOOK_JS!"
exit /b !ERRORLEVEL!
