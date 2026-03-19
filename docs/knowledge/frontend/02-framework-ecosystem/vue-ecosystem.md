---
title: Vue 全家桶
category: 知识点
tags:
  - 前端
  - Vue
  - 框架
---

# Vue 全家桶

Vue 生态强调响应式、模板语法和渐进式接入，适合把组件通信与状态变化链路学得很清楚。

## 核心范围

- Vue3 基础：`ref`、`reactive`、`computed`、`watch`、组件通信
- 路由：Vue Router 的嵌套、守卫、页面组织
- 状态管理：Pinia 的模块设计、异步 action、状态持久化
- 工程协作：组合式 API、TypeScript、Vite 和 composables 设计
- 服务端能力：Nuxt.js 的 SSR、SSG 和全栈能力

## 实战关注点

- 响应式对象和普通对象的边界要清楚
- composables 的职责拆分要尽量稳定
- 页面状态、全局状态和缓存状态最好分层看待

## 常见问题

- `watch` 能解决就全用 `watch`，导致逻辑分散
- 组合式 API 写久了变成“大杂烩 setup”
- 路由、状态和请求层缺少清晰分层

## 学习路线

1. 先掌握响应式系统和组件通信。
2. 再补路由、Pinia 和组合式 API。
3. 最后进入 Nuxt 和服务端渲染场景。
