---
title: SSR / SSG 框架
category: 知识点
tags:
  - 前端
  - SSR
  - SSG
  - Next.js
---

# SSR / SSG 框架

SSR 和 SSG 主要解决首屏性能、SEO、数据获取和全栈一体化问题。

## 核心范围

- Next.js：React 体系下的 SSR、SSG、ISR、全栈路由与数据请求
- Nuxt.js：Vue 体系下的 SSR、SSG、模块生态与服务端渲染
- 渲染模式对比：CSR、SSR、SSG、ISR、Streaming SSR
- 选型维度：SEO、内容时效性、服务端成本、交互复杂度

## 实战关注点

- 渲染模式要和业务类型匹配，而不是追热点
- 数据获取、缓存和部署方式必须一起考虑
- 客户端状态和服务端状态的边界要明确

## 常见问题

- 把 SSR 当成性能万能药，没有评估服务端开销
- 需要频繁更新的数据却选了纯静态生成
- 路由和数据获取方式混用，导致心智负担过高
