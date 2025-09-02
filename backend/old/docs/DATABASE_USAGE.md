# SQLite数据库操作工具框架使用指南

## 概述

HMML项目现在集成了一个功能完整的SQLite数据库操作工具框架，支持多数据库连接管理、分页查询、CRUD操作等功能。

## 核心特性

- ✅ **多数据库连接管理** - 支持同时连接多个SQLite数据库
- ✅ **分页查询** - 内置分页工具，支持不同页大小
- ✅ **完整CRUD操作** - 增删改查功能齐全
- ✅ **SQL查询构建器** - 动态构建复杂SQL查询
- ✅ **事务支持** - 支持数据库事务操作
- ✅ **连接池管理** - 自动管理数据库连接生命周期
- ✅ **RESTful API** - 提供完整的HTTP API接口
- ✅ **类型安全** - 完整的TypeScript类型定义
- ✅ **错误处理** - 完善的错误处理和日志记录

## 快速开始

### 1. 基本用法

```typescript
import { connectDatabase, getDatabase, findWithPagination } from './core/database';

// 连接数据库
await connectDatabase('/path/to/maimai.db', 'maimai', false);

// 获取数据库操作器
const db = getDatabase('maimai');

// 分页查询emoji表
const result = await db.findWithPagination('emoji', 
  { page: 1, pageSize: 20 }, 
  { 
    select: ['id', 'name', 'unicode'],
    orderBy: [{ field: 'name', order: 'ASC' }]
  }
);

console.log(`共找到 ${result.pagination.total} 条记录`);
console.log('当前页数据:', result.data);
```

### 2. 使用连接管理器

```typescript
import { databaseManager } from './core/database';

// 初始化管理器
await databaseManager.initialize();

// 添加多个数据库连接
await databaseManager.addDatabase('maimai', {
  path: '/path/to/maimai.db',
  readonly: false
});

await databaseManager.addDatabase('scores', {
  path: '/path/to/scores.db',
  readonly: false
});

// 获取操作器
const maimaiDb = databaseManager.getOperator('maimai');
const scoresDb = databaseManager.getOperator('scores');
```

## API使用示例

### 连接管理

```bash
# 添加数据库连接
curl -X POST http://localhost:7999/api/database/connections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "maimai",
    "path": "/path/to/maimai.db",
    "readonly": false
  }'

# 获取连接列表
curl http://localhost:7999/api/database/connections

# 测试连接
curl http://localhost:7999/api/database/connections/maimai/test
```

### 表信息查询

```bash
# 获取所有表信息
curl http://localhost:7999/api/database/maimai/tables

# 获取特定表信息
curl http://localhost:7999/api/database/maimai/tables/emoji
```

### 数据查询

```bash
# 分页查询数据
curl "http://localhost:7999/api/database/maimai/tables/emoji/data?page=1&pageSize=10&orderBy=name&order=ASC"

# 条件查询
curl "http://localhost:7999/api/database/maimai/tables/user/data?page=1&pageSize=20&level=10"

# 选择特定字段
curl "http://localhost:7999/api/database/maimai/tables/emoji/data?select=id,name,unicode&page=1&pageSize=5"
```

### 数据操作

```bash
# 插入单条记录
curl -X POST http://localhost:7999/api/database/maimai/tables/user/data \
  -H "Content-Type: application/json" \
  -d '{
    "name": "玩家1",
    "level": 15,
    "exp": 1500
  }'

# 批量插入
curl -X POST http://localhost:7999/api/database/maimai/tables/user/data \
  -H "Content-Type: application/json" \
  -d '[
    {"name": "玩家2", "level": 10, "exp": 1000},
    {"name": "玩家3", "level": 12, "exp": 1200}
  ]'

# 更新数据
curl -X PUT http://localhost:7999/api/database/maimai/tables/user/data \
  -H "Content-Type: application/json" \
  -d '{
    "data": {"exp": 2000},
    "where": [
      {"field": "name", "operator": "=", "value": "玩家1"}
    ]
  }'

# 删除数据
curl -X DELETE http://localhost:7999/api/database/maimai/tables/user/data \
  -H "Content-Type: application/json" \
  -d '{
    "where": [
      {"field": "level", "operator": "<", "value": 5}
    ]
  }'
```

### 自定义SQL查询

