@echo off
echo ========================================
echo   Firmen-Tool starten...
echo ========================================
echo.
echo Zum Beenden: Ctrl+C druecken
echo ========================================
echo.
cd /d "%~dp0"
start "" http://localhost:3000
npm run dev
