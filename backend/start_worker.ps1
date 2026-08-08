# ============================================================
# start_worker.ps1 — Start the Celery document-processing worker
#
# Run this in its own terminal BEFORE uploading any documents.
# The worker runs in the backend\venv Python environment.
#
# Requirements: Redis must be running on localhost:6379
# ============================================================

Set-Location $PSScriptRoot

# Activate the virtual environment
$venvActivate = Join-Path $PSScriptRoot "venv\Scripts\Activate.ps1"
if (Test-Path $venvActivate) {
    . $venvActivate
    Write-Host "[Worker] Virtual environment activated." -ForegroundColor Green
} else {
    Write-Host "[Worker] WARNING: venv not found at $venvActivate — using system Python." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Knowledge AI — Celery Worker" -ForegroundColor Cyan
Write-Host "  Broker : redis://localhost:6379/0" -ForegroundColor Cyan
Write-Host "  Pool   : solo (Windows-compatible)" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Heavy document processing (text extraction, chunking, embedding)" -ForegroundColor Gray
Write-Host "runs HERE — never inside the uvicorn process." -ForegroundColor Gray
Write-Host ""

# Start the worker.  --pool=solo is mandatory on Windows because the default
# prefork pool uses os.fork() which is not available on Windows.
celery -A app.tasks.document_tasks worker `
    --loglevel=info `
    --pool=solo `
    --concurrency=1 `
    --hostname="worker@%h"
