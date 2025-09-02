# PersonInfo表 API 使用文档

## 概述

PersonInfo表用于存储人物信息，包括人物的基本信息、印象、认知记录等。该表支持多平台、多用户的人物信息管理。

## 数据库表结构

```sql
CREATE TABLE person_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id TEXT NOT NULL,           -- 人物ID（唯一标识符）
    person_name TEXT NOT NULL,         -- 人物名称
    platform TEXT NOT NULL,           -- 平台（qq/wechat/telegram等）
    user_id TEXT NOT NULL,            -- 用户ID
    nickname TEXT,                    -- 昵称
    name_reason TEXT,                 -- 取名原因
    impression TEXT,                  -- 印象
    short_impression TEXT,            -- 简短印象
    points TEXT,                      -- 要点（JSON格式）
    forgotten_points TEXT,            -- 遗忘要点（JSON格式）
    info_list TEXT,                   -- 信息列表（JSON格式）
    know_times INTEGER DEFAULT 0,     -- 认知次数
    know_since INTEGER,               -- 认识时间（时间戳）
    last_know INTEGER,                -- 最后认知时间（时间戳）
    attitude INTEGER DEFAULT 50,      -- 态度值（0-100）
    
    UNIQUE(person_id, platform, user_id)
);
```

## API 接口

### 1. 分页查询PersonInfo

**GET** `/api/database/person-info/get`

查询所有PersonInfo记录，支持分页和过滤。

**查询参数：**
- `page` (可选): 页码，默认1
- `pageSize` (可选): 每页记录数，默认20，最大100
- `orderBy` (可选): 排序字段，默认id
- `orderDir` (可选): 排序方向，ASC或DESC，默认ASC
- `person_id` (可选): 过滤人物ID
- `person_name` (可选): 过滤人物名称（模糊匹配）
- `platform` (可选): 过滤平台
- `user_id` (可选): 过滤用户ID
- `nickname` (可选): 过滤昵称（模糊匹配）
- `impression` (可选): 过滤印象（模糊匹配）
- `minKnowTimes` (可选): 最小认知次数
- `maxKnowTimes` (可选): 最大认知次数
- `minAttitude` (可选): 最小态度值
- `maxAttitude` (可选): 最大态度值
- `knowSinceStart` (可选): 认识起始时间戳
- `knowSinceEnd` (可选): 认识结束时间戳
- `lastKnowStart` (可选): 最后认知起始时间戳
- `lastKnowEnd` (可选): 最后认知结束时间戳

**返回示例：**
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

### 2. 根据ID查询单个PersonInfo

**GET** `/api/database/person-info/get/:id`

根据ID查询单个PersonInfo记录。

**路径参数：**
- `id`: PersonInfo记录的ID

**返回示例：**
```json
{
  "status": 200,
  "message": "查询PersonInfo成功",
  "data": {
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
  },
  "time": 1703209600000
}
```

### 3. 新增PersonInfo

**POST** `/api/database/person-info/insert`

创建新的PersonInfo记录。

**请求体：**
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

**字段说明：**
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

**返回示例：**
```json
{
  "status": 200,
  "message": "PersonInfo创建成功",
  "data": {
    "id": 2,
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
    "know_times": 0,
    "know_since": 1703209600,
    "last_know": 1703209600,
    "attitude": 80
  },
  "time": 1703209600000
}
```

### 4. 更新PersonInfo

**PUT** `/api/database/person-info/update/:id`

更新指定ID的PersonInfo记录。

**路径参数：**
- `id`: PersonInfo记录的ID

**请求体：**
```json
{
  "nickname": "更新后的昵称",
  "impression": "更新后的印象",
  "attitude": 85
}
```

**说明：**
- 请求体中只需要包含要更新的字段
- person_id、platform、user_id的组合不能与其他记录重复

**返回示例：**
```json
{
  "status": 200,
  "message": "PersonInfo更新成功",
  "data": {
    "id": 1,
    "nickname": "更新后的昵称",
    "impression": "更新后的印象",
    "attitude": 85
  },
  "time": 1703209600000
}
```

### 5. 删除PersonInfo

**DELETE** `/api/database/person-info/delete/:id`

删除指定ID的PersonInfo记录。

**路径参数：**
- `id`: PersonInfo记录的ID

**返回示例：**
```json
{
  "status": 200,
  "message": "PersonInfo删除成功",
  "time": 1703209600000
}
```

### 6. 根据person_id查询PersonInfo

**GET** `/api/database/person-info/by-person/:personId`

根据person_id查询所有相关的PersonInfo记录（可能有多个平台的记录）。

