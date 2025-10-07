# HMML2 Docker 版本构建脚本
# 仅构建镜像，不推送

param(
    [string]$Version = "2.0.0",
    [string]$ImageName = "hmml",
    [switch]$NoBuildCache
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "     HMML2 Docker 镜像构建工具" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "版本: v$Version" -ForegroundColor Cyan
Write-Host "镜像名: $ImageName" -ForegroundColor Cyan
Write-Host ""

# 检查 Docker
Write-Host "检查 Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "  $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "  错误: 未安装 Docker" -ForegroundColor Red
    Write-Host "  请安装 Docker Desktop for Windows" -ForegroundColor Yellow
    exit 1
}

# 检查 Docker 是否运行
Write-Host "检查 Docker 服务..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "  Docker 服务正常运行" -ForegroundColor Green
} catch {
    Write-Host "  错误: Docker 服务未运行" -ForegroundColor Red
    Write-Host "  请启动 Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# 构建参数
$buildDate = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
$vcsRef = "unknown"

# 尝试获取 Git commit
try {
    $vcsRef = git rev-parse --short HEAD 2>$null
    if ($vcsRef) {
        Write-Host "Git Commit: $vcsRef" -ForegroundColor Gray
    }
} catch {
    Write-Host "Git 信息不可用" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "     开始构建镜像" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 构建命令
$buildArgs = @(
    "build",
    "--build-arg", "VERSION=$Version",
    "--build-arg", "BUILD_DATE=$buildDate",
    "--build-arg", "VCS_REF=$vcsRef",
    "-t", "${ImageName}:${Version}",
    "-t", "${ImageName}:latest"
)

if ($NoBuildCache) {
    $buildArgs += "--no-cache"
}

$buildArgs += "."

Write-Host "构建镜像..." -ForegroundColor Yellow
Write-Host "命令: docker $($buildArgs -join ' ')" -ForegroundColor Gray
Write-Host ""

# 执行构建
docker @buildArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "构建失败！" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "     构建完成！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 显示镜像信息
Write-Host "镜像信息:" -ForegroundColor Cyan
docker images | Select-String -Pattern $ImageName | ForEach-Object {
    Write-Host "  $_" -ForegroundColor White
}
Write-Host ""

Write-Host "镜像标签:" -ForegroundColor Cyan
Write-Host "  ${ImageName}:${Version}" -ForegroundColor Green
Write-Host "  ${ImageName}:latest" -ForegroundColor Green
Write-Host ""

Write-Host "快速测试:" -ForegroundColor Cyan
Write-Host "  docker run --rm ${ImageName}:${Version} python -c 'print(\"HMML2 v$Version\")'" -ForegroundColor White
Write-Host ""

Write-Host "启动容器:" -ForegroundColor Cyan
Write-Host "  docker run -d --name hmml -p 7999:7999 -p 7998:7998 ${ImageName}:${Version}" -ForegroundColor White
Write-Host ""

Write-Host "使用 Docker Compose:" -ForegroundColor Cyan
Write-Host "  docker compose up -d" -ForegroundColor White
Write-Host ""

Write-Host "完成！" -ForegroundColor Green
Write-Host ""
