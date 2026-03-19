---
title: 前端工程化面试题
category: 面试
tags:
  - 面试
  - 工程化
---

# 前端工程化面试题

## 高频问题

- Webpack 和 Vite 的差异
- Babel 的作用是什么
- Tree Shaking 为什么能生效
- pnpm 相比 npm 有什么不同
- ESLint、Prettier、Stylelint 分别解决什么问题
- CI / CD 在前端项目里怎么落地

## 常见追问

- 为什么 Vite 冷启动快
- ESM 为什么更利于 Tree Shaking
- pnpm 的硬链接和依赖隔离解决了什么问题

## 标准回答框架

1. 先讲工具职责
2. 再讲原理差异
3. 再讲真实项目选型依据

## 易错点

- 把构建、编译、包管理混成一件事
- 只会说“更快更现代”，说不出为什么

## 题库示例

### 问题 1：Webpack 和 Vite 有什么区别

**回答要点**

- Webpack 更偏传统完整打包方案，开发和生产都围绕 bundle 展开
- Vite 开发阶段更多利用浏览器原生 ESM，生产阶段再走打包
- 所以 Vite 冷启动和热更新通常更快

**常见追问**

- 为什么 Vite 生产环境仍然需要打包
- Webpack 在什么场景下仍然有优势
