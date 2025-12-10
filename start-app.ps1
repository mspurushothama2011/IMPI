# Start backend and frontend for IMIP (Intelligent Meeting Insights Platform)
# This script starts MongoDB (if needed), backend API, and frontend dev server

$ErrorActionPreference = "Continue"
$env:PYTHONIOENCODING = "utf-8"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Starting Intelligent Meeting Insights Platform..." -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
$mongoRunning = Get-Process -Name mongod -ErrorAction SilentlyContinue
if (-not $mongoRunning) {
    Write-Host "[WARN] MongoDB is not running. Please start it manually:" -ForegroundColor Yellow
    Write-Host "  mongod --dbpath <your-db-path>" -ForegroundColor Gray
    Write-Host ""
}

# Find Python interpreter
$pythonExe = $null
if (Test-Path ".\venv\Scripts\python.exe") {
    $pythonExe = ".\venv\Scripts\python.exe"
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonExe = "python"
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonExe = "py"
} else {
    Write-Host "[ERROR] Python not found. Please install Python or activate venv." -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Using Python: $pythonExe" -ForegroundColor Green

# Start backend
Write-Host "[INFO] Starting backend on http://127.0.0.1:8000..." -ForegroundColor Cyan
Start-Process -FilePath $pythonExe -ArgumentList "main.py" -WorkingDirectory $PSScriptRoot -WindowStyle Hidden

Start-Sleep -Seconds 3

# Wait for backend to be ready
$maxWait = 30
$waited = 0
$backendReady = $false
Write-Host "[INFO] Waiting for backend to start..." -ForegroundColor Yellow
while ($waited -lt $maxWait) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            break
        }
    } catch {
        # Not ready yet
    }
    Start-Sleep -Seconds 1
    $waited++
}

if ($backendReady) {
    Write-Host "[OK] Backend is ready!" -ForegroundColor Green
} else {
    Write-Host "[WARN] Backend did not respond within ${maxWait}s. It may still be starting..." -ForegroundColor Yellow
}

# Start frontend
Write-Host "[INFO] Starting frontend on http://localhost:5173..." -ForegroundColor Cyan
Start-Process -FilePath "cmd" -ArgumentList "/c cd /d `"$PSScriptRoot\frontend`" && npm run dev" -WorkingDirectory "$PSScriptRoot\frontend" -WindowStyle Hidden

Write-Host ""
Write-Host "===== IMIP Started =====" -ForegroundColor Green
Write-Host "Backend:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "API Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "To stop: .\stop-app.ps1" -ForegroundColor Gray
