# 麦麦配置API实现文档

## 功能概述

为HMML系统实现了完整的麦麦配置管理功能，支持主程序配置(`bot_config.toml`)和模型配置(`model_config.toml`)的读取、更新、验证和管理。

## 技术架构

### 分层设计
```
├── src/types/config.ts           # 配置相关类型定义
├── src/services/
│   ├── mainConfigService.ts      # 主程序配置服务
│   └── modelConfigService.ts     # 模型配置服务
└── src/routes/
    ├── mainConfig.ts             # 主程序配置路由
    ├── modelConfig.ts            # 模型配置路由
    └── config.ts                 # 配置路由入口
```

### 依赖库
- `@iarna/toml`: TOML格式解析和序列化
- `fs.promises`: Node.js异步文件系统操作
- `path`: 路径处理工具

## API接口详情

### 一、主程序配置API

#### 1.1 获取当前主程序配置
**GET** `/api/config/main/get`

获取`麦麦根目录/config/bot_config.toml`文件内容并转换为JSON格式。

**响应示例:**
```json
{
  "status": 200,
  "message": "获取成功",
  "data": {
    "bot": {
      "name": "MaiMai Bot",
      "version": "1.0.0",
      "description": "麦麦机器人"
    },
    "server": {
      "host": "0.0.0.0",
      "port": 8080
    },
    "logging": {
      "level": "info",
      "file": "logs/bot.log"
    }
  },
  "time": 1692000000000
}
```

#### 1.2 更新主程序配置
**POST** `/api/config/main/update`

更新主程序配置文件内容，支持部分更新和深度合并。

**请求体示例:**
```json
{
  "bot": {
    "name": "MaiMai Bot Updated",
    "version": "2.0.0"
  },
  "server": {
    "port": 9090
  }
}
```

**响应示例:**
```json
{
  "status": 200,
  "message": "更新成功",
  "time": 1692000000000
}
```

#### 1.3 获取配置文件信息
**GET** `/api/config/main/info`

获取配置文件的元数据信息。

**响应示例:**
```json
{
  "status": 200,
  "message": "获取配置文件信息成功",
  "data": {
    "path": "C:/MaiBot/config/bot_config.toml",
    "exists": true,
    "readable": true,
    "writable": true,
    "size": 1024,
    "lastModified": "2025-08-12T10:30:00.000Z"
  },
  "time": 1692000000000
}
```

#### 1.4 验证配置数据
**POST** `/api/config/main/validate`

验证配置数据格式是否正确，不实际写入文件。

**请求体:** 需要验证的配置数据
**响应示例:**
```json
{
  "status": 200,
  "message": "配置数据验证通过",
  "data": {
    "valid": true,
    "errors": [],
    "warnings": []
  },
  "time": 1692000000000
}
```

### 二、模型配置API

#### 2.1 获取当前模型配置
**GET** `/api/config/model/get`

获取`麦麦根目录/config/model_config.toml`文件内容并转换为JSON格式。

**响应示例:**
```json
{
  "status": 200,
  "message": "获取成功",
  "data": {
    "model_name": "gpt-3.5-turbo",
    "api_key": "sk-xxxxx",
    "api_base": "https://api.openai.com/v1",
    "max_tokens": 2000,
    "temperature": 0.7,
    "top_p": 0.9,
    "presence_penalty": 0.0,
    "frequency_penalty": 0.0
  },
  "time": 1692000000000
}
```

#### 2.2 更新模型配置
**POST** `/api/config/model/update`

更新模型配置文件内容，包含模型特定的验证规则。

**请求体示例:**
```json
{
  "model_name": "gpt-4",
  "max_tokens": 4000,
  "temperature": 0.8
}
```

**响应示例:**
```json
{
  "status": 200,
  "message": "更新成功",
  "time": 1692000000000
}
```

#### 2.3 添加API服务提供商
**POST** `/api/config/model/addProvider`

