@echo off
echo ==============================================
echo   AVVIO SERVER GREST PSG
echo ==============================================
echo.
cd frontend

echo Installazione pacchetti mancanti (se necessario)...
call npm install
echo.

echo Avvio ambiente di sviluppo...
echo Apri http://localhost:3000 nel browser
echo.
call npm run dev
pause
