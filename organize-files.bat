@echo off
echo ========================================
echo   Organizando Arquivos do Projeto
echo ========================================
echo.

REM Criar estrutura de diretorios
echo Criando estrutura de diretorios...
if not exist "docs\deploy" mkdir "docs\deploy"
if not exist "docs