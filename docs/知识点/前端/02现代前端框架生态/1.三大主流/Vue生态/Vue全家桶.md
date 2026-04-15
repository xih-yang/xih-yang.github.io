---
title: Vue 全家桶
category: 知识点
tags:
  - 前端
  - Vue
  - 框架
---

# Vue 全家桶

Vue 生态强调响应式、模板语法和渐进式接入，适合把组件通信与状态变化链路学得很清楚。

## 核心范围

- Vue3 基础：`ref`、`reactive`、`computed`、`watch`、组件通信
- 路由：Vue Router 的嵌套、守卫、页面组织
- 状态管理：Pinia 的模块设计、异步 action、状态持久化
- 工程协作：组合式 API、TypeScript、Vite 和 composables 设计
- 服务端能力：Nuxt.js 的 SSR、SSG 和全栈能力

## Vue 3 生态从入门到毕业：完整知识点清单

本文档系统梳理 Vue 3 及其全家桶的核心知识点，标注 ⭐️ 常用/重点 与 🔥 新特性/热点，助你查漏补缺、系统掌握。

### 1. Vue 3 核心基础

#### 1.1 创建应用

```js
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')
```
#### 1.2 模板语法
- 插值：{{ msg }}
- 指令：v-bind（简写 :）、v-on（简写 @）、v-html、v-text
- 表达式：支持简单 JavaScript 表达式

#### 1.3 响应式基础
| API      | 用法                                       | 特点                                                     |
|----------|--------------------------------------------|----------------------------------------------------------|
| ref      | `const count = ref(0)`                     | 基本类型/对象均可，通过 `.value` 访问                     |
| reactive | `const state = reactive({ count: 0 })`     | 仅用于对象，无需 `.value`，解构会丢失响应式               |

⭐️ 常用：ref 优先，基本类型必须用 ref，对象可选 reactive。

#### 1.4 计算属性与侦听器

```js
import { computed, watch, watchEffect } from 'vue'

// 计算属性 ⭐️
const double = computed(() => count.value * 2)

// 侦听器
watch(count, (newVal, oldVal) => { ... }, { immediate, deep })
watchEffect(() => { ... }) // 自动收集依赖
```

#### 1.5 类与样式绑定 ⭐️

```html
<div :class="{ active: isActive, 'text-danger': error }"></div>
<div :class="[activeClass, errorClass]"></div>
<div :style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>
```

#### 1.6 条件渲染 / 列表渲染

```html
<!-- 条件 -->
<div v-if="visible">...</div>
<div v-else-if="...">...</div>
<div v-else>...</div>
<div v-show="visible">...</div>

<!-- 列表 ⭐️ -->
<li v-for="item in list" :key="item.id">{{ item.name }}</li>
```

#### 1.7 事件处理

```html
<button @click="handleClick">Click</button>
<button @click="handleClick('arg', $event)">Click</button>
<!-- 修饰符 -->
<button @click.stop.prevent="..."></button>
```

#### 1.8 表单输入绑定 ⭐️

```html
<input v-model="text" />
<input v-model.trim="text" />
<input type="checkbox" v-model="checked" />
<select v-model="selected">
  <option v-for="opt in options" :value="opt.value">{{ opt.label }}</option>
</select>
```

#### 1.9 生命周期钩子
| 选项式 API   | 组合式 API       | 说明                                   |
|--------------|------------------|----------------------------------------|
| beforeCreate | -                | 组合式中无对应，setup 本身在此阶段     |
| created      | -                | 同上                                   |
| beforeMount  | onBeforeMount    | 挂载前                                 |
| mounted      | onMounted ⭐️     | DOM 已渲染，最常用                     |
| beforeUpdate | onBeforeUpdate   | 更新前                                 |
| updated      | onUpdated        | 更新后                                 |
| beforeUnmount| onBeforeUnmount  | 卸载前                                 |
| unmounted    | onUnmounted ⭐️   | 清理副作用                             |

