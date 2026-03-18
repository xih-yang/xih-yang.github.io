# Dev Essays

> 逻辑之外，随笔之内

一个使用 VitePress 构建的个人技术随笔网站，记录开发心得、技术思考和编程经验。

## 项目特点

- ✨ **现代化文档**：基于 VitePress 构建，支持 Markdown 语法和 Vue 组件
- 🎨 **响应式设计**：适配各种设备屏幕尺寸
- 📱 **实时预览**：开发时支持热更新，实时查看修改效果
- 🔧 **易于扩展**：支持自定义主题和插件

## 快速开始

### 环境要求

- Node.js 16.x 或更高版本
- npm 或 yarn 或 pnpm

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 开发模式

```bash
npm run docs:dev
```

网站将在 `http://localhost:5173/` 启动（如果端口被占用，会自动尝试其他端口）。

### 构建生产版本

```bash
npm run docs:build
```

构建产物将生成在 `docs/.vitepress/dist` 目录。

### 预览生产版本

```bash
npm run docs:preview
```

## 项目结构

```
dev-essays/
├── docs/                    # 文档内容
│   ├── .vitepress/          # VitePress 配置
│   │   ├── config.mts       # 网站配置
│   │   └── cache/           # 缓存文件
│   ├── index.md             # 首页
│   ├── api-examples.md      # API 示例
│   └── markdown-examples.md # Markdown 示例
├── .gitignore               # Git 忽略文件
├── package.json             # 项目配置
└── README.md                # 项目说明
```

## 如何贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 许可证

MIT License

## 联系方式

- GitHub: [xih-yang](https://github.com/xih-yang)
- Email: your.email@example.com

---

**欢迎访问我的技术随笔网站！** 🚀