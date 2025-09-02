# ChatStream表操作API使用指南

## 概述

ChatStream表操作API提供了对`chat_streams`表的完整CRUD操作，包括分页查询、条件过滤、统计信息等功能。

## 表结构

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 唯一标识符 |
| stream_id | TEXT | 聊天流id |
| create_time | REAL | 创建时间 |
| group_platform | TEXT | 群组平台 |
| group_id | TEXT | 群组id |
| group_name | TEXT | 群组名称 |
| last_active_time | REAL | 最后活跃时间 |
| platform | TEXT | 平台 |
| user_platform | TEXT | 用户平台 |
| user_id | TEXT | 用户id |
| user_nickname | TEXT | 用户昵称 |
| user_cardname | TEXT | 用户群昵称 |

## API 接口

### 1. 分页查询聊天流

**请求方式**: `GET`  
**请求路径**: `/api/database/chatStreams/get`

**查询参数**:
- `page`: 页码，从1开始（默认：1）
- `pageSize`: 每页数量，最大1000（默认：10）
- `orderBy`: 排序字段，可选值：`id`、`create_time`、`last_active_time`
- `orderDir`: 排序方向，可选值：`ASC`、`DESC`（默认：ASC）

**过滤参数**:
- `stream_id`: 按聊天流id过滤
- `group_platform`: 按群组平台过滤
- `group_id`: 按群组id过滤
- `group_name`: 按群组名称模糊搜索
- `platform`: 按平台过滤
- `user_platform`: 按用户平台过滤
- `user_id`: 按用户id过滤
- `user_nickname`: 按用户昵称模糊搜索
- `user_cardname`: 按用户群昵称模糊搜索

**请求示例**:
```
GET /api/database/chatStreams/get?page=1&pageSize=10&platform=qq&orderBy=create_time&orderDir=DESC
```

**响应示例**:
```json
{
  "status": 200,
  "message": "查询成功",
  "data": {
    "items": [
      {
        "id": 1,
        "stream_id": "3dae6257e1d175a1829e4ff3033f550a",
        "create_time": 1692000000000,
        "group_platform": "qq",
        "group_id": "1787882683",
        "group_name": "测试群",
        "last_active_time": 1692000000000,
        "platform": "qq",
        "user_platform": "qq",
        "user_id": "1787882683",
        "user_nickname": "墨梓柒(IceSakurary)",
        "user_cardname": "墨梓柒(IceSakurary)"
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

### 2. 根据ID查询单个聊天流

**请求方式**: `GET`  
**请求路径**: `/api/database/chatStreams/getById/:id`

**路径参数**:
- `id`: 聊天流ID

**请求示例**:
```
GET /api/database/chatStreams/getById/1
```

**响应示例**:
```json
{
  "status": 200,
  "message": "查询成功",
  "data": {
    "id": 1,
    "stream_id": "3dae6257e1d175a1829e4ff3033f550a",
    "create_time": 1692000000000,
    "group_platform": "qq",
    "group_id": "1787882683",
    "group_name": "测试群",
    "last_active_time": 1692000000000,
    "platform": "qq",
    "user_platform": "qq",
    "user_id": "1787882683",
    "user_nickname": "墨梓柒(IceSakurary)",
    "user_cardname": "墨梓柒(IceSakurary)"
  },
  "time": 1692000000000
}
```

### 3. 根据stream_id查询聊天流

**请求方式**: `GET`  
**请求路径**: `/api/database/chatStreams/getByStreamId/:streamId`

**路径参数**:
- `streamId`: 聊天流stream_id

**请求示例**:
```
GET /api/database/chatStreams/getByStreamId/3dae6257e1d175a1829e4ff3033f550a
```

**响应格式**: 同上

### 4. 插入新的聊天流

**请求方式**: `POST`  
**请求路径**: `/api/database/chatStreams/insert`

**请求体**:
```json
{
  "stream_id": "3dae6257e1d175a1829e4ff3033f550a",
  "create_time": 1692000000000,
  "group_platform": "qq",
  "group_id": "1787882683",
  "group_name": "测试群",
  "last_active_time": 1692000000000,
  "platform": "qq",
  "user_platform": "qq",
  "user_id": "1787882683",
  "user_nickname": "墨梓柒(IceSakurary)",
  "user_cardname": "墨梓柒(IceSakurary)"
}
```

**响应示例**:
```json
{
  "status": 200,
  "message": "插入成功",
  "data": {
    "id": 1
  },
  "time": 1692000000000
}
```

### 5. 更新聊天流

**请求方式**: `POST`  
**请求路径**: `/api/database/chatStreams/update`

**请求体**:
```json
{
  "id": 1,
  "stream_id": "3dae6257e1d175a1829e4ff3033f550a",
  "create_time": 1692000000000,
  "group_platform": "qq",
  "group_id": "1787882683",
  "group_name": "测试群",
  "last_active_time": 1692000000000,
  "platform": "qq",
  "user_platform": "qq",
  "user_id": "1787882683",
  "user_nickname": "墨梓柒(IceSakurary)",
  "user_cardname": "墨梓柒(IceSakurary)"
}
```

**响应示例**:
```json
{
  "status": 200,
  "message": "更新成功",
  "time": 1692000000000
}
```

### 6. 删除聊天流

**请求方式**: `DELETE`  
**请求路径**: `/api/database/chatStreams/delete`

**请求体**:
```json
{
  "id": 1
}
```

**响应示例**:
```json
{
  "status": 200,
  "message": "删除成功",
  "time": 1692000000000
}
```

### 7. 获取聊天流统计信息

**请求方式**: `GET`  
**请求路径**: `/api/database/chatStreams/stats`

**响应示例**:
```json
{
  "status": 200,
  "message": "获取统计信息成功",
  "data": {
    "totalCount": 1000,
    "recentActiveCount": 150,
    "platformStats": [
      { "platform": "qq", "count": 800 },
      { "platform": "wechat", "count": 200 }
    ],
    "groupPlatformStats": [
      { "group_platform": "qq", "count": 800 },
      { "group_platform": "wechat", "count": 200 }
    ]
  },
  "time": 1692000000000
}
```

## 错误处理

所有API都使用统一的错误响应格式：

```json
{
  "status": 400,
  "message": "错误信息",
  "time": 1692000000000
}
```

**常见错误码**:
- `400`: 请求参数错误
- `404`: 记录不存在
- `500`: 服务器内部错误

## 使用示例

### JavaScript/TypeScript客户端

```typescript
// 查询聊天流
async function getChatStreams(page: number = 1, pageSize: number = 10) {
  const response = await fetch(`/api/database/chatStreams/get?page=${page}&pageSize=${pageSize}`);
  return response.json();
}