添加一个新的API服务提供商配置。

**请求体示例:**
```json
{
  "name": "DeepSeek",
  "base_url": "https://api.deepseek.cn/v1",
  "api_key": "your-api-key-here",
  "client_type": "openai",
  "max_retry": 2,
  "timeout": 30,
  "retry_interval": 10
}
```

**响应示例:**
```json
{
  "status": 200,
  "message": "添加成功",
  "time": 1692000000000
}
```

#### 2.4 删除API服务提供商
**DELETE** `/api/config/model/deleteProvider`

删除指定名称的API服务提供商配置。会检查是否有模型正在使用该供应商，如有则拒绝删除。

**请求体示例:**
```json
{
  "name": "DeepSeek"
}
```

**响应示例:**
```json
{
  "status": 200,
  "message": "删除成功",
  "time": 1692000000000
}
```

#### 2.5 添加模型配置
**POST** `/api/config/model/addModel`

添加一个新的模型配置。会验证API供应商是否存在。

**请求体示例:**
```json
{
  "model_identifier": "deepseek-chat",
  "name": "deepseek-v3",
  "api_provider": "DeepSeek",
  "price_in": 2.0,
  "price_out": 8.0,
  "force_stream_mode": false,
  "extra_params": {
    "enable_thinking": true
  }
}
```

**响应示例:**
```json
{
  "status": 200,
  "message": "添加成功",
  "time": 1692000000000
}
```

#### 2.6 删除模型配置
**DELETE** `/api/config/model/deleteModel`

删除指定名称的模型配置。会检查是否有任务配置正在使用该模型，如有则拒绝删除。

**请求体示例:**
```json
{
  "name": "deepseek-v3"
}
```

**响应示例:**
```json
{
  "status": 200,
  "message": "删除成功",
  "time": 1692000000000
}
```

### 三、配置模块健康检查
**GET** `/api/config/health`

检查配置模块的运行状态。

**响应示例:**
```json
{
  "status": 200,
  "message": "配置模块运行正常",
  "data": {
    "module": "config",
    "services": ["mainConfig", "modelConfig"],
    "timestamp": "2025-08-12T10:30:00.000Z"
  },
  "time": 1692000000000
}
```

## 核心功能特性

### 1. 数据完整性保护
- **自动备份**: 更新前自动创建时间戳备份文件
- **原子操作**: 配置更新要么全部成功，要么全部回滚
- **文件权限检查**: 更新前检查文件读写权限
- **目录自动创建**: 配置目录不存在时自动创建

### 2. 数据验证机制
- **格式验证**: 确保TOML格式正确性
- **类型检查**: 验证配置值类型符合TOML规范
- **业务规则**: 模型配置包含特定的业务验证规则
- **深度验证**: 递归验证嵌套对象结构

### 3. 配置合并策略
- **深度合并**: 嵌套对象递归合并而非替换
- **部分更新**: 支持只更新配置的一部分
- **空值处理**: 正确处理null和undefined值
- **数组替换**: 数组字段采用完整替换策略

### 4. 错误处理机制
```typescript
// 错误类型分类
- ValidationError (400): 参数验证失败
- NotFoundError (404): 文件或目录不存在
- InternalServerError (500): 文件操作或系统错误
```

## 业务验证规则

### 主程序配置验证
- 键名必须是非空字符串
- 支持的值类型：string, number, boolean, null, array, object
- 数组元素类型必须一致
- 对象结构递归验证

### 模型配置特定验证
```typescript
// 模型参数验证规则
- model_name: 非空字符串
- max_tokens: 正整数
- temperature: 0-2之间的数值
- top_p: 0-1之间的数值
- api_key: 字符串格式
- api_base: 有效的URL格式
```

## 文件操作细节

### 路径构建
```typescript
// 主程序配置路径
const mainConfigPath = path.join(mainRoot, 'config', 'bot_config.toml');

// 模型配置路径
const modelConfigPath = path.join(mainRoot, 'config', 'model_config.toml');
```

