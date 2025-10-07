# HMML2 发布打包指南

本文档说明如何构建 HMML2 的两种发布版本。

---

## 📦 两种发布版本

### 1. Windows 源码版
- **适用**: Windows 用户、开发环境、需要修改源码
- **包含**: 完整源码 + 依赖列表 + 启动脚本 + 文档
- **文件**: `HMML2-v{version}-Windows-Source.zip`

### 2. Docker 版
- **适用**: Linux 服务器、生产环境、快速部署
- **包含**: 前后端统一镜像
- **镜像**: `hmml:{version}`, `hmml:latest`

---

## 🚀 快速打包

### Windows 源码版

```powershell
# 打包默认版本 (v2.0.0)
.\pack-windows-release.ps1

# 打包指定版本
.\pack-windows-release.ps1 -Version "2.1.0"

# 指定输出目录
.\pack-windows-release.ps1 -Version "2.0.0" -OutputDir "dist"
```

**输出文件**: `release/HMML2-v{version}-Windows-Source.zip`

### Docker 版

```powershell
# 构建默认版本 (v2.0.0)
.\pack-docker-release.ps1

# 构建指定版本
.\pack-docker-release.ps1 -Version "2.1.0"

# 无缓存构建
.\pack-docker-release.ps1 -NoBuildCache
```

**输出镜像**: `hmml:{version}`, `hmml:latest`

---

## 📋 打包前检查清单

### 通用检查

- [ ] 更新 `version.json` 文件
- [ ] 更新 `RELEASE_NOTES.md`
- [ ] 确认所有代码已提交到 Git
- [ ] 测试功能是否正常
- [ ] 更新文档（如有必要）

### Windows 源码版特定检查

- [ ] 确认 `requirements.txt` 是最新的
- [ ] 确认 `package.json` 是最新的
- [ ] 测试 `start-windows.ps1` 脚本
- [ ] 检查文档完整性

### Docker 版特定检查

- [ ] 测试 Dockerfile 构建
- [ ] 验证镜像大小合理
- [ ] 测试容器启动
- [ ] 检查健康检查端点
- [ ] 验证数据持久化

---

## 🔧 详细步骤

### Windows 源码版详细流程

#### 1. 准备工作

```powershell
# 确保在项目根目录
cd E:\MaimBot\HMML2

# 检查文件结构
ls backend/
ls frontend/
```

#### 2. 更新版本信息

编辑以下文件中的版本号:
- `backend/src/core/version.py` 或 `backend/version.json`
- `frontend/package.json`
- `RELEASE_NOTES.md`

#### 3. 执行打包

```powershell
.\pack-windows-release.ps1 -Version "2.0.0"
```

#### 4. 验证打包结果

```powershell
# 查看生成的文件
ls release/

# 解压测试
Expand-Archive release/HMML2-v2.0.0-Windows-Source.zip -DestinationPath release/test

# 测试安装
cd release/test/HMML2-v2.0.0-Windows-Source
.\start-windows.ps1
```

#### 5. 清理测试文件

```powershell
cd E:\MaimBot\HMML2
Remove-Item release/test -Recurse -Force
```

---

### Docker 版详细流程

#### 1. 准备工作

```powershell
# 确保 Docker 正在运行
docker info

# 清理旧镜像（可选）
docker rmi hmml:latest
```

#### 2. 更新 Dockerfile

确认 Dockerfile 中的:
- 基础镜像版本
- 构建参数
- 健康检查配置

#### 3. 执行构建

```powershell
.\pack-docker-release.ps1 -Version "2.0.0"
```

#### 4. 测试镜像

```powershell
# 运行测试容器
docker run -d `
  --name hmml-test `
  -p 7999:7999 `
  -p 7998:7998 `
  hmml:2.0.0

# 等待启动
Start-Sleep 10

# 测试健康检查
curl http://localhost:7999/api/health

# 测试前端
curl http://localhost:7998

# 查看日志
docker logs hmml-test

# 停止并删除测试容器
docker stop hmml-test
docker rm hmml-test
```

#### 5. 导出镜像（可选）

如果需要离线分发:

```powershell
# 导出镜像
docker save hmml:2.0.0 -o release/hmml-v2.0.0-docker.tar

# 压缩（可选）
Compress-Archive release/hmml-v2.0.0-docker.tar release/hmml-v2.0.0-docker.tar.zip
```

---

## 📤 发布到 GitHub Release

### 使用 GitHub CLI (推荐)

#### 1. 安装 GitHub CLI

```powershell
winget install GitHub.cli
```

#### 2. 登录

```powershell
gh auth login
```

