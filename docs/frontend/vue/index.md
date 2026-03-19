---
title: Vue 介绍
category: 前端
tags:
  - Vue3
  - 前端
  - 框架
---

# Vue 介绍

## 什么是 Vue？

Vue (读音 /vjuː/，类似于 **view**) 是一套用于构建用户界面的**渐进式框架**。与其它大型框架不同的是，Vue 被设计为可以自底向上逐层应用。Vue 的核心库只关注视图层，不仅易于上手，还便于与第三方库或既有项目整合。

## Vue 的特点

### 1. 渐进式框架

Vue 可以根据项目需求逐步采用：
- **简单页面**：只需引入 Vue 的 CDN 链接即可使用
- **复杂应用**：可以使用 Vue CLI 或 Vite 创建完整的单页应用
- **现有项目**：可以逐步将 Vue 集成到现有项目中

### 2. 响应式数据绑定

Vue 使用基于依赖追踪的响应式系统，当数据变化时，视图会自动更新：

```javascript
import { ref } from 'vue'

const count = ref(0)
// 修改数据，视图自动更新
count.value++
```

### 3. 组件化开发

Vue 鼓励使用组件化开发模式，将页面拆分为可复用的组件：

```vue
<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
  </div>
</template>

<script setup>
defineProps(['msg'])
</script>
```

### 4. 单文件组件 (SFC)

Vue 的单文件组件 (`.vue` 文件) 将 HTML、CSS 和 JavaScript 组合在一个文件中：

```vue
<template>
  <!-- HTML 模板 -->
</template>

<script setup>
// JavaScript 逻辑
</script>

<style scoped>
/* CSS 样式 */
</style>
```

## Vue 版本

### Vue 2

- 发布于 2016 年
- 使用 Options API
- 成熟的生态系统
- 目前处于维护模式

### Vue 3

- 发布于 2020 年
- 使用 Composition API
- 更好的 TypeScript 支持
- 更小的包体积和更好的性能
- **推荐使用**

## 学习路径

1. **基础**：模板语法、响应式数据、计算属性、监听器
2. **组件**：组件注册、Props、事件、插槽
3. **进阶**：生命周期、依赖注入、异步组件
4. **生态**：Vue Router、Pinia/Vuex、构建工具

## 相关资源

- [Vue 官方文档](https://cn.vuejs.org/)
- [Vue Router 文档](https://router.vuejs.org/zh/)
- [Pinia 文档](https://pinia.vuejs.org/zh/)
- [Vue 3 迁移指南](https://v3-migration.vuejs.org/)

## 为什么选择 Vue？

- **易学易用**：平缓的学习曲线，优秀的文档
- **灵活性**：可以作为库使用，也可以作为框架使用
- **性能优秀**：轻量级，运行时性能好
- **生态丰富**：有完整的工具链和丰富的第三方库
- **社区活跃**：有庞大的中文社区支持
