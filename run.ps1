<#
  run.ps1 - start (or check) the SystemDesignAI stack on Windows.

    .\run.ps1            start Ollama + backend + frontend + watcher, open the UI
    .\run.ps1 -Status    just print what is UP / DOWN, do not start anything

  Four processes make up the app (all started by this script):
    - Ollama daemon  :11434   serves qwen3:4b (free local chat)
    - Backend API    :8000    FastAPI - retrieval, LLM routing, vault, flashcards
    - Frontend UI    :3000    Vite/React cockpit (proxies /api to :8000)
    - raw/ watcher            auto-ingests dropped PDFs/markdown into the review queue
#>
param([switch]$Status)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$ollamaExe = Join-Path $env:LOCALAPPDATA "Programs\Ollama\ollama.exe"

function Test-Url($url) {
  try { Invoke-WebRequest -Uri $url -TimeoutSec 10 -UseBasicParsing | Out-Null; return $true }
  catch { return $false }
}

function Write-Line($name, $ok) {
  if ($ok) { $label = "UP  "; $color = "Green" } else { $label = "DOWN"; $color = "Red" }
  Write-Host ("   {0,-24} {1}" -f $name, $label) -ForegroundColor $color
}

function Show-Status {
  Write-Host "`n  SystemDesignAI - status" -ForegroundColor Cyan
  $api = Test-Url "http://localhost:8000/api/health"
  $web = Test-Url "http://localhost:3000/"
  $oll = Test-Url "http://localhost:11434/api/tags"
  $qwen = $false
  if ($oll) {
    try { $qwen = ((Invoke-WebRequest "http://localhost:11434/api/tags" -UseBasicParsing).Content -match "qwen3:4b") } catch {}
  }
  $watcher = $false
  try {
    $watcher = [bool](Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
                      Where-Object { $_.CommandLine -match 'watcher\.py' })
  } catch {}
  Write-Line "Backend  (API  :8000)" $api
  Write-Line "Frontend (UI   :3000)" $web
  Write-Line "Ollama   (     :11434)" $oll
  Write-Line "  qwen3:4b pulled" $qwen
  Write-Line "Watcher  (raw/ ingest)" $watcher
  Write-Host ""
}

if ($Status) { Show-Status; return }

# ---- pre-flight ----------------------------------------------------------
if (-not (Test-Path "$root\.venv-win\Scripts\python.exe")) {
  Write-Host "!! .venv-win missing. First-time setup:" -ForegroundColor Yellow
  Write-Host "   py -3.12 -m venv .venv-win" -ForegroundColor Yellow
  Write-Host "   .venv-win\Scripts\python -m pip install -r tools\requirements.txt" -ForegroundColor Yellow
  return
}
if (-not (Test-Path "$root\course-app\node_modules")) {
  Write-Host "!! frontend deps missing. Run:  npm --prefix course-app install" -ForegroundColor Yellow
  return
}

# ---- Ollama (non-fatal) --------------------------------------------------
if (-not (Test-Url "http://localhost:11434/api/tags")) {
  if (Test-Path $ollamaExe) {
    Write-Host ">> starting Ollama daemon..." -ForegroundColor DarkGray
    Start-Process $ollamaExe -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 2
  } else {
    Write-Host "!! Ollama not found - chat will fall back to Claude (small cost)." -ForegroundColor Yellow
    Write-Host "   Install from https://ollama.com, then: ollama pull qwen3:8b" -ForegroundColor Yellow
  }
}

# ---- backend -------------------------------------------------------------
Write-Host ">> starting backend on :8000 ..." -ForegroundColor Green
$backendCmd = "`$host.ui.RawUI.WindowTitle='SDA backend :8000'; Set-Location '$root'; `$env:OLLAMA_KEEP_ALIVE='-1'; .venv-win\Scripts\python -m uvicorn api:app --app-dir tools --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# ---- frontend ------------------------------------------------------------
Write-Host ">> starting frontend on :3000 ..." -ForegroundColor Green
$frontendCmd = "`$host.ui.RawUI.WindowTitle='SDA frontend :3000'; Set-Location '$root\course-app'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

# ---- watcher (auto-ingest raw/) -----------------------------------------
Write-Host ">> starting raw/ watcher ..." -ForegroundColor Green
$watcherCmd = "`$host.ui.RawUI.WindowTitle='SDA watcher'; Set-Location '$root'; .venv-win\Scripts\python tools\watcher.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $watcherCmd

Write-Host "`n  UI: http://localhost:3000  (first question takes ~10s while models load)" -ForegroundColor Cyan
Write-Host "  Check status any time with:  .\run.ps1 -Status`n" -ForegroundColor DarkGray
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"
