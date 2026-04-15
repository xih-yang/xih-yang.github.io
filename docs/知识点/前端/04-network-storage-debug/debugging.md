---
title: 调试、抓包与线上排障
category: 知识点
tags:
  - 前端
  - DevTools
  - Charles
  - Fiddler
---

# 调试、抓包与线上排障

调试能力是前端工程师的硬实力。越接近线上环境，越考验问题定位路径是否清晰。

## 核心范围

- 浏览器调试：Elements、Console、Network、Performance、Application
- 抓包工具：Charles、Fiddler 的代理、重写、弱网模拟和证书配置
- 线上问题排查：Source Map、日志回放、环境复现、埋点辅助定位

## 排障思路

- 先确认是不是请求问题
- 再确认是渲染问题、状态问题还是环境差异问题
- 最后再去看性能和时序问题

## 常见问题

- 看到报错就改代码，没有先定位发生链路
- 本地环境正常，线上异常时缺少复现手段
- 抓包、日志、Source Map 没有形成组合打法
