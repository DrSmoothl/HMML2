# HMML 快速开发脚本
# 提供一系列便捷的开发和构建操作

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$Version,
    
    [switch]$DryRun,
    [switch]$SkipTests,
    [switch]$Open,
    [switch]$All,
    [switch]$Watch
)

# 设置控制台编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 颜色函数
function Write-Success { param($msg) Write-Host "Success: $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "Error: $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "Info: $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "Warning: $msg" -ForegroundColor Yellow }
function Write-Title { param($msg) Write-Host "`n=== $msg ===" -ForegroundColor Magenta }

# 检查 Node.js 和 pnpm
function Test-Prerequisites {
    Write-Info "Checking environment dependencies..."
    
    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "Node.js not installed or not in PATH"
        exit 1
    }
    
    if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-Error "pnpm not installed. Please run: npm install -g pnpm"
        exit 1
    }
    
    Write-Success "Environment dependencies check passed"
}

# 显示帮助信息
function Show-Help {
    Write-Host @"

HMML Quick Development Tool

Usage: .\dev.ps1 <command> [options]

Commands:
  release [version]    - Build production release
  dev [version]        - Build development version  
  build                - Build TypeScript only
  version <version>    - Update version number
  bump <type>          - Bump version (patch|minor|major)
  status               - Show project status
  info                 - Show version info
  clean                - Clean build artifacts
  install              - Install dependencies
  start                - Start application
  test                 - Run tests

Options:
  -DryRun             - Preview mode only
  -SkipTests          - Skip tests
  -Open               - Open output directory after build
  -Watch              - Enable watch mode (dev command only)
  -All                - Clean all files including node_modules

Examples:
  .\dev.ps1 release 1.2.0 -Open
  .\dev.ps1 dev -Watch
  .\dev.ps1 bump patch
  .\dev.ps1 version 2.0.0
  .\dev.ps1 status

"@
}

# 构建项目
function Invoke-Build {
    param($Environment, $Version, $SkipTests, $Open, $DryRun)
    
    Write-Title "$Environment Build Started"
    
    if ($DryRun) {
        Write-Warning "DRY RUN MODE - Operations to be performed:"
    }
    
    # 设置环境变量
    $env:NODE_ENV = $Environment
    Write-Info "Environment set to: $Environment"
    
    # 更新版本 (如果提供)
    if ($Version) {
        Write-Info "Updating version to: $Version"
        if (!$DryRun) {
            Invoke-UpdateVersion $Version $false
        }
    }
    
    # 运行测试
    if (!$SkipTests) {
        Write-Info "Running tests..."
        if (!$DryRun) {
            try {
                pnpm run test
                Write-Success "Tests passed"
            } catch {
                Write-Warning "Tests failed or not configured, continuing build..."
            }
        }
    }
    
    # 清理并构建
    Write-Info "Cleaning build directory..."
    if (!$DryRun) {
        pnpm run clean
    }
    
    Write-Info "Building with webpack..."
    if (!$DryRun) {
        if ($Environment -eq "production") {
            pnpm run build
        } else {
            pnpm run build:dev
        }
    }
    
    if (!$DryRun) {
        Write-Success "$Environment build completed!"
        
        # 显示下一步提示
        Write-Info "`nNext steps:"
        Write-Host "  - Run application: node dist/app.js" -ForegroundColor Gray
        if ($Environment -eq "development") {
            Write-Host "  - Development mode: pnpm run dev" -ForegroundColor Gray
        }
    }
}

# 更新版本
function Invoke-UpdateVersion {
    param($NewVersion, $DryRun = $false)
    
    Write-Title "Version Update: $NewVersion"
    
    if ($DryRun) {
        Write-Warning "DRY RUN MODE - Files that would be updated:"
        Write-Host "  - src\version.ts" -ForegroundColor Gray
        Write-Host "  - package.json" -ForegroundColor Gray
        return
    }
    
    # 更新主版本文件
    $versionFile = "src\version.ts"
    if (Test-Path $versionFile) {
        $content = Get-Content $versionFile -Raw -Encoding UTF8
        $newContent = $content -replace "export const HMML_VERSION = '[^']+';", "export const HMML_VERSION = '$NewVersion';"
        Set-Content $versionFile $newContent -Encoding UTF8
        Write-Success "Updated: $versionFile"
    }
    
    # 更新 package.json
    $packageFile = "package.json"
    if (Test-Path $packageFile) {
        $package = Get-Content $packageFile -Raw | ConvertFrom-Json
        $package.version = $NewVersion
        $package | ConvertTo-Json -Depth 10 | Set-Content $packageFile -Encoding UTF8
        Write-Success "Updated: $packageFile"
    }
    
    Write-Success "Version update completed!"
}