#### 1.10 组件基础

**Props**

```vue
<script setup>
const props = defineProps<{
  title: string
  count?: number
}>()
</script>
```

⭐️ 常用：defineProps + TypeScript 类型声明。

**Emits**

```vue
<script setup>
const emit = defineEmits<{
  (e: 'update', value: number): void
}>()
emit('update', 123)
</script>
```

**Slots**

```html
<slot name="header" :user="user">默认内容</slot>
```

使用：

```html
<template #header="{ user }">{{ user.name }}</template>
```

#### 1.11 组件通信方式
| 方式             | 适用场景                             |
|------------------|--------------------------------------|
| Props / Emits    | 父子组件 ⭐️                         |
| Provide / Inject | 祖先-后代（跨层级）⭐️               |
| Pinia / Vuex     | 全局状态 ⭐️                         |
| 事件总线 (mitt)  | 任意组件，但需注意内存管理           |

#### 1.12 动态组件 & keep-alive

```html
<component :is="currentTab" />
<keep-alive>
  <component :is="currentTab" />
</keep-alive>
```
### 2. 组合式 API（Composition API）

#### 2.1 `script setup` ⭐️

```vue
<script setup>
import { ref, onMounted } from 'vue'
const count = ref(0)
onMounted(() => {})
</script>
```

特点：编译时语法糖，顶层变量自动暴露给模板，性能更好，代码更简洁。

#### 2.2 响应式 API 详解
| API          | 说明                       | 使用场景                             |
|--------------|----------------------------|--------------------------------------|
| ref          | 响应式引用，任何类型       | 基本类型/对象/数组 ⭐️               |
| reactive     | 响应式代理，仅对象         | 大型对象，但注意解构丢失响应式       |
| computed     | 计算属性，缓存结果         | 派生状态 ⭐️                         |
| watch        | 惰性侦听特定源             | 需要访问旧值或 deep 时               |
| watchEffect  | 自动收集依赖，立即执行     | 简单副作用 ⭐️                       |

#### 2.3 工具函数

```js
// 将 ref 解包为普通值（模板中自动解包，组合式中需手动）
const value = unref(myRef)  // 等价于 isRef(myRef) ? myRef.value : myRef

// 将响应式对象转换为普通 ref 对象（保留响应式）
const { count } = toRefs(state)  // 解构时保持响应式
const countRef = toRef(state, 'count')
```

#### 2.4 生命周期在组合式 API 中

```js
import { onMounted, onUnmounted, onUpdated } from 'vue'
onMounted(() => { ... })
```

⭐️ 注意：beforeCreate 和 created 没有直接对应，因为 setup 本身就在它们之前执行。

#### 2.5 模板引用

```vue
<script setup>
import { ref, onMounted } from 'vue'

const input = ref(null)        // 名称与模板中 ref 一致
onMounted(() => input.value.focus())

// Vue 3.5+ 推荐 useTemplateRef
import { useTemplateRef } from 'vue'
const inputRef = useTemplateRef('input')
</script>

<template>
  <input ref="input" />
</template>
```

#### 2.6 异步组件

```js
import { defineAsyncComponent } from 'vue'

const AsyncComp = defineAsyncComponent(() => import('./MyComp.vue'))
```

#### 2.7 自定义组合式函数（Composables）

```js
// useMouse.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  function update(e) {
    x.value = e.pageX
    y.value = e.pageY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  return { x, y }
}
```

⭐️ 命名规范：以 use 开头，返回响应式状态或方法。

### 3. Vue Router 4 / 5

#### 3.1 基本配置

```js
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About }
  ]
})
```

#### 3.2 动态路由匹配

```js
{ path: '/users/:id', component: User }
```

在组件中获取参数：

```js
import { useRoute } from 'vue-router'
const route = useRoute()
console.log(route.params.id)
```

#### 3.3 嵌套路由

```js
{
  path: '/user/:id',
  component: User,
  children: [
    { path: 'profile', component: UserProfile },
    { path: 'posts', component: UserPosts }
  ]
}
```

