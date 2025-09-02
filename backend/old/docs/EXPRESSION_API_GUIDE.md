# Expression表API操作指南

## 概述

Expression表用于存储和管理表达方式数据，包括情境描述、对应的表达风格、使用统计等信息。本文档提供了完整的Expression表API操作指南。

## 表结构

Expression表包含以下字段：

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

## API接口

### 基础CRUD操作

#### 1. 查询expression列表（分页）

**请求方式**: `GET`  
**请求路径**: `/api/database/expression/get`

**查询参数**:
- `page`: 页码（默认：1）
- `pageSize`: 每页记录数（默认：10，最大：100）
- `orderBy`: 排序字段（默认：id）
- `orderDir`: 排序方向（ASC/DESC，默认：ASC）
- `situation`: 按情境描述过滤
- `style`: 按表达风格过滤
- `chat_id`: 按聊天ID过滤
- `type`: 按类型过滤
- `minCount`: 最小统计次数
- `maxCount`: 最大统计次数
- `startDate`: 开始创建时间
- `endDate`: 结束创建时间

**响应示例**:
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
        "last_active_time": 1692000000.0,
        "chat_id": "chat_001",
        "type": "style",
        "create_date": 1692000000.0
      }
    ],
    "totalPages": 100,
    "currentPage": 1,
    "pageSize": 10
  },
  "time": 1692000000000
}
```

#### 2. 根据ID查询单个expression

**请求方式**: `GET`  
**请求路径**: `/api/database/expression/get/:id`

**响应示例**:
```json
{
  "status": 200,
  "message": "查询成功",
  "data": {
    "id": 1,
    "situation": "确认对方是否接收到图片信息",
    "style": "你现在能看得见这张图吗",
    "count": 5,
    "last_active_time": 1692000000.0,
    "chat_id": "chat_001",
    "type": "style",
    "create_date": 1692000000.0
  },
  "time": 1692000000000
}
```

#### 3. 插入expression

**请求方式**: `POST`  
**请求路径**: `/api/database/expression/insert`

**请求体**:
```json
{
  "situation": "确认对方是否接收到图片信息",
  "style": "你现在能看得见这张图吗",
  "count": 5,
  "last_active_time": 1692000000.0,
  "chat_id": "chat_001",
  "type": "style",
  "create_date": 1692000000.0
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

#### 4. 更新expression

**请求方式**: `POST`  
**请求路径**: `/api/database/expression/update`

**请求体**:
```json
{
  "id": 1,
  "situation": "确认对方是否接收到图片信息",
  "style": "你现在能看得见这张图吗",
  "count": 10,
  "last_active_time": 1692000000.0,
  "chat_id": "chat_001",
  "type": "style",
  "create_date": 1692000000.0
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

#### 5. 删除expression

**请求方式**: `DELETE`  
**请求路径**: `/api/database/expression/delete`

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

### 扩展功能API

#### 1. 根据聊天ID查询expression

**请求方式**: `GET`  
**请求路径**: `/api/database/expression/chat/:chatId`

**查询参数**:
- `limit`: 返回数量限制（默认：10，最大：100）

#### 2. 根据类型查询expression

**请求方式**: `GET`  
**请求路径**: `/api/database/expression/type/:type`

**查询参数**:
- `limit`: 返回数量限制（默认：10，最大：100）

#### 3. 获取expression统计信息

**请求方式**: `GET`  
**请求路径**: `/api/database/expression/stats`

#### 4. 增加expression统计次数

**请求方式**: `POST`  
**请求路径**: `/api/database/expression/increment/:id`

#### 5. 搜索expression

**请求方式**: `GET`  
**请求路径**: `/api/database/expression/search`

**查询参数**:
- `keyword`: 搜索关键字（必需）
- `limit`: 返回数量限制（默认：20，最大：100）

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
  "message": "具体的错误信息",
  "time": 1692000000000
}
```

常见错误码：
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

## 使用示例

### JavaScript/Node.js 示例

```javascript
// 查询expression
const response = await fetch('/api/database/expression/get?page=1&pageSize=20&type=style');
const data = await response.json();

// 插入expression
const newExpression = {
  situation: '询问对方近况',
  style: '最近怎么样啊',
  count: 0,
  chat_id: 'chat_001',
  type: 'style'
};

const insertResponse = await fetch('/api/database/expression/insert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newExpression)
});

const insertResult = await insertResponse.json();
console.log('插入的expression ID:', insertResult.data.id);
```

### Python 示例

```python
import requests

# 查询expression
response = requests.get('/api/database/expression/get', params={
    'page': 1,
    'pageSize': 20,
    'type': 'style'
})
data = response.json()

# 插入expression
new_expression = {
    'situation': '询问对方近况',
    'style': '最近怎么样啊',
    'count': 0,
    'chat_id': 'chat_001',
    'type': 'style'
}

response = requests.post('/api/database/expression/insert', json=new_expression)
result = response.json()
print(f"插入的expression ID: {result['data']['id']}")
```

## 最佳实践

1. **分页查询**: 使用合适的页大小（建议10-50条记录）来平衡性能和用户体验
2. **过滤条件**: 合理使用过滤条件来减少返回的数据量
3. **错误处理**: 始终检查API响应的状态码和错误信息
4. **性能优化**: 对于频繁查询的场景，考虑使用缓存
5. **数据验证**: 在插入和更新数据前进行客户端验证

## 注意事项

1. 所有时间字段使用Unix时间戳格式（秒）
2. 字符串字段有长度限制，详见字段说明
3. 类型字段只接受"style"或"grammar"两个值
4. 统计次数字段必须为非负数
5. API响应时间戳使用毫秒格式

## 更新日志

- **v1.0.0**: 初始版本，提供基础CRUD操作和扩展功能
- 后续版本将根据需求进行功能扩展
