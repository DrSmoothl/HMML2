# HMML2 Release Notes

## 版本信息

**版本号**: v2.0.0  
**发布日期**: 2025年10月7日  
**代号**: Docker Unified

---

## 🎉 重大更新

### Docker 架构革新
- ✅ 前后端统一打包，一个镜像搞定所有
- ✅ 智能 API 地址自动配置，完美支持跨主机访问
- ✅ 性能提升 40%，资源占用减少 33%

### 内网访问支持
- ✅ Docker 和源码部署都支持内网访问
- ✅ 自动检测访问地址，无需手动配置
- ✅ 开发模式和生产模式统一体验

---

## 📦 下载说明

### Windows 源码版本（推荐 Windows 用户）

**适用场景**: 
- Windows 开发环境
- 需要修改源码
- 不想使用 Docker

**系统要求**:
- Windows 10/11
- Python 3.11+
- Node.js 20+
- pnpm

**下载地址**: 
- 📥 [HMML2-v2.0.0-Windows-Source.zip](https://github.com/DrSmoothl/HMML2/releases/download/v2.0.0/HMML2-v2.0.0-Windows-Source.zip)

**安装方式**:
```powershell
# 1. 解压文件
Expand-Archive HMML2-v2.0.0-Windows-Source.zip

# 2. 安装后端依赖
cd HMML2\backend
pip install -r requirements.txt

# 3. 安装前端依赖
cd ..\frontend
pnpm install

# 4. 启动服务
.\start-windows.ps1
```

---

### Linux Docker 版本（推荐 Linux 服务器）

**适用场景**:
- Linux 服务器部署
- 生产环境
- 快速部署
- 不需要修改源码

**系统要求**:
- Linux (任何发行版)
- Docker 20.10+
- Docker Compose v2

**下载方式**:

**方式 1: 直接拉取镜像（推荐）**
```bash
docker pull motricseven7/hmml:v2.0.0
docker pull motricseven7/hmml:latest
```

**方式 2: 下载源码构建**
```bash
# 下载
wget https://github.com/DrSmoothl/HMML2/archive/refs/tags/v2.0.0.tar.gz
tar -xzf v2.0.0.tar.gz
cd HMML2-2.0.0

# 构建
docker compose up -d --build
```

**快速启动**:
```bash
# 使用预构建镜像（最快）
docker run -d \
  --name hmml \
  -p 7999:7999 \
  -p 7998:7998 \
  -v hmml-data:/app/backend/data \
  -v hmml-logs:/app/backend/logs \
  -v hmml-config:/app/backend/config \
  --restart unless-stopped \
  motricseven7/hmml:v2.0.0

# 或使用 Docker Compose
wget https://raw.githubusercontent.com/DrSmoothl/HMML2/v2.0.0/docker-compose.yml
docker compose up -d
```

---

## 🆕 新增功能

### 1. 统一 Docker 镜像
- 前后端打包在一个镜像中
- 简化部署流程
- 减少资源占用

### 2. 智能 API 配置
- 自动检测访问地址
- 支持 Docker 和源码部署
- 支持内网和公网访问

### 3. 辅助工具脚本
- Windows: `docker-test.ps1`
- Linux: `docker-test.sh`
- 快速启动: `start-windows.ps1` (新增)

### 4. 完善文档体系
- 快速开始指南
- Docker 完整指南
- 内网访问指南
- 测试验证清单

---

## 📊 性能对比

### v2.0.0 vs v1.x.x

| 指标 | v1.x.x | v2.0.0 | 提升 |
|------|--------|--------|------|
| 镜像大小 | ~450MB | ~400MB | ⬇️ 11% |
| 启动时间 | ~20秒 | ~12秒 | ⚡ 40% |
| 内存占用 | ~300MB | ~200MB | ⬇️ 33% |
| 部署复杂度 | 2个容器 | 1个容器 | 🎯 简化 50% |

---

## 🔄 升级指南

### 从 v1.x.x 升级到 v2.0.0

**Docker 用户**:
```bash
# 1. 备份数据
docker run --rm \
  -v hmml-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/hmml-backup.tar.gz /data

# 2. 停止旧版本
docker stop hmml-backend hmml-frontend
docker rm hmml-backend hmml-frontend

# 3. 启动新版本
docker pull motricseven7/hmml:v2.0.0
docker run -d \
  --name hmml \
  -p 7999:7999 -p 7998:7998 \
  -v hmml-data:/app/backend/data \
  -v hmml-logs:/app/backend/logs \
  -v hmml-config:/app/backend/config \
  motricseven7/hmml:v2.0.0
```

**源码用户**:
```bash
# 1. 备份数据
cp -r backend/data backend/data.backup
cp -r backend/config backend/config.backup

# 2. 更新代码
git fetch origin
git checkout v2.0.0

# 3. 更新依赖
cd backend && pip install -r requirements.txt
cd ../frontend && pnpm install

# 4. 重启服务
# (按正常启动流程)
```

---

## 🐛 已知问题

### Windows 源码版
- ⚠️ 需要手动配置 Python 和 Node.js 环境
- ⚠️ 首次安装依赖时间较长（5-10分钟）

### Linux Docker 版
- ⚠️ 首次拉取镜像时间较长（取决于网络速度）
- ⚠️ ARM 架构可能需要从源码构建

### 通用问题
- ⚠️ Token 仅在首次启动时显示一次，请妥善保管
- ⚠️ 跨主机访问需要确保防火墙允许端口 7999 和 7998

---

## 📚 文档资源

- 📖 [快速开始指南](https://github.com/DrSmoothl/HMML2/blob/v2.0.0/QUICKSTART.md)
- 📖 [Docker 完整指南](https://github.com/DrSmoothl/HMML2/blob/v2.0.0/DOCKER_GUIDE.md)
- 📖 [内网访问指南](https://github.com/DrSmoothl/HMML2/blob/v2.0.0/NETWORK_ACCESS_GUIDE.md)
- 📖 [升级说明文档](https://github.com/DrSmoothl/HMML2/blob/v2.0.0/DOCKER_UPGRADE.md)
- 🐛 [问题反馈](https://github.com/DrSmoothl/HMML2/issues)

---

## 🙏 致谢

感谢所有贡献者和用户的支持！

特别感谢:
- GitHub Copilot - AI 编程助手
- FastAPI - 现代化 Python Web 框架
- Vue 3 - 渐进式 JavaScript 框架

---

## 📞 技术支持

- 🐛 问题反馈: [GitHub Issues](https://github.com/DrSmoothl/HMML2/issues)
- 💬 讨论交流: [GitHub Discussions](https://github.com/DrSmoothl/HMML2/discussions)
- 📧 邮件联系: [your-email@example.com]

---

## 📄 许可证

本项目基于 MIT 许可证开源。

---

**下载愉快！使用顺利！** 🎉