// 插入聊天流
async function insertChatStream(data: any) {
  const response = await fetch('/api/database/chatStreams/insert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
}

// 更新聊天流
async function updateChatStream(data: any) {
  const response = await fetch('/api/database/chatStreams/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
}

// 删除聊天流
async function deleteChatStream(id: number) {
  const response = await fetch('/api/database/chatStreams/delete', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id })
  });
  return response.json();
}
```

### curl命令行

```bash
# 查询聊天流
curl "http://localhost:7999/api/database/chatStreams/get?page=1&pageSize=10"

# 插入聊天流
curl -X POST "http://localhost:7999/api/database/chatStreams/insert" \
  -H "Content-Type: application/json" \
  -d '{
    "stream_id": "test_stream",
    "create_time": 1692000000000,
    "group_platform": "qq",
    "group_id": "123456",
    "group_name": "测试群",
    "last_active_time": 1692000000000,
    "platform": "qq",
    "user_platform": "qq",
    "user_id": "789012",
    "user_nickname": "测试用户",
    "user_cardname": "测试昵称"
  }'

# 更新聊天流
curl -X POST "http://localhost:7999/api/database/chatStreams/update" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "group_name": "更新后的群名"
  }'

# 删除聊天流
curl -X DELETE "http://localhost:7999/api/database/chatStreams/delete" \
  -H "Content-Type: application/json" \
  -d '{"id": 1}'
```

## 注意事项

1. **数据验证**: 所有必填字段都必须提供，时间字段必须是有效的时间戳
2. **分页限制**: 每页最大数量为1000条记录
3. **模糊搜索**: `group_name`、`user_nickname`、`user_cardname`字段支持模糊搜索
4. **排序**: 支持按ID、创建时间、最后活跃时间排序
5. **统计信息**: 包含总数、平台分布、最近活跃数等统计数据

## 扩展功能

API设计遵循RESTful规范，易于扩展。未来可以添加：
- 批量操作
- 更复杂的查询条件
- 数据导入导出
- 实时统计更新
