# HMML 完整 API 文档

## 概述

HMML (Hello MaiMai Launcher) 是基于 Koa.js 构建的后端服务系统，提供了完整的数据库操作、路径缓存管理、PTY 虚拟终端服务等功能。本文档详细介绍了所有可用的 API 接口。

## 🔗 基础信息

- **基础URL**: `http://localhost:7999/api`
- **数据格式**: JSON
- **字符编码**: UTF-8
- **版本**: 1.3.0

## 📋 统一响应格式

所有API接口返回统一的JSON响应格式：

```json
{
  "status": 200,
  "message": "操作成功",
  "data": "响应数据",
  "time": 1703209600000
}
```

## 🗂️ API 分类

### 1. 系统管理 API

#### 1.1 健康检查

**GET** `/api/health`

检查服务器运行状态。

**响应示例:**
```json
{
  "status": 200,
  "message": "服务运行正常",
  "data": {
    "uptime": 3600,
    "timestamp": "2025-08-11T10:00:00.000Z"
  },
  "time": 1703209600000
}
```

#### 1.2 服务信息

**GET** `/api/info`

获取服务器基本信息。

**响应示例:**
```json
{
  "status": 200,
  "message": "获取服务信息成功",
  "data": {
    "name": "HMML Backend Service",
    "version": "1.3.0",
    "environment": "development",
    "node_version": "v20.0.0"
  },
  "time": 1703209600000
}
```

---

### 2. 路径缓存 API

路径缓存功能为HMML后端服务提供麦麦主程序和适配器根目录的缓存管理。

#### 2.1 获取所有缓存路径

**GET** `/api/pathCache/getAllPaths`

**响应示例:**
```json
{
  "status": 200,
  "data": {
    "mainRoot": "C:\\Games\\Maimai\\Main",
    "adapterRoots": [
      {
        "adapterName": "适配器1",
        "rootPath": "C:\\Games\\Maimai\\Adapters\\Adapter1"
      }
    ]
  },
  "message": "获取路径成功",
  "time": 1703209600000
}
```

#### 2.2 设置主程序根目录

**POST** `/api/pathCache/setRootPath`

**请求体:**
```json
{
  "mainRoot": "C:\\Games\\Maimai\\Main"
}
```

#### 2.3 获取主程序根目录

**GET** `/api/pathCache/getMainRoot`

#### 2.4 添加适配器根目录

**POST** `/api/pathCache/addAdapterRoot`

**请求体:**
```json
{
  "adapterName": "新适配器",
  "rootPath": "C:\\Games\\Maimai\\Adapters\\NewAdapter"
}
```

#### 2.5 移除适配器根目录

**DELETE** `/api/pathCache/removeAdapterRoot`

**请求体:**
```json
{
  "adapterName": "要移除的适配器"
}
```

#### 2.6 更新适配器根目录

**PUT** `/api/pathCache/updateAdapterRoot`

**请求体:**
```json
{
  "adapterName": "适配器1",
  "rootPath": "C:\\Games\\Maimai\\Adapters\\UpdatedPath"
}
```

#### 2.7 获取单个适配器根目录

**GET** `/api/pathCache/getAdapterRoot/:adapterName`

#### 2.8 获取所有适配器列表

**GET** `/api/pathCache/getAllAdapters`

#### 2.9 清空所有缓存

**DELETE** `/api/pathCache/clearCache`

#### 2.10 获取缓存统计信息

**GET** `/api/pathCache/getStats`

**响应示例:**
```json
{
  "status": 200,
  "data": {
    "hasMainRoot": true,
    "adapterCount": 3,
    "lastUpdated": "2025-08-11T10:30:00.000Z"
  },
  "message": "获取缓存统计信息成功",
  "time": 1703209600000
}
```

---

### 3. 数据库管理 API

#### 3.1 数据库状态

**GET** `/api/database/status`

获取数据库连接状态信息。

#### 3.2 测试数据库连接

**GET** `/api/database/test`

测试数据库连接是否正常。

#### 3.3 获取数据库统计信息

**GET** `/api/database/stats`

#### 3.4 获取表列表

**GET** `/api/database/tables`

#### 3.5 获取表结构

**GET** `/api/database/table/:tableName`

---

### 4. Emoji表操作 API

Emoji表用于管理emoji文件信息，包括路径、格式、描述等。

#### 4.1 分页查询Emoji

**GET** `/api/database/emoji/get`

