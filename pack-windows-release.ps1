# HMML2 Windows Source Package Builder
# Build Windows source release package only, no upload

param(
    [string]$Version = "2.0.0",
    [string]$OutputDir = "release"
)

$ErrorActionPreference = "Stop"

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  HMML2 Windows Source Package Builder" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Version: v$Version" -ForegroundColor Cyan
Write-Host "Output: $OutputDir" -ForegroundColor Cyan
Write-Host ""

# Create output directory
if (Test-Path $OutputDir) {
    Write-Host "[1/6] Cleaning old files..." -ForegroundColor Yellow
    Remove-Item -Path $OutputDir -Recurse -Force
}
New-Item -Path $OutputDir -ItemType Directory -Force | Out-Null

# Temp directory
$tempDir = Join-Path $OutputDir "HMML2-v$Version-Windows-Source"
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null

Write-Host "[2/6] Copying project files..." -ForegroundColor Yellow

# Copy backend
Write-Host "  - Backend files" -ForegroundColor Gray
$backendDir = Join-Path $tempDir "backend"
New-Item -Path $backendDir -ItemType Directory -Force | Out-Null

Copy-Item -Path "backend\src" -Destination $backendDir -Recurse -Force
Copy-Item -Path "backend\public" -Destination $backendDir -Recurse -Force
Copy-Item -Path "backend\requirements.txt" -Destination $backendDir -Force
Copy-Item -Path "backend\start.py" -Destination $backendDir -Force
Copy-Item -Path "backend\dev-tool.py" -Destination $backendDir -Force
if (Test-Path "backend\README.md") {
    Copy-Item -Path "backend\README.md" -Destination $backendDir -Force
}

# Create backend directories
New-Item -Path "$backendDir\logs" -ItemType Directory -Force | Out-Null
New-Item -Path "$backendDir\data" -ItemType Directory -Force | Out-Null
New-Item -Path "$backendDir\config" -ItemType Directory -Force | Out-Null

# Copy default config
if (Test-Path "backend\config\server.json") {
    Copy-Item -Path "backend\config\server.json" -Destination "$backendDir\config\" -Force
}

# Copy frontend
Write-Host "  - Frontend files" -ForegroundColor Gray
$frontendDir = Join-Path $tempDir "frontend"
New-Item -Path $frontendDir -ItemType Directory -Force | Out-Null

Copy-Item -Path "frontend\src" -Destination $frontendDir -Recurse -Force
Copy-Item -Path "frontend\public" -Destination $frontendDir -Recurse -Force
Copy-Item -Path "frontend\index.html" -Destination $frontendDir -Force
Copy-Item -Path "frontend\package.json" -Destination $frontendDir -Force
Copy-Item -Path "frontend\pnpm-lock.yaml" -Destination $frontendDir -Force
Copy-Item -Path "frontend\vite.config.ts" -Destination $frontendDir -Force
Copy-Item -Path "frontend\tsconfig.json" -Destination $frontendDir -Force
Copy-Item -Path "frontend\tsconfig.node.json" -Destination $frontendDir -Force
Copy-Item -Path "frontend\postcss.config.js" -Destination $frontendDir -Force
Copy-Item -Path "frontend\tailwind.config.js" -Destination $frontendDir -Force
Copy-Item -Path "frontend\server.cjs" -Destination $frontendDir -Force
if (Test-Path "frontend\README.md") {
    Copy-Item -Path "frontend\README.md" -Destination $frontendDir -Force
}

# Copy root files
Write-Host "  - Documentation and scripts" -ForegroundColor Gray
$rootFiles = @(
    "README.md",
    "QUICKSTART.md",
    "NETWORK_ACCESS_GUIDE.md",
    "DOCKER_GUIDE.md",
    "RELEASE_NOTES.md",
    "start-windows.ps1"
)

foreach ($file in $rootFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination $tempDir -Force
    }
}

# Create installation guide
Write-Host "[3/6] Creating installation guide..." -ForegroundColor Yellow
$installGuide = @"
HMML2 v$Version - Windows Source Release

QUICK START
===========

