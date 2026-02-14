@echo off
echo Resetting Grest PSG Tournament Database...
cd frontend
if exist tournament.db (
    del tournament.db
    echo Database file deleted.
)
if exist tournament.db-wal (
    del tournament.db-wal
)
if exist tournament.db-shm (
    del tournament.db-shm
)
echo Done. Restart the server using AVVIA_SERVER.bat to re-seed.
pause
