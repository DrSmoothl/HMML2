# HMML2 Windows 快速启动脚本
# 用于源码版本的快速启动

param(
    [switch]$SkipDependencies,  # 跳过依赖检查
    [switch]$DevMode            # 开发模式（前端热重载）
)

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "     HMML2 Windows 快速启动脚本" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否在项目根目录
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ 错误: 请在项目根目录下运行此脚本" -ForegroundColor Red
    Write-Host "   当前目录: $PWD" -ForegroundColor Yellow
    exit 1
}

# 检查 Python
Write-Host "🔍 检查 Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>$null
if (-not $pythonVersion) {
    Write-Host "❌ 错误: 未找到 Python" -ForegroundColor Red
    Write-Host "   请安装 Python 3.11 或更高版本" -ForegroundColor Yellow
    Write-Host "   下载地址: https://www.python.org/downloads/" -ForegroundColor Cyan
    exit 1
}
Write-Host "✅ $pythonVersion" -ForegroundColor Green

# 检查 Node.js
Write-Host "🔍 检查 Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ 错误: 未找到 Node.js" -ForegroundColor Red
    Write-Host "   请安装 Node.js 20 或更高版本" -ForegroundColor Yellow
    Write-Host "   下载地址: https://nodejs.org/" -ForegroundColor Cyan
    exit 1
}
Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green

# 检查 pnpm
Write-Host "🔍 检查 pnpm..." -ForegroundColor Yellow
$pnpmVersion = pnpm --version 2>$null
if (-not $pnpmVersion) {
    Write-Host "⚠️  警告: 未找到 pnpm，正在安装..." -ForegroundColor Yellow
    npm install -g pnpm
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 错误: pnpm 安装失败" -ForegroundColor Red
        exit 1
    }
    $pnpmVersion = pnpm --version
}
Write-Host "✅ pnpm $pnpmVersion" -ForegroundColor Green

Write-Host ""

# 安装依赖
if (-not $SkipDependencies) {
    Write-Host "📦 安装依赖..." -ForegroundColor Cyan
    
    # 后端依赖
    Write-Host "  → 安装后端依赖..." -ForegroundColor Yellow
    Push-Location backend
    if (-not (Test-Path ".venv")) {
        Write-Host "    创建虚拟环境..." -ForegroundColor Gray
        python -m venv .venv
    }
    .\.venv\Scripts\Activate.ps1
    pip install -r requirements.txt --quiet
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 错误: 后端依赖安装失败" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    deactivate
    Pop-Location
    Write-Host "  ✅ 后端依赖安装完成" -ForegroundColor Green
    
    # 前端依赖
    Write-Host "  → 安装前端依赖..." -ForegroundColor Yellow
    Push-Location frontend
    if (-not (Test-Path "node_modules")) {
        pnpm install --silent
    } else {
        Write-Host "    依赖已存在，跳过安装" -ForegroundColor Gray
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 错误: 前端依赖安装失败" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host "  ✅ 前端依赖安装完成" -ForegroundColor Green
    
    Write-Host ""
} else {
    Write-Host "⏭️  跳过依赖检查" -ForegroundColor Yellow
    Write-Host ""
}

# 启动服务
Write-Host "🚀 启动服务..." -ForegroundColor Cyan
Write-Host ""

# 启动后端
Write-Host "📡 启动后端服务..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PWD\backend'; .\.venv\Scripts\Activate.ps1; python start.py"
) -WindowStyle Normal

Write-Host "  ✅ 后端服务正在启动..." -ForegroundColor Green
Write-Host "     PID: $($backendProcess.Id)" -ForegroundColor Gray
Write-Host "     端口: 7999" -ForegroundColor Gray
Write-Host ""

# 等待后端启动
Write-Host "⏳ 等待后端服务就绪 (5秒)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 启动前端
if ($DevMode) {
    Write-Host "🌐 启动前端服务 (开发模式)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "cd '$PWD\frontend'; pnpm dev --host"
    ) -WindowStyle Normal
    $frontendPort = 5173
} else {
    Write-Host "🌐 启动前端服务 (生产模式)..." -ForegroundColor Yellow
    
    # 检查是否需要构建
    if (-not (Test-Path "frontend\dist")) {
        Write-Host "  → 构建前端..." -ForegroundColor Yellow
        Push-Location frontend
        pnpm build
        Pop-Location
    }
    
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "cd '$PWD\frontend'; node server.cjs"
    ) -WindowStyle Normal
    $frontendPort = 7998
}

Write-Host "  ✅ 前端服务正在启动..." -ForegroundColor Green
Write-Host "     端口: $frontendPort" -ForegroundColor Gray
Write-Host ""

# 等待前端启动
Write-Host "⏳ 等待前端服务就绪 (3秒)..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 显示访问信息
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "     ✅ HMML2 启动成功！" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 访问地址:" -ForegroundColor Cyan
Write-Host "   前端界面: http://localhost:$frontendPort" -ForegroundColor White
Write-Host "   后端 API: http://localhost:7999/docs" -ForegroundColor White
Write-Host "   健康检查: http://localhost:7999/api/health" -ForegroundColor White
Write-Host ""
Write-Host "📋 服务状态:" -ForegroundColor Cyan
Write-Host "   后端: 运行中 (端口 7999)" -ForegroundColor White
Write-Host "   前端: 运行中 (端口 $frontendPort)" -ForegroundColor White
if ($DevMode) {
    Write-Host "   模式: 开发模式 (支持热重载)" -ForegroundColor Yellow
} else {
    Write-Host "   模式: 生产模式" -ForegroundColor White
}
Write-Host ""
Write-Host "💡 提示:" -ForegroundColor Cyan
Write-Host "   - 首次启动会显示访问 Token，请妥善保管" -ForegroundColor Gray
Write-Host "   - 关闭此窗口不会停止服务" -ForegroundColor Gray
Write-Host "   - 前后端服务在独立的 PowerShell 窗口中运行" -ForegroundColor Gray
Write-Host "   - 要停止服务，请关闭对应的 PowerShell 窗口" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 文档资源:" -ForegroundColor Cyan
Write-Host "   - 快速开始: .\QUICKSTART.md" -ForegroundColor White
Write-Host "   - 内网访问: .\NETWORK_ACCESS_GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "🎉 祝使用愉快！" -ForegroundColor Green
Write-Host ""

# 可选：打开浏览器
$openBrowser = Read-Host "是否打开浏览器？(Y/n)"
if ($openBrowser -ne 'n' -and $openBrowser -ne 'N') {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:$frontendPort"
}

Write-Host "按任意键退出此窗口（不会停止服务）..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
