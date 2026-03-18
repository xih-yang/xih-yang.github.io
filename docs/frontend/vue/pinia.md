---
title: Vue 状态管理
---

# Vue 状态管理

## 什么是状态管理？

状态管理是指在应用中管理和共享数据的方式。在 Vue 应用中，随着组件数量的增加，组件之间的数据共享会变得复杂。状态管理库提供了一种集中式的方式来管理应用的状态。

## Pinia

Pinia 是 Vue 的官方状态管理库，是 Vuex 的继任者，提供了更简洁的 API 和更好的 TypeScript 支持。

### 安装

```bash
npm install pinia
# 或使用 bun
bun add pinia
```

### 创建 Store

```javascript
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Eduardo'
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
    doublePlusOne() {
      return this.doubleCount + 1
    }
  },
  actions: {
    increment() {
      this.count++
    },
    async fetchUser() {
      const response = await fetch('/api/user')
      this.name = await response.json()
    }
  }
})
```

### 在组件中使用

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>

<template>
  <div>
    <p>Count: {{ counter.count }}</p>
    <p>Double: {{ counter.doubleCount }}</p>
    <button @click="counter.increment()">+1</button>
  </div>
</template>
```

### Setup Store (推荐)

使用组合式 API 风格的 Store：

```javascript
// stores/counter.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  // state
  const count = ref(0)
  const name = ref('Eduardo')
  
  // getters
  const doubleCount = computed(() => count.value * 2)
  
  // actions
  function increment() {
    count.value++
  }
  
  async function fetchUser() {
    const response = await fetch('/api/user')
    name.value = await response.json()
  }
  
  return { count, name, doubleCount, increment, fetchUser }
})
```

## 核心概念

### State

State 是 Store 的核心，存储应用的数据：

```javascript
export const useStore = defineStore('storeId', {
  state: () => {
    return {
      // 所有这些属性都将自动推断出它们的类型
      count: 0,
      name: 'Eduardo',
      isAdmin: true,
      items: [],
      hasChanged: true
    }
  }
})
```

访问 State：

```vue
<script setup>
const store = useStore()

// 直接访问
console.log(store.count)

// 使用 computed 保持响应性
const count = computed(() => store.count)

// 使用 storeToRefs 解构
const { count, name } = storeToRefs(store)
</script>
```

修改 State：

```javascript
// 直接修改
store.count++

// 使用 $patch 修改多个属性
store.$patch({
  count: store.count + 1,
  name: 'Abalam'
})

// 使用函数式 $patch
store.$patch((state) => {
  state.items.push({ name: 'shoes', quantity: 1 })
  state.hasChanged = true
})

// 重置状态
store.$reset()
```

### Getters

Getters 相当于 Store 的计算属性：

```javascript
export const useStore = defineStore('storeId', {
  state: () => ({
    count: 0
  }),
  getters: {
    // 自动推断返回类型
    doubleCount: (state) => state.count * 2,
    
    // 返回类型必须明确设置
    doublePlusOne(): number {
      return this.doubleCount + 1
    },
    
    // 向 getter 传递参数
    getUserById: (state) => {
      return (userId) => state.users.find((user) => user.id === userId)
    }
  }
})
```

使用 Getters：

```vue
<script setup>
const store = useStore()
</script>

<template>
  <p>Double: {{ store.doubleCount }}</p>
  <p>User: {{ store.getUserById(2) }}</p>
</template>
```

### Actions

Actions 相当于组件的方法，可以包含异步操作：

```javascript
export const useStore = defineStore('storeId', {
  state: () => ({
    userData: null
  }),
  actions: {
    // 同步 action
    increment() {
      this.count++
    },
    
    // 异步 action
    async registerUser(login, password) {
      try {
        this.userData = await api.post({ login, password })
        showNotification(`Welcome back ${this.userData.name}!`)
      } catch (error) {
        showNotification(error)
      }
    }
  }
})
```

使用 Actions：

```vue
<script setup>
const store = useStore()

async function submitForm() {
  await store.registerUser(login, password)
}
</script>
```

## 插件

### 持久化插件

使用 pinia-plugin-persistedstate 实现状态持久化：

```bash
npm install pinia-plugin-persistedstate
```

```javascript
// main.js
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
```

```javascript
// stores/counter.js
import { defineStore } from 'pinia'

export const useStore = defineStore('main', {
  state: () => {
    return {
      someState: 'hello pinia'
    }
  },
  persist: true
})
```

## 最佳实践

### 1. 使用组合式函数封装逻辑

```javascript
// composables/useUser.js
import { useUserStore } from '@/stores/user'

export function useUser() {
  const userStore = useUserStore()
  
  const login = async (credentials) => {
    await userStore.login(credentials)
  }
  
  const logout = () => {
    userStore.logout()
  }
  
  return {
    user: computed(() => userStore.user),
    isLoggedIn: computed(() => userStore.isLoggedIn),
    login,
    logout
  }
}
```

### 2. 模块化 Store

按功能模块组织 Store：

```
stores/
├── index.js          # 导出所有 store
├── user.js           # 用户相关
├── cart.js           # 购物车相关
├── product.js        # 商品相关
└── settings.js       # 设置相关
```

### 3. 避免直接修改 State

始终通过 actions 修改状态：

```javascript
// ❌ 不推荐
counterStore.count++

// ✅ 推荐
counterStore.increment()
```

### 4. 使用 TypeScript

```typescript
import { defineStore } from 'pinia'

interface User {
  id: number
  name: string
  email: string
}

interface UserState {
  users: User[]
  currentUser: User | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    users: [],
    currentUser: null
  }),
  // ...
})
```

### 5. 测试 Store

```javascript
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '@/stores/counter'

describe('Counter Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('increments', () => {
    const counter = useCounterStore()
    expect(counter.count).toBe(0)
    counter.increment()
    expect(counter.count).toBe(1)
  })
})
```

## 与 Vuex 的区别

| 特性 | Pinia | Vuex |
|------|-------|------|
| API | 更简洁 | 较复杂 |
| TypeScript | 原生支持 | 需要额外配置 |
| 模块化 | 自动模块化 | 需要手动配置 |
| 体积 | 更小 | 较大 |
| 开发工具 | 更好的支持 | 支持 |
| 服务端渲染 | 更好的支持 | 支持 |

## 迁移指南

从 Vuex 迁移到 Pinia：

1. 安装 Pinia
2. 逐个将 Vuex 模块转换为 Pinia Store
3. 更新组件中的使用方式
4. 移除 Vuex 依赖

Pinia 官方提供了迁移指南和工具，可以帮助你完成迁移。