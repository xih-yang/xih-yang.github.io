---
title: 请求状态统一管理的小技巧
category: 每日技巧
tags:
  - 前端
  - 请求
  - 状态管理
---

# 请求状态统一管理的小技巧

## 适用场景

页面上有加载中、空态、错误态、成功态时，如果每个接口都单独拼判断，组件会很快变乱。

## 推荐做法

统一约定请求状态字段：

```ts
type RequestState<T> = {
  loading: boolean
  data: T | null
  error: string | null
}
```

## 收益

- 页面分支更清晰
- 错误态和重试逻辑更容易复用
- 适合继续封装成 hooks 或 composables

## 延伸

- 复杂页面可以继续补 `empty`、`refreshing`、`lastUpdated` 等状态
- 如果项目里接口很多，适合继续抽成统一请求层
