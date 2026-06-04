# AsEmOs geliştirme ortamı: PostgreSQL + Chat2DB + Redis + Qdrant
# Kullanım: .\scripts\start-docker-dev.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

function Test-DockerReady {
    docker info *> $null
    return $LASTEXITCODE -eq 0
}

function Start-DockerDesktop {
    $paths = @(
        "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe"
    )
    foreach ($p in $paths) {
        if (Test-Path $p) {
            Write-Host "Docker Desktop baslatiliyor..."
            Start-Process $p
            return $true
        }
    }
    return $false
}

if (-not (Test-DockerReady)) {
    if (-not (Start-DockerDesktop)) {
        Write-Error "Docker Desktop bulunamadi. Lutfen elle acin."
    }
    Write-Host "Docker hazir olana kadar bekleniyor (en fazla 3 dk)..."
    $ok = $false
    for ($i = 1; $i -le 36; $i++) {
        if (Test-DockerReady) { $ok = $true; break }
        Start-Sleep -Seconds 5
        Write-Host "  ... $i/36"
    }
    if (-not $ok) {
        Write-Error "Docker baslamadi. Docker Desktop acik ve yesil mi kontrol edin."
    }
}

Write-Host "`n=== PostgreSQL + Chat2DB ===" -ForegroundColor Cyan
docker compose -f "$root\docker-compose.yml" up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== Redis + Qdrant (AI servisi) ===" -ForegroundColor Cyan
docker compose -f "$root\ai-llm\docker-compose.yml" up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== Calisan servisler ===" -ForegroundColor Green
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host @"

Hazir:
  PostgreSQL  -> localhost:5433  (user: postgres, pass: 123, db: ai_mekan_oneri_db)
  Chat2DB     -> http://localhost:10824  (DB host: db, port: 5432)
  Redis       -> localhost:6379
  Qdrant      -> http://localhost:6333

Backend:  cd backend && uvicorn main:app --reload --port 8000
AI-LLM:   cd ai-llm && python app.py
Mobile:   cd apps/mobile && npx expo start
"@
