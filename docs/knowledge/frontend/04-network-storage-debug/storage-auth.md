---
title: 存储、鉴权与离线能力
category: 知识点
tags:
  - 前端
  - Cookie
  - JWT
  - Service Worker
---

# 存储、鉴权与离线能力

存储与鉴权设计会直接影响安全性、易用性和多端登录体验。

## 核心范围

- Cookie、Session、JWT 的职责与适用场景
- 本地存储：`localStorage`、`sessionStorage`、IndexedDB
- PWA：安装体验、缓存策略、离线访问
- Service Worker：请求拦截、资源缓存、消息通信

## 实战关注点

- 鉴权信息放哪里，要结合安全要求和刷新机制来决定
- 离线缓存要注意版本更新与旧资源失效问题

## 常见问题

- 把 Token 存储方案简单粗暴套用到所有项目
- 忽略刷新令牌、登出失效和多端登录的实际流程
- Service Worker 缓存后没有做好版本更新和兜底策略

## 学习路线

1. 先理解 Cookie、Session、JWT 的角色差异。
2. 再掌握浏览器存储和安全边界。
3. 最后补 PWA 与 Service Worker 的离线能力设计。