父组件中需放置 `router-view`。

#### 3.4 编程式导航 ⭐️

```js
import { useRouter } from 'vue-router'
const router = useRouter()

router.push('/about')
router.push({ path: '/about', query: { plan: 'private' } })
router.replace('/')
router.go(-1)
```

#### 3.5 命名路由 & 命名视图

```js
// 命名路由
{ path: '/user/:id', name: 'user', component: User }
router.push({ name: 'user', params: { id: 123 } })

// 命名视图
<router-view name="header"></router-view>
{
  path: '/',
  components: {
    default: Home,
    header: Header
  }
}
```

#### 3.6 路由守卫
| 类型         | 用法                                  |
|--------------|---------------------------------------|
| 全局前置     | router.beforeEach((to, from) => { ... }) |
| 全局解析     | router.beforeResolve                  |
| 全局后置     | router.afterEach                      |
| 路由独享     | { path: ..., beforeEnter: (to, from) => {...} } |
| 组件内       | onBeforeRouteUpdate, onBeforeRouteLeave |

#### 3.7 路由元信息

```js
{ path: '/admin', component: Admin, meta: { requiresAuth: true } }
```

#### 3.8 路由懒加载 ⭐️

```js
{ path: '/about', component: () => import('./About.vue') }
```

#### 3.9 组合式 API 中使用路由 ⭐️

```js
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()
```

#### 3.10 Vue Router 5 新特性 🔥
- 文件路由：通过 unplugin-vue-router 或 vue-router/unplugin 自动生成路由
- 类型安全：自动生成 typed-router.d.ts
- 路由组：(group) 文件夹不参与路径

### 4. Pinia 状态管理

#### 4.1 定义 Store

```js
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2
  },
  actions: {
    increment() {
      this.count++
    }
  }
})
```

#### 4.2 组合式 Store（推荐）⭐️

```js
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const double = computed(() => count.value * 2)
  function increment() { count.value++ }
  return { count, double, increment }
})
```

#### 4.3 使用 Store

```js
const store = useCounterStore()
store.count++                // 直接修改
store.$patch({ count: 100 }) // 批量修改
store.$reset()               // 重置
store.increment()            // 调用 action
```

#### 4.4 Getters 与计算属性

```js
// 访问 getter
console.log(store.double)
```

#### 4.5 Actions 可以是异步

```js
actions: {
  async fetchUser(id) {
    const data = await api.getUser(id)
    this.user = data
  }
}
```

#### 4.6 插件

```js
// 持久化插件示例
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
```

#### 4.7 类型安全
Pinia 自带 TypeScript 支持，state、getters、actions 自动推断类型。

#### 4.8 HMR 热更新

```js
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCounterStore, import.meta.hot))
}
```
### 5. TypeScript 在 Vue 中的应用

#### 5.1 Props 类型定义 ⭐️

```vue
<script setup lang="ts">
defineProps<{
  title: string
  count?: number
}>()
</script>
```

#### 5.2 Emits 类型定义

```vue
<script setup lang="ts">
const emit = defineEmits<{
  (e: 'update', value: number): void
  (e: 'delete'): void
}>()
</script>
```

#### 5.3 ref 类型标注

```ts
const count = ref<number>(0)
const user = ref<User | null>(null)
```

#### 5.4 reactive 类型

```ts
interface State {
  name: string
  age: number
}
const state = reactive<State>({ name: '', age: 0 })
```

#### 5.5 computed 类型推导

```ts
const double = computed(() => count.value * 2) // 自动推导为 ComputedRef<number>
```

#### 5.6 provide / inject 类型 ⭐️

```ts
import type { InjectionKey } from 'vue'

export interface User {
  name: string
  age: number
}
export const userKey: InjectionKey<User> = Symbol('user')

// provide
provide(userKey, { name: 'John', age: 30 })

// inject
const user = inject(userKey) // 类型为 User | undefined
```

