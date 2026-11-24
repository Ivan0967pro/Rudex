@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

set "PLUGIN_DIR=%~dp0"
set "SCRIPT=%PLUGIN_DIR%skills\antigravity-ru\scripts\uninstall-ru.js"
set "LOG=%TEMP%\antigravity-ru-uninstall.log"
set "ELECTRON_RUN_AS_NODE="

if not exist "%SCRIPT%" (
  echo [ОШИБКА] Не найден скрипт удаления: "%SCRIPT%"
  pause
  exit /b 1
)

set "USE_NODE="
where node >nul 2>&1
if not errorlevel 1 set "USE_NODE=1"

set "RUNTIME_EXE="
if exist "%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe" set "RUNTIME_EXE=%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe"
if not defined RUNTIME_EXE if exist "%LOCALAPPDATA%\Antigravity\Antigravity.exe" set "RUNTIME_EXE=%LOCALAPPDATA%\Antigravity\Antigravity.exe"
if not defined RUNTIME_EXE if exist "%ProgramFiles%\Antigravity\Antigravity.exe" set "RUNTIME_EXE=%ProgramFiles%\Antigravity\Antigravity.exe"
if not defined RUNTIME_EXE if exist "%ProgramFiles(x86)%\Antigravity\Antigravity.exe" set "RUNTIME_EXE=%ProgramFiles(x86)%\Antigravity\Antigravity.exe"

echo [Antigravity RU] Закрываем Antigravity для безопасного отката...
taskkill /IM Antigravity.exe >nul 2>&1
timeout /t 2 /nobreak >nul
taskkill /F /IM Antigravity.exe >nul 2>&1
timeout /t 1 /nobreak >nul

if defined USE_NODE (
  node "%SCRIPT%" > "%LOG%" 2>&1
  set "RC=!ERRORLEVEL!"
) else (
  if not defined RUNTIME_EXE (
    echo [ОШИБКА] Не найден ни Node.js, ни Antigravity.exe.
    pause
    exit /b 1
  )
  set "ELECTRON_RUN_AS_NODE=1"
  "%RUNTIME_EXE%" "%SCRIPT%" > "%LOG%" 2>&1
  set "RC=!ERRORLEVEL!"
  set "ELECTRON_RUN_AS_NODE="
)

type "%LOG%"

if not "!RC!"=="0" (
  echo.
  echo [ОШИБКА] Удаление завершилось с кодом !RC!.
  pause
  exit /b !RC!
)

set "AGY_EXE="
for /f "usebackq tokens=1,* delims==" %%A in ("%LOG%") do (
  if "%%A"=="AGY_EXE" set "AGY_EXE=%%B"
)

if not defined AGY_EXE if defined RUNTIME_EXE set "AGY_EXE=%RUNTIME_EXE%"
if defined AGY_EXE (
  echo [Antigravity RU] Оригинальный английский интерфейс восстановлен. Запускаем Antigravity...
  start "" "!AGY_EXE!"
) else (
  echo [Antigravity RU] Оригинальный английский интерфейс восстановлен.
  pause
)
exit /b 0
