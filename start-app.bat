@echo off
REM IMIP start script (Batch) - Fixed version
REM Starts backend and frontend using PowerShell script

setlocal EnableExtensions
chcp 65001 >nul
set PYTHONIOENCODING=utf-8

color 0B
echo ========================================
echo   IMIP Application Startup
echo ========================================
echo.

REM Base dir
set "BASE_DIR=%~dp0"
cd /d "%BASE_DIR%"
echo Working directory: %BASE_DIR%
echo.

REM Use PowerShell script instead of complex batch logic
echo [INFO] Starting services using PowerShell...
powershell -ExecutionPolicy Bypass -File "start-app.ps1"

echo.
echo [INFO] If services didn't start, check the PowerShell output above.
echo.
echo URLs:
echo   Backend:  http://127.0.0.1:8000
echo   Frontend: http://localhost:5173
echo   API Docs: http://127.0.0.1:8000/docs
echo.
echo To stop services: .\stop-app.bat
echo.
pause





