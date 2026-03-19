---
title: Chrome DevTools 里直接 Copy as fetch
category: 每日技巧
tags:
  - Chrome
  - DevTools
  - 工具
---

# Chrome DevTools 里直接 Copy as fetch

## 适用场景

你想快速复现某个请求，或者把线上请求搬到本地脚本里调试。

## 推荐做法

- 打开 `Network`
- 右键目标请求
- 选择 `Copy` -> `Copy as fetch`

## 收益

- 能快速在控制台或本地脚本里复现请求
- 调试接口参数和 Header 更方便

## 注意点

- 复制下来的鉴权信息可能会过期
- 提交代码前不要把敏感 Header 带进仓库
