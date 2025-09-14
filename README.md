# HMML2

<!-- CI Badge (update repository path appropriately) -->
![Build & Push](https://github.com/DrSmoothl/HMML2/actions/workflows/docker-build.yml/badge.svg)

## 运行模式
支持两种使用方式：
1. 直接本地源码运行（Python 后端 + Vite 前端）
2. Docker / Docker Compose 部署（前后端分离容器）

### 本地源码方式
后端：
```
cd backend
pip install -r requirements.txt
python start.py
```
默认监听: http://localhost:7999

前端：
```
cd frontend
pnpm install
cp .env.example .env.local   # 可编辑 VITE_API_BASE_URL
pnpm dev
```
开发访问: http://localhost:5173

若后端也本地，推荐 `.env.local` 设置：
```
VITE_API_BASE_URL=http://localhost:7999/api
```

### Docker Compose 方式
```
docker compose up -d --build
```
- 后端: http://localhost:7999
- 前端: http://localhost:7998

Compose 中前端构建时自动注入 `API_BASE=http://hmml-backend:7999/api`
容器内互访使用服务名 `hmml-backend`。

### 单行快速启动（Linux 用户）
```
USER=motricseven7 NET=hmml-net; docker network inspect "$NET" >/dev/null 2>&1 || docker network create "$NET"; docker rm -f hmml-backend hmml-frontend >/dev/null 2>&1 || true; docker pull "$USER/hmml-backend:latest" && docker pull "$USER/hmml-frontend:latest" && docker run -d --name hmml-backend --network "$NET" -p 7999:7999 "$USER/hmml-backend:latest" && docker run -d --name hmml-frontend --network "$NET" -p 7998:7998 "$USER/hmml-frontend:latest"
```

### API 基址解析逻辑（前端 `api.ts`）
优先级：
1. `window.__HMML_API_BASE__` （运行时注入）
2. `VITE_API_BASE_URL` （构建时环境变量/`.env`）
3. Docker 容器内：`http://hmml-backend:7999/api`
4. 回退：`http://localhost:7999/api`

### 运行时覆盖方式
在 `index.html` `<head>` 中添加：
```
<script>window.__HMML_API_BASE__='https://example.com/api'</script>
```
无需重新构建可切换后端地址。

### 常见问题
| 现象 | 可能原因 | 处理 |
|------|----------|------|
| NETWORK_ERROR | 前端容器访问 localhost | 使用服务名 hmml-backend 或注入变量 |
| 404 /api/* | 后端未启动 / URL prefix | 确认后端日志与 prefix 配置 |
| CORS 报错 | 未开启 CORS | server.json 中 security.cors_enabled=true |
| WebSocket 失败 | 端口或协议不匹配 | 确认 ws 基址与 Nginx/反代配置 |

---

## CI / CD 说明

本仓库使用 GitHub Actions 在每次 push / PR 时自动构建前后端 Docker 镜像（不默认推送）。

### 手动推送镜像
在 GitHub Actions 页面手动运行工作流 (workflow_dispatch) 并勾选 push 选项。

需要在仓库 Secrets 中配置：
- `DOCKERHUB_USERNAME`: Docker Hub 用户名
- `DOCKERHUB_TOKEN`: Docker Hub Access Token (读写权限)

### 版本标签策略
优先级: 手动输入 tag_override > backend/version.json > frontend/package.json > commit 短 SHA。

推送时会生成：
- `hmml-backend:<version>` 与 `hmml-backend:commit-<sha>`
- `hmml-frontend:<version>` 与 `hmml-frontend:commit-<sha>`
并在 main 手动触发时添加 `latest` 多架构镜像 (linux/amd64, linux/arm64)。

### 扩展建议
- 增加测试步骤: 后端 pytest / 前端 vitest
- 增加安全扫描: Trivy 或 Grype
- 失败通知: 加 Slack / 钉钉 Webhook
- 自动语义化发布: conventional commits + release-please