# 🌐 HMML2 内网/跨主机访问指南

## 概述

HMML2 现在支持**智能 API 地址自动配置**，无论是 Docker 部署还是源码部署，都能自动适配内网访问！

## ✨ 自动配置原理

前端会根据当前访问地址自动推断后端 API 地址：

```
访问地址                        → API 地址
http://localhost:5173          → http://localhost:7999/api
http://localhost:7998          → http://localhost:7999/api
http://192.168.1.100:5173      → http://192.168.1.100:7999/api
http://192.168.1.100:7998      → http://192.168.1.100:7999/api
http://your-domain.com:7998    → http://your-domain.com:7999/api
```

**关键点**: 前端会使用**你访问时的主机地址**来构建 API 地址！

## 📋 支持的部署方式

### ✅ 方式 1: Docker 部署（推荐）

**服务器上 (192.168.1.100)**:
```bash
docker compose up -d
```

**其他电脑浏览器访问**:
```
http://192.168.1.100:7998
```

**自动配置结果**:
- API 地址: `http://192.168.1.100:7999/api` ✅
- 无需任何配置！

---

### ✅ 方式 2: 源码部署（开发模式）

**服务器上 (192.168.1.100)**:
```bash
# 启动后端
cd backend
python start.py  # 默认监听 0.0.0.0:7999

# 启动前端
cd frontend
pnpm dev -- --host  # 关键：添加 --host 参数允许外部访问
```

**其他电脑浏览器访问**:
```
http://192.168.1.100:5173
```

**自动配置结果**:
- API 地址: `http://192.168.1.100:7999/api` ✅
- 无需任何配置！

---

### ✅ 方式 3: 生产构建部署

**服务器上 (192.168.1.100)**:
```bash
# 1. 构建前端
cd frontend
pnpm build

# 2. 启动后端
cd ../backend
python start.py

# 3. 启动前端静态服务器
cd ../frontend
node server.cjs
```

**其他电脑浏览器访问**:
```
http://192.168.1.100:7998
```

**自动配置结果**:
- API 地址: `http://192.168.1.100:7999/api` ✅
- 无需任何配置！

## 🔧 详细配置说明

### 后端配置

后端需要监听 `0.0.0.0` 以允许外部访问。

**检查配置文件** `backend/config/server.json`:
```json
{
  "server": {
    "host": "0.0.0.0",  // ✅ 必须是 0.0.0.0，不能是 127.0.0.1
    "port": 7999
  },
  "security": {
    "cors_enabled": true,       // ✅ 必须启用 CORS
    "cors_origins": ["*"]       // ✅ 允许所有来源（或指定 IP）
  }
}
```

### 前端配置

#### 开发模式 (Vite)

**启动时添加 `--host` 参数**:
```bash
# 方式 1: 命令行
pnpm dev -- --host

# 方式 2: 修改 package.json
{
  "scripts": {
    "dev": "vite --host"
  }
}

# 方式 3: 修改 vite.config.ts
export default defineConfig({
  server: {
    host: '0.0.0.0',  // 允许外部访问
    port: 5173
  }
})
```

#### 生产模式

生产模式下 `server.cjs` 已默认监听 `0.0.0.0`，无需额外配置。

## 🎯 验证配置是否生效

### 1. 打开浏览器开发者工具

访问前端页面后，按 `F12` 打开开发者工具。

### 2. 查看 Console 日志

你应该看到类似信息：
```
[HMML] API Base URL 自动设置为: http://192.168.1.100:7999/api
[HMML] 部署模式: 开发模式/Docker模式/自定义模式
```

### 3. 检查 Network 请求

在 Network 标签页中，查看 API 请求的地址：
- ✅ 正确: `http://192.168.1.100:7999/api/...`
- ❌ 错误: `http://localhost:7999/api/...`

如果看到 `localhost`，说明自动配置未生效！

## 🔍 常见问题排查

### 问题 1: API 请求 404 或网络错误

**可能原因**:
- 后端未监听 `0.0.0.0`
- 防火墙阻止了端口 7999
- 后端未启动

**解决步骤**:

1. **检查后端是否可访问**:
```bash
# 在服务器上测试
curl http://localhost:7999/api/health

# 在其他电脑测试
curl http://192.168.1.100:7999/api/health
```

2. **检查后端监听地址**:
```bash
# Linux/macOS
netstat -tuln | grep 7999

# Windows
netstat -an | findstr 7999
```

应该看到 `0.0.0.0:7999` 而不是 `127.0.0.1:7999`

3. **检查防火墙**:
```bash
# Linux (firewalld)
sudo firewall-cmd --add-port=7999/tcp --permanent
sudo firewall-cmd --reload

# Linux (ufw)
sudo ufw allow 7999/tcp

# Windows
# 在 Windows 防火墙中添加入站规则允许 7999 端口
```

### 问题 2: CORS 错误

**错误信息**:
```
Access to XMLHttpRequest at 'http://192.168.1.100:7999/api/...' 
from origin 'http://192.168.1.100:5173' has been blocked by CORS policy
```

