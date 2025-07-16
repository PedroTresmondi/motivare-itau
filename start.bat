@echo off
echo === Etapa 1: Atualizando repositório e instalando dependências...

call instalar.bat

echo === Etapa 2: Iniciando servidor...
start "" cmd /k "node server.js"

timeout /t 3 >nul

echo === Etapa 3: Abrindo navegador em modo tela cheia...
start "" chrome --kiosk http://localhost:5500/configuracao.html

echo.
echo Tudo pronto!
pause