```bash
# 执行查询
curl -X POST http://localhost:7999/api/database/maimai/query \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT name, level, exp FROM user WHERE level > ? ORDER BY exp DESC LIMIT ?",
    "bindings": [10, 5]
  }'

# 执行更新语句
curl -X POST http://localhost:7999/api/database/maimai/query \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "UPDATE user SET last_login = datetime('now') WHERE id = ?",
    "bindings": [1]
  }'
```

## 代码示例

### 1. 基本CRUD操作

```typescript
import { databaseManager } from './core/database';

const db = databaseManager.getOperator('maimai');

// 查询单条记录
const user = await db.findOne('user', {
  where: [{ field: 'id', operator: '=', value: 1 }]
});

// 查询多条记录
const users = await db.findMany('user', {
  where: [{ field: 'level', operator: '>', value: 10 }],
  orderBy: [{ field: 'exp', order: 'DESC' }],
  limit: 10
});

// 插入记录
const insertResult = await db.insertOne('user', {
  name: '新玩家',
  level: 1,
  exp: 0
});

// 更新记录
const updateResult = await db.update('user', 
  { exp: 100 },
  { where: [{ field: 'id', operator: '=', value: insertResult.lastInsertId }] }
);

// 删除记录
const deleteResult = await db.delete('user', {
  where: [{ field: 'level', operator: '<', value: 5 }]
});
```

### 2. 复杂查询示例

```typescript
import { SqlQueryBuilder, databaseManager } from './core/database';

const db = databaseManager.getOperator('maimai');

// 使用查询构建器
const builder = SqlQueryBuilder.select('user')
  .fields(['id', 'name', 'level', 'exp'])
  .whereField('level', '>=', 10)
  .whereField('exp', '>', 1000, 'AND')
  .orderByField('exp', 'DESC')
  .limit(20);

const { sql, bindings } = builder.build();
const results = await db.executeQuery(sql, bindings);

// 联表查询
const complexQuery = SqlQueryBuilder.select('user')
  .fields(['u.name', 'u.level', 'COUNT(s.id) as song_count'])
  .leftJoin('scores s', 'u.id = s.user_id', 'u')
  .whereField('u.level', '>', 15)
  .groupBy(['u.id', 'u.name', 'u.level'])
  .having([{ field: 'COUNT(s.id)', operator: '>', value: 10 }])
  .orderByField('song_count', 'DESC');

const { sql: complexSql, bindings: complexBindings } = complexQuery.build();
const complexResults = await db.executeQuery(complexSql, complexBindings);
```

### 3. 分页查询示例

```typescript
import { databaseManager, PaginationUtils } from './core/database';

const db = databaseManager.getOperator('maimai');

// 基本分页查询
const paginatedResult = await db.findWithPagination('emoji', 
  { page: 1, pageSize: 20 },
  { 
    select: ['id', 'name', 'unicode'],
    orderBy: [{ field: 'name', order: 'ASC' }]
  }
);

console.log('分页信息:', paginatedResult.pagination);
console.log('数据:', paginatedResult.data);

// 获取分页摘要
const summary = PaginationUtils.getPaginationSummary(
  { page: 1, pageSize: 20, offset: 0 }, 
  paginatedResult.pagination.total
);
console.log(summary); // "显示第 1-20 条记录，共 150 条记录，第 1/8 页"
```

### 4. 事务操作示例

```typescript
import { databaseManager } from './core/database';

const db = databaseManager.getOperator('maimai');

// 执行事务
const transactionResult = await db.transaction(async (tx) => {
  // 在事务中执行多个操作
  const user = await tx.insertOne('user', {
    name: '事务用户',
    level: 1,
    exp: 0
  });
  
  await tx.insertOne('user_profile', {
    user_id: user.lastInsertId,
    avatar: 'default.png',
    created_at: new Date().toISOString()
  });
  
  await tx.update('statistics', 
    { total_users: 'total_users + 1' },
    { where: [{ field: 'id', operator: '=', value: 1 }] }
  );
  
  return { userId: user.lastInsertId };
});

console.log('事务执行完成，新用户ID:', transactionResult.userId);
```

### 5. 批量操作示例

