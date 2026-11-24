@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

set "PLUGIN_DIR=%~dp0"
set "SCRIPT=%PLUGIN_DIR%skills\antigravity-ru\scripts\install-ru.js"
set "LOG=%TEMP%\antigravity-ru-install.log"
set "ELECTRON_RUN_AS_NODE="

if not exist "%SCRIPT%" (
  echo [ОШИБКА] Не найден скрипт установки: "%SCRIPT%"
  pause
  exit /b 1
)

set "USE_NODE="
where node >nul 2>&1
if not errorlevel 1 set "USE_NODE=1"

set "RUNTIME_EXE="
if not defined USE_NODE (
  if exist "%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe" set "RUNTIME_EXE=%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe"
)
if not defined USE_NODE if not defined RUNTIME_EXE if exist "%LOCALAPPDATA%\Antigravity\Antigravity.exe" set "RUNTIME_EXE=%LOCALAPPDATA%\Antigravity\Antigravity.exe"
if not defined USE_NODE if not defined RUNTIME_EXE if exist "%ProgramFiles%\Antigravity\Antigravity.exe" set "RUNTIME_EXE=%ProgramFiles%\Antigravity\Antigravity.exe"
if not defined USE_NODE if not defined RUNTIME_EXE if exist "%ProgramFiles(x86)%\Antigravity\Antigravity.exe" set "RUNTIME_EXE=%ProgramFiles(x86)%\Antigravity\Antigravity.exe"

if not defined USE_NODE if not defined RUNTIME_EXE (
  echo [ОШИБКА] Не найден ни Node.js, ни установленный Antigravity.exe.
  echo Установите Antigravity или передайте путь вручную: node "%SCRIPT%" --app-dir "ПУТЬ"
  pause
  exit /b 1
)

echo [Antigravity RU] Подготовка перевода и установка плагина...
if defined USE_NODE (
  node "%SCRIPT%" --sync-plugin > "%LOG%" 2>&1
  set "RC=!ERRORLEVEL!"
) else (
  set "ELECTRON_RUN_AS_NODE=1"
  "%RUNTIME_EXE%" "%SCRIPT%" --sync-plugin > "%LOG%" 2>&1
  set "RC=!ERRORLEVEL!"
  set "ELECTRON_RUN_AS_NODE="
)

type "%LOG%"

if not "!RC!"=="0" (
  echo.
  echo [ОШИБКА] Установка завершилась с кодом !RC!.
  pause
  exit /b !RC!
)

set "STATUS="
set "ACTIVATOR_PATH="
set "AGY_EXE="
for /f "usebackq tokens=1,* delims==" %%A in ("%LOG%") do (
  if "%%A"=="STATUS" set "STATUS=%%B"
  if "%%A"=="ACTIVATOR_PATH" set "ACTIVATOR_PATH=%%B"
  if "%%A"=="AGY_EXE" set "AGY_EXE=%%B"
)

if "!STATUS!"=="LOCKED_NEEDS_ACTIVATOR" (
  if exist "!ACTIVATOR_PATH!" (
    echo.
    echo [Antigravity RU] Запуск активатора и перезапуск Antigravity...
    call "!ACTIVATOR_PATH%"
    exit /b !ERRORLEVEL!
  )
)

echo.
if defined AGY_EXE (
  tasklist /FI "IMAGENAME eq Antigravity.exe" 2>nul | find /I "Antigravity.exe" >nul
  if not errorlevel 1 (
    echo [Antigravity RU] Перезапуск запущенного Antigravity...
    taskkill /IM Antigravity.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
    taskkill /F /IM Antigravity.exe >nul 2>&1
  )
  echo [Antigravity RU] Готово! Запускаем Antigravity на русском языке...
  start "" "!AGY_EXE!"
) else (
  echo [Antigravity RU] Готово! Перезапустите Antigravity для применения русского интерфейса.
  pause
)
exit /b 0
