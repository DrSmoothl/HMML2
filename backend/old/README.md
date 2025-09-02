# HMML - Hello MaiMai Launcher Backend Service

基于MCSM框架设计的轻量级HTTP后端服务，为MaiMai启动器提供后端API支持。

## ✨ 特性

- 🚀 基于Koa.js的高性能HTTP服务器
- 📝 美观的彩色日志系统，支持文件日志
- ⚙️ 灵活的配置管理系统
- 🛡️ 完善的错误处理机制
- 📁 强大的文件操作工具
- 🔧 丰富的工具函数库
- 📦 TypeScript支持
- 🎯 RESTful API设计
- 🌐 CORS跨域支持
- 💾 会话管理
- � **路径缓存功能** - 麦麦主程序和适配器根目录缓存管理
- �🖥️ **PTY虚拟终端支持** (WebSocket + HTTP API)
- 📡 **Socket.io实时通信**
- 🔐 **安全的命令验证和用户权限控制**
- 🎛️ **多会话并发管理**

## 🏗️ 项目结构

```
HMML/
├── src/                    # 源代码目录
│   ├── app.ts             # 应用入口文件
│   ├── core/              # 核心组件
│   │   ├── logger.ts      # 日志系统
│   │   ├── config.ts      # 配置管理
│   │   ├── fileManager.ts # 文件操作
│   │   └── httpServer.ts  # HTTP服务器
│   ├── pty/               # PTY虚拟终端模块
│   │   ├── index.ts       # PTY服务管理器
│   │   ├── sessionManager.ts  # 会话管理器
│   │   ├── webSocketService.ts # WebSocket服务
│   │   ├── routeHandler.ts # HTTP API处理器
│   │   ├── goPtyAdapter.ts # Go PTY程序适配器
│   │   ├── constants.ts   # 常量和环境检查
│   │   ├── commandParser.ts # 命令解析和验证
│   │   └── systemUser.ts  # 系统用户管理
│   ├── middleware/        # 中间件
│   │   ├── protocol.ts    # 协议处理
│   │   └── errorHandler.ts # 错误处理
│   ├── routes/           # 路由
│   │   ├── index.ts      # 路由管理器
│   │   └── base.ts       # 基础路由
│   ├── types/            # 类型定义
│   │   ├── index.ts      # 通用类型
│   │   └── pty.ts        # PTY相关类型
│   └── utils/            # 工具函数
│       └── helpers.ts    # 通用工具
├── lib/                  # Go PTY可执行文件
│   ├── pty_linux_x64     # Linux 64位
│   ├── pty_win32_x64.exe # Windows 64位
│   └── ...               # 其他平台
├── config/               # 配置文件
│   └── server.json       # 服务器配置
├── logs/                 # 日志文件
├── public/               # 静态文件
│   └── index.html        # 首页
├── dist/                 # 编译输出
└── package.json          # 项目配置
```

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 准备PTY环境（可选）

如果需要使用PTY虚拟终端功能，请确保在项目根目录的`lib`文件夹中有对应平台的PTY可执行文件：

```
lib/
├── pty_linux_x64      # Linux 64位
├── pty_win32_x64.exe  # Windows 64位
└── ...                # 其他平台
```

### 3. 开发模式启动

```bash
pnpm dev
```

### 4. 生产环境启动

```bash
# 构建项目
pnpm build

# 启动服务
pnpm start
```

## 📖 API 接口

### 基础接口

- `GET /` - 服务首页
- `GET /api/health` - 健康检查
- `GET /api/info` - 服务信息

### 路径缓存接口

为麦麦启动器提供根目录缓存功能：

#### 主程序路径管理
- `GET /api/pathCache/getAllPaths` - 获取所有缓存路径
- `POST /api/pathCache/setRootPath` - 设置主程序根目录
- `GET /api/pathCache/getMainRoot` - 获取主程序根目录

#### 适配器路径管理
- `POST /api/pathCache/addAdapterRoot` - 添加适配器根目录
- `DELETE /api/pathCache/removeAdapterRoot` - 移除适配器根目录
- `PUT /api/pathCache/updateAdapterRoot` - 更新适配器根目录
- `GET /api/pathCache/getAdapterRoot/:name` - 获取单个适配器根目录
- `GET /api/pathCache/getAllAdapters` - 获取所有适配器列表

#### 缓存管理
- `DELETE /api/pathCache/clearCache` - 清空所有缓存
- `GET /api/pathCache/getStats` - 获取缓存统计信息

> 📋 **详细文档**: 完整的API文档请参考 [PATH_CACHE_API.md](./docs/PATH_CACHE_API.md)

### PTY虚拟终端接口

当PTY服务集成后，将提供以下接口：

#### HTTP API
- `GET /pty/environment` - 检查PTY环境
- `POST /pty/sessions` - 创建PTY会话
- `GET /pty/sessions` - 获取所有会话
- `GET /pty/sessions/:id` - 获取会话信息
- `POST /pty/sessions/:id/start` - 启动会话
- `POST /pty/sessions/:id/stop` - 停止会话
- `POST /pty/sessions/:id/input` - 发送输入
- `POST /pty/sessions/:id/resize` - 调整终端大小
- `DELETE /pty/sessions/:id` - 销毁会话

#### WebSocket API
- 连接地址: `ws://localhost:7999/socket.io`
- 事件类型: `pty:*` 系列事件（详见PTY文档）

> 💡 **注意**: PTY功能已完整实现，但需要在应用启动时显式集成。详细使用方法请参考 [PTY_README.md](./PTY_README.md)。

### 响应格式