### 备份文件命名
```typescript
// 新的备份目录结构
LauncherConfigBak/
├── main/                                    # 主程序配置备份目录
│   └── bot_config.toml.backup.2025-08-13T10-30-00-000Z
└── model/                                   # 模型配置备份目录
    └── model_config.toml.backup.2025-08-13T10-30-00-000Z

// 备份文件格式
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFileName = `${configFileName}.backup.${timestamp}`;
// 例如: bot_config.toml.backup.2025-08-13T10-30-00-000Z
```

### 编码处理
- 默认使用UTF-8编码
- 支持自定义编码格式
- 自动处理Buffer和string类型转换

## 使用示例

### JavaScript客户端示例
```javascript
// 获取主程序配置
const response = await fetch('/api/config/main/get');
const result = await response.json();
if (result.status === 200) {
  console.log('配置内容:', result.data);
}

// 更新配置
const updateData = {
  bot: { name: "New Bot Name" }
};
const updateResponse = await fetch('/api/config/main/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updateData)
});
```

### curl命令示例
```bash
# 获取主程序配置
curl "http://localhost:7999/api/config/main/get"

# 更新主程序配置
curl -X POST "http://localhost:7999/api/config/main/update" \
  -H "Content-Type: application/json" \
  -d '{"bot":{"name":"Updated Bot"}}'

# 获取模型配置
curl "http://localhost:7999/api/config/model/get"

# 添加API服务提供商
curl -X POST "http://localhost:7999/api/config/model/addProvider" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TestProvider",
    "base_url": "https://api.test.com/v1",
    "api_key": "test-key",
    "client_type": "openai"
  }'

# 删除API服务提供商
curl -X DELETE "http://localhost:7999/api/config/model/deleteProvider" \
  -H "Content-Type: application/json" \
  -d '{"name": "TestProvider"}'

# 添加模型配置
curl -X POST "http://localhost:7999/api/config/model/addModel" \
  -H "Content-Type: application/json" \
  -d '{
    "model_identifier": "test-model",
    "name": "test-model-v1",
    "api_provider": "TestProvider",
    "price_in": 1.0,
    "price_out": 2.0
  }'

# 删除模型配置
curl -X DELETE "http://localhost:7999/api/config/model/deleteModel" \
  -H "Content-Type: application/json" \
  -d '{"name": "test-model-v1"}'
```

## 部署注意事项

### 1. 文件系统权限
- 确保HMML进程对配置目录有读写权限
- 配置文件不存在时需要创建权限
- 备份目录需要写入权限

### 2. 配置文件位置
- 主程序配置: `{麦麦根目录}/config/bot_config.toml`
- 模型配置: `{麦麦根目录}/config/model_config.toml`
- 备份文件: 与原文件同目录，添加时间戳后缀

### 3. 依赖库版本
- `@iarna/toml@2.2.5`: TOML解析库
- 确保Node.js版本支持fs.promises API

### 4. 错误监控
- 配置文件操作失败时会记录详细日志
- 建议监控配置更新频率和失败率
- 定期清理过期的备份文件

## 扩展功能建议

### 1. 配置模板系统
- 提供配置文件模板
- 支持从模板初始化配置
- 配置项说明和默认值

### 2. 配置版本管理
- 配置文件版本控制
- 配置变更历史记录
- 回滚到历史版本功能

### 3. 配置热重载
- 文件变化监听
- 自动重载配置
- 通知相关服务配置更新

### 4. 配置加密存储
- 敏感信息加密存储
- API密钥安全处理
- 配置访问权限控制

### 5. 配置导入导出
- 配置文件导出功能
- 批量配置导入
- 配置在不同环境间迁移

---

**实现日期**: 2025年8月12日  
**版本**: 1.0.0  
**作者**: GitHub Copilot  
**依赖**: @iarna/toml@2.2.5, Node.js fs.promises API
