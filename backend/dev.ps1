# HMML Python Backend Development Script

param(
    [Parameter(Position=0)]
    [string]$Action = "help"
)

# Configuration
$pythonExe = "E:/MaimBot/HMML2/.venv/Scripts/python.exe"
$backendDir = "e:\MaimBot\HMML2\backend"

function Show-Help {
    Write-Host ""
    Write-Host "HMML Python Backend Development Tool" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\dev.ps1 [command]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor Green
    Write-Host "  start    - Start development server" -ForegroundColor White
    Write-Host "  dev      - Start development server (alias)" -ForegroundColor White
    Write-Host "  install  - Install dependencies" -ForegroundColor White
    Write-Host "  status   - Show service status" -ForegroundColor White
    Write-Host "  logs     - View log files" -ForegroundColor White
    Write-Host "  clean    - Clean logs and cache" -ForegroundColor White
    Write-Host "  help     - Show this help message" -ForegroundColor White
    Write-Host ""
}

function Start-DevServer {
    Write-Host "Starting HMML Python development server..." -ForegroundColor Green
    Set-Location $backendDir
    & $pythonExe start.py
}

function Install-Dependencies {
    Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
    Set-Location $backendDir
    & $pythonExe -m pip install -r requirements.txt
    Write-Host "Dependencies installed successfully" -ForegroundColor Green
}

function Show-Status {
    Write-Host "Checking service status..." -ForegroundColor Blue
    
    # Check if port is in use
    $port = 7999
    $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
    
    if ($connection) {
        Write-Host "Service is running - Port $port is in use" -ForegroundColor Green
        Write-Host "Access URL: http://localhost:$port" -ForegroundColor Cyan
    } else {
        Write-Host "Service is not running - Port $port is free" -ForegroundColor Red
    }
    
    # Check log files
    $logDir = Join-Path $backendDir "logs"
    if (Test-Path $logDir) {
        $logFiles = Get-ChildItem $logDir -Filter "*.log" | Measure-Object
        Write-Host "Log files count: $($logFiles.Count)" -ForegroundColor White
    }
}

function Show-Logs {
    $logDir = Join-Path $backendDir "logs"
    
    if (-not (Test-Path $logDir)) {
        Write-Host "Log directory does not exist: $logDir" -ForegroundColor Red
        return
    }
    
    $logFiles = Get-ChildItem $logDir -Filter "*.log" | Sort-Object LastWriteTime -Descending
    
    if ($logFiles.Count -eq 0) {
        Write-Host "No log files found" -ForegroundColor Yellow
        return
    }
    
    Write-Host "Latest log file:" -ForegroundColor Green
    $latestLog = $logFiles[0]
    Write-Host "   File: $($latestLog.Name)" -ForegroundColor White
    Write-Host "   Size: $([math]::Round($latestLog.Length / 1KB, 2)) KB" -ForegroundColor White
    Write-Host "   Modified: $($latestLog.LastWriteTime)" -ForegroundColor White
    Write-Host ""
    
    # Show last few lines
    $content = Get-Content $latestLog.FullName -Tail 10
    Write-Host "Last 10 lines:" -ForegroundColor Yellow
    $content | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
}

function Clean-Files {
    Write-Host "Cleaning files..." -ForegroundColor Yellow
    
    $logDir = Join-Path $backendDir "logs"
    if (Test-Path $logDir) {
        $logFiles = Get-ChildItem $logDir -Filter "*.log"
        if ($logFiles) {
            Remove-Item $logFiles -Force
            Write-Host "Cleaned $($logFiles.Count) log files" -ForegroundColor Green
        }
    }
    
    # Clean Python cache
    $pycacheFiles = Get-ChildItem $backendDir -Recurse -Directory -Name "__pycache__"
    if ($pycacheFiles) {
        $pycacheFiles | ForEach-Object {
            $fullPath = Join-Path $backendDir $_
            Remove-Item $fullPath -Recurse -Force
        }
        Write-Host "Cleaned Python cache files" -ForegroundColor Green
    }
    
    Write-Host "Cleanup completed" -ForegroundColor Green
}

# Main logic
switch ($Action.ToLower()) {
    "start" { Start-DevServer }
    "dev" { Start-DevServer }
    "install" { Install-Dependencies }
    "status" { Show-Status }
    "logs" { Show-Logs }
    "clean" { Clean-Files }
    "" { Show-Help }
    "help" { Show-Help }
    default { 
        Write-Host "Unknown command: $Action" -ForegroundColor Red
        Show-Help 
    }
}
