# PTY集成指南

本文档介绍如何将PTY虚拟终端功能集成到HMML主应用中。

## 快速集成

### 1. 修改HTTP服务器

编辑 `src/core/httpServer.ts`，添加PTY服务集成：

```typescript
import PtyService from '../pty';

export class HttpServer {
  private ptyService?: PtyService;

  constructor(config: ServerConfig) {
    this.config = config;
    this.app = new Koa({
      proxy: config.server.reverseProxyMode || false,
      proxyIpHeader: 'X-Real-IP'
    });
    
    // 初始化PTY服务（如果启用）
    if (config.pty?.enabled) {
      this.ptyService = new PtyService(config.pty.maxSessions || 100);
    }
  }

  private setupRoutes(): void {
    // 注册现有路由
    initRoutes(this.app);
    
    // 注册PTY路由
    if (this.ptyService) {
      this.app.use(this.ptyService.getRouter().routes());
      this.app.use(this.ptyService.getRouter().allowedMethods());
      logger.info('PTY路由已注册');
    }
    
    logger.debug('路由设置完成');
  }

  async start(): Promise<void> {
    try {
      this.server = http.createServer(this.app.callback());

      // 启动PTY WebSocket服务
      if (this.ptyService && this.server) {
        await this.ptyService.start(this.server);
        logger.info('PTY WebSocket服务已启动');
      }

      this.server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          logger.fatal(`端口 ${this.config.server.port} 已被占用`);
        } else {
          logger.fatal('HTTP服务器启动失败:', error);
        }
      });

      this.server.listen(this.config.server.port, this.config.server.host);
      
      this.printStartupInfo();
      logger.info(`HTTP服务器已启动，监听 ${this.config.server.host}:${this.config.server.port}`);
    } catch (error) {
      logger.fatal('HTTP服务器启动失败:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    // 停止PTY服务
    if (this.ptyService) {
      await this.ptyService.stop();
      logger.info('PTY服务已停止');
    }

    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          logger.info('HTTP服务器已停止');
          resolve();
        });
      });
    }
  }
}
```

### 2. 更新配置类型

编辑 `src/core/config.ts`，添加PTY配置支持：

```typescript
export interface PtyConfig {
  enabled: boolean;
  maxSessions: number;
  timeout: number;
}

export interface ServerConfig {
  server: {
    port: number;
    host: string;
    prefix?: string;
    reverseProxyMode?: boolean;
  };
  logger: LoggerConfig;
  security: SecurityConfig;
  pty?: PtyConfig;  // 新增PTY配置
  app: AppConfig;
}
```

### 3. 更新配置文件

在 `config/server.json` 中添加PTY配置：

```json
{
  "server": {
    "port": 7999,
    "host": "0.0.0.0",
    "prefix": "",
    "reverseProxyMode": false
  },
  "logger": {
    "level": "INFO",
    "enableConsole": true,
    "enableFile": true,
    "maxFileSize": 10,
    "maxFiles": 5
  },
  "security": {
    "sessionSecret": "your-secret-key",
    "corsEnabled": true,
    "corsOrigins": ["*"],
    "maxRequestSize": "10mb"
  },
  "pty": {
    "enabled": true,
    "maxSessions": 100,
    "timeout": 10000
  },
  "app": {
    "name": "HMML",
    "version": "1.0.0",
    "description": "Hello MaiMai Launcher Backend Service"
  }
}
```

## 验证集成

启动应用后，可以通过以下方式验证PTY功能是否正常工作：

### 1. 检查环境
```bash
curl http://localhost:7999/pty/environment
```

### 2. 创建会话
```bash
curl -X POST http://localhost:7999/pty/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "command": {
      "startCommand": "bash",
      "cwd": "/tmp",
      "ie": "utf-8",
      "oe": "utf-8"
    },
    "terminal": {
      "haveColor": true,
      "pty": true,
      "ptyWindowCol": 80,
      "ptyWindowRow": 24
    }
  }'
```

### 3. 测试WebSocket连接
```javascript
const socket = io('ws://localhost:7999');
socket.on('connect', () => {
  console.log('WebSocket连接成功');
});
```

## 故障排除

1. **PTY程序不存在**: 确保 `lib/` 目录下有对应平台的PTY可执行文件
2. **端口冲突**: 检查7999端口是否被占用
3. **权限问题**: 确保PTY程序有执行权限（Linux/Mac）
4. **依赖缺失**: 确保已安装 `socket.io` 依赖

## 完整示例

参考 `src/examples/ptyIntegration.ts` 查看完整的集成示例代码。

更多详细信息请参考 [PTY_README.md](../PTY_README.md)。
