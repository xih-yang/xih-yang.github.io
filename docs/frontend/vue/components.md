---
title: Vue 组件
---

# Vue 组件

## 组件基础

组件是 Vue 中最重要的概念之一，它允许我们将 UI 拆分为独立、可复用的部分。

### 定义组件

使用单文件组件 (SFC) 定义组件：

```vue
<!-- MyComponent.vue -->
<template>
  <div class="greeting">
    <h1>{{ msg }}</h1>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps(['msg'])
const count = ref(0)

function increment() {
  count.value++
}
</script>

<style scoped>
.greeting {
  color: blue;
}
</style>
```

### 使用组件

```vue
<template>
  <MyComponent msg="Hello Vue!" />
</template>

<script setup>
import MyComponent from './MyComponent.vue'
</script>
```

## Props

Props 是组件的自定义属性，用于父组件向子组件传递数据。

### 声明 Props

```vue
<script setup>
const props = defineProps(['title', 'likes'])
</script>
```

### 带类型的 Props

```vue
<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0
  }
})
</script>
```

### 使用 TypeScript

```vue
<script setup lang="ts">
interface Props {
  title: string
  likes?: number
}

const props = withDefaults(defineProps<Props>(), {
  likes: 0
})
</script>
```

## 事件

组件可以通过 `$emit` 方法触发事件来与父组件通信。

### 声明事件

```vue
<script setup>
const emit = defineEmits(['enlarge-text', 'submit'])

function onClick() {
  emit('enlarge-text', 0.1)
}
</script>
```

### 使用 TypeScript

```vue
<script setup lang="ts">
const emit = defineEmits<{
  (e: 'change', id: number): void
  (e: 'update', value: string): void
}>()
</script>
```

### 监听事件

```vue
<template>
  <BlogPost
    v-for="post in posts"
    :key="post.id"
    :title="post.title"
    @enlarge-text="postFontSize += $event"
  />
</template>
```

## 插槽 (Slots)

插槽允许你在组件中预留位置，让使用组件的地方可以填充内容。

### 默认插槽

```vue
<!-- MyButton.vue -->
<template>
  <button class="btn">
    <slot>默认内容</slot>
  </button>
</template>
```

使用：

```vue
<MyButton>点击我</MyButton>
<MyButton></MyButton> <!-- 显示默认内容 -->
```

### 具名插槽

```vue
<!-- BaseLayout.vue -->
<template>
  <header>
    <slot name="header"></slot>
  </header>
  <main>
    <slot></slot>
  </main>
  <footer>
    <slot name="footer"></slot>
  </footer>
</template>
```

使用：

```vue
<BaseLayout>
  <template #header>
    <h1>页面标题</h1>
  </template>

  <p>主要内容</p>

  <template #footer>
    <p>版权信息</p>
  </template>
</BaseLayout>
```

### 作用域插槽

允许子组件向父组件传递数据：

```vue
<!-- MyComponent.vue -->
<template>
  <slot :user="user" :message="message"></slot>
</template>

<script setup>
const user = { name: 'John' }
const message = 'Hello'
</script>
```

使用：

```vue
<MyComponent v-slot="slotProps">
  {{ slotProps.user.name }}: {{ slotProps.message }}
</MyComponent>

<!-- 解构 -->
<MyComponent v-slot="{ user, message }">
  {{ user.name }}: {{ message }}
</MyComponent>
```

## 动态组件

使用 `<component>` 元素和 `:is` 属性在多个组件间切换：

```vue
<template>
  <component :is="currentTab"></component>
</template>

<script setup>
import { ref, shallowRef } from 'vue'
import Home from './Home.vue'
import Posts from './Posts.vue'
import Archive from './Archive.vue'

const currentTab = shallowRef(Home)
</script>
```

## 异步组件

使用 `defineAsyncComponent` 定义异步组件，实现代码分割：

```vue
<script setup>
import { defineAsyncComponent } from 'vue'

const AdminPage = defineAsyncComponent(() =>
  import('./components/AdminPage.vue')
)
</script>

<template>
  <AdminPage />
</template>
```

### 加载状态和错误处理

```vue
<script setup>
import { defineAsyncComponent } from 'vue'
import Loading from './Loading.vue'
import Error from './Error.vue'

const AsyncComp = defineAsyncComponent({
  // 加载函数
  loader: () => import('./Foo.vue'),

  // 加载异步组件时使用的组件
  loadingComponent: Loading,
  
  // 展示加载组件前的延迟时间，默认为 200ms
  delay: 200,

  // 加载失败后展示的组件
  errorComponent: Error,
  
  // 如果提供了一个 timeout 时间限制，并超时了
  // 也会显示这里配置的报错组件，默认值是：Infinity
  timeout: 3000
})
</script>
```

## 组件通信方式

### 1. Props / Emits

父子组件通信：

```vue
<!-- 父组件 -->
<template>
  <Child :message="parentMsg" @update="handleUpdate" />
</template>

<!-- 子组件 -->
<template>
  <button @click="$emit('update', 'new value')">
    {{ message }}
  </button>
</template>

<script setup>
defineProps(['message'])
defineEmits(['update'])
</script>
```

### 2. Provide / Inject

跨层级组件通信：

```vue
<!-- 祖先组件 -->
<script setup>
import { provide, ref } from 'vue'

const user = ref({ name: 'John' })
provide('user', user)
</script>
```

```vue
<!-- 后代组件 -->
<script setup>
import { inject } from 'vue'

const user = inject('user')
</script>
```

### 3. 全局状态管理

使用 Pinia 或 Vuex 进行全局状态管理：

```javascript
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    doubleCount: (state) => state.count * 2
  },
  actions: {
    increment() {
      this.count++
    }
  }
})
```

使用：

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

## 组件最佳实践

1. **单一职责**：每个组件应该只做一件事
2. **Props 向下传递**：数据通过 props 向下传递，事件向上传递
3. **避免直接修改 Props**：Props 应该是只读的
4. **使用有意义的命名**：组件名应该清晰表达其功能
5. **文档化组件**：为组件的 props、事件和插槽编写文档
6. **合理使用插槽**：对于可定制的内容，使用插槽而不是 props