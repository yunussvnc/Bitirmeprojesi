Write-Host "===========================================" -ForegroundColor Magenta
Write-Host "   AI-LLM Servisi Baslatiliyor (port 8081)" -ForegroundColor Magenta
Write-Host "===========================================" -ForegroundColor Magenta
Write-Host ""

Set-Location "D:\BitirmeProjesi\ai-llm"

$uvicorn = "D:\BitirmeProjesi\.venv\Scripts\uvicorn.exe"

if (-not (Test-Path $uvicorn)) {
    Write-Host "HATA: uvicorn bulunamadi: $uvicorn" -ForegroundColor Red
    Write-Host "Pip ile yukleniyor..." -ForegroundColor Yellow
    & "D:\BitirmeProjesi\.venv\Scripts\pip.exe" install uvicorn fastapi
}

Write-Host "Uvicorn baslatiliyor..." -ForegroundColor Green
Write-Host "URL: http://10.23.0.72:8081" -ForegroundColor Cyan
Write-Host ""

& $uvicorn app:app --host 0.0.0.0 --port 8082 --reload
