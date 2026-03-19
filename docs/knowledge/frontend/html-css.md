---
title: HTML / CSS 知识点
category: 知识点
tags:
  - 前端
  - HTML
  - CSS
  - 基础
---

# HTML / CSS 知识点

HTML / CSS 是前端的地基。很多框架层面的体验问题，最后都能追溯到结构设计、样式组织和布局策略是否合理。

## 深入学习入口

- [HTML 全体系](./01-core-foundation/html.md)
- [CSS 全体系](./01-core-foundation/css.md)
- [前端核心基础总览](./01-core-foundation/index.md)

## HTML 核心

### 语义化

- 正确使用 `header`、`main`、`section`、`article`、`aside`、`footer`
- 表单元素、列表元素、表格元素按语义使用，而不是全部依赖 `div`
- 对 SEO、无障碍和后期维护都更友好

### 常见关注点

- 文档结构与标题层级
- 表单可用性与 label 绑定
- 图片 `alt` 与媒体资源回退方案
- SEO 基础标签：`title`、`meta description`

## CSS 核心

### 盒模型与选择器

- 标准盒模型和 `box-sizing`
- 继承、优先级、层叠顺序
- 常见选择器与组合选择器

### 布局

- 文档流、定位、浮动的历史包袱
- Flex 适合一维布局
- Grid 适合二维布局
- 响应式布局通常由媒体查询、弹性单位和断点共同完成

### 响应式与适配

- `rem`、`em`、`vw`、`vh` 的使用场景
- 移动端视口设置
- 断点设计不应只看设备型号，而应看内容何时开始失衡

## 进阶方向

- CSS 变量与主题切换
- 动画与过渡
- Sass / Less 等预处理器
- Tailwind / UnoCSS 等原子化方案

## 面试和实战高频点

- `display: none`、`visibility: hidden`、`opacity: 0` 的区别
- BFC 是什么，什么时候会触发
- 水平垂直居中的常见写法
- Flex 和 Grid 的适用边界
- 如何避免样式污染

## 学习建议

- 不要把 CSS 只当“调样式”，它本质上也是界面系统设计能力。
- 一个页面写不清楚，往往不是框架问题，而是结构和层级没有设计好。
- 建议把 HTML 和 CSS 一起练，在真实页面里同时思考结构、语义和视觉层级。
