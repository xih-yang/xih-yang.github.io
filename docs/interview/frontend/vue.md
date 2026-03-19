---
title: Vue 面试题
category: 面试
tags:
  - 面试
  - Vue
---

# Vue 面试题

## 高频问题

- `ref` 和 `reactive` 的区别
- `computed` 和 `watch` 的使用边界
- 组件通信有哪些方式
- Pinia 和 Vuex 的差异
- Vue3 相比 Vue2 的核心变化

## 项目题方向

- 你们是如何组织 composables 的
- 状态管理为什么这么拆
- 大页面性能优化做过什么

## 常见追问

- `watch` 和 `watchEffect` 区别是什么
- `ref` 包对象和 `reactive` 有什么差异
- 为什么某些场景下要拆 composables

## 标准回答框架

1. 先说 Vue 的响应式机制
2. 再讲 API 之间的边界
3. 再落到项目里的使用方式

## 易错点

- 混淆 `computed`、`watch`、`watchEffect`
- 只说 API 用法，不说状态组织思路

## 题库示例

### 问题 1：`ref` 和 `reactive` 有什么区别

**回答要点**

- `ref` 更适合包基础类型，也可以包对象
- `reactive` 主要用于对象类型的响应式代理
- `ref` 通过 `.value` 取值，模板里会自动解包
- 实际项目里通常会混合使用，而不是二选一

**常见追问**

- 为什么 `reactive` 不能直接替代所有 `ref`
- `ref` 包对象时和 `reactive` 的体验差在哪里

### 问题 2：`computed` 和 `watch` 的边界是什么

**回答要点**

- `computed` 适合从已有状态推导新值
- `watch` 更适合监听变化后执行副作用
- 如果只是派生数据，优先考虑 `computed`
- 如果涉及请求、日志、同步外部状态，更适合 `watch`

**常见追问**

- `watchEffect` 和 `watch` 区别是什么
- 为什么不建议把所有逻辑都塞进 `watch`

### 问题 3：Vue3 相比 Vue2 的核心变化有哪些

**回答要点**

- 响应式底层从 `Object.defineProperty` 转向 `Proxy`
- 组合式 API 让逻辑复用和大型组件组织更灵活
- TypeScript 友好度更高
- 性能和 Tree Shaking 能力整体更好

**常见追问**

- `Proxy` 相比旧方案解决了什么问题
- 组合式 API 为什么更适合大型项目
