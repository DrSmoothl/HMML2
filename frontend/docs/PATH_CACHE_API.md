# 路径缓存功能 API 文档

## 概述

路径缓存功能为HMML后端服务提供麦麦主程序和适配器根目录的缓存管理。启动器可以通过这些API来存储和检索根目录路径，无需每次都重新配置。

## 数据存储

- **文件位置**: `data/pathCache.json`
- **格式**: JSON
- **持久化**: 自动保存到文件系统
- **验证**: 路径有效性自动验证（可配置）

## API接口

### 1. 获取所有缓存路径

**接口**: `GET /api/pathCache/getAllPaths`

**功能**: 获取麦麦主程序根目录和所有适配器根目录

**请求参数**: 无

**响应格式**:
```json
{
  "status": 200,
  "data": {
    "mainRoot": "C:\\Games\\Maimai\\Main",
    "adapterRoots": [
      {
        "adapterName": "适配器1",
        "rootPath": "C:\\Games\\Maimai\\Adapters\\Adapter1"
      },
      {
        "adapterName": "适配器2", 
        "rootPath": "C:\\Games\\Maimai\\Adapters\\Adapter2"
      }
    ]
  },
  "message": "获取路径成功",
  "time": 1692000000000
}
```

### 2. 设置主程序根目录

**接口**: `POST /api/pathCache/setRootPath`

**功能**: 设置或更新麦麦主程序根目录

**请求体**:
```json
{
  "mainRoot": "C:\\Games\\Maimai\\Main"
}
```

**响应格式**:
```json
{
  "status": 200,
  "data": null,
  "message": "主程序根目录设置成功",
  "time": 1692000000000
}
```

**错误响应**:
```json
{
  "status": 400,
  "data": null,
  "message": "参数验证失败",
  "time": 1692000000000
}
```

### 3. 获取主程序根目录

**接口**: `GET /api/pathCache/getMainRoot`

**功能**: 单独获取主程序根目录

**请求参数**: 无

**响应格式**:
```json
{
  "status": 200,
  "data": {
    "mainRoot": "C:\\Games\\Maimai\\Main"
  },
  "message": "获取主程序根目录成功",
  "time": 1692000000000
}
```

### 4. 添加适配器根目录

**接口**: `POST /api/pathCache/addAdapterRoot`

**功能**: 添加新的适配器根目录

**请求体**:
```json
{
  "adapterName": "新适配器",
  "rootPath": "C:\\Games\\Maimai\\Adapters\\NewAdapter"
}
```

**响应格式**:
```json
{
  "status": 200,
  "data": null,
  "message": "适配器根目录添加成功",
  "time": 1692000000000
}
```

**错误响应**:
- `409 Conflict`: 适配器名称已存在
- `400 Bad Request`: 适配器数量达到上限(50个)
- `400 Bad Request`: 路径验证失败

### 5. 移除适配器根目录

**接口**: `DELETE /api/pathCache/removeAdapterRoot`

**功能**: 移除指定的适配器根目录

**请求体**:
```json
{
  "adapterName": "要移除的适配器"
}
```

**响应格式**:
```json
{
  "status": 200,
  "data": null,
  "message": "适配器根目录移除成功",
  "time": 1692000000000
}
```

**错误响应**:
- `404 Not Found`: 适配器不存在

### 6. 更新适配器根目录

**接口**: `PUT /api/pathCache/updateAdapterRoot`

**功能**: 更新已存在适配器的根目录路径

**请求体**:
```json
{
  "adapterName": "适配器1",
  "rootPath": "C:\\Games\\Maimai\\Adapters\\UpdatedPath"
}
```

**响应格式**:
```json
{
  "status": 200,
  "data": null,
  "message": "适配器根目录更新成功",
  "time": 1692000000000
}
```

### 7. 获取单个适配器根目录

**接口**: `GET /api/pathCache/getAdapterRoot/:adapterName`

**功能**: 获取指定适配器的根目录

**路径参数**:
- `adapterName`: 适配器名称

**响应格式**:
```json
{
  "status": 200,
  "data": {
    "adapterName": "适配器1",
    "rootPath": "C:\\Games\\Maimai\\Adapters\\Adapter1"
  },
  "message": "获取适配器根目录成功",
  "time": 1692000000000
}
```

### 8. 获取所有适配器列表

**接口**: `GET /api/pathCache/getAllAdapters`