**查询参数:**
- `page`: 页码 (默认1)
- `pageSize`: 每页记录数 (默认10, 最大1000)
- `orderBy`: 排序字段 (id, query_count, usage_count等)
- `orderDir`: 排序方向 (ASC/DESC, 默认ASC)
- `format`: 按格式过滤
- `emotion`: 按情感过滤
- `is_registered`: 按注册状态过滤 (0/1)
- `is_banned`: 按禁止状态过滤 (0/1)
- `description`: 按描述模糊搜索
- `emoji_hash`: 按哈希值精确查找

**响应示例:**
```json
{
  "status": 200,
  "message": "查询成功",
  "data": {
    "items": [
      {
        "id": 1,
        "full_path": "/path/to/emoji1.png",
        "format": "png",
        "emoji_hash": "hash1",
        "description": "Happy emoji",
        "query_count": 10,
        "is_registered": 1,
        "is_banned": 0,
        "emotion": "happy",
        "record_time": 1703123200.0,
        "register_time": 1703123200.0,
        "usage_count": 5,
        "last_used_time": 1703123200.0
      }
    ],
    "totalPages": 100,
    "currentPage": 1,
    "pageSize": 10,
    "total": 1000,
    "hasNext": true,
    "hasPrev": false
  },
  "time": 1703209600000
}
```

#### 4.2 根据ID查询单个Emoji

**GET** `/api/database/emoji/get/:id`

#### 4.3 插入Emoji

**POST** `/api/database/emoji/insert`

**请求体:**
```json
{
  "full_path": "/path/to/emoji1.png",
  "format": "png",
  "emoji_hash": "hash1",
  "description": "Happy emoji",
  "emotion": "happy",
  "query_count": 0,
  "is_registered": 0,
  "is_banned": 0,
  "usage_count": 0
}
```

#### 4.4 更新Emoji

**POST** `/api/database/emoji/update`

**请求体:**
```json
{
  "id": 123,
  "full_path": "/path/to/updated_emoji.png",
  "description": "Updated emoji description",
  "is_registered": 1
}
```

#### 4.5 删除Emoji

**DELETE** `/api/database/emoji/delete`

**请求体:**
```json
{
  "id": 123
}
```

#### 4.6 获取单个Emoji图片

**GET** `/api/database/emoji/getSingleEmojiImage`

根据emoji ID获取对应的图片文件，返回Base64编码的图片数据。

**查询参数:**
- `id`: emoji的ID (必需，大于0的整数)

**请求示例:**
```
GET /api/database/emoji/getSingleEmojiImage?id=1
```

**响应示例:**
```json
{
  "status": 200,
  "message": "查询成功",
  "data": {
    "imageb64": "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABGklEQhY2P8f+fPn4T8//8/AyUYTFh4Tf38"
  },
  "time": 1692000000000
}
```

**功能说明:**
1. 根据传入的ID查询emoji表获取full_path字段
2. full_path字段存储相对于麦麦根目录的文件路径
3. 自动拼接完整文件路径：`麦麦根目录 + full_path`
4. 读取文件内容并转换为Base64编码字符串
5. 支持常见图片格式：jpg, png, gif, webp等

**错误处理:**
- `400`: ID参数无效或缺失
- `404`: emoji记录不存在或文件不存在
- `500`: 文件读取失败或其他服务器错误

**使用示例:**
```bash
# 获取ID为1的emoji图片
curl "http://localhost:7999/api/database/emoji/getSingleEmojiImage?id=1"

# JavaScript使用示例
const response = await fetch('/api/database/emoji/getSingleEmojiImage?id=1');
const result = await response.json();
if (result.status === 200) {
  const base64Image = result.data.imageb64;
  // 可以直接用于img标签: data:image/png;base64,${base64Image}
}
```

---

### 5. Expression表操作 API

Expression表用于存储和管理表达方式数据，包括情境描述、对应的表达风格、使用统计等。

#### 5.1 分页查询Expression

**GET** `/api/database/expression/get`

**查询参数:**
- `page`: 页码 (默认1)
- `pageSize`: 每页记录数 (默认10, 最大100)
- `orderBy`: 排序字段 (默认id)
- `orderDir`: 排序方向 (ASC/DESC, 默认ASC)
- `situation`: 按情境描述过滤
- `style`: 按表达风格过滤
- `chat_id`: 按聊天ID过滤
- `type`: 按类型过滤
- `minCount`: 最小统计次数
- `maxCount`: 最大统计次数
- `startDate`: 开始创建时间
- `endDate`: 结束创建时间