#### 5.7 组件实例类型

```ts
import MyComponent from './MyComponent.vue'

type Instance = InstanceType<typeof MyComponent>
const comp = ref<Instance | null>(null)
```

#### 5.8 全局类型声明

```ts
// shims-vue.d.ts
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```
### 6. Vite 构建工具

#### 6.1 基础配置

```js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia']
        }
      }
    }
  }
})
```

#### 6.2 环境变量

```js
// .env.development
VITE_API_URL=http://localhost:8080
```

在代码中：import.meta.env.VITE_API_URL

#### 6.3 常用插件 ⭐️
| 插件                       | 用途                               |
|----------------------------|------------------------------------|
| @vitejs/plugin-vue         | Vue 单文件组件支持                 |
| vite-plugin-pages          | 文件路由自动生成                   |
| unplugin-auto-import       | 自动导入 API                       |
| unplugin-vue-components    | 组件自动注册                       |
| vite-plugin-vue-devtools   | Vue DevTools 集成                  |

#### 6.4 构建优化
- 代码分割：通过 manualChunks 手动分包
- 压缩：默认使用 esbuild，可配置 build.minify
- Tree Shaking：ESM 原生支持

#### 6.5 VitePlus 概念
指基于 Vite 的增强方案，如 VitePlus 插件集或企业级配置模板，通常包含：
- 更严格的 TypeScript 配置
- 多环境构建
- 性能分析工具 (vite-plugin-inspect)
- 组件库按需加载 (如 vite-plugin-style-import)

### 7. Composables 最佳实践

#### 7.1 命名规范
- 文件名：useXxx.ts
- 函数名：useXxx

#### 7.2 响应式状态封装

```ts
export function useLocalStorage<T>(key: string, initial: T) {
  const data = ref<T>(initial)
  const read = () => { data.value = JSON.parse(localStorage.getItem(key) || JSON.stringify(initial)) }
  const write = () => { localStorage.setItem(key, JSON.stringify(data.value)) }
  watch(data, write, { immediate: true })
  return data
}
```

#### 7.3 清理副作用

```ts
export function useInterval(cb: () => void, delay: number) {
  let timer: number
  onMounted(() => {
    timer = setInterval(cb, delay)
  })
  onUnmounted(() => {
    clearInterval(timer)
  })
}
```

或使用 onWatcherCleanup 在 watch 中清理。

#### 7.4 组合式函数的组合

```ts
export function useUser() {
  const { data, loading, error } = useFetch('/api/user')
  const { isOnline } = useNetwork()
  // ...
}
```

#### 7.5 常见 Composables 示例 ⭐️
- useFetch：封装数据请求
- useLocalStorage：本地存储
- useMouse：鼠标位置
- useDebounceFn：防抖
- useEventListener：事件监听
- useTitle：动态标题

### 8. Nuxt.js 全栈框架

#### 8.1 项目结构

```text
├── pages/          # 页面路由（文件路由）⭐️
├── components/     # 自动导入组件
├── composables/    # 自动导入 composables
├── layouts/        # 布局组件
├── middleware/     # 路由中间件
├── plugins/        # Vue 插件
├── server/         # 服务端代码（API、中间件）
├── nuxt.config.ts  # 配置文件
```

#### 8.2 数据获取 ⭐️

```vue
<script setup>
// 客户端 & 服务端通用
const { data, pending, error, refresh } = await useFetch('/api/users')
// 更灵活
const { data } = await useAsyncData('users', () => $fetch('/api/users'))
</script>
```

#### 8.3 路由中间件

```js
// middleware/auth.js
export default defineNuxtRouteMiddleware((to, from) => {
  if (!useAuth().isLoggedIn) return navigateTo('/login')
})
```

#### 8.4 插件

```js
// plugins/vue-query.client.js
export default defineNuxtPlugin((nuxtApp) => {
  const vueQuery = createVueQuery()
  nuxtApp.vueApp.use(vueQuery)
})
```

