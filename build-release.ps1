# HMML2 Release 构建脚本
# 用于构建 Windows 源码版本的发布包

param(
    [string]$Version = "2.0.0",
    [string]$OutputDir = "release"
)

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "     HMML2 Release 构建脚本" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 版本: v$Version" -ForegroundColor Cyan
Write-Host "📁 输出目录: $OutputDir" -ForegroundColor Cyan
Write-Host ""

# 创建输出目录
if (Test-Path $OutputDir) {
    Write-Host "🗑️  清理旧的发布文件..." -ForegroundColor Yellow
    Remove-Item -Path $OutputDir -Recurse -Force
}
New-Item -Path $OutputDir -ItemType Directory -Force | Out-Null

# 定义临时目录
$tempDir = Join-Path $OutputDir "HMML2-v$Version-Windows-Source"
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null

Write-Host "📋 复制项目文件..." -ForegroundColor Yellow

# 复制后端文件
Write-Host "  → 后端文件..." -ForegroundColor Gray
$backendDir = Join-Path $tempDir "backend"
New-Item -Path $backendDir -ItemType Directory -Force | Out-Null

$backendFiles = @(
    "backend\src",
    "backend\public",
    "backend\requirements.txt",
    "backend\start.py",
    "backend\dev-tool.py",
    "backend\README.md"
)

foreach ($file in $backendFiles) {
    if (Test-Path $file) {
        $dest = Join-Path $backendDir (Split-Path $file -Leaf)
        Copy-Item -Path $file -Destination $dest -Recurse -Force
    }
}

# 创建后端目录结构
New-Item -Path (Join-Path $backendDir "logs") -ItemType Directory -Force | Out-Null
New-Item -Path (Join-Path $backendDir "data") -ItemType Directory -Force | Out-Null
New-Item -Path (Join-Path $backendDir "config") -ItemType Directory -Force | Out-Null

# 复制默认配置
if (Test-Path "backend\config\server.json") {
    Copy-Item -Path "backend\config\server.json" -Destination (Join-Path $backendDir "config\server.json") -Force
}

# 复制前端文件
Write-Host "  → 前端文件..." -ForegroundColor Gray
$frontendDir = Join-Path $tempDir "frontend"
New-Item -Path $frontendDir -ItemType Directory -Force | Out-Null

$frontendFiles = @(
    "frontend\src",
    "frontend\public",
    "frontend\index.html",
    "frontend\package.json",
    "frontend\pnpm-lock.yaml",
    "frontend\vite.config.ts",
    "frontend\tsconfig.json",
    "frontend\tsconfig.node.json",
    "frontend\postcss.config.js",
    "frontend\tailwind.config.js",
    "frontend\server.cjs",
    "frontend\README.md"
)

foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        $dest = Join-Path $frontendDir (Split-Path $file -Leaf)
        Copy-Item -Path $file -Destination $dest -Recurse -Force
    }
}

# 复制根目录文件
Write-Host "  → 根目录文件..." -ForegroundColor Gray
$rootFiles = @(
    "README.md",
    "QUICKSTART.md",
    "NETWORK_ACCESS_GUIDE.md",
    "DOCKER_GUIDE.md",
    "RELEASE_NOTES.md",
    "start-windows.ps1",
    ".gitignore"
)

foreach ($file in $rootFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination (Join-Path $tempDir (Split-Path $file -Leaf)) -Force
    }
}

# 创建 README 文件
Write-Host "📝 创建安装说明..." -ForegroundColor Yellow
$readmeContent = @"
# HMML2 v$Version - Windows 源码版

## 快速开始

### 1. 安装依赖

#### 安装 Python 3.11+
下载地址: https://www.python.org/downloads/

#### 安装 Node.js 20+
下载地址: https://nodejs.org/

#### 安装 pnpm
``````powershell
npm install -g pnpm
``````

### 2. 安装项目依赖

``````powershell
# 后端依赖
cd backend
pip install -r requirements.txt

# 前端依赖
cd ..\frontend
pnpm install
``````

### 3. 启动服务

**方式 1: 使用快速启动脚本（推荐）**
``````powershell
.\start-windows.ps1
``````

**方式 2: 手动启动**
``````powershell
# 启动后端
cd backend
python start.py

# 新开一个终端，启动前端
cd frontend
pnpm dev --host
``````

### 4. 访问应用

- 前端界面: http://localhost:5173 (开发模式) 或 http://localhost:7998 (生产模式)
- 后端 API: http://localhost:7999/docs