**功能**: 获取所有适配器的信息（不包含主程序根目录）

**请求参数**: 无

**响应格式**:
```json
{
  "status": 200,
  "data": [
    {
      "adapterName": "适配器1",
      "rootPath": "C:\\Games\\Maimai\\Adapters\\Adapter1"
    },
    {
      "adapterName": "适配器2", 
      "rootPath": "C:\\Games\\Maimai\\Adapters\\Adapter2"
    }
  ],
  "message": "获取适配器列表成功",
  "time": 1692000000000
}
```

### 9. 清空所有缓存

**接口**: `DELETE /api/pathCache/clearCache`

**功能**: 清空所有缓存（主程序根目录和所有适配器根目录）

**请求参数**: 无

**响应格式**:
```json
{
  "status": 200,
  "data": null,
  "message": "缓存清空成功",
  "time": 1692000000000
}
```

### 10. 获取缓存统计信息

**接口**: `GET /api/pathCache/getStats`

**功能**: 获取缓存的统计信息

**请求参数**: 无

**响应格式**:
```json
{
  "status": 200,
  "data": {
    "hasMainRoot": true,
    "adapterCount": 3,
    "lastUpdated": "2025-08-11T10:30:00.000Z"
  },
  "message": "获取缓存统计信息成功",
  "time": 1692000000000
}
```

## 路径验证

### 验证规则
1. **路径格式检查**: 检查路径格式是否合法
2. **存在性检查**: 验证路径是否存在（可配置）
3. **目录检查**: 确保路径指向目录而不是文件
4. **权限检查**: 检查目录的读写权限
5. **长度限制**: Windows路径最大260字符，Linux最大4096字符
6. **字符限制**: Windows系统禁止特殊字符 `<>:"|?*`

### 自动创建目录
- 可通过配置启用自动创建不存在的目录
- 默认关闭，需要目录已存在

### 路径规范化
- 自动将相对路径转换为绝对路径
- 统一路径分隔符格式
- 去除多余的路径分隔符

## 错误代码

| 状态码 | 说明 | 示例场景 |
|--------|------|----------|
| 200 | 成功 | 正常操作完成 |
| 400 | 请求参数错误 | 参数验证失败、路径格式错误 |
| 404 | 资源不存在 | 适配器不存在 |
| 409 | 资源冲突 | 适配器名称已存在 |
| 500 | 服务器内部错误 | 文件系统错误、意外异常 |

## 配置参数

```typescript
interface PathCacheConfig {
  cacheFilePath: string;        // 缓存文件路径，默认: "data/pathCache.json"
  enableValidation: boolean;    // 启用路径验证，默认: true
  autoCreateDirectory: boolean; // 自动创建目录，默认: false
  maxAdapters: number;         // 最大适配器数量，默认: 50
}
```

## 使用示例

### JavaScript/TypeScript 客户端示例

```typescript
// 获取所有路径
const response = await fetch('/api/pathCache/getAllPaths');
const data = await response.json();
console.log('主程序路径:', data.data.mainRoot);
console.log('适配器列表:', data.data.adapterRoots);

// 设置主程序根目录
await fetch('/api/pathCache/setRootPath', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mainRoot: 'C:\\Games\\Maimai\\Main'
  })
});

// 添加适配器
await fetch('/api/pathCache/addAdapterRoot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    adapterName: '新适配器',
    rootPath: 'C:\\Games\\Maimai\\Adapters\\New'
  })
});
```

## 注意事项

1. **路径格式**: 推荐使用绝对路径，避免相对路径可能的歧义
2. **适配器命名**: 适配器名称只能包含字母、数字、下划线、连字符和中文字符
3. **并发安全**: 管理器支持并发操作，自动处理文件锁定
4. **错误处理**: 所有API都提供详细的错误信息，方便客户端处理
5. **日志记录**: 所有操作都会记录到系统日志中，便于问题排查

## 文件结构

```
src/
├── core/
│   └── pathCacheManager.ts      # 路径缓存管理器
├── routes/
│   └── pathCache.ts             # 路径缓存API路由
├── types/
│   └── pathCache.ts             # 路径缓存类型定义
└── utils/
    └── pathValidator.ts         # 路径验证工具

data/
└── pathCache.json               # 缓存数据文件
```

这个实现确保了高可用性、易用性和扩展性，满足麦麦启动器的路径缓存需求。
