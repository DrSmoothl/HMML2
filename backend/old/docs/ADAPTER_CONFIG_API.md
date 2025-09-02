# QQ适配器配置API文档

## 概述

本文档描述了QQ适配器配置管理的后端API接口，用于读取和更新QQ适配器的 `config.toml` 配置文件。

## 前提条件

- QQ适配器根目录必须已在路径缓存中设置
- 配置文件路径：`{QQ适配器根目录}/config.toml`

## API接口

### 1. 获取QQ适配器配置

**接口**: `GET /config/adapter/qq/get`

**功能**: 读取并返回QQ适配器的配置文件内容，格式为JSON

**请求参数**: 无

**响应格式**:
```json
{
  "status": 200,
  "message": "获取成功",
  "data": {
    "inner": {
      "version": "0.1.1"
    },
    "nickname": "",
    "napcat_server": {
      "host": "localhost",
      "port": 8095,
      "heartbeat_interval": 30
    },
    "maibot_server": {
      "host": "localhost",
      "port": 8000
    },
    "chat": {
      "group_list_type": "whitelist",
      "group_list": [941657197, 1022489779],
      "private_list_type": "whitelist",
      "private_list": [],
      "ban_user_id": [],
      "ban_qq_bot": true,
      "enable_poke": true
    },
    "voice": {
      "use_tts": false
    },
    "debug": {
      "level": "INFO"
    }
  },
  "time": 1692000000000
}
```

### 2. 更新QQ适配器配置

**接口**: `POST /config/adapter/qq/update`

**方法**: POST

**请求体**:
```json
{
  "napcat_server": {
    "host": "localhost",
    "port": 8095,
    "heartbeat_interval": 30
  },
  "chat": {
    "group_list_type": "whitelist",
    "group_list": [123456789],
    "ban_qq_bot": true
  }
}
```

**功能**: 更新QQ适配器的配置文件内容（支持部分更新）

**响应格式**:
```json
{
  "status": 200,
  "message": "更新成功",
  "time": 1692000000000
}
```

### 3. 获取配置文件信息

**接口**: `GET /config/adapter/qq/info`

**功能**: 获取配置文件的状态信息（用于诊断）

**响应格式**:
```json
{
  "status": 200,
  "message": "获取配置文件信息成功",
  "data": {
    "path": "C:\\QQBot\\Adapter\\config.toml",
    "exists": true,
    "readable": true,
    "writable": true,
    "size": 1024,
    "lastModified": "2025-08-13T10:30:00.000Z"
  },
  "time": 1692000000000
}
```

### 4. 验证配置数据

**接口**: `POST /config/adapter/qq/validate`

**功能**: 验证配置数据格式（不实际写入文件）

**请求体**: 配置数据（同更新接口）

**响应格式**:
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

## 错误处理

| 状态码 | 说明 | 示例场景 |
|--------|------|----------|
| 200 | 成功 | 正常操作完成 |
| 400 | 请求参数错误 | 配置数据格式错误 |
| 404 | 资源不存在 | 适配器根目录未设置或配置文件不存在 |
| 500 | 服务器内部错误 | 文件系统错误、权限问题 |

### 常见错误信息

- `"QQ适配器根目录未设置，请先在路径缓存中设置适配器根目录"`
- `"QQ适配器配置文件不存在"`
- `"QQ适配器配置文件不可读/不可写"`
- `"配置文件格式错误: TOML解析失败"`
- `"group_list_type 必须是 whitelist 或 blacklist"`

## 配置文件结构说明

### 连接配置
- `napcat_server`: Napcat服务器连接配置
- `maibot_server`: MaiBot服务器连接配置

### 聊天权限
- `group_list_type`: 群组列表类型（whitelist/blacklist）
- `group_list`: 群组ID数组
- `private_list_type`: 私聊列表类型（whitelist/blacklist）
- `private_list`: 用户QQ号数组
- `ban_user_id`: 全局禁止用户数组

### 功能设置
- `ban_qq_bot`: 是否屏蔽QQ官方机器人
- `enable_poke`: 是否启用戳一戳功能
- `use_tts`: 是否启用TTS语音

### 调试设置
- `debug.level`: 日志等级（DEBUG/INFO/WARNING/ERROR/CRITICAL）

## 数据验证规则

1. **服务器配置**:
   - 端口必须在1-65535范围内
   - 心跳间隔必须大于0

2. **聊天配置**:
   - 列表类型只能是"whitelist"或"blacklist"
   - QQ号和群号必须是正整数
   - 数组中的元素类型必须一致

3. **布尔值**: 功能开关必须是true或false

4. **字符串**: 不能为空或只包含空白字符

## 备份机制

- 更新配置前会自动创建备份
- 备份目录：`{适配器根目录}/../LauncherConfigBak/adapter/qq/`
- 备份文件名格式：`config.toml.backup.{时间戳}`

## 使用示例

### JavaScript/TypeScript 客户端
```typescript
// 获取配置
const config = await fetch('/config/adapter/qq/get').then(r => r.json())

// 更新配置
await fetch('/config/adapter/qq/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat: {
      group_list_type: 'whitelist',
      group_list: [123456789]
    }
  })
})
```

### 前端组件
参考 `frontend/src/views/settings/AdapterSettings.vue` 的实现。
