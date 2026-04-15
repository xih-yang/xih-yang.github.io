---
title: Mock 与 Serverless
category: 知识点
tags:
  - 前端
  - Mock
  - Serverless
  - 云开发
---

# Mock 与 Serverless

这部分能力适合快速搭建验证环境，也适合前端把简单业务闭环自己跑起来。

## 核心范围

- Mock 工具：Mock.js、MSW、本地 JSON Server、接口契约联调
- 云开发：数据库、存储、鉴权、函数一体化能力
- Serverless 函数：按需执行、事件触发、低运维部署

## 实战关注点

- Mock 要服务于联调效率，而不是脱离真实接口长期漂移
- Serverless 要评估冷启动、权限和供应商绑定成本

## 常见问题

- Mock 数据和真实接口结构脱节，越用越难联调
- 把 Serverless 当作“不要后端”的替代品，忽略工程边界
- 本地开发、云端权限和环境变量没有统一管理
