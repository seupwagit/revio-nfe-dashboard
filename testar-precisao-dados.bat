@echo off
echo ========================================
echo TESTE: Precisao Absoluta dos Dados
echo ========================================
echo.
echo Este teste valida que TODAS as telas mostram
echo EXATAMENTE o mesmo numero de documentos
echo.
echo IMPORTANTE:
echo 1. Reinicie o servidor backend primeiro!
echo    npm run backoffice
echo.
echo 2. Depois execute o frontend:
echo    npm run dev
echo.
echo ========================================
echo.
echo PASSOS DO TESTE:
echo.
echo 1. Abra http://localhost:5173
echo.
echo 2. ANALYTICS
echo    - Selecione "Ultimo ano" (12m)
echo    - Anote o total: _____ documentos
echo.
echo 3. DASHBOARD
echo    - Clique no botao verde "Ultimo ano"
echo    - Anote o total: _____ documentos
echo.
echo 4. NOTAS FISCAIS (Grid)
echo    - Clique no botao verde "Ultimo ano"
echo    - Anote o total: _____ documentos
echo.
echo RESULTADO ESPERADO:
echo - Todas as telas devem mostrar: 5.199 documentos
echo - Se houver diferenca, a correcao nao funcionou!
echo.
echo ========================================
echo.
echo Deseja iniciar o servidor backend agora? (S/N)
set /p resposta=
if /i "%resposta%"=="S" (
    echo.
    echo Iniciando servidor backend...
    npm run backoffice
) else (
    echo.
    echo Lembre-se de iniciar o backend manualmente:
    echo npm run backoffice
    echo.
    pause
)
