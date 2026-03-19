---
title: React 全家桶
category: 知识点
tags:
  - 前端
  - React
  - 框架
---

# React 全家桶

React 生态强调组件化、单向数据流和以状态驱动 UI。学习时要把 React 本体和周边生态分开看。

## 核心范围

- React 基础：JSX、组件、Props、State、Hooks
- 路由：React Router 的页面组织、嵌套路由和数据流转
- 状态管理：Redux、Zustand、Jotai 等方案的取舍
- 工程协作：TypeScript、测试、样式方案和目录拆分
- 服务端能力：Next.js、Server Components、Server Actions 的关系

## 实战关注点

- 组件边界和状态边界要一起设计
- 副作用、异步请求和缓存策略需要统一思路
- 路由、状态管理和 SSR 不要同时无差别上满

## 常见问题

- 组件拆分过细或过粗，导致复用和维护都困难
- `useEffect` 滥用，副作用和渲染逻辑缠在一起
- 看到状态管理库就上，没有先想清楚数据流复杂度

## 学习路线

1. 先学组件、Hooks、列表渲染和表单状态。
2. 再补 React Router 和一套状态管理方案。
3. 最后进入 Next.js、全栈数据流和性能优化。
