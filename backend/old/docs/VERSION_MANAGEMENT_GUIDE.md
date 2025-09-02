# HMML 版本管理系统

## 概述

HMML 现在拥有完整的版本管理机制，支持应用程序版本和配置文件版本的独立管理，遵循语义化版本规范，并提供自动配置迁移功能。

## 🏗️ 架构设计

### 分布式文件结构

```
src/core/version/
├── types.ts              # 版本管理类型定义
├── semver.ts              # 语义化版本解析器
├── appVersion.ts          # 应用版本管理器
├── configVersion.ts       # 配置版本管理器
├── configMigration.ts     # 配置迁移管理器
├── utils.ts               # 版本管理工具函数
└── index.ts               # 模块导出入口
```

### 核心组件

1. **语义化版本解析器** (`SemVerParser`)
   - 解析和比较语义化版本
   - 支持预发布版本和构建元数据
   - 提供版本增量更新功能

2. **应用版本管理器** (`ApplicationVersionManager`)
   - 管理应用程序版本信息
   - 自动创建和维护 `version.json` 文件
   - 支持构建时间、Git 哈希等元数据

3. **配置版本管理器** (`ConfigVersionManager`)
   - 管理配置文件版本
   - 自动检测版本差异
   - 触发配置迁移流程

4. **配置迁移管理器** (`ConfigMigrationManager`)
   - 执行配置文件迁移
   - 支持多步骤迁移链
   - 记录详细的变更信息

## 📋 功能特性

### 1. 双版本体系

- **应用版本**: 存储在 `version.json`，管理应用程序本体版本
- **配置版本**: 存储在 `config/.{name}.version.json`，管理配置文件版本
- **独立管理**: 两个版本可以独立更新，互不影响

### 2. 自动配置迁移

```typescript
// 示例迁移规则：1.0.0 -> 1.1.0
{
  from: '1.0.0',
  to: '1.1.0',
  description: '添加数据库配置支持',
  migrate: (oldConfig) => {
    const newConfig = { ...oldConfig };
    if (!newConfig.database) {
      newConfig.database = {
        type: 'sqlite',
        path: './data/hmml.db',
        autoMigrate: true
      };
    }
    return newConfig;
  }
}
```

### 3. 版本信息显示

应用启动时会显示完整的版本信息：
```
🔖 版本: 1.0.0 (development)
🌍 环境: development
🕐 构建时间: 2025-08-10 18:34:19
⚙️ 配置版本: 1.0.0
```

### 4. 配置变更跟踪

自动记录配置迁移过程中的所有变更：
- 新增配置项
- 删除配置项
- 修改配置项
- 重命名配置项

## 🔧 使用方法

### 启动应用

版本管理系统会在应用启动时自动初始化：

```typescript
async function main() {
  const app = new Application();
  await app.initialize(); // 自动初始化版本系统
  await app.start();
}
```

### 查看版本信息

在运行的应用中输入命令：
- `config` 或 `c` - 显示配置和版本信息
- `status` 或 `s` - 显示运行状态

### 手动版本管理

可以通过 CLI 工具进行版本管理：

```bash
# 显示版本信息
node dist/tools/version-cli.js info

# 更新应用版本
node dist/tools/version-cli.js update-app 1.1.0

# 增量更新版本
node dist/tools/version-cli.js bump patch

# 检查配置迁移
node dist/tools/version-cli.js check-config
```

## 📁 生成的文件

### 应用版本文件 (`version.json`)

```json
{
  "version": "1.0.0",
  "semanticVersion": {
    "major": 1,
    "minor": 0,
    "patch": 0
  },
  "buildTime": "2025-08-10T10:34:19.141Z",
  "environment": "development"
}
```

### 配置版本文件 (`config/.server.version.json`)

```json
{
  "version": "1.0.0",
  "semanticVersion": {
    "major": 1,
    "minor": 0,
    "patch": 0
  },
  "lastUpdated": "2025-08-10T10:34:19.144Z"
}
```

### 更新的配置文件 (`config/server.json`)

```json
{
  "version": "1.0.0",
  "server": { ... },
  "logger": { ... },
  "security": { ... },
  "app": { ... }
}
```

## 🚀 部署与构建

### SEA 可执行文件

版本管理系统已完全集成到 SEA (Single Executable Applications) 构建中：

```bash
pnpm run sea:win  # 构建 Windows 可执行文件
```

生成的 `build/hmml-win.exe` 包含完整的版本管理功能。

### 版本一致性

- 应用版本从 `package.json` 自动同步
- 配置版本独立管理，支持向后兼容
- 构建时自动更新版本信息

## 📈 扩展性

### 添加新的迁移规则

```typescript
// 在 ConfigVersionManager 中添加
this.migrationManager.registerMigration({
  from: '1.1.0',
  to: '1.2.0',
  description: '添加新功能配置',
  migrate: (oldConfig) => {
    // 迁移逻辑
    return newConfig;
  }
});
```

### 自定义版本信息

```typescript
await appVersionManager.updateVersion('1.2.0', {
  buildTime: new Date().toISOString(),
  gitHash: 'abc123',
  environment: 'production'
});
```

## 🛡️ 最佳实践

1. **版本规范**: 严格遵循语义化版本规范 (Semantic Versioning)
2. **向后兼容**: 配置迁移必须保持向后兼容性
3. **错误处理**: 迁移失败时回退到安全状态
4. **日志记录**: 详细记录所有版本变更和迁移过程
5. **测试覆盖**: 为每个迁移规则编写测试用例

## 🎯 总结

HMML 版本管理系统提供了：

✅ **完整的版本控制** - 应用和配置双版本体系  
✅ **自动配置迁移** - 智能检测和升级配置文件  
✅ **语义化版本** - 标准的版本管理规范  
✅ **分布式设计** - 每个文件专注单一功能  
✅ **生产就绪** - 集成到 SEA 构建流程  
✅ **开发友好** - 完整的 CLI 工具支持  

这个系统确保了 HMML 应用在版本升级过程中的稳定性和可维护性，为未来的功能扩展提供了坚实的基础。