1. Install Python 3.11+
   Download: https://www.python.org/downloads/

2. Install Node.js 20+
   Download: https://nodejs.org/

3. Install pnpm
   npm install -g pnpm

4. Install dependencies

   Backend:
   cd backend
   pip install -r requirements.txt

   Frontend:
   cd frontend
   pnpm install

5. Start services

   Method 1 - Quick start script (Recommended):
   .\start-windows.ps1

   Method 2 - Manual start:
   
   Terminal 1 (Backend):
   cd backend
   python start.py

   Terminal 2 (Frontend):
   cd frontend
   pnpm dev --host

6. Access

   Frontend: http://localhost:5173 (dev) or http://localhost:7998 (prod)
   Backend API: http://localhost:7999/docs

IMPORTANT
=========

- First startup will show access token - SAVE IT IMMEDIATELY
- Token is shown only once
- For network access guide see NETWORK_ACCESS_GUIDE.md

DOCUMENTATION
=============

- README.md - Full documentation
- QUICKSTART.md - Quick start guide
- NETWORK_ACCESS_GUIDE.md - Network access guide

SUPPORT
=======

Issues: https://github.com/DrSmoothl/HMML2/issues

---
Version: v$Version
Release Date: $(Get-Date -Format 'yyyy-MM-dd')
"@

Set-Content -Path "$tempDir\INSTALL.txt" -Value $installGuide -Encoding UTF8

# Create .gitignore
$gitignoreContent = @"
# Python
backend/__pycache__/
backend/**/__pycache__/
backend/*.pyc
backend/.venv/
backend/venv/
backend/logs/*.log
backend/data/*.db
backend/config/token.token

# Node
frontend/node_modules/
frontend/dist/
frontend/.pnpm-store/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db
"@

Set-Content -Path "$tempDir\.gitignore" -Value $gitignoreContent -Encoding UTF8

# Create version info
$versionInfo = @{
    version = $Version
    release_date = (Get-Date -Format 'yyyy-MM-dd')
    platform = "Windows"
    type = "Source"
    build_date = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
} | ConvertTo-Json -Depth 10

Set-Content -Path "$tempDir\version.json" -Value $versionInfo -Encoding UTF8

# Compress
Write-Host "[4/6] Compressing package..." -ForegroundColor Yellow
$zipFile = Join-Path $OutputDir "HMML2-v$Version-Windows-Source.zip"

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory(
    $tempDir, 
    $zipFile, 
    [System.IO.Compression.CompressionLevel]::Optimal, 
    $false
)

# Clean temp files
Write-Host "[5/6] Cleaning temp files..." -ForegroundColor Yellow
Remove-Item -Path $tempDir -Recurse -Force

# Calculate info
$fileInfo = Get-Item $zipFile
$fileSize = [math]::Round($fileInfo.Length / 1MB, 2)
$fileHash = (Get-FileHash $zipFile -Algorithm SHA256).Hash

# Show result
Write-Host ""
Write-Host "[6/6] Package complete!" -ForegroundColor Green
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  BUILD SUCCESSFUL" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Package Info:" -ForegroundColor Cyan
Write-Host "  File: HMML2-v$Version-Windows-Source.zip" -ForegroundColor White
Write-Host "  Path: $zipFile" -ForegroundColor White
Write-Host "  Size: $fileSize MB" -ForegroundColor White
Write-Host "  SHA256:" -ForegroundColor White
Write-Host "    $fileHash" -ForegroundColor Gray
Write-Host ""
Write-Host "Contents:" -ForegroundColor Cyan
Write-Host "  [OK] Backend source + requirements" -ForegroundColor Green
Write-Host "  [OK] Frontend source + package.json" -ForegroundColor Green
Write-Host "  [OK] Start scripts" -ForegroundColor Green
Write-Host "  [OK] Documentation" -ForegroundColor Green
Write-Host "  [OK] Installation guide" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Test the package" -ForegroundColor White
Write-Host "  2. Upload to GitHub Release (optional)" -ForegroundColor White
Write-Host ""
Write-Host "Done!" -ForegroundColor Green
Write-Host ""
