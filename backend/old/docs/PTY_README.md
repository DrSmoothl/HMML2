# PTY虚拟终端服务

基于WebSocket和HTTP的分布式PTY虚拟终端实现，支持多会话管理和实时通信。

## 功能特性

- ✅ **多会话管理**: 支持同时管理多个PTY会话
- ✅ **WebSocket实时通信**: 基于Socket.io的实时数据传输
- ✅ **HTTP API**: 完整的REST API用于会话管理
- ✅ **Go PTY集成**: 与预编译Go PTY程序通信
- ✅ **安全验证**: 命令验证和用户权限管理
- ✅ **跨平台支持**: 支持Linux和Windows系统
- ✅ **分布式架构**: 模块化设计，易于扩展
- ✅ **终端尺寸管理**: 自动适配多观察者的终端尺寸

## 架构概述

```
┌─────────────────────────────────────────┐
│                客户端                    │
│    (WebSocket + HTTP API)              │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│             Koa HTTP 服务器              │
│         (端口 7999, Socket.io)          │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│          PTY WebSocket 服务             │
│      (WebSocket 事件处理)               │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│          PTY 会话管理器                 │
│    (会话生命周期，进程管理)             │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         Go PTY 进程适配器               │
│      (命名管道通信，进程控制)           │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│          Go PTY 可执行程序              │
│         (lib/pty_*.exe)                │
└─────────────────────────────────────────┘
```

## 目录结构

```
src/pty/
├── index.ts              # 主入口，PTY服务管理器
├── sessionManager.ts     # PTY会话管理器
├── webSocketService.ts   # WebSocket服务
├── routeHandler.ts       # HTTP API路由处理器
├── goPtyAdapter.ts       # Go PTY进程适配器
├── constants.ts          # 常量和环境检查
├── commandParser.ts      # 命令解析和验证
├── systemUser.ts         # 系统用户管理
└── types/
    └── pty.ts           # PTY相关类型定义
```

## 快速开始

### 1. 安装依赖

```bash
npm install socket.io @koa/router koa-bodyparser
npm install --save-dev @types/koa @types/koa-bodyparser
```

### 2. 准备Go PTY程序

确保在项目根目录的`lib`文件夹中有对应平台的PTY可执行文件：

```
lib/
├── pty_linux_x64      # Linux 64位
├── pty_win32_x64.exe  # Windows 64位
└── ...
```

### 3. 集成到现有项目

```typescript
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { createServer } from 'http';
import PtyService from './src/pty';

const app = new Koa();

// 添加body解析中间件
app.use(bodyParser());

// 创建HTTP服务器
const httpServer = createServer(app.callback());

// 创建PTY服务
const ptyService = new PtyService(100); // 最多100个会话

// 注册PTY路由
app.use(ptyService.getRouter().routes());
app.use(ptyService.getRouter().allowedMethods());

// 启动服务器
httpServer.listen(7999, async () => {
  console.log('服务器运行在端口 7999');
  
  // 启动PTY服务（包括WebSocket）
  await ptyService.start(httpServer);
  console.log('PTY服务已启动');
});
```

## API文档

### HTTP API

#### 环境检查

```http
GET /pty/environment
```

检查PTY环境是否就绪。

#### 创建会话

```http
POST /pty/sessions
Content-Type: application/json

{
  "command": {
    "startCommand": "bash",
    "cwd": "/home/user",
    "ie": "utf-8",
    "oe": "utf-8",
    "env": {
      "TERM": "xterm-256color"
    }
  },
  "terminal": {
    "ptyWindowCol": 80,
    "ptyWindowRow": 24
  }
}
```

#### 启动会话

```http
POST /pty/sessions/:sessionId/start
```

#### 发送输入

```http
POST /pty/sessions/:sessionId/input
Content-Type: application/json

{
  "input": "ls -la\n"
}
```

#### 调整终端大小

```http
POST /pty/sessions/:sessionId/resize
Content-Type: application/json

{
  "width": 120,
  "height": 30
}
```

#### 获取会话信息

```http
GET /pty/sessions/:sessionId
```

#### 停止会话

```http
POST /pty/sessions/:sessionId/stop
Content-Type: application/json

{
  "force": false
}
```

#### 销毁会话

```http
DELETE /pty/sessions/:sessionId
```

### WebSocket API

连接WebSocket：

```javascript
const socket = io('ws://localhost:7999');
```

#### 事件列表

**客户端发送：**

- `pty:create-session` - 创建会话
- `pty:start-session` - 启动会话  
- `pty:join-session` - 加入会话观察
- `pty:input` - 发送输入
- `pty:resize` - 调整终端大小
- `pty:leave-session` - 离开会话
- `pty:stop-session` - 停止会话

