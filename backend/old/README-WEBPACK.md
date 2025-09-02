# HMML Backend - Webpack 构建版本

## 概述

HMML 后端已从 SEA (Single Executable Applications) 注入方式改为 Webpack 打包的形式。现在使用 `node app.js` 的方式在生产环境中启动应用。

## 主要变更

### 构建方式变更
- **旧方式**: SEA 注入 → 生成可执行文件 `hmml-win.exe`
- **新方式**: Webpack 打包 → 生成 `dist/app.js` 文件

### 启动方式变更
- **旧方式**: 直接运行 `./build/hmml-win.exe`
- **新方式**: 使用 Node.js 运行 `node app.js` 或使用启动脚本

## 快速开始

### 安装依赖
```bash
pnpm install
```

### 开发环境
```bash
# 开发模式 (自动重启)
pnpm run dev

# 或者先构建再启动
pnpm run build:dev
pnpm run start:dev
```

### 生产环境
```bash
# 构建生产版本
pnpm run build

# 启动生产环境
pnpm start

# 或者直接运行
node dist/app.js
```

## 构建脚本

### NPM 脚本

- `pnpm start` - 生产环境启动 (使用 start.js 脚本)
- `pnpm run start:dev` - 开发环境启动 (使用 start-dev.js 脚本)
- `pnpm run start:direct` - 直接启动 dist/app.js
- `pnpm run dev` - 开发模式 (nodemon + ts-node)
- `pnpm run build` - 生产环境构建 (webpack + production mode)
- `pnpm run build:dev` - 开发环境构建 (webpack + development mode)
- `pnpm run build:watch` - 监视模式构建
- `pnpm run clean` - 清理构建文件

### PowerShell 脚本

```powershell
# 快速构建和部署
.\dev.ps1 release          # 生产环境构建
.\dev.ps1 dev              # 开发环境构建
.\dev.ps1 dev -Watch       # 开发模式 + 监视

# 版本管理
.\dev.ps1 version 1.4.0    # 更新版本号
.\dev.ps1 bump patch       # 版本递增

# 项目管理
.\dev.ps1 status           # 查看项目状态
.\dev.ps1 clean            # 清理构建文件
.\dev.ps1 clean -All       # 清理所有文件 (包括 node_modules)
```

## 文件结构

```
backend/
├── src/                   # 源码目录
│   ├── app.ts            # 主应用文件
│   ├── version.ts        # 版本管理
│   ├── core/             # 核心模块
│   ├── routes/           # 路由
│   ├── services/         # 服务
│   ├── middleware/       # 中间件
│   ├── utils/            # 工具函数
│   └── types/            # 类型定义
├── dist/                 # 构建输出目录
│   └── app.js           # Webpack 打包后的应用文件
├── webpack.config.js     # Webpack 配置
├── start.js             # 生产环境启动脚本
├── start-dev.js         # 开发环境启动脚本
├── package.json         # 包配置
├── tsconfig.json        # TypeScript 配置
├── dev.ps1              # PowerShell 开发脚本
└── README.md            # 说明文档 (本文件)
```

## Webpack 配置特点

- **模式**: 支持 development 和 production 模式
- **输出**: 单文件 `dist/app.js`，包含所有依赖
- **外部依赖**: 原生模块 (如 better-sqlite3) 保持外部依赖
- **别名支持**: 支持 `@/` 等路径别名
- **源映射**: 开发环境内联，生产环境独立文件
- **优化**: 生产环境自动压缩和优化

## 部署说明

### 生产环境部署

1. **构建应用**
   ```bash
   pnpm run build
   ```

2. **复制文件到服务器**
   - `dist/app.js` - 主应用文件
   - `start.js` - 启动脚本 (可选)
   - `package.json` - 依赖信息
   - `node_modules/` - 运行时依赖

3. **启动服务**
   ```bash
   # 方式1: 使用启动脚本
   node start.js
   
   # 方式2: 直接启动
   NODE_ENV=production node dist/app.js
   
   # 方式3: 使用 PM2
   pm2 start dist/app.js --name "hmml-backend"
   ```

### Docker 部署

创建 Dockerfile：

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod

# 复制构建文件
COPY dist/ ./dist/
COPY start.js ./

# 暴露端口
EXPOSE 7999

# 启动应用
CMD ["node", "start.js"]
```

## 环境变量

- `NODE_ENV` - 环境模式 (development/production)
- `WEBPACK_BUILD` - 标识 webpack 构建 (自动设置)

## 故障排除

### 常见问题

1. **模块未找到错误**
   - 确保 `node_modules` 存在且依赖已安装
   - 检查 webpack externals 配置

2. **启动失败**
   - 检查 `dist/app.js` 是否存在
   - 确认端口 7999 未被占用

3. **环境变量问题**
   - 使用启动脚本确保环境变量正确设置

### 调试模式

```bash
# 启用调试日志
DEBUG=* node dist/app.js

# 或使用 Node.js 内置调试器
node --inspect dist/app.js
```

## 迁移说明

从 SEA 版本迁移到 Webpack 版本：

1. **停止旧版本服务**
   ```bash
   # 如果使用可执行文件
   taskkill /IM hmml-win.exe /F
   ```

2. **更新代码并构建**
   ```bash
   git pull
   pnpm install
   pnpm run build
   ```

3. **启动新版本**
   ```bash
   pnpm start
   ```

4. **验证功能**
   - 访问 `http://localhost:7999` 确认服务正常
   - 检查日志确认无错误

## 性能优化

- 生产环境使用压缩后的代码
- 启用 Node.js 集群模式 (如需要)
- 使用 PM2 进行进程管理
- 配置适当的日志轮转