所有API接口返回统一的JSON格式：

```json
{
  "status": 200,
  "data": "响应数据",
  "message": "可选的消息",
  "time": 1692000000000
}
```

## ⚙️ 配置说明

配置文件位于 `config/server.json`，包含以下配置项：

```json
{
  "server": {
    "port": 7999,                    // 服务端口
    "host": "0.0.0.0",              // 监听主机
    "prefix": "",                   // URL前缀
    "reverseProxyMode": false       // 反向代理模式
  },
  "logger": {
    "level": "INFO",                // 日志级别
    "enableConsole": true,          // 控制台日志
    "enableFile": true,             // 文件日志
    "maxFileSize": 10,              // 最大文件大小(MB)
    "maxFiles": 5                   // 最大文件数量
  },
  "security": {
    "sessionSecret": "secret",      // 会话密钥
    "corsEnabled": true,            // CORS启用
    "corsOrigins": ["*"],           // CORS来源
    "maxRequestSize": "10mb"        // 最大请求大小
  },
  "pty": {
    "enabled": false,               // PTY功能启用状态
    "maxSessions": 100,             // 最大会话数
    "timeout": 10000                // PTY启动超时(ms)
  },
  "app": {
    "name": "HMML",                 // 应用名称
    "version": "1.0.0",             // 版本号
    "description": "..."            // 描述
  }
}
```

## 🛠️ 开发指南

### 集成PTY虚拟终端功能

PTY虚拟终端功能已完整实现，如需集成到主应用，请参考以下示例：

```typescript
// src/core/httpServer.ts 中添加PTY集成
import PtyService from '../pty';

export class HttpServer {
  private ptyService?: PtyService;

  async init(): Promise<void> {
    // 现有初始化代码...
    
    // 集成PTY服务
    this.ptyService = new PtyService(100);
    this.app.use(this.ptyService.getRouter().routes());
    this.app.use(this.ptyService.getRouter().allowedMethods());
  }

  async start(): Promise<void> {
    // 创建HTTP服务器
    this.server = http.createServer(this.app.callback());
    
    // 启动PTY WebSocket服务
    if (this.ptyService) {
      await this.ptyService.start(this.server);
    }
    
    // 启动HTTP服务器
    this.server.listen(this.config.server.port, this.config.server.host);
  }
}
```

更多详细信息请参考 [PTY_README.md](./PTY_README.md) 和 [PTY集成指南](./PTY_INTEGRATION_GUIDE.md)。

### 添加新的路由

1. 在 `src/routes/` 目录下创建新的路由文件
2. 在 `src/routes/index.ts` 中注册路由

```typescript
import Router from '@koa/router';
import { AppContext } from '@/types';

const router = new Router();

router.get('/example', async (ctx: AppContext) => {
  ctx.body = { message: 'Hello World' };
});

export default router;
```

### 添加新的中间件

在 `src/middleware/` 目录下创建中间件文件，并在 `src/core/httpServer.ts` 中注册。

### 日志使用

```typescript
import { logger } from '@/core/logger';

logger.debug('调试信息');
logger.info('普通信息');
logger.warn('警告信息');
logger.error('错误信息');
logger.fatal('致命错误'); // 会导致程序退出
```

### 配置使用

```typescript
import { configManager } from '@/core/config';

// 获取完整配置
const config = configManager.get();

// 获取配置节
const serverConfig = configManager.getSection('server');

// 设置配置
configManager.setSection('server', { port: 8000 });
await configManager.save();
```

### 文件操作

```typescript
import { FileManager } from '@/core/fileManager';

// 读取JSON文件
const data = await FileManager.readJSON('/path/to/file.json');

// 写入JSON文件
await FileManager.writeJSON('/path/to/file.json', { key: 'value' });

// 其他文件操作
await FileManager.copy(src, dest);
await FileManager.move(src, dest);
await FileManager.remove(path);
```

## 🎨 日志样式

HMML 提供了美观的彩色日志输出：

- 🟣 **DEBUG** - 紫色，调试信息
- 🔵 **INFO** - 青色，普通信息  
- 🟡 **WARN** - 黄色，警告信息
- 🔴 **ERROR** - 红色，错误信息
- ⚫ **FATAL** - 红底白字，致命错误

## 🔧 命令行交互

服务启动后，支持以下命令行交互：

- `exit`, `quit`, `q` - 退出服务
- `help`, `h` - 显示帮助信息  
- `status`, `s` - 显示服务状态
- `config`, `c` - 显示配置信息

## 📝 脚本命令

```bash
# 开发模式（热重载）
pnpm dev

# 构建项目
pnpm build

# 生产模式启动
pnpm start

# 清理编译文件
pnpm clean
```

## 🌐 访问地址

- **服务首页**: http://localhost:7999/
- **健康检查**: http://localhost:7999/api/health
- **服务信息**: http://localhost:7999/api/info
- **PTY WebSocket**: ws://localhost:7999/socket.io（集成PTY后可用）
- **PTY API**: http://localhost:7999/pty/*（集成PTY后可用）

## 📚 相关文档

- [PTY虚拟终端文档](./PTY_README.md) - 完整的PTY功能文档和API参考
- [PTY集成指南](./PTY_INTEGRATION_GUIDE.md) - 如何将PTY功能集成到主应用
- [PTY实现总结](./PTY_IMPLEMENTATION_SUMMARY.md) - PTY系统的技术实现细节
- [项目结构文档](./PROJECT_STRUCTURE.md) - 项目架构和模块说明

## 📄 许可证

ISC License

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

## 📞 支持

如有问题，请在项目中提交 Issue。