**解决方案**:

编辑 `backend/config/server.json`:
```json
{
  "security": {
    "cors_enabled": true,
    "cors_origins": ["*"]  // 或指定: ["http://192.168.1.100:5173"]
  }
}
```

然后重启后端服务。

### 问题 3: 前端无法从外部访问

**问题**:
- 在服务器上访问 `http://localhost:5173` 正常
- 在其他电脑访问 `http://192.168.1.100:5173` 无法打开

**解决方案**:

确保 Vite 使用 `--host` 参数启动：
```bash
pnpm dev -- --host
```

或者修改 `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0'  // 添加这行
  }
})
```

### 问题 4: API 地址仍然是 localhost

**检查步骤**:

1. 打开浏览器开发者工具 (F12)
2. 切换到 Console 标签页
3. 刷新页面
4. 查找 `[HMML] API Base URL 自动设置为:` 消息

**可能原因**:
- 浏览器缓存了旧的 index.html
- 构建时没有包含新的 index.html

**解决方案**:
```bash
# 清除浏览器缓存并强制刷新
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (macOS)

# 重新构建前端
cd frontend
rm -rf dist
pnpm build
```

## 📱 移动设备访问

移动设备（手机/平板）也可以访问！

**前提**:
- 移动设备和服务器在同一局域网
- 知道服务器的 IP 地址

**访问方式**:
```
http://192.168.1.100:7998
```

API 地址会自动配置为 `http://192.168.1.100:7999/api`

## 🌍 公网访问配置

如果需要通过公网访问（使用域名或公网 IP），需要额外配置：

### 方式 1: 使用反向代理（推荐）

使用 Nginx/Caddy 统一前后端端口：

**Nginx 配置**:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://localhost:7998;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:7999;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

访问 `http://your-domain.com` 即可，API 自动为 `/api`

### 方式 2: 手动指定 API 地址

在 `frontend/index.html` 的 `<head>` 开头添加：

```html
<script>
  // 在自动配置脚本之前设置
  window.__HMML_API_BASE__ = 'https://api.your-domain.com/api';
</script>
```

## 🛡️ 安全建议

### 内网访问
- ✅ 使用内网 IP，相对安全
- ✅ 可以使用 HTTP
- ⚠️ 建议限制 IP 白名单

### 公网访问
- ✅ **必须使用 HTTPS**
- ✅ **必须配置强 Token**
- ✅ **建议使用反向代理**
- ✅ **限制 CORS 来源**
- ✅ **启用防火墙规则**

## 📊 各部署方式对比

| 部署方式 | 难度 | 内网访问 | 自动配置 | 推荐场景 |
|---------|------|---------|---------|---------|
| Docker | ⭐ 简单 | ✅ | ✅ | 生产环境 |
| 源码开发 | ⭐⭐ 中等 | ✅ | ✅ | 开发调试 |
| 生产构建 | ⭐⭐⭐ 复杂 | ✅ | ✅ | 手动部署 |

## 🎓 最佳实践

### 开发环境
```bash
# 后端
cd backend
python start.py

# 前端
cd frontend
pnpm dev -- --host

# 访问: http://localhost:5173 或 http://<your-ip>:5173
```

### 测试环境
```bash
# 使用 Docker
docker compose up -d

# 访问: http://localhost:7998 或 http://<your-ip>:7998
```

### 生产环境
```bash
# 使用 Docker + Nginx 反向代理
docker compose up -d
# 配置 Nginx
# 配置 HTTPS (Let's Encrypt)
# 访问: https://your-domain.com
```

## 💡 快速测试命令

### 测试后端可访问性
```bash
# 从服务器本地
curl http://localhost:7999/api/health

# 从其他机器
curl http://192.168.1.100:7999/api/health

# 应该返回 JSON 格式的健康信息
```

### 测试前端可访问性
```bash
# 从其他机器
curl http://192.168.1.100:5173  # 开发模式
curl http://192.168.1.100:7998  # 生产模式

# 应该返回 HTML 内容
```

### 查看实时日志
```bash
# Docker 部署
docker logs -f hmml-unified

# 源码部署 - 后端日志
tail -f backend/logs/hmml.log

# 前端在浏览器 Console 中查看
```

## 🎉 总结

现在，**无论是 Docker 部署还是源码部署**，HMML2 都支持内网/跨主机访问的 API 地址自动配置！

**关键要点**:
1. ✅ 后端监听 `0.0.0.0`
2. ✅ 启用 CORS
3. ✅ 前端使用 `--host` (开发模式)
4. ✅ 防火墙允许端口
5. ✅ 浏览器 Console 验证配置

**快速开始**:
```bash
# Docker
docker compose up -d

# 源码
cd backend && python start.py &
cd frontend && pnpm dev -- --host

# 访问
http://<your-ip>:7998  # Docker
http://<your-ip>:5173  # 源码
```

享受无缝的内网访问体验！🚀
