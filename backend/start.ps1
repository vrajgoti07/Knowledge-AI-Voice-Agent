# ============================================================
# start.ps1 - Knowledge AI Backend Launcher
# Auto-kills any zombie on port 8000, then starts uvicorn
# with an auto-restart loop so a crash never leaves it dead.
#
# Usage: .\start.ps1
#
# -- FULL STARTUP ORDER (4 separate terminals) ---------------
#   Terminal 1 (services): docker-compose up -d
#               (starts Postgres, Qdrant, Redis via Docker)
#   Terminal 2 (worker):   cd backend && .\start_worker.ps1
#               (Celery worker -- handles ALL document processing)
#   Terminal 3 (API):      cd backend && .\start.ps1
#               (uvicorn -- handles lightweight HTTP only)
#   Terminal 4 (frontend): cd frontend && npm run dev
# ============================================================

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Knowledge AI -- API Server (uvicorn)" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "TIP: Make sure the Celery worker is also running:" -ForegroundColor Yellow
Write-Host "     .\start_worker.ps1   (in a separate terminal)" -ForegroundColor Yellow
Write-Host ""

Set-Location $PSScriptRoot

# Activate the virtual environment
$venvActivate = Join-Path $PSScriptRoot "venv\Scripts\Activate.ps1"
if (Test-Path $venvActivate) {
    . $venvActivate
    Write-Host "[start.ps1] Virtual environment activated." -ForegroundColor Green
} else {
    Write-Host "[start.ps1] WARNING: venv not found -- using system Python." -ForegroundColor Yellow
}

# Kill any process already on port 8000
Write-Host "[start.ps1] Checking port 8000..." -ForegroundColor Cyan
try {
    $connections = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $p = $conn.OwningProcess
            if ($p -and $p -ne 0 -and $p -ne 4) {
                Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
                Write-Host "[start.ps1] Killed PID $p on port 8000 via Get-NetTCPConnection" -ForegroundColor Yellow
            }
        }
    }
} catch {}

$lines = netstat -ano | Select-String ":8000" | Select-String "LISTENING"
foreach ($line in $lines) {
    $lineStr = $line.ToString()
    $parts = -split $lineStr
    if ($parts.Count -ge 5) {
        $p = $parts[-1]
        if ($p -match "^\d+$" -and $p -ne "0" -and $p -ne "4") {
            try {
                Stop-Process -Id ([int]$p) -Force -ErrorAction SilentlyContinue
                Write-Host "[start.ps1] Killed PID $p on port 8000 via netstat" -ForegroundColor Yellow
            } catch {}
        }
    }
}

Start-Sleep -Milliseconds 800
Write-Host "[start.ps1] Port 8000 clear." -ForegroundColor Green
Write-Host ""

# Auto-launch the Celery worker in a separate terminal window
$workerScript = Join-Path $PSScriptRoot "start_worker.ps1"
if (Test-Path $workerScript) {
    Write-Host "[start.ps1] Auto-launching Celery worker in a separate window..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-File", $workerScript -WindowStyle Normal
    Write-Host "[start.ps1] Celery worker launched (separate window)." -ForegroundColor Green
    Start-Sleep -Milliseconds 2000  # Give worker time to connect to Redis
} else {
    Write-Host "[start.ps1] WARNING: start_worker.ps1 not found. Worker must be started manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[start.ps1] Starting uvicorn with auto-restart loop..." -ForegroundColor Green
Write-Host "           (If it crashes, it restarts automatically within 2 seconds)" -ForegroundColor Gray
Write-Host ""

# Auto-restart loop:
# If uvicorn crashes for any reason (OOM, unhandled exception, etc.) it
# restarts automatically within 2 seconds instead of silently staying dead.
while ($true) {
    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    $exitCode = $LASTEXITCODE
    Write-Host ""
    Write-Host "[start.ps1] uvicorn exited (code $exitCode). Restarting in 2s..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}
