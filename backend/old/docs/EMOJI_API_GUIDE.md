# Emoji表操作API使用指南

## 概述

本文档介绍如何使用HMML后端服务的emoji表操作API。该API提供了emoji表的完整CRUD（创建、读取、更新、删除）操作功能。

## 数据库路径配置

emoji表位于麦麦主程序数据库中：
- **数据库路径**: `{麦麦根目录}/data/MaiBot.db`  
- **根目录获取**: 通过路径缓存功能获取麦麦根目录

在使用emoji API前，请确保已正确设置麦麦主程序根目录缓存。

## Emoji表结构

| 字段名称 | 类型 | 描述 |
|---------|------|------|
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

## API接口

### 1. 查询emoji（分页）

**请求方式**: `GET`  
**请求路径**: `/api/database/emoji/get`

**查询参数**:
- `page`: 页码，从1开始（默认：1）
- `pageSize`: 每页大小（默认：10，最大：1000）
- `orderBy`: 排序字段，可选值：`id`, `query_count`, `usage_count`, `last_used_time`, `record_time`
- `orderDir`: 排序方向，可选值：`ASC`, `DESC`（默认：ASC）
- `format`: 按格式过滤
- `emotion`: 按情感过滤
- `is_registered`: 按注册状态过滤（0或1）
- `is_banned`: 按禁止状态过滤（0或1）
- `description`: 按描述模糊搜索
- `emoji_hash`: 按哈希值精确查找

**示例请求**:
```http
GET /api/database/emoji/get?page=1&pageSize=10&orderBy=usage_count&orderDir=DESC&emotion=happy
```

**响应格式**:
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
        "record_time": 1692000000.0,
        "register_time": 1692000000.0,
        "usage_count": 5,
        "last_used_time": 1692000000.0
      }
    ],
    "totalPages": 100,
    "currentPage": 1,
    "pageSize": 10,
    "total": 1000,
    "hasNext": true,
    "hasPrev": false
  },
  "time": 1692000000000
}
```

### 2. 根据ID查询单个emoji

**请求方式**: `GET`  
**请求路径**: `/api/database/emoji/get/:id`

**路径参数**:
- `id`: emoji的ID

**示例请求**:
```http
GET /api/database/emoji/get/123
```

**响应格式**:
```json
{
  "status": 200,
  "message": "查询成功",
  "data": {
    "id": 123,
    "full_path": "/path/to/emoji.png",
    "format": "png",
    // ... 其他字段
  },
  "time": 1692000000000
}
```

### 3. 插入emoji

**请求方式**: `POST`  
**请求路径**: `/api/database/emoji/insert`

**请求体**:
```json
{
  "full_path": "/path/to/emoji1.png",
  "format": "png",
  "emoji_hash": "hash1",
  "description": "Happy emoji",
  "emotion": "happy"
}
```

**可选字段**（会自动设置默认值）:
```json
{
  "query_count": 0,
  "is_registered": 0,
  "is_banned": 0,
  "record_time": 1692000000.0,
  "register_time": 1692000000.0,
  "usage_count": 0,
  "last_used_time": 1692000000.0
}
```

**响应格式**:
```json
{
  "status": 200,
  "message": "插入成功",
  "data": {
    "id": 124
  },
  "time": 1692000000000
}
```

### 4. 更新emoji

**请求方式**: `POST`  
**请求路径**: `/api/database/emoji/update`

**请求体**:
```json
{
  "id": 123,
  "full_path": "/path/to/updated_emoji.png",
  "format": "png",
  "emoji_hash": "updated_hash",
  "description": "Updated emoji description",
  "query_count": 20,
  "is_registered": 1,
  "is_banned": 0,
  "emotion": "happy",
  "record_time": 1692000000.0,
  "register_time": 1692000000.0,
  "usage_count": 10,
  "last_used_time": 1692000000.0
}
```

**响应格式**:
```json
{
  "status": 200,
  "message": "更新成功",
  "time": 1692000000000
}
```

### 5. 删除emoji

**请求方式**: `DELETE`  
**请求路径**: `/api/database/emoji/delete/{id}`

**路径参数**:
- `id`: emoji的唯一标识符（必需）

**请求示例**:
```http
DELETE /api/database/emoji/delete/123
```

**响应格式**:
```json
{
  "status": 200,
  "message": "删除成功",
  "time": 1692000000000
}
```

**兼容性说明**: 为了向后兼容，仍然支持通过请求体传递ID的方式：

**备用请求方式**: `DELETE`  
**备用请求路径**: `/api/database/emoji/delete`

**备用请求体**:
```json
{
  "id": 123
}
```

## 扩展API

### 1. 根据哈希值查询emoji

**请求方式**: `GET`  
**请求路径**: `/api/database/emoji/hash/:hash`

### 2. 获取emoji统计信息

**请求方式**: `GET`  
**请求路径**: `/api/database/emoji/stats`

## 数据库管理API

### 1. 获取数据库状态

**请求方式**: `GET`  
**请求路径**: `/api/database/status`

### 2. 测试数据库连接

**请求方式**: `GET`  
**请求路径**: `/api/database/test`

### 3. 获取数据库统计信息

**请求方式**: `GET`  
**请求路径**: `/api/database/stats`

### 4. 获取表列表

**请求方式**: `GET`  
**请求路径**: `/api/database/tables`

### 5. 获取表结构

**请求方式**: `GET`  
**请求路径**: `/api/database/table/:tableName`

## 错误处理

所有API都遵循统一的错误响应格式：

```json
{
  "status": 400,
  "message": "具体的错误描述",
  "time": 1692000000000
}
```

常见错误状态码：
- `400`: 请求参数错误
- `404`: 资源未找到
- `500`: 服务器内部错误

## 使用注意事项

1. **数据验证**: 插入和更新操作会进行数据验证，确保必填字段不为空
2. **自动时间戳**: 时间相关字段支持自动设置当前时间戳
3. **查询统计**: 查询单个emoji时会自动增加查询次数
4. **连接管理**: 数据库连接由框架自动管理，无需手动处理
5. **事务支持**: 批量操作使用事务确保数据一致性

## 性能优化建议

1. 使用分页查询避免一次性获取大量数据
2. 合理使用过滤条件减少不必要的数据传输
3. 定期清理不再使用的emoji记录
4. 考虑为经常查询的字段添加索引

## 开发示例

### JavaScript/Node.js 示例

```javascript
// 查询emoji
const response = await fetch('/api/database/emoji/get?page=1&pageSize=20&emotion=happy');
const data = await response.json();

// 插入emoji
const newEmoji = {
  full_path: '/path/to/new_emoji.png',
  format: 'png',
  emoji_hash: 'abc123',
  description: 'A new happy emoji',
  emotion: 'happy'
};

const insertResponse = await fetch('/api/database/emoji/insert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newEmoji)
});

const insertResult = await insertResponse.json();
console.log('插入的emoji ID:', insertResult.data.id);
```

### Python 示例

```python
import requests

# 查询emoji
response = requests.get('/api/database/emoji/get', params={
    'page': 1,
    'pageSize': 20,
    'emotion': 'happy'
})
data = response.json()

# 插入emoji
new_emoji = {
    'full_path': '/path/to/new_emoji.png',
    'format': 'png',
    'emoji_hash': 'abc123',
    'description': 'A new happy emoji',
    'emotion': 'happy'
}

response = requests.post('/api/database/emoji/insert', json=new_emoji)
result = response.json()
print(f"插入的emoji ID: {result['data']['id']}")
```
