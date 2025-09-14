# HMML2

<!-- CI Badge (update repository path appropriately) -->
![Build & Push](https://github.com/DrSmoothl/HMML2/actions/workflows/docker-build.yml/badge.svg)

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