**路径参数：**
- `personId`: 人物ID

**返回示例：**
```json
{
  "status": 200,
  "message": "查询person_id为person_001的PersonInfo成功",
  "data": [
    {
      "id": 1,
      "person_id": "person_001",
      "person_name": "张三",
      "platform": "qq",
      "user_id": "123456",
      "nickname": "小张",
      "attitude": 75,
      // ... 其他字段
    },
    {
      "id": 5,
      "person_id": "person_001",
      "person_name": "张三",
      "platform": "wechat",
      "user_id": "789012",
      "nickname": "张同学",
      "attitude": 80,
      // ... 其他字段
    }
  ],
  "time": 1703209600000
}
```

### 7. 根据平台和用户ID查询PersonInfo

**GET** `/api/database/person-info/by-platform/:platform/user/:userId`

根据平台和用户ID查询PersonInfo记录。

**路径参数：**
- `platform`: 平台名称
- `userId`: 用户ID

**返回示例：**
```json
{
  "status": 200,
  "message": "查询平台qq上用户123456的PersonInfo成功",
  "data": [
    {
      "id": 1,
      "person_id": "person_001",
      "person_name": "张三",
      "platform": "qq",
      "user_id": "123456",
      "nickname": "小张",
      "attitude": 75,
      // ... 其他字段
    }
  ],
  "time": 1703209600000
}
```

### 8. 获取PersonInfo统计信息

**GET** `/api/database/person-info/stats`

获取PersonInfo的统计信息，包括总数、平台分布、态度分布等。

**返回示例：**
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
        "know_times": 50,
        // ... 其他字段
      }
    ]
  },
  "time": 1703209600000
}
```

### 9. 搜索PersonInfo

**GET** `/api/database/person-info/search`

通过关键字搜索PersonInfo记录，支持在姓名、昵称、印象等字段中搜索。

**查询参数：**
- `keyword` (必需): 搜索关键字
- `limit` (可选): 限制数量，默认20，最大100

**返回示例：**
```json
{
  "status": 200,
  "message": "搜索PersonInfo成功，找到3条记录",
  "data": [
    {
      "id": 1,
      "person_id": "person_001",
      "person_name": "张三",
      "platform": "qq",
      "user_id": "123456",
      "nickname": "小张",
      "impression": "活泼开朗的人",
      "attitude": 75,
      // ... 其他字段
    }
  ],
  "time": 1703209600000
}
```

### 10. 获取可用平台列表

**GET** `/api/database/person-info/platforms`

获取系统支持的平台列表。

**返回示例：**
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

## 平台枚举值

```typescript
enum Platform {
  QQ = 'qq',
  WeChat = 'wechat',
  Telegram = 'telegram',
  Discord = 'discord',
  Line = 'line',
  Other = 'other'
}
```

## 态度范围说明

- `0-20`: 非常负面 (very_negative)
- `21-40`: 负面 (negative)
- `41-60`: 中性 (neutral)
- `61-80`: 正面 (positive)
- `81-100`: 非常正面 (very_positive)

## JSON字段格式示例

### points 字段
```json
[
  "工作认真负责",
  "乐于助人",
  "技术能力强"
]
```

### forgotten_points 字段
```json
[
  "曾经提到过喜欢旅游",
  "家里有宠物猫"
]
```

### info_list 字段
```json
[
  {
    "type": "工作",
    "content": "软件开发工程师",
    "source": "自述",
    "time": 1703123200
  },
  {
    "type": "兴趣",
    "content": "喜欢摄影和音乐",
    "source": "聊天记录",
    "time": 1703209600
  }
]
```

## 错误处理

所有API都会返回统一格式的错误响应：

```json
{
  "status": 400,
  "message": "具体错误信息",
  "code": "错误代码",
  "time": 1703209600000
}
```

常见错误代码：
- `VALIDATION_ERROR`: 参数验证失败
- `NOT_FOUND_ERROR`: 记录不存在
- `CONFLICT_ERROR`: 数据冲突（如唯一约束违反）
- `INTERNAL_SERVER_ERROR`: 内部服务器错误

## 使用建议

1. **创建记录时**：确保person_id、platform、user_id的组合是唯一的
2. **JSON字段**：points、forgotten_points、info_list字段应该是有效的JSON字符串
3. **时间戳**：使用Unix时间戳（秒为单位）
4. **态度值**：保持在0-100范围内，50为中性值
5. **搜索功能**：使用关键字搜索时，系统会在多个字段中进行模糊匹配
6. **统计信息**：定期查看统计信息可以了解数据分布和使用情况
