# 路径缓存API文档

HMML 后端服务提供了一套完整的路径缓存管理API，用于缓存和管理主程序根目录以及适配器根目录。

## API 基础信息

- **基础URL**: `http://localhost:7999/api/pathCache`
- **内容类型**: `application/json`
- **响应格式**: 统一的JSON响应格式

### 响应格式

所有API响应都遵循统一格式：

```json
{
  "status": 200,
  "data": {},
  "message": "操作成功",
  "time": 1754846700429
}
```

## API 端点

### 1. 设置主程序根目录

**POST** `/pathCache/setRootPath`

设置或更新主程序的根目录路径。

#### 请求参数

```json
{
  "mainRoot": "E:/MaimBot/HMML"
}
```

#### 响应示例

```json
{
  "status": 200,
  "data": null,
  "message": "主程序根目录设置成功",
  "time": 1754846700429
}
```

### 2. 获取主程序根目录

**GET** `/pathCache/getMainRoot`

获取当前设置的主程序根目录。

#### 响应示例

```json
{
  "status": 200,
  "data": "E:\\MaimBot\\HMML",
  "message": "获取主程序根目录成功",
  "time": 1754846700429
}
```

### 3. 添加适配器根目录

**POST** `/pathCache/addAdapterRoot`

为指定适配器添加根目录路径。

#### 请求参数

```json
{
  "adapterName": "TestAdapter",
  "rootPath": "E:/MaimBot"
}
```

#### 响应示例

```json
{
  "status": 200,
  "data": null,
  "message": "适配器根目录添加成功",
  "time": 1754846700429
}
```

### 4. 更新适配器根目录

**PUT** `/pathCache/updateAdapterRoot`

更新指定适配器的根目录路径。

#### 请求参数

```json
{
  "adapterName": "TestAdapter",
  "rootPath": "E:/MaimBot/HMML/dist"
}
```

#### 响应示例

```json
{
  "status": 200,
  "data": null,
  "message": "适配器根目录更新成功",
  "time": 1754846700429
}
```

### 5. 删除适配器根目录

**DELETE** `/pathCache/removeAdapterRoot?adapterName={适配器名称}`

删除指定适配器的根目录缓存。

#### 请求参数

通过查询参数传递：
- `adapterName`: 要删除的适配器名称

#### 请求示例

```
DELETE /pathCache/removeAdapterRoot?adapterName=SkinAdapter
```

#### 响应示例

```json
{
  "status": 200,
  "data": null,
  "message": "适配器根目录移除成功",
  "time": 1754846700429
}
```

### 6. 获取指定适配器根目录

**GET** `/pathCache/getAdapterRoot/{适配器名称}`

获取指定适配器的根目录路径。

#### 请求示例

```
GET /pathCache/getAdapterRoot/TestAdapter
```

#### 响应示例

```json
{
  "status": 200,
  "data": "E:\\MaimBot\\HMML\\dist",
  "message": "获取适配器根目录成功",
  "time": 1754846700429
}
```

### 7. 获取所有路径

**GET** `/pathCache/getAllPaths`

获取所有缓存的路径信息，包括主程序根目录和所有适配器根目录。

#### 响应示例

```json
{
  "status": 200,
  "data": {
    "mainRoot": "E:\\MaimBot\\HMML",
    "adapterRoots": [
      {
        "adapterName": "TestAdapter",
        "rootPath": "E:\\MaimBot"
      }
    ]
  },
  "message": "获取所有路径成功",
  "time": 1754846700429
}
```

### 8. 获取所有适配器列表

**GET** `/pathCache/getAllAdapters`

获取所有已注册的适配器名称列表。

#### 响应示例

```json
{
  "status": 200,
  "data": ["TestAdapter"],
  "message": "获取适配器列表成功",
  "time": 1754846700429
}
```

### 9. 获取缓存统计信息

**GET** `/pathCache/getStats`

获取路径缓存的统计信息。

#### 响应示例

