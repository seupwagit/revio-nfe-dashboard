@echo off
echo ========================================
echo TESTE: Consistencia de "Ultimo Ano"
echo ========================================
echo.
echo Este teste valida que todas as telas mostram
echo o mesmo total de documentos ao filtrar por "ultimo ano"
echo.
echo PASSOS:
echo.
echo 1. Abra o navegador em http://localhost:5173
echo.
echo 2. Va para ANALYTICS
echo    - Selecione "Ultimo ano" (12m)
echo    - Anote o total de documentos
echo.
echo 3. Va para DASHBOARD
echo    - Clique no preset "Ultimo ano" (novo botao verde)
echo    - Verifique que o total e o mesmo
echo.
echo 4. Va para NOTAS FISCAIS (Grid)
echo    - Clique no preset "Ultimo ano" (novo botao verde)
echo    - Verifique que o total e o mesmo
echo.
echo RESULTADO ESPERADO:
echo - Todas as telas devem mostrar 5199 documentos
echo - O periodo deve ser de 03/12/2023 ate 03/12/2024
echo.
echo ========================================
echo Pressione qualquer tecla para iniciar o app...
pause > nul

npm run dev
