@echo off
echo ==============================================
echo   AVVIO SERVER GREST PSG
echo ==============================================
echo.
cd frontend

echo Installazione pacchetti mancanti (se necessario)...
call npm install
echo.

echo Avvio ambiente di sviluppo (accessibile da altri dispositivi)...
echo Apri http://localhost:3000 nel browser di questo PC
echo Accedi dal Raspberry all'indirizzo: http://192.168.1.4:3000
echo.
call npm run dev -- -H 0.0.0.0
pause