```json
{
  "status": 200,
  "data": {
    "hasMainRoot": true,
    "adapterCount": 1,
    "lastUpdated": "2025-08-10T17:17:50.398Z"
  },
  "message": "获取缓存统计信息成功",
  "time": 1754846700429
}
```

### 10. 清空所有缓存

**DELETE** `/pathCache/clearCache`

清空所有路径缓存，包括主程序根目录和所有适配器根目录。

#### 响应示例

```json
{
  "status": 200,
  "data": null,
  "message": "缓存清空成功",
  "time": 1754846700429
}
```

## 错误处理

API 使用标准的HTTP状态码和统一的错误响应格式：

### 常见错误响应

#### 400 Bad Request - 参数验证失败

```json
{
  "status": 400,
  "data": "缺少必需参数: adapterName",
  "message": "参数验证失败",
  "time": 1754846700429
}
```

#### 404 Not Found - 资源不存在

```json
{
  "status": 404,
  "data": "适配器不存在",
  "message": "适配器不存在",
  "time": 1754846700429
}
```

#### 409 Conflict - 资源冲突

```json
{
  "status": 409,
  "data": "适配器已存在",
  "message": "适配器已存在",
  "time": 1754846700429
}
```

#### 500 Internal Server Error - 服务器内部错误

```json
{
  "status": 500,
  "data": "路径验证失败: 路径不存在",
  "message": "设置主程序根目录失败",
  "time": 1754846700429
}
```

## 路径验证规则

所有路径在设置前都会进行严格验证：

1. **路径格式验证**: 检查路径格式是否符合操作系统规范
2. **路径存在性验证**: 确保指定路径实际存在于文件系统中
3. **目录验证**: 确保路径指向的是目录而非文件
4. **路径长度验证**: Windows系统最长260字符，Linux/Unix系统最长4096字符

## 使用示例

### PowerShell 示例

```powershell
# 设置主程序根目录
Invoke-WebRequest -Uri "http://localhost:7999/api/pathCache/setRootPath" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"mainRoot":"E:/MaimBot/HMML"}'

# 添加适配器根目录
Invoke-WebRequest -Uri "http://localhost:7999/api/pathCache/addAdapterRoot" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"adapterName":"TestAdapter","rootPath":"E:/MaimBot"}'

# 获取所有路径
Invoke-WebRequest -Uri "http://localhost:7999/api/pathCache/getAllPaths" -Method GET

# 删除适配器（使用查询参数）
Invoke-WebRequest -Uri "http://localhost:7999/api/pathCache/removeAdapterRoot?adapterName=TestAdapter" -Method DELETE
```

### curl 示例

```bash
# 设置主程序根目录
curl -X POST "http://localhost:7999/api/pathCache/setRootPath" \
     -H "Content-Type: application/json" \
     -d '{"mainRoot":"E:/MaimBot/HMML"}'

# 添加适配器根目录
curl -X POST "http://localhost:7999/api/pathCache/addAdapterRoot" \
     -H "Content-Type: application/json" \
     -d '{"adapterName":"TestAdapter","rootPath":"E:/MaimBot"}'

# 获取所有路径
curl -X GET "http://localhost:7999/api/pathCache/getAllPaths"

# 删除适配器
curl -X DELETE "http://localhost:7999/api/pathCache/removeAdapterRoot?adapterName=TestAdapter"
```

## 数据持久化

路径缓存数据会自动保存到 `data/pathCache.json` 文件中，确保服务重启后数据不会丢失。数据文件格式如下：

```json
{
  "mainRoot": "E:\\MaimBot\\HMML",
  "adapterRoots": {
    "TestAdapter": {
      "adapterName": "TestAdapter",
      "rootPath": "E:\\MaimBot",
      "addedAt": "2025-08-10T17:16:26.540Z"
    }
  },
  "lastUpdated": "2025-08-10T17:17:50.398Z"
}
```

## 安全考虑

1. **路径验证**: 所有输入路径都经过严格验证，防止路径遍历攻击
2. **参数校验**: 所有API参数都进行类型和格式验证
3. **错误处理**: 敏感信息不会在错误消息中暴露
4. **日志记录**: 所有操作都会记录详细日志用于审计
