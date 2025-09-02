#!/usr/bin/env pwsh
# Build SEA executable for Windows

Write-Host "Building HMML Windows executable..." -ForegroundColor Green

# Create build directory if it doesn't exist
if (!(Test-Path "build")) {
    New-Item -ItemType Directory -Path "build" | Out-Null
}

# Run the bundle process
Write-Host "Bundling application..." -ForegroundColor Yellow
npm run bundle
if ($LASTEXITCODE -ne 0) {
    Write-Host "Bundle failed!" -ForegroundColor Red
    exit 1
}

# Generate SEA blob
Write-Host "Generating SEA blob..." -ForegroundColor Yellow
$env:NODE_NO_WARNINGS = "1"
node --experimental-sea-config sea-config.json --no-warnings
if ($LASTEXITCODE -ne 0) {
    Write-Host "SEA blob generation failed!" -ForegroundColor Red
    exit 1
}

# Copy Node.js executable
Write-Host "Copying Node.js executable..." -ForegroundColor Yellow
$nodePath = (Get-Command node).Source
Copy-Item $nodePath "build/hmml-win.exe" -Force

# Inject application into executable
Write-Host "Injecting application..." -ForegroundColor Yellow
npx postject build/hmml-win.exe NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --overwrite 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Injection failed!" -ForegroundColor Red
    exit 1
}

$exeSize = (Get-Item "build/hmml-win.exe").Length
$exeSizeMB = [math]::Round($exeSize / 1MB, 2)

Write-Host "✅ Build complete! Generated: build/hmml-win.exe ($exeSizeMB MB)" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Note: The SEA warning is expected and doesn't affect functionality." -ForegroundColor Yellow
Write-Host "   This is a known limitation of Node.js Single Executable Applications." -ForegroundColor Yellow
