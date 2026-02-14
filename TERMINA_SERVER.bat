@echo off
echo ==============================================
echo   CHIUSURA SERVER GREST PSG
echo ==============================================
echo.
echo Arresto forzato di Node.js...
taskkill /F /IM node.exe
echo.
echo Server terminato con successo.
pause
