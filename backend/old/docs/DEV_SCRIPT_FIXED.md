# 🎯 HMML 开发脚本修复完成

## 📋 问题解决

✅ **原始问题**: `dev.ps1` 脚本存在编码问题，导致 PowerShell 解析错误
✅ **解决方案**: 修复了所有编码问题，保留完整功能
✅ **结果**: 原始 `dev.ps1` 脚本现在完全正常工作

## 🛠️ 修复内容

### 1️⃣ 编码问题修复
- 修复了中文字符编码导致的 PowerShell 解析错误
- 保持所有原始功能不变
- 确保 PowerShell 5.1 兼容性

### 2️⃣ 文件处理
- 原损坏脚本备份为 `dev-broken.ps1`
- 修复后的脚本替换为原始 `dev.ps1`
- 删除了临时的简化版本 `quick-dev.ps1`

### 3️⃣ 功能验证
- ✅ 版本更新功能正常
- ✅ 增量版本更新正常
- ✅ 构建预览模式正常
- ✅ 项目状态查看正常
- ✅ npm 脚本集成正常

## 🚀 完整功能列表

### 直接使用脚本
```bash
# 构建与发布
.\dev.ps1 release [版本号]     # 生产构建
.\dev.ps1 dev [版本号]         # 开发构建
.\dev.ps1 build               # 仅构建 TypeScript

# 版本管理
.\dev.ps1 version <版本号>     # 更新版本号
.\dev.ps1 bump <类型>         # 增量更新 (major|minor|patch)

# 状态与信息
.\dev.ps1 status              # 项目状态
.\dev.ps1 info                # 版本信息

# 维护工具
.\dev.ps1 clean               # 清理构建产物
.\dev.ps1 clean -All          # 清理所有文件
.\dev.ps1 install             # 安装依赖
.\dev.ps1 start               # 启动应用
.\dev.ps1 test                # 运行测试
```

### 通过 npm 脚本使用
```bash
pnpm run release              # 生产构建
pnpm run dev:build            # 开发构建
pnpm run bump:patch           # 补丁版本更新
pnpm run bump:minor           # 次要版本更新
pnpm run bump:major           # 主要版本更新
pnpm run status               # 项目状态
```

### 高级选项
```bash
.\dev.ps1 release -DryRun     # 预览模式
.\dev.ps1 release -Open       # 构建后打开目录
.\dev.ps1 dev -Watch          # 启用监视模式
.\dev.ps1 build -SkipTests    # 跳过测试
.\dev.ps1 clean -All          # 清理所有文件
```

## 📊 当前状态

- **版本号**: 1.2.0 (已自动同步)
- **脚本状态**: ✅ 完全正常
- **功能完整性**: ✅ 100% 保留
- **编码问题**: ✅ 已修复
- **PowerShell 兼容性**: ✅ 5.1+ 支持

## 🎉 总结

现在您拥有一个完全修复的、功能完整的 `dev.ps1` 脚本，它提供：

1. **完整的版本管理** - 单一真实源，自动同步
2. **快速环境切换** - development ↔ production
3. **自动化构建流程** - 清理 → 构建 → 打包
4. **便捷的开发工具** - 状态查看、清理、测试等
5. **灵活的选项支持** - 预览模式、监视模式等

您可以像之前计划的那样使用所有功能，编码问题已经完全解决！
