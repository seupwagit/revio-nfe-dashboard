@echo off
echo 🪟 SETUP DEBUG WINDOWS NATIVO
echo ==============================

REM Executar o script PowerShell
powershell -ExecutionPolicy Bypass -File "%~dp0Setup-Windows-Debug.ps1"

pause