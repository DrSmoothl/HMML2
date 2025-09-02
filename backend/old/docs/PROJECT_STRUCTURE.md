# HMML 项目结构说明

## 🎯 项目概述
基于MCSM框架设计的HMML (Hello MaiMai Launcher) 后端服务已成功创建！

## 📁 目录结构
```
HMML/
├── src/                          # 源代码目录
│   ├── app.ts                   # 🚀 应用程序入口点
│   ├── core/                    # 📦 核心组件
│   │   ├── logger.ts           # 📝 美观的彩色日志系统
│   │   ├── config.ts           # ⚙️ 配置管理系统
│   │   ├── fileManager.ts      # 📁 文件操作工具
│   │   └── httpServer.ts       # 🌐 HTTP服务器核心
│   ├── middleware/              # 🔧 中间件
│   │   ├── protocol.ts         # 📡 协议处理中间件
│   │   └── errorHandler.ts     # ❌ 错误处理中间件
│   ├── routes/                  # 🛣️ 路由管理
│   │   ├── index.ts            # 路由管理器
│   │   └── base.ts             # 基础路由
│   ├── types/                   # 📋 TypeScript类型定义
│   │   └── index.ts            # 通用类型接口
│   └── utils/                   # 🔨 工具函数库
│       └── helpers.ts          # 通用辅助函数
├── config/                      # ⚙️ 配置文件
│   └── server.json             # 服务器配置
├── logs/                        # 📊 日志文件目录
├── public/                      # 🌐 静态资源
│   └── index.html              # 美观的首页
├── dist/                        # 🏗️ 编译输出
├── package.json                 # 📦 项目配置
├── tsconfig.json               # 🔧 TypeScript配置
├── nodemon.json                # 🔄 开发环境配置
└── README.md                   # 📖 详细文档
```

## ✨ 核心功能特性

### 1. 📝 日志系统 (src/core/logger.ts)
- 美观的彩色控制台输出
- 文件日志记录和轮转
- 多级别日志支持 (DEBUG, INFO, WARN, ERROR, FATAL)
- 自动日志清理

### 2. ⚙️ 配置管理 (src/core/config.ts)
- JSON配置文件支持
- 热重载配置
- 默认配置自动生成
- 配置验证和合并

### 3. 📁 文件管理 (src/core/fileManager.ts)
- 安全的文件读写操作
- JSON文件处理
- 目录管理
- 文件复制、移动、删除
- 文件统计信息

### 4. 🌐 HTTP服务器 (src/core/httpServer.ts)
- 基于Koa.js的高性能服务器
- 中间件支持
- 静态文件服务
- 会话管理
- CORS跨域支持

### 5. 🔧 中间件系统
- **协议中间件**: 统一的响应格式处理
- **错误处理中间件**: 全局错误捕获和处理

### 6. 🛣️ 路由系统
- 模块化路由设计
- 自动路由注册
- RESTful API支持

### 7. 🔨 工具函数库
- 字符串处理
- 异步工具 (防抖、节流、重试)
- 数据验证
- UUID生成
- 深度克隆
- 时间格式化

## 🚀 运行命令

```bash
# 开发模式 (热重载)
pnpm dev

# 构建项目
pnpm build

# 生产模式运行
pnpm start

# 清理构建文件
pnpm clean
```

## 🌍 访问地址

- **首页**: http://localhost:7999/
- **健康检查**: http://localhost:7999/api/health
- **服务信息**: http://localhost:7999/api/info

## 💻 命令行交互

服务运行时支持以下命令:
- `exit`, `quit`, `q` - 优雅关闭服务
- `help`, `h` - 显示帮助信息
- `status`, `s` - 显示服务状态
- `config`, `c` - 显示配置信息

## 📊 响应格式

所有API接口使用统一的JSON响应格式:

```json
{
  "status": 200,
  "data": "响应数据",
  "message": "可选消息",
  "time": 1692000000000
}
```

## 🎨 日志样式

- 🟣 **DEBUG** - 调试信息
- 🔵 **INFO** - 常规信息
- 🟡 **WARN** - 警告信息
- 🔴 **ERROR** - 错误信息
- ⚫ **FATAL** - 致命错误

## ✅ 项目状态

✅ 项目初始化完成  
✅ 核心组件实现完成  
✅ HTTP服务器运行正常  
✅ API接口测试通过  
✅ 日志系统工作正常  
✅ 配置管理功能完整  
✅ 错误处理机制完善  
✅ 构建系统配置完成  

🎉 **HMML后端服务已成功创建并可以投入使用！**

## 🔧 技术栈

- **运行时**: Node.js
- **语言**: TypeScript
- **框架**: Koa.js
- **包管理**: pnpm
- **构建工具**: tsc (TypeScript Compiler)
- **开发工具**: nodemon, ts-node

## 📈 下一步扩展建议

1. **数据库集成**: 添加MySQL/PostgreSQL支持
2. **缓存系统**: 集成Redis缓存
3. **用户认证**: JWT认证系统
4. **API文档**: 集成Swagger文档
5. **单元测试**: 添加Jest测试框架
6. **Docker化**: 容器化部署支持
7. **监控系统**: 添加性能监控
8. **WebSocket**: 实时通信支持