**服务器发送：**

- `pty:output` - 终端输出
- `pty:status-change` - 状态变更
- `pty:error` - 错误信息
- `pty:session-stopped` - 会话停止
- `pty:session-destroyed` - 会话销毁

#### 使用示例

```javascript
// 连接WebSocket
const socket = io('ws://localhost:7999');

// 创建会话
socket.emit('pty:create-session', {
  config: {
    command: {
      startCommand: 'bash',
      cwd: '/home/user',
      ie: 'utf-8',
      oe: 'utf-8'
    },
    terminal: {
      ptyWindowCol: 80,
      ptyWindowRow: 24
    }
  }
}, (response) => {
  if (response.success) {
    const sessionId = response.sessionId;
    
    // 启动会话
    socket.emit('pty:start-session', { sessionId }, (response) => {
      if (response.success) {
        // 加入会话观察
        socket.emit('pty:join-session', {
          sessionId,
          terminalSize: { width: 80, height: 24 }
        });
      }
    });
  }
});

// 监听终端输出
socket.on('pty:output', (data) => {
  console.log('终端输出:', data.data);
});

// 发送命令
socket.emit('pty:input', {
  sessionId: 'your-session-id',
  input: 'ls -la\n'
});
```

## 配置说明

### 环境变量

- `PTY_MAX_SESSIONS`: 最大会话数（默认100）
- `PTY_TIMEOUT`: PTY启动超时（默认10000ms）

### 会话配置

```typescript
interface IPtyInstanceConfig {
  uuid?: string;              // 会话ID（可选，自动生成）
  command: {
    startCommand: string;      // 启动命令，如 "bash" 或 "cmd"
    stopCommand?: string;      // 停止命令（默认 ^C）
    cwd: string;              // 工作目录
    ie: string;               // 输入编码（默认 utf-8）
    oe: string;               // 输出编码（默认 utf-8）
    runAs?: string;           // 运行用户（可选）
    env?: Record<string, string>; // 环境变量
  };
  terminal: {
    haveColor: boolean;       // 是否支持颜色
    pty: boolean;             // 是否为PTY模式
    ptyWindowCol: number;     // 终端列数
    ptyWindowRow: number;     // 终端行数
  };
}
```

## 安全注意事项

1. **命令验证**: 系统会验证启动命令的安全性
2. **用户权限**: 支持指定运行用户，避免权限提升
3. **路径限制**: 工作目录需要是绝对路径且存在
4. **资源限制**: 限制最大会话数量，防止资源耗尽
5. **输入过滤**: 对用户输入进行基本的安全检查

### 故障排除

### 常见问题

1. **PTY程序不存在**
   - 检查 `lib/pty_*` 文件是否存在
   - 确认文件有执行权限（Linux/Mac）

2. **会话启动失败**
   - 检查工作目录是否存在
   - 确认启动命令是否有效
   - 查看日志输出的错误信息

3. **WebSocket连接失败**
   - 确认端口7999是否被占用
   - 检查防火墙设置
   - 验证Socket.io版本兼容性

4. **终端输出乱码**
   - 检查输入输出编码设置（ie/oe）
   - 确认终端环境变量正确

5. **回调函数错误 (TypeError: callback is not a function)**
   - 客户端调用WebSocket事件时可能没有提供回调函数
   - 服务器已修复：所有回调参数现在都是可选的
   - 如果不需要响应，可以省略回调参数

### 调试模式

启用详细日志：

```typescript
import { logger } from './src/core/logger';

// 设置日志级别为debug
logger.level = 'debug';
```

### WebSocket事件回调说明

**注意**: 从v1.1.0开始，所有WebSocket事件的回调参数都是可选的，可以安全省略：

```javascript
// 有回调
socket.emit('pty:create-session', { config }, (response) => {
  console.log(response);
});

// 无回调（也支持）
socket.emit('pty:create-session', { config });
```

## 开发指南

### 扩展功能

1. **自定义命令验证器**:
   ```typescript
   // 在 commandParser.ts 中添加新的验证规则
   ```

2. **添加新的WebSocket事件**:
   ```typescript
   // 在 webSocketService.ts 中添加事件处理器
   ```

3. **扩展HTTP API**:
   ```typescript
   // 在 routeHandler.ts 中添加新的路由处理器
   ```

### 性能优化

1. **会话池管理**: 实现会话复用机制
2. **输出缓冲**: 对终端输出进行批量处理
3. **连接管理**: 优化WebSocket连接的生命周期

## License

MIT License