**响应示例:**
```json
{
  "status": 200,
  "message": "查询成功",
  "data": {
    "items": [
      {
        "id": 1,
        "situation": "确认对方是否接收到图片信息",
        "style": "你现在能看得见这张图吗",
        "count": 5,
        "last_active_time": 1703123200.0,
        "chat_id": "chat_001",
        "type": "style",
        "create_date": 1703123200.0
      }
    ],
    "totalPages": 100,
    "currentPage": 1,
    "pageSize": 10
  },
  "time": 1703209600000
}
```

#### 5.2 根据ID查询单个Expression

**GET** `/api/database/expression/get/:id`

#### 5.3 插入Expression

**POST** `/api/database/expression/insert`

**请求体:**
```json
{
  "situation": "确认对方是否接收到图片信息",
  "style": "你现在能看得见这张图吗",
  "count": 5,
  "last_active_time": 1703123200.0,
  "chat_id": "chat_001",
  "type": "style",
  "create_date": 1703123200.0
}
```

#### 5.4 更新Expression

**POST** `/api/database/expression/update`

#### 5.5 删除Expression

**DELETE** `/api/database/expression/delete`

#### 5.6 根据聊天ID查询Expression

**GET** `/api/database/expression/chat/:chatId`

**查询参数:**
- `limit`: 返回数量限制 (默认10, 最大100)

#### 5.7 根据类型查询Expression

**GET** `/api/database/expression/type/:type`

#### 5.8 获取Expression统计信息

**GET** `/api/database/expression/stats`

#### 5.9 增加Expression统计次数

**POST** `/api/database/expression/increment/:id`

#### 5.10 搜索Expression

**GET** `/api/database/expression/search`

**查询参数:**
- `keyword`: 搜索关键字 (必需)
- `limit`: 返回数量限制 (默认20, 最大100)

---

### 6. PersonInfo表操作 API

PersonInfo表用于存储人物信息，包括人物的基本信息、印象、认知记录等，支持多平台、多用户的人物信息管理。

#### 6.1 分页查询PersonInfo

**GET** `/api/database/person-info/get`

**查询参数:**
- `page`: 页码 (默认1)
- `pageSize`: 每页记录数 (默认20, 最大100)
- `orderBy`: 排序字段 (默认id)
- `orderDir`: 排序方向 (ASC/DESC, 默认ASC)
- `person_id`: 过滤人物ID
- `person_name`: 过滤人物名称 (模糊匹配)
- `platform`: 过滤平台
- `user_id`: 过滤用户ID
- `nickname`: 过滤昵称 (模糊匹配)
- `impression`: 过滤印象 (模糊匹配)
- `minKnowTimes`: 最小认知次数
- `maxKnowTimes`: 最大认知次数
- `minAttitude`: 最小态度值
- `maxAttitude`: 最大态度值
- `knowSinceStart`: 认识起始时间戳
- `knowSinceEnd`: 认识结束时间戳
- `lastKnowStart`: 最后认知起始时间戳
- `lastKnowEnd`: 最后认知结束时间戳

**响应示例:**
```json
{
  "status": 200,
  "message": "查询PersonInfo成功",
  "data": {
    "items": [
      {
        "id": 1,
        "person_id": "person_001",
        "person_name": "张三",
        "platform": "qq",
        "user_id": "123456",
        "nickname": "小张",
        "name_reason": "名字简单好记",
        "impression": "活泼开朗的人",
        "short_impression": "开朗",
        "points": "[]",
        "forgotten_points": "[]",
        "info_list": "[]",
        "know_times": 5,
        "know_since": 1703123200,
        "last_know": 1703209600,
        "attitude": 75
      }
    ],
    "total": 100,
    "totalPages": 5,
    "currentPage": 1,
    "pageSize": 20,
    "hasNext": true,
    "hasPrev": false
  },
  "time": 1703209600000
}
```

#### 6.2 根据ID查询单个PersonInfo

**GET** `/api/database/person-info/get/:id`

#### 6.3 新增PersonInfo

**POST** `/api/database/person-info/insert`