# 增量更新版本
function Invoke-BumpVersion {
    param($Type, $DryRun = $false)
    
    Write-Title "Bump Version: $Type"
    
    # 读取当前版本
    $packageFile = "package.json"
    if (!(Test-Path $packageFile)) {
        Write-Error "package.json not found"
        return
    }
    
    $package = Get-Content $packageFile -Raw | ConvertFrom-Json
    $currentVersion = $package.version
    $parts = $currentVersion -split '\.'
    
    if ($parts.Length -ne 3) {
        Write-Error "Invalid version format: $currentVersion"
        return
    }
    
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    $patch = [int]$parts[2]
    
    switch ($Type) {
        "major" { $newVersion = "$($major + 1).0.0" }
        "minor" { $newVersion = "$major.$($minor + 1).0" }
        "patch" { $newVersion = "$major.$minor.$($patch + 1)" }
        default { Write-Error "Version type must be: major, minor, or patch"; return }
    }
    
    Write-Info "$currentVersion -> $newVersion"
    
    if (!$DryRun) {
        Invoke-UpdateVersion $newVersion $false
        Write-Success "Version bumped to: $newVersion"
    }
}

# 显示项目状态
function Show-ProjectStatus {
    Write-Title "HMML Project Status"
    
    # 版本信息
    Write-Host "Version Info:" -ForegroundColor Cyan
    if (Test-Path "package.json") {
        $package = Get-Content "package.json" -Raw | ConvertFrom-Json
        Write-Host "  Current Version: $($package.version)" -ForegroundColor Gray
    }
    Write-Host "  Node.js: $($PSVersionTable.PSVersion)" -ForegroundColor Gray
    
    # 环境变量处理 (PowerShell 5.1 兼容)
    $nodeEnv = if ($env:NODE_ENV) { $env:NODE_ENV } else { "development" }
    Write-Host "  Environment: $nodeEnv" -ForegroundColor Gray
    
    # Git 信息
    try {
        $branch = git branch --show-current 2>$null
        $hash = git rev-parse --short HEAD 2>$null
        if ($branch) {
            Write-Host "  Git Branch: $branch" -ForegroundColor Gray
            Write-Host "  Git Commit: $hash" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  Git: Not initialized or not a Git repository" -ForegroundColor Gray
    }
    
    # 文件状态
    Write-Host "`nFile Status:" -ForegroundColor Cyan
    $files = @(
        @{ Path = "dist/app.js"; Name = "Webpack Bundle" },
        @{ Path = "dist"; Name = "Build Output" },
        @{ Path = "node_modules"; Name = "Dependencies" },
        @{ Path = "version.json"; Name = "Version File" }
    )
    
    foreach ($file in $files) {
        $exists = Test-Path $file.Path
        $status = if ($exists) { "OK" } else { "Missing" }
        Write-Host "  $($file.Name): $status" -ForegroundColor Gray
    }
}

# 清理项目
function Invoke-Clean {
    param($All = $false)
    
    Write-Title "Clean Project Files"
    
    $targets = @("dist", "version.json")
    
    if ($All) {
        $targets += @("node_modules", "pnpm-lock.yaml")
        Write-Warning "Will clean all files (including dependencies)"
    }
    
    foreach ($target in $targets) {
        if (Test-Path $target) {
            Remove-Item $target -Recurse -Force
            Write-Success "Removed: $target"
        }
    }
    
    if ($All) {
        Write-Info "Tip: Run 'pnpm install' to reinstall dependencies"
    }
}

# 主逻辑
try {
    Test-Prerequisites
    
    switch ($Command) {
        "release" { 
            Invoke-Build "production" $Version $SkipTests $Open $DryRun 
        }
        "dev" { 
            Invoke-Build "development" $Version $SkipTests $Open $DryRun
            if ($Watch -and !$DryRun) {
                Write-Info "Starting watch mode..."
                pnpm run dev
            }
        }
        "build" { 
            Write-Info "Building TypeScript..."
            if (!$DryRun) { pnpm run build }
            Write-Success "Build completed"
        }
        "version" { 
            if (!$Version) {
                Write-Error "Version number required: .\dev.ps1 version 1.2.0"
                exit 1
            }
            Invoke-UpdateVersion $Version $DryRun 
        }
        "bump" { 
            if (!$Version) {
                Write-Error "Bump type required: .\dev.ps1 bump patch"
                exit 1
            }
            Invoke-BumpVersion $Version $DryRun 
        }
        "status" { Show-ProjectStatus }
        "info" { 
            if (Test-Path "dist") {
                node dist/tools/version-cli.js info
            } else {
                Write-Warning "Project not built yet. Please run build command first"
                Show-ProjectStatus
            }
        }
        "clean" { Invoke-Clean $All }
        "install" { 
            Write-Info "Installing dependencies..."
            pnpm install
            Write-Success "Dependencies installed"
        }
        "start" { 
            Write-Info "Starting application..."
            pnpm start 
        }
        "test" { 
            Write-Info "Running tests..."
            pnpm run test 
        }
        "" { Show-Help }
        default { 
            Write-Error "Unknown command: $Command"
            Show-Help
        }
    }
} catch {
    Write-Error "Operation failed: $($_.Exception.Message)"
    exit 1
}
