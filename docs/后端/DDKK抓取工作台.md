---
title: DDKK 抓取工作台
---

<DdkkScraperWorkbench />

## 使用说明

先在仓库根目录启动本地服务：

```bash
node script/ddkk-scrape-server.js
```

然后保持 VitePress 开发服务运行：

```bash
bun run docs:dev
```

页面里填写 `ddkk.com` 文章或栏目页地址后，就可以直接从浏览器触发抓取。当前服务接口：

```text
GET  /api/ddkk/health
POST /api/ddkk/scrape
```