**请求体:**
```json
{
  "person_id": "person_002",
  "person_name": "李四",
  "platform": "wechat",
  "user_id": "user789",
  "nickname": "小李",
  "name_reason": "同事推荐的名字",
  "impression": "认真负责的工作伙伴",
  "short_impression": "负责",
  "points": "[\"工作认真\", \"乐于助人\"]",
  "forgotten_points": "[]",
  "info_list": "[{\"type\": \"工作\", \"content\": \"软件开发工程师\"}]",
  "attitude": 80
}
```

**字段说明:**
- `person_id` (必需): 人物ID，字符串，最大100字符
- `person_name` (必需): 人物名称，字符串，最大200字符
- `platform` (必需): 平台，字符串，最大50字符
- `user_id` (必需): 用户ID，字符串，最大100字符
- `nickname` (可选): 昵称，字符串，最大200字符
- `name_reason` (可选): 取名原因，字符串，最大500字符
- `impression` (可选): 印象，字符串，最大2000字符
- `short_impression` (可选): 简短印象，字符串，最大100字符
- `points` (可选): 要点，JSON字符串，最大5000字符
- `forgotten_points` (可选): 遗忘要点，JSON字符串，最大5000字符，默认"[]"
- `info_list` (可选): 信息列表，JSON字符串，最大10000字符，默认"[]"
- `know_times` (可选): 认知次数，数字，默认0
- `know_since` (可选): 认识时间，Unix时间戳，默认当前时间
- `last_know` (可选): 最后认知时间，Unix时间戳，默认当前时间
- `attitude` (可选): 态度值，数字0-100，默认50

#### 6.4 更新PersonInfo

**PUT** `/api/database/person-info/update/:id`

**请求体:**
```json
{
  "nickname": "更新后的昵称",
  "impression": "更新后的印象",
  "attitude": 85
}
```

#### 6.5 删除PersonInfo

**DELETE** `/api/database/person-info/delete/:id`

#### 6.6 根据person_id查询PersonInfo

**GET** `/api/database/person-info/by-person/:personId`

#### 6.7 根据平台和用户ID查询PersonInfo

**GET** `/api/database/person-info/by-platform/:platform/user/:userId`

#### 6.8 获取PersonInfo统计信息

**GET** `/api/database/person-info/stats`

**响应示例:**
```json
{
  "status": 200,
  "message": "获取PersonInfo统计信息成功",
  "data": {
    "total": 150,
    "byPlatform": {
      "qq": 80,
      "wechat": 45,
      "telegram": 25
    },
    "byAttitudeRange": {
      "very_negative": 5,
      "negative": 15,
      "neutral": 50,
      "positive": 60,
      "very_positive": 20
    },
    "avgKnowTimes": 12.5,
    "avgAttitude": 62.3,
    "totalKnowTimes": 1875,
    "recentActive": 35,
    "topPersons": [
      {
        "id": 10,
        "person_name": "王五",
        "know_times": 50
      }
    ]
  },
  "time": 1703209600000
}
```

#### 6.9 搜索PersonInfo

**GET** `/api/database/person-info/search`

**查询参数:**
- `keyword`: 搜索关键字 (必需)
- `limit`: 限制数量 (默认20, 最大100)

#### 6.10 获取可用平台列表

**GET** `/api/database/person-info/platforms`

**响应示例:**
```json
{
  "status": 200,
  "message": "获取平台列表成功",
  "data": [
    "qq",
    "wechat",
    "telegram",
    "discord",
    "line",
    "other"
  ],
  "time": 1703209600000
}
```

---

### 7. PTY虚拟终端服务 API

PTY服务提供基于WebSocket和HTTP的分布式PTY虚拟终端实现，支持多会话管理和实时通信。

#### 7.1 环境检查

**GET** `/api/pty/environment`

检查PTY环境是否就绪。

#### 7.2 创建会话

**POST** `/api/pty/sessions`

**请求体:**
```json
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

#### 7.3 启动会话

**POST** `/api/pty/sessions/:sessionId/start`

#### 7.4 发送输入

**POST** `/api/pty/sessions/:sessionId/input`

**请求体:**
```json
{
  "input": "ls -la\n"
}
```

#### 7.5 调整终端大小

**POST** `/api/pty/sessions/:sessionId/resize`

**请求体:**
```json
{
  "width": 120,
  "height": 30
}
```

#### 7.6 获取会话信息

**GET** `/api/pty/sessions/:sessionId`

#### 7.7 停止会话

**POST** `/api/pty/sessions/:sessionId/stop`

**请求体:**
```json
{
  "force": false
}
```

#### 7.8 销毁会话

**DELETE** `/api/pty/sessions/:sessionId`

#### 7.9 WebSocket连接

连接地址: `ws://localhost:7999`

