# HMML Python Backend

这是HMML (Hello MaiMai Launcher) 的Python后端服务，使用FastAPI框架重写自原Node.js版本。

## 特性

- 🚀 基于FastAPI的高性能Web服务器
- 📝 完整的日志系统（控制台+文件）
- ⚙️ 灵活的配置管理
- 🔒 安全中间件（CORS、请求验证等）
- 📚 自动生成的API文档
- 💪 优雅的错误处理和关闭机制

## 目录结构

```
backend/
├── src/
│   ├── core/
│   │   ├── config.py      # 配置管理
│   │   ├── logger.py      # 日志系统
│   │   ├── version.py     # 版本管理
│   │   └── http_server.py # HTTP服务器
│   └── app.py             # 主应用
├── config/
│   └── server.json        # 服务器配置
├── public/
│   └── index.html         # 静态首页
├── logs/                  # 日志目录
├── requirements.txt       # Python依赖
└── start.py              # 启动脚本
```

## 快速开始

1. 安装依赖：
```bash
pip install -r requirements.txt
```

2. 启动服务：
```bash
python start.py
```

3. 访问服务：
- 主页：http://localhost:7999
- API文档：http://localhost:7999/docs
- 健康检查：http://localhost:7999/api/health

## 配置

服务器配置位于 `config/server.json`，包含以下主要设置：

- `server.port`: 服务端口（默认7999）
- `server.host`: 绑定地址（默认0.0.0.0）
- `logger.level`: 日志级别（DEBUG/INFO/WARNING/ERROR/CRITICAL）
- `security.cors_enabled`: 是否启用CORS
- `security.cors_origins`: 允许的CORS源

## 从Node.js版本的改进

- ✅ 更好的类型安全（Pydantic模型）
- ✅ 自动API文档生成
- ✅ 内置请求验证
- ✅ 更清晰的异步处理
- ✅ 更好的错误处理和日志记录
- ✅ 简化的中间件系统

## 开发

服务器支持热重载，修改代码后会自动重启。日志会同时输出到控制台和文件中。