## 首次启动

首次启动时会在控制台显示访问 Token，请：
1. 立即复制并保存
2. Token 仅显示一次
3. 丢失可重新生成（会使旧 Token 失效）

## 内网访问

如需从其他设备访问，请确保：
1. 使用 ``--host`` 参数启动前端
2. 防火墙允许端口 7999 和 5173

访问地址: ``http://<你的IP>:5173``

## 文档

- 快速开始: QUICKSTART.md
- 内网访问指南: NETWORK_ACCESS_GUIDE.md
- 完整文档: README.md

## 问题反馈

GitHub Issues: https://github.com/DrSmoothl/HMML2/issues

---

**版本**: v$Version
**发布日期**: $(Get-Date -Format 'yyyy-MM-dd')
"@

Set-Content -Path (Join-Path $tempDir "安装说明.txt") -Value $readmeContent -Encoding UTF8

# 创建版本信息文件
Write-Host "📝 创建版本信息..." -ForegroundColor Yellow
$versionInfo = @{
    version = $Version
    release_date = (Get-Date -Format 'yyyy-MM-dd')
    platform = "Windows"
    type = "Source"
    build_date = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
} | ConvertTo-Json

Set-Content -Path (Join-Path $tempDir "version.json") -Value $versionInfo -Encoding UTF8

# 创建 .gitignore
Write-Host "📝 创建 .gitignore..." -ForegroundColor Yellow
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

Set-Content -Path (Join-Path $tempDir ".gitignore") -Value $gitignoreContent -Encoding UTF8

# 压缩文件
Write-Host "🗜️  压缩发布包..." -ForegroundColor Yellow
$zipFile = Join-Path $OutputDir "HMML2-v$Version-Windows-Source.zip"

# 使用 .NET 压缩（更快）
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $zipFile, [System.IO.Compression.CompressionLevel]::Optimal, $false)

# 清理临时文件
Write-Host "🗑️  清理临时文件..." -ForegroundColor Yellow
Remove-Item -Path $tempDir -Recurse -Force

# 计算文件大小和哈希
$fileInfo = Get-Item $zipFile
$fileSize = [math]::Round($fileInfo.Length / 1MB, 2)
$fileHash = (Get-FileHash $zipFile -Algorithm SHA256).Hash

# 显示结果
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "     ✅ 构建完成！" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 发布包信息:" -ForegroundColor Cyan
Write-Host "   文件名: HMML2-v$Version-Windows-Source.zip" -ForegroundColor White
Write-Host "   路径: $zipFile" -ForegroundColor White
Write-Host "   大小: $fileSize MB" -ForegroundColor White
Write-Host "   SHA256: $fileHash" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 发布清单:" -ForegroundColor Cyan
Write-Host "   ✅ 后端源码及依赖列表" -ForegroundColor Green
Write-Host "   ✅ 前端源码及依赖列表" -ForegroundColor Green
Write-Host "   ✅ 快速启动脚本" -ForegroundColor Green
Write-Host "   ✅ 完整文档" -ForegroundColor Green
Write-Host "   ✅ 安装说明" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 下一步:" -ForegroundColor Cyan
Write-Host "   1. 测试发布包" -ForegroundColor White
Write-Host "   2. 上传到 GitHub Release" -ForegroundColor White
Write-Host "   3. 更新发布说明" -ForegroundColor White
Write-Host ""

# 创建发布信息文件
$releaseInfoContent = @"
# HMML2 v$Version Windows 源码版发布信息

## 文件信息
- 文件名: HMML2-v$Version-Windows-Source.zip
- 大小: $fileSize MB
- SHA256: $fileHash
- 构建时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## 发布到 GitHub

使用 GitHub CLI:
````
gh release create v$Version --title "HMML2 v$Version - Windows 源码版" --notes-file RELEASE_NOTES.md
gh release upload v$Version $zipFile
````

## 手动上传

1. 访问: https://github.com/DrSmoothl/HMML2/releases/new
2. 标签: v$Version
3. 标题: HMML2 v$Version - Windows 源码版
4. 描述: 复制 RELEASE_NOTES.md 的内容
5. 上传文件: $zipFile
6. 发布
"@

Set-Content -Path (Join-Path $OutputDir "release-info.md") -Value $releaseInfoContent -Encoding UTF8

Write-Host "💾 发布信息已保存到: $(Join-Path $OutputDir 'release-info.md')" -ForegroundColor Cyan
Write-Host ""
