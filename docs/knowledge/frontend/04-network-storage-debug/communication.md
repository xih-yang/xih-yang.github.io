---
title: 页面与端间通信方案
category: 知识点
tags:
  - 前端
  - postMessage
  - iframe
  - BroadcastChannel
---

# 页面与端间通信方案

页面通信经常出现在多标签页、嵌入式页面、微前端和跨端容器场景里。

## 核心范围

- `iframe` 通信与嵌入边界
- `postMessage` 的跨窗口消息传递与安全校验
- `BroadcastChannel` 的多标签页广播
- 其他补充：`storage` 事件、SharedWorker、MessageChannel

## 实战关注点

- 通信协议要定义清楚消息格式和来源校验
- 多标签页同步要考虑兼容性和生命周期
- 微前端场景里最好提前约定通道和权限边界

## 常见问题

- `postMessage` 发得出去，但不校验来源
- 标签页之间状态同步依赖偶然行为，没有统一机制
- 容器通信和业务状态耦合太深，后面很难维护
