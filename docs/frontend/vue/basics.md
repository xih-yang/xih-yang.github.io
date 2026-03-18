---
title: Vue 基础
---

# Vue 基础

## 模板语法

Vue 使用基于 HTML 的模板语法，允许你声明式地将 DOM 绑定到底层 Vue 实例的数据。

### 文本插值

使用双大括号 `{{ }}` 进行文本插值：

```vue
<template>
  <span>Message: {{ msg }}</span>
</template>

<script setup>
import { ref } from 'vue'
const msg = ref('Hello Vue!')
</script>
```

### 原始 HTML

使用 `v-html` 指令输出真正的 HTML：

```vue
<template>
  <p>Using text interpolation: {{ rawHtml }}</p>
  <p>Using v-html directive: <span v-html="rawHtml"></span></p>
</template>

<script setup>
import { ref } from 'vue'
const rawHtml = ref('<span style="color: red">This should be red.</span>')
</script>
```

### 属性绑定

使用 `v-bind` 指令绑定属性：

```vue
<template>
  <div v-bind:id="dynamicId"></div>
  <!-- 简写 -->
  <div :id="dynamicId"></div>
</template>

<script setup>
import { ref } from 'vue'
const dynamicId = ref('my-id')
</script>
```

## 条件渲染

### v-if

条件性地渲染一块内容：

```vue
<template>
  <h1 v-if="awesome">Vue is awesome!</h1>
  <h1 v-else>Oh no 😢</h1>
</template>

<script setup>
import { ref } from 'vue'
const awesome = ref(true)
</script>
```

### v-show

根据条件显示或隐藏元素：

```vue
<template>
  <h1 v-show="ok">Hello!</h1>
</template>

<script setup>
import { ref } from 'vue'
const ok = ref(true)
</script>
```

**v-if vs v-show**：
- `v-if` 是"真正的"条件渲染，切换时组件会被销毁和重建
- `v-show` 只是简单地切换元素的 CSS `display` 属性
- `v-if` 有更高的切换开销，`v-show` 有更高的初始渲染开销

## 列表渲染

### v-for

基于一个数组来渲染一个列表：

```vue
<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.text }}
    </li>
  </ul>
</template>

<script setup>
import { ref } from 'vue'

const items = ref([
  { id: 1, text: 'Learn JavaScript' },
  { id: 2, text: 'Learn Vue' },
  { id: 3, text: 'Build something awesome' }
])
</script>
```

### 遍历对象

```vue
<template>
  <ul>
    <li v-for="(value, key, index) in myObject" :key="key">
      {{ index }}. {{ key }}: {{ value }}
    </li>
  </ul>
</template>

<script setup>
import { reactive } from 'vue'

const myObject = reactive({
  title: 'How to do lists in Vue',
  author: 'Jane Doe',
  publishedAt: '2016-04-10'
})
</script>
```

## 事件处理

### v-on

使用 `v-on` 指令监听 DOM 事件：

```vue
<template>
  <button v-on:click="increment">Add 1</button>
  <!-- 简写 -->
  <button @click="increment">Add 1</button>
  <p>Count is: {{ count }}</p>
</template>

<script setup>
import { ref } from 'vue'

const count = ref(0)

function increment() {
  count.value++
}
</script>
```

### 事件修饰符

Vue 提供了事件修饰符来处理常见的 DOM 事件细节：

```vue
<template>
  <!-- 阻止单击事件继续传播 -->
  <a @click.stop="doThis"></a>

  <!-- 提交事件不再重载页面 -->
  <form @submit.prevent="onSubmit"></form>

  <!-- 修饰符可以串联 -->
  <a @click.stop.prevent="doThat"></a>

  <!-- 只有修饰符 -->
  <form @submit.prevent></form>

  <!-- 只当在 event.target 是当前元素自身时触发处理函数 -->
  <div @click.self="doThat">...</div>
</template>
```

## 表单输入绑定

### v-model

使用 `v-model` 指令在表单输入元素上创建双向数据绑定：

```vue
<template>
  <input v-model="message" placeholder="edit me" />
  <p>Message is: {{ message }}</p>
</template>

<script setup>
import { ref } from 'vue'
const message = ref('')
</script>
```

### 修饰符

```vue
<template>
  <!-- 在 "change" 时而非 "input" 时更新 -->
  <input v-model.lazy="msg" />

  <!-- 自动将用户的输入值转为数值类型 -->
  <input v-model.number="age" />

  <!-- 自动过滤用户输入的首尾空白字符 -->
  <input v-model.trim="msg" />
</template>
```

## 计算属性

使用 `computed` 函数创建计算属性：

```vue
<template>
  <p>Has published books:</p>
  <span>{{ publishedBooksMessage }}</span>
</template>

<script setup>
import { ref, computed } from 'vue'

const author = ref({
  name: 'John Doe',
  books: [
    'Vue 2 - Advanced Guide',
    'Vue 3 - Basic Guide',
    'Vue 4 - The Mystery'
  ]
})

const publishedBooksMessage = computed(() => {
  return author.value.books.length > 0 ? 'Yes' : 'No'
})
</script>
```

## 侦听器

使用 `watch` 函数在响应式数据变化时执行副作用：

```vue
<template>
  <p>
    Ask a yes/no question:
    <input v-model="question" />
  </p>
  <p>{{ answer }}</p>
</template>

<script setup>
import { ref, watch } from 'vue'

const question = ref('')
const answer = ref('Questions usually contain a question mark. ;-)')

watch(question, async (newQuestion, oldQuestion) => {
  if (newQuestion.indexOf('?') > -1) {
    answer.value = 'Thinking...'
    try {
      const res = await fetch('https://yesno.wtf/api')
      answer.value = (await res.json()).answer
    } catch (error) {
      answer.value = 'Error! Could not reach the API. ' + error
    }
  }
})
</script>
```

## 生命周期钩子

Vue 组件有一系列生命周期钩子，可以在组件的不同阶段执行代码：

```vue
<script setup>
import { onMounted, onUpdated, onUnmounted } from 'vue'

onMounted(() => {
  console.log('the component is now mounted.')
})

onUpdated(() => {
  console.log('the component is updated.')
})

onUnmounted(() => {
  console.log('the component is now unmounted.')
})
</script>
```

### 常用生命周期钩子

| 钩子 | 说明 |
|------|------|
| `onBeforeMount` | 在组件被挂载之前调用 |
| `onMounted` | 在组件挂载完成后调用 |
| `onBeforeUpdate` | 在组件即将因为响应式状态变更而更新其 DOM 树之前调用 |
| `onUpdated` | 在组件因为响应式状态变更而更新其 DOM 树之后调用 |
| `onBeforeUnmount` | 在组件实例被卸载之前调用 |
| `onUnmounted` | 在组件实例被卸载之后调用 |

## 最佳实践

1. **使用 `<script setup>`**：更简洁的语法，更好的 TypeScript 支持
2. **使用 `ref` 和 `reactive`**：根据数据类型选择合适的响应式 API
3. **使用计算属性**：对于依赖其他数据的复杂逻辑，使用计算属性
4. **使用 `key` 管理状态**：在 `v-for` 中始终使用 `:key`
5. **避免直接修改 props**：props 应该是只读的