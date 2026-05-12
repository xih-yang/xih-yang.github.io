---
title: DDKK 菜单栏批量抓取
---

<DdkkMenuScraperWorkbench />

## 使用说明

先启动本地服务：

```bash
node script/ddkk-scrape-server.js
```

再启动文档站：

```bash
bun run docs:dev
```

这个页面只需要输入菜单栏名称，例如：

- `消息队列合集`
- `Java并发合集`
- `设计模式合集`

然后页面会自动：

- 去 DDKK 首页搜索对应菜单栏区块
- 找出该区块下所有卡片链接
- 自动把分类页映射为实际抓取页
- 自动生成输出目录 `tmp/菜单栏名称/序号、 子项名称`
