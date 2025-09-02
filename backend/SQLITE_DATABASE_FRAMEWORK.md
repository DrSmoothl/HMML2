# SQLite数据库工具框架实现文档

## 概述

本文档描述了HMML后端服务中新增的SQLite数据库工具框架，以及emoji表的完整操作功能。

## 架构设计

### 分层架构

```
├── models/           # 数据模型层
│   ├── database.py   # 通用数据库模型
│   └── emoji.py      # Emoji表专用模型
├── core/             # 核心服务层
│   ├── database_connection.py  # 数据库连接管理
│   ├── database_operator.py    # 通用数据库操作器
│   └── database_manager.py     # 数据库管理器
├── services/         # 业务逻辑层
│   └── emoji_service.py        # Emoji业务服务
├── routes/           # 路由层
│   └── emoji.py                # Emoji API路由
└── utils/            # 工具层
    └── database_validator.py   # 数据验证工具
```

### 设计原则

1. **分布式编写**: 每个文件专注于一个功能模块
2. **高可用性**: 连接池管理、错误处理、自动重连
3. **易于扩展**: 通用操作器支持任意表的CRUD操作
4. **易于维护**: 清晰的注释和类型提示

## 核心功能

### 1. 通用数据库工具框架

#### DatabaseConnection (数据库连接管理器)
- 功能: 管理SQLite数据库连接
- 特性:
  - 线程安全的连接管理
  - 自动创建数据库目录
  - 连接状态验证
  - 上下文管理器支持

#### DatabaseOperator (通用数据库操作器)
- 功能: 提供通用的CRUD操作
- 支持操作:
  - `find_one()` - 查询单条记录
  - `find_many()` - 查询多条记录
  - `find_with_pagination()` - 分页查询
  - `insert()` - 插入记录
  - `update()` - 更新记录
  - `delete()` - 删除记录
  - `count()` - 统计记录数
  - `execute_raw_sql()` - 执行原始SQL

#### DatabaseManager (数据库管理器)
- 功能: 管理多个数据库连接
- 特性:
  - 多数据库连接管理
  - 自动初始化麦麦数据库
  - 连接健康检查
  - 优雅关闭所有连接

### 2. Emoji表专用功能

#### 数据模型
- `EmojiRecord` - Emoji记录模型
- `EmojiInsertData` - 插入数据模型
- `EmojiUpdateData` - 更新数据模型
- `EmojiQueryResponse` - 查询响应模型

#### 业务服务 (EmojiService)
- `get_emojis()` - 分页查询emoji列表
- `get_emoji_by_id()` - 根据ID查询单个emoji
- `insert_emoji()` - 插入emoji记录
- `update_emoji()` - 更新emoji记录
- `delete_emoji()` - 删除emoji记录
- `get_emoji_by_hash()` - 根据哈希值查询emoji
- `get_emoji_image()` - 获取emoji图片Base64
- `calculate_image_hash()` - 计算图片哈希值
- `get_emoji_stats()` - 获取统计信息

## API接口

### Emoji表操作API

#### 1. 查询emoji（分页）
```http
GET /api/database/emoji/get?page=1&pageSize=10
```

**查询参数:**
- `page` - 页码（从1开始）
- `pageSize` - 每页大小（1-1000）
- `orderBy` - 排序字段（id, query_count, usage_count, last_used_time, record_time）
- `orderDir` - 排序方向（ASC, DESC）
- `format` - 按格式过滤
- `emotion` - 按情感过滤
- `is_registered` - 按注册状态过滤（0/1）
- `is_banned` - 按禁止状态过滤（0/1）
- `description` - 按描述模糊搜索
- `emoji_hash` - 按哈希值查找

**响应格式:**
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
        "description": "Emoji 1",
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

#### 2. 插入emoji
```http
POST /api/database/emoji/insert
```

**请求体:**
```json
{
  "full_path": "/path/to/emoji1.png",
  "format": "png",
  "emoji_hash": "hash1",
  "description": "Emoji 1",
  "query_count": 10,
  "is_registered": 1,
  "is_banned": 0,
  "emotion": "happy",
  "record_time": 1692000000.0,
  "register_time": 1692000000.0,
  "usage_count": 5,
  "last_used_time": 1692000000.0
}
```