**WebSocket事件:**

**客户端发送:**
- `pty:create-session` - 创建会话
- `pty:start-session` - 启动会话
- `pty:join-session` - 加入会话观察
- `pty:input` - 发送输入
- `pty:resize` - 调整终端大小
- `pty:leave-session` - 离开会话
- `pty:stop-session` - 停止会话

**服务器发送:**
- `pty:output` - 终端输出
- `pty:status-change` - 状态变更
- `pty:error` - 错误信息
- `pty:session-stopped` - 会话停止
- `pty:session-destroyed` - 会话销毁

---

## 📊 数据库表结构

### Emoji表结构

| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | INTEGER | 唯一标识符（主键，自增） |
| full_path | TEXT | emoji文件的完整路径 |
| format | TEXT | emoji格式（如：png, gif, jpg等） |
| emoji_hash | TEXT | emoji的哈希值（用于去重和快速查找） |
| description | TEXT | emoji的描述信息 |
| query_count | INTEGER | 查询次数统计 |
| is_registered | INTEGER | 是否已注册（0：未注册，1：已注册） |
| is_banned | INTEGER | 是否被禁止（0：未禁止，1：已禁止） |
| emotion | TEXT | 情感分类（如：happy, sad, angry等） |
| record_time | REAL | 记录创建时间（Unix时间戳） |
| register_time | REAL | 注册时间（Unix时间戳） |
| usage_count | INTEGER | 使用次数统计 |
| last_used_time | REAL | 最后使用时间（Unix时间戳） |

### Expression表结构

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 唯一标识符（主键，自增） |
| situation | TEXT | 情境描述 |
| style | TEXT | 对应的表达风格 |
| count | REAL | 统计次数 |
| last_active_time | REAL | 最后使用此表达方式的时间 |
| chat_id | TEXT | 聊天ID |
| type | TEXT | 类型（style/grammar） |
| create_date | FLOAT | 创建时间 |

### PersonInfo表结构

| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | INTEGER | 唯一标识符（主键，自增） |
| person_id | TEXT | 人物ID（唯一标识符） |
| person_name | TEXT | 人物名称 |
| platform | TEXT | 平台（qq/wechat/telegram等） |
| user_id | TEXT | 用户ID |
| nickname | TEXT | 昵称 |
| name_reason | TEXT | 取名原因 |
| impression | TEXT | 印象 |
| short_impression | TEXT | 简短印象 |
| points | TEXT | 要点（JSON格式） |
| forgotten_points | TEXT | 遗忘要点（JSON格式） |
| info_list | TEXT | 信息列表（JSON格式） |
| know_times | INTEGER | 认知次数 |
| know_since | INTEGER | 认识时间（时间戳） |
| last_know | INTEGER | 最后认知时间（时间戳） |
| attitude | INTEGER | 态度值（0-100） |

**唯一约束**: (person_id, platform, user_id)

---

## ❌ 错误处理

所有API都遵循统一的错误响应格式：

```json
{
  "status": 400,
  "message": "具体错误信息",
  "code": "ERROR_CODE",
  "time": 1703209600000
}
```

### 常见错误代码

| 状态码 | 说明 | 示例场景 |
|--------|------|----------|
| 200 | 成功 | 正常操作完成 |
| 400 | 请求参数错误 | 参数验证失败、格式错误 |
| 401 | 认证失败 | 缺少或无效的认证信息 |
| 403 | 权限不足 | 没有操作权限 |
| 404 | 资源不存在 | 记录不存在、路径不存在 |
| 409 | 资源冲突 | 唯一约束违反、资源已存在 |
| 429 | 请求过于频繁 | 超出请求限制 |
| 500 | 服务器内部错误 | 数据库错误、系统异常 |
| 503 | 服务不可用 | 数据库连接失败、外部服务异常 |

### 错误代码列表

- `VALIDATION_ERROR`: 参数验证失败
- `NOT_FOUND_ERROR`: 记录不存在
- `CONFLICT_ERROR`: 数据冲突
- `AUTHENTICATION_ERROR`: 认证失败
- `AUTHORIZATION_ERROR`: 权限不足
- `TOO_MANY_REQUESTS_ERROR`: 请求过于频繁
- `INTERNAL_SERVER_ERROR`: 内部服务器错误
- `SERVICE_UNAVAILABLE_ERROR`: 服务不可用

