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
- [Bun](https://bun.sh/) 1.0.0 或更高版本

### 安装依赖

```bash
bun install
```

### 开发模式

```bash
bun run docs:dev
```

网站将在 `http://localhost:5173/` 启动（如果端口被占用，会自动尝试其他端口）。

### 构建生产版本

```bash
bun run docs:build
```

构建产物将生成在 `docs/.vitepress/dist` 目录。

### 预览生产版本

```bash
bun run docs:preview
```

### 抓取 DDKK 教程内容

仓库内置了一个针对 `ddkk.com` 教程页的抓取脚本，可以从栏目页自动发现文章并导出为 Markdown：

```bash
node script/ddkk-scrape.js --url https://ddkk.com/springboot/4-action/index.html
```

常用参数：

```bash
# 只抓前 3 篇，便于调试
node script/ddkk-scrape.js --url https://ddkk.com/springboot/4-action/index.html --limit 3

# 只抓单篇文章
node script/ddkk-scrape.js --url https://ddkk.com/springboot/4-action/1.html --single

# 指定输出目录，并允许覆盖已有文件
node script/ddkk-scrape.js --url https://ddkk.com/springboot/4-action/index.html --out-dir docs/后端/SpringBoot4 --overwrite
```

默认输出目录是 `tmp/ddkk-springboot`。

### DDKK 可视化抓取页面

如果你想用页面而不是命令行控制抓取，可以启动本地服务再打开 VitePress 页面：

```bash
# 终端 1：启动抓取服务
node script/ddkk-scrape-server.js

# 终端 2：启动文档站
bun run docs:dev
```

然后访问：

```text
http://localhost:5173/后端/DDKK抓取工作台
http://localhost:5173/后端/DDKK菜单栏批量抓取
```

这个页面会调用本地接口触发抓取：

```text
GET  http://127.0.0.1:3456/api/ddkk/health
POST http://127.0.0.1:3456/api/ddkk/scrape
POST http://127.0.0.1:3456/api/ddkk/quick-scrape-mq
POST http://127.0.0.1:3456/api/ddkk/quick-scrape-menu
```

其中 `quick-scrape-mq` 是“12、消息队列合集”一键扒预设，会自动：

- 从 DDKK 首页解析“消息队列合集”下的 24 个子项
- 把 `/category/mq/.../index.html` 转成实际抓取页 `https://ddkk.com/zhuanlan/mq/.../index.html`
- 按 `tmp/12、消息队列合集/序号、 子项名称` 输出
- 默认 `limit=200`
- 默认开启“包含阅读指南”和“覆盖已有文件”

`quick-scrape-menu` 是通用的“菜单栏批量抓取”接口。你只需要传一个菜单栏名称，例如 `消息队列合集`，服务就会：

- 去 DDKK 首页定位该菜单栏区块
- 提取该区块下全部卡片
- 自动把分类页映射为实际抓取页
- 自动生成输出目录 `tmp/菜单栏名称/序号、 子项名称`

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
- Email: yang92yxh@163.com

---

**欢迎访问我的技术随笔网站！** 🚀
