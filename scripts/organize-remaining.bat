@echo off
echo Organizando scripts restantes...

REM Mover kill-ports.bat para windows
if exist "scripts\kill-ports.bat" move /Y "scripts\kill-ports.bat" "scripts\windows\" 2>nul

REM Mover auto-debug-monitor.mjs para monitoring (se ainda estiver na raiz de scripts)
if exist "scripts\auto-debug-monitor.mjs" move /Y "scripts\auto-debug-monitor.mjs" "scripts\monitoring\" 2>nul

echo Concluido!