#### 8.5 模块系统

```bash
npx nuxi@latest module add @pinia/nuxt
```

#### 8.6 部署
- nuxt build：生成 .output/ 目录
- 支持 Node 服务、静态生成 (nuxt generate)、边缘部署 (Cloudflare Workers)

#### 8.7 Nuxt 4 新特性 🔥
- 路由规则布局：routeRules 中可配置 appLayout
- ISR/SWR 负载提取：增量静态再生页面的 payload 被 CDN 缓存
- #server 别名：服务端代码导入更清晰
- 路由组暴露：在 middleware 中可获取 to.meta.groups

### 9. 高频实用知识点（补充）

#### 9.1 Provide / Inject 详解 ⭐️

```js
// 祖先
import { provide, ref } from 'vue'
const theme = ref('dark')
provide('theme', theme)

// 后代
import { inject } from 'vue'
const theme = inject('theme')
```

#### 9.2 自定义指令

```vue
<script setup>
const vFocus = {
  mounted: (el) => el.focus()
}
</script>
<template>
  <input v-focus />
</template>
```

#### 9.3 渲染函数与 JSX

```jsx
import { h } from 'vue'
export default {
  render() {
    return h('div', { class: 'hello' }, 'Hello')
  }
}
```

JSX 需配置 @vitejs/plugin-vue-jsx。

#### 9.4 Teleport

```html
<Teleport to="body">
  <div class="modal">...</div>
</Teleport>
```

#### 9.5 Suspense

```html
<Suspense>
  <AsyncComponent />
  <template #fallback> Loading... </template>
</Suspense>
```

#### 9.6 全局 API

```js
app.component('MyGlobal', MyComponent)
app.directive('focus', ...)
app.config.globalProperties.$http = ...
```

#### 9.7 性能优化技巧
- 懒加载路由/组件：defineAsyncComponent
- 虚拟滚动：vue-virtual-scroller
- v-memo：缓存模板片段，避免不必要的更新
- 合理使用 shallowRef / shallowReactive：减少深度响应式开销

### 10. 升级与迁移

#### 10.1 Vue 2 → Vue 3 关键变化
- 响应式：Vue.observable → reactive / ref
- 生命周期：beforeDestroy → beforeUnmount
- 全局 API：Vue.prototype → app.config.globalProperties
- 插槽语法：slot="header" → v-slot:header 或 #header
- 移除 $on、$off、$once（改用 mitt 或 provide/inject）

#### 10.2 Vue Router 3 → 4/5 变化
- 创建方式：new VueRouter → createRouter
- 模式：mode: 'history' → history: createWebHistory()
- 守卫：next 可选，返回路由对象替代
- 组合式 API：useRouter, useRoute

#### 10.3 Vuex → Pinia 迁移
- 模块：Pinia 没有模块嵌套，通过多个 store 实现
- mutations → 直接修改 state 或 actions
- 命名空间：自动隔离

总结：学习路径建议
基础阶段：掌握 Vue 3 核心（模板语法、组件、响应式）

进阶阶段：深入组合式 API、路由、状态管理

工程化阶段：TypeScript + Vite + 常用插件

全栈阶段：Nuxt.js + 服务端渲染

架构阶段：自定义 composables、性能优化、源码阅读

⭐️ 标注为高频必会知识点，🔥 为 2026 年新特性，建议优先掌握。

## 实战关注点

- 响应式对象和普通对象的边界要清楚
- composables 的职责拆分要尽量稳定
- 页面状态、全局状态和缓存状态最好分层看待

## 常见问题

- `watch` 能解决就全用 `watch`，导致逻辑分散
- 组合式 API 写久了变成“大杂烩 setup”
- 路由、状态和请求层缺少清晰分层

## 学习路线

1. 先掌握响应式系统和组件通信。
2. 再补路由、Pinia 和组合式 API。
3. 最后进入 Nuxt 和服务端渲染场景。