#### 3. 创建 Release

```powershell
# 创建 Release
gh release create v2.0.0 `
  --title "HMML2 v2.0.0" `
  --notes-file RELEASE_NOTES.md

# 上传 Windows 源码包
gh release upload v2.0.0 release/HMML2-v2.0.0-Windows-Source.zip

# 上传 Docker 镜像包（如果导出了）
gh release upload v2.0.0 release/hmml-v2.0.0-docker.tar.zip
```

### 手动上传

1. 访问: https://github.com/DrSmoothl/HMML2/releases/new
2. 填写表单:
   - **Tag**: `v2.0.0`
   - **Title**: `HMML2 v2.0.0`
   - **Description**: 复制 `RELEASE_NOTES.md` 的内容
3. 上传文件:
   - `HMML2-v2.0.0-Windows-Source.zip`
   - `hmml-v2.0.0-docker.tar.zip` (可选)
4. 点击 "Publish release"

---

## 🐳 发布 Docker 镜像到 Docker Hub

### 1. 登录 Docker Hub

```powershell
docker login
```

### 2. 标记镜像

```powershell
docker tag hmml:2.0.0 你的用户名/hmml:2.0.0
docker tag hmml:latest 你的用户名/hmml:latest
```

### 3. 推送镜像

```powershell
docker push 你的用户名/hmml:2.0.0
docker push 你的用户名/hmml:latest
```

### 4. 验证

访问: https://hub.docker.com/r/你的用户名/hmml

---

## 🧪 发布后验证

### Windows 源码版

```powershell
# 下载
gh release download v2.0.0 -p "HMML2-v2.0.0-Windows-Source.zip"

# 解压
Expand-Archive HMML2-v2.0.0-Windows-Source.zip

# 测试安装
cd HMML2-v2.0.0-Windows-Source
.\start-windows.ps1
```

### Docker 版

```powershell
# 拉取
docker pull 你的用户名/hmml:2.0.0

# 运行
docker run -d --name hmml -p 7999:7999 -p 7998:7998 你的用户名/hmml:2.0.0

# 验证
curl http://localhost:7999/api/health
curl http://localhost:7998
```

---

## 📊 打包结果参考

### Windows 源码版

```
release/
└── HMML2-v2.0.0-Windows-Source.zip  (~50-100 MB)
    ├── backend/
    │   ├── src/
    │   ├── requirements.txt
    │   └── start.py
    ├── frontend/
    │   ├── src/
    │   ├── package.json
    │   └── vite.config.ts
    ├── README.md
    ├── QUICKSTART.md
    ├── start-windows.ps1
    └── 安装说明.txt
```

### Docker 版

```
镜像:
- hmml:2.0.0  (~400 MB)
- hmml:latest (~400 MB)

可选导出:
- release/hmml-v2.0.0-docker.tar      (~400 MB)
- release/hmml-v2.0.0-docker.tar.zip  (~300 MB)
```

---

## ⚠️ 常见问题

### Windows 源码版

**Q: 压缩包太大？**
A: 确认没有包含 `node_modules/`, `.venv/`, `dist/` 等目录

**Q: 解压后无法运行？**
A: 检查用户是否安装了 Python 和 Node.js

### Docker 版

**Q: 构建失败？**
A: 检查 Docker 是否有足够的磁盘空间和内存

**Q: 镜像过大？**
A: 检查是否使用了多阶段构建，是否清理了缓存

**Q: 容器无法启动？**
A: 查看日志 `docker logs <容器名>`

---

## 📝 版本命名规范

- **主版本号**: 大型架构变更 (如 1.x -> 2.x)
- **次版本号**: 新功能添加 (如 2.0 -> 2.1)
- **修订号**: Bug 修复 (如 2.0.0 -> 2.0.1)

示例:
- `v2.0.0` - 首个统一 Docker 镜像版本
- `v2.1.0` - 添加了新的 API 功能
- `v2.0.1` - 修复了登录问题

---

## 🔐 安全提示

1. **不要在发布包中包含**:
   - Token 文件
   - 数据库文件
   - 日志文件
   - `.env` 文件

2. **Docker 镜像**:
   - 使用非 root 用户运行
   - 定期更新基础镜像
   - 扫描安全漏洞: `docker scan hmml:latest`

---

## 📚 相关文档

- [快速开始指南](./QUICKSTART.md)
- [Docker 完整指南](./DOCKER_GUIDE.md)
- [内网访问指南](./NETWORK_ACCESS_GUIDE.md)
- [发布说明](./RELEASE_NOTES.md)

---

**最后更新**: 2025-10-07
**维护者**: DrSmoothl
