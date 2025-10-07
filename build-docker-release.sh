#!/bin/bash
# HMML2 Docker Release 构建脚本
# 用于构建和推送 Docker 镜像到 Docker Hub

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置
VERSION=${1:-"2.0.0"}
DOCKER_USERNAME=${DOCKER_USERNAME:-"motricseven7"}
IMAGE_NAME="hmml"
PLATFORMS="linux/amd64,linux/arm64"

echo -e "${CYAN}==========================================${NC}"
echo -e "${CYAN}     HMML2 Docker Release 构建脚本${NC}"
echo -e "${CYAN}==========================================${NC}"
echo ""

echo -e "${CYAN}📦 版本: v${VERSION}${NC}"
echo -e "${CYAN}🐳 Docker Hub: ${DOCKER_USERNAME}/${IMAGE_NAME}${NC}"
echo -e "${CYAN}🏗️  平台: ${PLATFORMS}${NC}"
echo ""

# 检查 Docker
echo -e "${YELLOW}🔍 检查 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ 错误: 未安装 Docker${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker 已安装: $(docker --version)${NC}"

# 检查 Docker Buildx
echo -e "${YELLOW}🔍 检查 Docker Buildx...${NC}"
if ! docker buildx version &> /dev/null; then
    echo -e "${RED}❌ 错误: Docker Buildx 不可用${NC}"
    echo -e "${YELLOW}   请升级到 Docker 19.03 或更高版本${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Buildx 已安装${NC}"

# 检查是否已登录 Docker Hub
echo -e "${YELLOW}🔍 检查 Docker Hub 登录状态...${NC}"
if ! docker info | grep -q "Username: ${DOCKER_USERNAME}"; then
    echo -e "${YELLOW}⚠️  未登录到 Docker Hub${NC}"
    echo -e "${YELLOW}   请先登录: docker login${NC}"
    read -p "现在登录? (y/n): " login_now
    if [ "$login_now" = "y" ] || [ "$login_now" = "Y" ]; then
        docker login
    else
        echo -e "${RED}❌ 已取消${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ 已登录 Docker Hub${NC}"

# 创建 buildx builder
echo -e "${YELLOW}🔨 准备 Buildx Builder...${NC}"
BUILDER_NAME="hmml-builder"
if ! docker buildx inspect $BUILDER_NAME &> /dev/null; then
    echo -e "${YELLOW}   创建新的 builder: ${BUILDER_NAME}${NC}"
    docker buildx create --name $BUILDER_NAME --use
else
    echo -e "${YELLOW}   使用现有 builder: ${BUILDER_NAME}${NC}"
    docker buildx use $BUILDER_NAME
fi

# 启动 builder
docker buildx inspect --bootstrap

echo ""
echo -e "${CYAN}===========================================${NC}"
echo -e "${CYAN}     开始构建多架构镜像${NC}"
echo -e "${CYAN}===========================================${NC}"
echo ""

# 构建参数
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# 构建并推送镜像
echo -e "${YELLOW}🏗️  构建镜像...${NC}"
docker buildx build \
    --platform $PLATFORMS \
    --build-arg VERSION=$VERSION \
    --build-arg BUILD_DATE=$BUILD_DATE \
    --build-arg VCS_REF=$VCS_REF \
    --tag ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION} \
    --tag ${DOCKER_USERNAME}/${IMAGE_NAME}:latest \
    --push \
    --progress=plain \
    .

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ 构建成功！${NC}"
else
    echo ""
    echo -e "${RED}❌ 构建失败${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}===========================================${NC}"
echo -e "${CYAN}     ✅ 发布完成！${NC}"
echo -e "${CYAN}===========================================${NC}"
echo ""

echo -e "${CYAN}📦 发布的镜像:${NC}"
echo -e "   ${GREEN}${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}${NC}"
echo -e "   ${GREEN}${DOCKER_USERNAME}/${IMAGE_NAME}:latest${NC}"
echo ""

echo -e "${CYAN}🏗️  支持的平台:${NC}"
echo -e "   ${GREEN}linux/amd64${NC}"
echo -e "   ${GREEN}linux/arm64${NC}"
echo ""

