# Stop backend and frontend for IMIP

$ErrorActionPreference = "Continue"

Write-Host "Stopping Intelligent Meeting Insights Platform..." -ForegroundColor Cyan
Write-Host ""

# Stop Python (backend)
$pythonProcesses = Get-Process -Name python -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    Write-Host "[INFO] Stopping backend (Python processes)..." -ForegroundColor Yellow
    $pythonProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Backend stopped." -ForegroundColor Green
} else {
    Write-Host "[INFO] No backend processes found." -ForegroundColor Gray
}

# Stop Node (frontend)
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "[INFO] Stopping frontend (Node processes)..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Frontend stopped." -ForegroundColor Green
} else {
    Write-Host "[INFO] No frontend processes found." -ForegroundColor Gray
}

Write-Host ""
Write-Host "===== IMIP Stopped =====" -ForegroundColor Green
