@echo off
REM Fresh IMIP stop script (Batch)

color 0C
echo ========================================
echo   IMIP Application Shutdown
echo ========================================
echo.

echo Stopping Backend API (port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000"') do (
  taskkill /F /PID %%a 2>nul
)
echo.

echo Stopping Frontend Dev Server (port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173"') do (
  taskkill /F /PID %%a 2>nul
)
echo.

echo Cleanup stray python/node processes (best-effort)...
taskkill /F /IM python.exe 2>nul
taskkill /F /IM node.exe 2>nul
echo.

color 0A
echo ========================================
echo   All Services Stopped
echo ========================================
echo.
pause





