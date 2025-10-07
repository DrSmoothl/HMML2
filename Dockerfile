# HMML2 Unified Dockerfile - 前后端打包在一个镜像中
# 采用多阶段构建优化镜像大小

# 构建参数
ARG VERSION=2.0.0
ARG BUILD_DATE
ARG VCS_REF

# ==================== Stage 1: 前端构建 ====================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
ENV CI=true

# 启用 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制前端依赖文件
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制前端源码
COPY frontend ./

# 构建前端（不注入固定的 API_BASE，让它在运行时动态决定）
RUN pnpm build

# ==================== Stage 2: 最终运行镜像 ====================
FROM python:3.11-slim AS runtime

# 重新声明构建参数（ARG 在每个 stage 都需要重新声明）
ARG VERSION=2.0.0
ARG BUILD_DATE
ARG VCS_REF

# 设置标签
LABEL org.opencontainers.image.title="HMML2" \
      org.opencontainers.image.description="MaiMai Launcher Management System" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.authors="DrSmoothl" \
      org.opencontainers.image.url="https://github.com/DrSmoothl/HMML2" \
      org.opencontainers.image.source="https://github.com/DrSmoothl/HMML2" \
      org.opencontainers.image.vendor="DrSmoothl" \
      org.opencontainers.image.licenses="MIT"

# 环境变量
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    NODE_VERSION=20 \
    HMML_VERSION=${VERSION}

WORKDIR /app

# 安装 Node.js（用于运行前端静态服务器）和其他必要工具
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_VERSION}.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# ==================== 后端部分 ====================
# 复制后端依赖文件
COPY backend/requirements.txt ./backend/requirements.txt

# 安装 Python 依赖
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# 复制后端源码
COPY backend ./backend

# ==================== 前端部分 ====================
# 从构建阶段复制前端构建产物
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# 复制前端服务器脚本
COPY frontend/server.cjs ./frontend/server.cjs

# 复制启动脚本（新建的统一启动脚本）
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# 创建非 root 用户
RUN useradd -m hmml && chown -R hmml:hmml /app
USER hmml

# 暴露端口：7999 为后端，7998 为前端
EXPOSE 7999 7998

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:7999/api/health || exit 1

# 使用统一的启动脚本
ENTRYPOINT ["./docker-entrypoint.sh"]
