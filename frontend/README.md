# MaiMai Launcher Frontend

麦麦启动器前端项目 - 基于 Vue3 + TypeScript + TailwindCSS + DaisyUI 构建的现代化管理界面。

## ✨ 特性

- 🎯 **Vue 3** - 使用最新的 Vue 3 Composition API
- 📘 **TypeScript** - 完整的类型安全支持
- 🎨 **TailwindCSS 3** - 实用优先的 CSS 框架
- 🌼 **DaisyUI** - 美观的组件库
- ⚡ **Vite** - 极快的构建工具
- 🍍 **Pinia** - 现代化状态管理
- 🛣️ **Vue Router** - 官方路由管理器
- 🧪 **Vitest** - 快速的单元测试框架
- 📏 **ESLint + Prettier** - 代码质量和格式化
- 🐶 **Husky + Lint-Staged** - Git 提交钩子

## 🏗️ 项目结构

```
src/
├── assets/           # 静态资源
│   └── styles/      # 样式文件
├── components/      # 可复用组件
│   └── layout/     # 布局组件
├── router/         # 路由配置
├── stores/         # Pinia 状态管理
├── types/          # TypeScript 类型定义
├── utils/          # 工具函数
├── views/          # 页面组件
│   ├── logs/       # 日志相关页面
│   ├── settings/   # 设置相关页面
│   └── resources/  # 资源管理页面
├── App.vue         # 根组件
└── main.ts         # 应用入口
```

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发环境

```bash
pnpm run dev
```

### 构建生产版本

```bash
pnpm run build
```

### 预览构建结果

```bash
pnpm run preview
```

### 运行测试

```bash
pnpm run test
```

### 代码检查和格式化

```bash
# ESLint 检查
pnpm run lint

# Prettier 格式化
pnpm run format

# TypeScript 类型检查
pnpm run type-check
```

## 📱 功能模块

### 首页
- 系统状态总览
- 实时数据展示
- 快速操作入口
- 最近活动记录

### 日志管理
- 麦麦本体日志查看
- 适配器日志监控
- 实时日志流
- 日志过滤和搜索

### 设置管理
- 麦麦本体参数配置
- AI 模型设置
- 平台适配器配置
- 高级选项管理

### 资源管理
- Emoji 表情包管理
- 表达方式库管理
- 人物信息维护
- 资源分类整理

### 系统功能
- 多主题切换
- 响应式设计
- 国际化支持
- 数据导入导出

## 🎨 设计系统

项目使用 DaisyUI 组件库，支持多种主题：

- **Light** - 明亮主题
- **Dark** - 深色主题
- **Auto** - 跟随系统

### 颜色规范

```css
/* 主色调 */
--primary: #3b82f6
--secondary: #64748b
--accent: #f59e0b

/* 功能色 */
--success: #10b981
--warning: #f59e0b
--error: #ef4444
--info: #06b6d4
```

## 🔧 环境配置

创建 `.env.local` 文件：

```env
VITE_APP_TITLE=MaiMai Launcher
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_BASE_URL=ws://localhost:8080/ws
```

## 📝 开发规范

### 代码风格

- 使用 2 空格缩进
- 使用单引号
- 行末不加分号
- 使用 TypeScript 严格模式

### 组件规范

- 组件名使用 PascalCase
- 文件名与组件名保持一致
- 使用 Composition API
- 提供完整的类型定义

### 提交规范

使用 Conventional Commits 规范：

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建工具或依赖更新
```

## 🏆 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 87

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 贡献指南

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📞 联系我们

- 问题反馈: [GitHub Issues](https://github.com/your-repo/issues)
- 讨论交流: [GitHub Discussions](https://github.com/your-repo/discussions)

---

⭐ 如果这个项目对你有帮助，请给它一个星标！