```typescript
import { databaseManager } from './core/database';

const db = databaseManager.getOperator('maimai');

// 批量插入用户数据
const users = [
  { name: '用户1', level: 10, exp: 1000 },
  { name: '用户2', level: 15, exp: 1500 },
  { name: '用户3', level: 20, exp: 2000 }
];

const batchResult = await db.insertMany('user', users, 50); // 批次大小为50
console.log(`批量插入完成，影响 ${batchResult.affectedRows} 行`);
```

## 配置说明

### 数据库配置选项

```typescript
interface DatabaseConfig {
  path: string;               // 数据库文件路径
  readonly?: boolean;         // 是否只读模式（默认：false）
  timeout?: number;           // 连接超时时间毫秒（默认：5000）
  verbose?: boolean;          // 是否启用详细日志（默认：false）
  memory?: boolean;           // 是否使用内存数据库（默认：false）
  fileMustExist?: boolean;    // 文件是否必须存在（默认：false）
}
```

### 查询参数选项

```typescript
interface QueryParams {
  select?: string[];          // 选择字段
  where?: QueryFilter[];      // WHERE条件
  orderBy?: SortParams[];     // 排序
  groupBy?: string[];         // 分组字段
  having?: QueryFilter[];     // HAVING条件
  limit?: number;             // 限制数量
  offset?: number;            // 偏移量
}
```

### 过滤操作符

支持的过滤操作符：
- `=`, `!=` - 等于、不等于
- `>`, `>=`, `<`, `<=` - 大于、大于等于、小于、小于等于
- `LIKE`, `NOT LIKE` - 模糊匹配
- `IN`, `NOT IN` - 在范围内、不在范围内
- `IS NULL`, `IS NOT NULL` - 为空、不为空
- `BETWEEN` - 在区间内

## 最佳实践

### 1. 连接管理

```typescript
// 应用启动时初始化
await databaseManager.initialize();

// 连接麦麦主数据库
await databaseManager.addDatabase('maimai', {
  path: path.join(maimaiRoot, 'data.db'),
  readonly: false,
  timeout: 10000
});

// 应用关闭时清理
await databaseManager.closeAllConnections();
```

### 2. 错误处理

```typescript
try {
  const result = await db.findWithPagination('user', pagination, query);
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    // 参数验证错误
    logger.warn('查询参数错误:', error.message);
  } else if (error instanceof NotFoundError) {
    // 资源不存在
    logger.warn('数据库或表不存在:', error.message);
  } else {
    // 其他数据库错误
    logger.error('数据库操作失败:', error);
  }
  throw error;
}
```

### 3. 性能优化

```typescript
// 使用索引优化查询
const users = await db.findMany('user', {
  where: [{ field: 'level', operator: '=', value: 15 }], // 确保level字段有索引
  orderBy: [{ field: 'created_at', order: 'DESC' }],    // 确保created_at字段有索引
  limit: 100
});

// 批量操作减少事务开销
const batchSize = 100;
await db.insertMany('scores', scoreData, batchSize);

// 定期执行VACUUM清理
await databaseManager.vacuumDatabase('maimai');
```

## 故障排除

### 常见问题

1. **数据库文件锁定**
   ```
   错误: database is locked
   解决: 检查是否有其他程序占用数据库文件
   ```

2. **连接超时**
   ```
   错误: connection timeout
   解决: 增加timeout配置或检查数据库文件权限
   ```

3. **SQL语法错误**
   ```
   错误: SQL syntax error
   解决: 使用SqlQueryBuilder构建查询或检查手写SQL语法
   ```

### 调试技巧

```typescript
// 启用详细日志
const config = {
  path: '/path/to/db.sqlite',
  verbose: true  // 启用SQL查询日志
};

// 检查连接状态
const isConnected = await databaseManager.testConnection('maimai');
console.log('连接状态:', isConnected);

// 获取数据库统计信息
const stats = await databaseManager.getDatabaseStats('maimai');
console.log('数据库统计:', stats);
```

## 扩展开发

框架采用模块化设计，可以轻松扩展：

1. **自定义操作器** - 继承`DatabaseOperator`类
2. **自定义查询构建器** - 扩展`SqlQueryBuilder`类
3. **自定义中间件** - 添加数据库操作中间件
4. **自定义错误处理** - 继承数据库错误类型

这个SQLite数据库操作工具框架为HMML项目提供了完整的数据库操作能力，支持麦麦主程序数据的高效读取、修改和管理。