**响应:**
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

#### 3. 更新emoji
```http
POST /api/database/emoji/update
```

**请求体:**
```json
{
  "id": 1,
  "description": "Updated description",
  "emotion": "excited"
}
```

#### 4. 删除emoji
```http
DELETE /api/database/emoji/delete/1
```
或
```http
DELETE /api/database/emoji/delete
```
```json
{
  "id": 1
}
```

#### 5. 获取emoji图片
```http
GET /api/database/emoji/getSingleEmojiImage?id=1
```

#### 6. 计算图片哈希值
```http
POST /api/database/emoji/calculateHash
```
```json
{
  "image_path": "data/emoji_registed/example.png"
}
```

#### 7. 获取统计信息
```http
GET /api/database/emoji/stats
```

## 数据库路径配置

### 麦麦数据库路径
- **数据库文件**: `{麦麦根目录}/data/MaiBot.db`
- **根目录获取**: 通过路径缓存功能获取麦麦根目录
- **自动连接**: 应用启动时自动建立连接

### 表结构 (emoji表)

| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | INTEGER | 唯一标识符 |
| full_path | TEXT | 完整路径 |
| format | TEXT | 格式 |
| emoji_hash | TEXT | 哈希值 |
| description | TEXT | 描述 |
| query_count | INTEGER | 查询次数 |
| is_registered | INTEGER | 是否注册 |
| is_banned | INTEGER | 是否被禁止 |
| emotion | TEXT | 情感 |
| record_time | REAL | 记录时间 |
| register_time | REAL | 注册时间 |
| usage_count | INTEGER | 使用次数 |
| last_used_time | REAL | 最后使用时间 |

## 安全特性

### 1. SQL注入防护
- 使用参数化查询
- 输入验证和清理
- 字段名白名单验证

### 2. 数据验证
- Pydantic模型验证
- 输入格式检查
- 字段长度限制

### 3. 错误处理
- 统一错误处理机制
- 详细的错误日志
- 用户友好的错误消息

## 扩展性

### 添加新表操作
1. 在 `models/` 中定义数据模型
2. 在 `services/` 中实现业务逻辑
3. 在 `routes/` 中添加API路由
4. 在 `http_server.py` 中注册路由

### 示例：添加用户表操作
```python
# models/user.py
class UserRecord(BaseModel):
    id: int
    username: str
    email: str

# services/user_service.py
class UserService:
    @classmethod
    async def get_users(cls, params):
        operator = await cls._get_operator()
        return operator.find_with_pagination("users", ...)

# routes/user.py
@router.get("/get")
async def get_users(...):
    result = await UserService.get_users(params)
    return result
```

## 性能优化

### 1. 连接池管理
- 复用数据库连接
- 连接超时设置
- 自动连接恢复

### 2. 查询优化
- 分页查询限制
- 索引使用建议
- 查询缓存策略

### 3. 内存管理
- 结果集分页处理
- 大文件流式读取
- 及时释放资源

## 监控和日志

### 1. 操作日志
- SQL执行日志
- 性能监控日志
- 错误详细日志

### 2. 健康检查
- 数据库连接状态
- 查询响应时间
- 错误率统计

## 使用示例

### Python客户端示例
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
print('插入的emoji ID:', result['data']['id'])
```

### JavaScript客户端示例
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

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查麦麦根目录设置
   - 验证数据库文件权限
   - 查看数据库文件是否存在

2. **查询超时**
   - 检查查询条件复杂度
   - 验证数据库文件大小
   - 调整连接超时设置

3. **插入失败**
   - 验证数据格式
   - 检查必需字段
   - 查看约束冲突

### 日志分析
```bash
# 查看数据库相关日志
grep "数据库" logs/hmml-*.log

# 查看错误日志
grep "ERROR" logs/hmml-error-*.log
```

## 总结

HMML的SQLite数据库工具框架提供了：

1. **完整的CRUD操作支持**
2. **高性能的分页查询**
3. **安全的SQL注入防护**
4. **灵活的扩展能力**
5. **完善的错误处理**
6. **详细的操作日志**

该框架严格遵循原后端的API设计，确保前端兼容性，同时提供了更好的性能和可维护性。