---

## 💡 使用示例

### JavaScript/Node.js 示例

```javascript
// 基础请求函数
async function apiRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`http://localhost:7999/api${endpoint}`, options);
  return await response.json();
}

// 查询PersonInfo
const personInfos = await apiRequest('/database/person-info/get?page=1&pageSize=20');
console.log(personInfos.data);

// 新增PersonInfo
const newPerson = {
  person_id: 'person_123',
  person_name: '测试用户',
  platform: 'qq',
  user_id: '123456789'
};
const result = await apiRequest('/database/person-info/insert', 'POST', newPerson);
console.log('新增成功，ID:', result.data.id);

// 设置路径缓存
const pathResult = await apiRequest('/pathCache/setRootPath', 'POST', {
  mainRoot: 'C:\\Games\\Maimai\\Main'
});
```

### Python 示例

```python
import requests

BASE_URL = 'http://localhost:7999/api'

def api_request(endpoint, method='GET', data=None):
    url = f"{BASE_URL}{endpoint}"
    if method == 'GET':
        response = requests.get(url, params=data)
    else:
        response = requests.request(method, url, json=data)
    return response.json()

# 查询PersonInfo
person_infos = api_request('/database/person-info/get', params={
    'page': 1,
    'pageSize': 20,
    'platform': 'qq'
})
print(person_infos['data'])

# 新增PersonInfo
new_person = {
    'person_id': 'person_123',
    'person_name': '测试用户',
    'platform': 'qq',
    'user_id': '123456789'
}
result = api_request('/database/person-info/insert', 'POST', new_person)
print(f"新增成功，ID: {result['data']['id']}")
```

### WebSocket 示例

```javascript
// 连接WebSocket
const socket = io('ws://localhost:7999');

// 创建PTY会话
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
    console.log('会话创建成功:', sessionId);
    
    // 启动会话
    socket.emit('pty:start-session', { sessionId });
  }
});

// 监听终端输出
socket.on('pty:output', (data) => {
  console.log('终端输出:', data.data);
});

// 发送命令
setTimeout(() => {
  socket.emit('pty:input', {
    sessionId: 'your-session-id',
    input: 'ls -la\n'
  });
}, 2000);
```

---

## 🚀 最佳实践

### 1. 分页查询

- 使用合适的页大小（建议10-50条记录）
- 合理使用过滤条件减少数据量
- 考虑使用缓存提高性能

### 2. 错误处理

```javascript
try {
  const response = await apiRequest('/database/person-info/get');
  if (response.status === 200) {
    // 处理成功响应
    console.log(response.data);
  }
} catch (error) {
  // 处理网络错误
  console.error('API请求失败:', error);
}
```

### 3. 数据验证

```javascript
// 客户端验证示例
function validatePersonInfo(data) {
  const errors = [];
  
  if (!data.person_id || data.person_id.length > 100) {
    errors.push('person_id必须是1-100字符');
  }
  
  if (!data.person_name || data.person_name.length > 200) {
    errors.push('person_name必须是1-200字符');
  }
  
  if (data.attitude !== undefined && (data.attitude < 0 || data.attitude > 100)) {
    errors.push('attitude必须在0-100之间');
  }
  
  return errors;
}
```

### 4. 性能优化

- 使用合适的查询条件
- 避免频繁的全量查询
- 合理使用缓存机制
- 考虑使用连接池

---

## 📝 更新日志

### v1.3.0 (2025-08-11)
- ✅ 新增PersonInfo表完整API
- ✅ 优化错误处理机制
- ✅ 完善文档和示例

### v1.2.0
- ✅ 新增Expression表API
- ✅ 优化数据库连接管理

### v1.1.0
- ✅ 新增Emoji表API
- ✅ 新增PTY虚拟终端服务
- ✅ 完善版本管理系统

### v1.0.0
- ✅ 初始版本
- ✅ 基础系统框架
- ✅ 路径缓存功能

---

## 📞 技术支持

如有问题或建议，请通过以下方式联系：

- 项目文档：查看 `docs/` 目录下的详细文档
- 示例代码：参考 `src/examples/` 目录下的示例
- 错误日志：查看 `logs/` 目录下的日志文件

---

**HMML API 文档 v1.3.0**  
*最后更新时间: 2025-08-11*