echo -e "${CYAN}🚀 使用方式:${NC}"
echo ""
echo -e "${YELLOW}方式 1: Docker Run${NC}"
echo -e "docker run -d \\"
echo -e "  --name hmml \\"
echo -e "  -p 7999:7999 -p 7998:7998 \\"
echo -e "  -v hmml-data:/app/backend/data \\"
echo -e "  -v hmml-logs:/app/backend/logs \\"
echo -e "  -v hmml-config:/app/backend/config \\"
echo -e "  ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo ""

echo -e "${YELLOW}方式 2: Docker Compose${NC}"
echo -e "services:"
echo -e "  hmml:"
echo -e "    image: ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo -e "    ports:"
echo -e "      - \"7999:7999\""
echo -e "      - \"7998:7998\""
echo -e "    volumes:"
echo -e "      - hmml-data:/app/backend/data"
echo -e "      - hmml-logs:/app/backend/logs"
echo -e "      - hmml-config:/app/backend/config"
echo ""

echo -e "${CYAN}📋 镜像信息:${NC}"
echo -e "   版本: ${VERSION}"
echo -e "   构建时间: ${BUILD_DATE}"
echo -e "   Git Commit: ${VCS_REF}"
echo ""

echo -e "${CYAN}🔍 验证镜像:${NC}"
echo -e "   docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo -e "   docker run --rm ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION} python -c 'from core.version import HMML_VERSION; print(HMML_VERSION)'"
echo ""

# 创建发布信息
RELEASE_DIR="release"
mkdir -p $RELEASE_DIR

RELEASE_INFO="${RELEASE_DIR}/docker-release-info-v${VERSION}.md"
cat > $RELEASE_INFO << EOF
# HMML2 v${VERSION} Docker 版发布信息

## 镜像信息
- 镜像名称: ${DOCKER_USERNAME}/${IMAGE_NAME}
- 版本标签: ${VERSION}, latest
- 支持平台: linux/amd64, linux/arm64
- 构建时间: ${BUILD_DATE}
- Git Commit: ${VCS_REF}

## 拉取镜像

\`\`\`bash
# 拉取特定版本
docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}

# 拉取最新版本
docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:latest
\`\`\`

## 快速启动

\`\`\`bash
docker run -d \\
  --name hmml \\
  -p 7999:7999 \\
  -p 7998:7998 \\
  -v hmml-data:/app/backend/data \\
  -v hmml-logs:/app/backend/logs \\
  -v hmml-config:/app/backend/config \\
  --restart unless-stopped \\
  ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}
\`\`\`

## 访问地址
- 前端: http://localhost:7998
- 后端 API: http://localhost:7999/docs

## 发布到 GitHub Release

\`\`\`bash
# 创建 Release（如果还没有）
gh release create v${VERSION} \\
  --title "HMML2 v${VERSION} - Docker 版" \\
  --notes "Docker 镜像已发布到 Docker Hub

**镜像地址**: ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}

**支持平台**: linux/amd64, linux/arm64

**快速启动**:
\\\`\\\`\\\`bash
docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}
docker run -d --name hmml -p 7999:7999 -p 7998:7998 ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}
\\\`\\\`\\\`

详细文档请查看 [Docker 完整指南](https://github.com/DrSmoothl/HMML2/blob/v${VERSION}/DOCKER_GUIDE.md)"
\`\`\`

## 镜像标签
- \`${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}\` - 特定版本
- \`${DOCKER_USERNAME}/${IMAGE_NAME}:latest\` - 最新版本

## 验证

\`\`\`bash
# 检查镜像
docker images | grep ${IMAGE_NAME}

# 验证版本
docker run --rm ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION} \\
  python -c 'from core.version import HMML_VERSION; print(HMML_VERSION)'
\`\`\`

---

**构建时间**: ${BUILD_DATE}
**构建平台**: Multi-arch (amd64, arm64)
EOF

echo -e "${CYAN}💾 发布信息已保存到: ${RELEASE_INFO}${NC}"
echo ""

echo -e "${GREEN}🎉 全部完成！${NC}"
echo ""
