---
title: Vue Router
---

# Vue Router

Vue Router 是 Vue.js 的官方路由管理器，用于构建单页应用 (SPA)。

## 安装

```bash
npm install vue-router@4
# 或使用 bun
bun add vue-router
```

## 基本使用

### 1. 创建路由配置

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

### 2. 在应用中使用

```javascript
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')
```

### 3. 在组件中使用

```vue
<template>
  <nav>
    <router-link to="/">首页</router-link>
    <router-link to="/about">关于</router-link>
  </nav>
  
  <!-- 路由出口 -->
  <router-view></router-view>
</template>
```

## 路由模式

### Hash 模式

使用 URL 的 hash 部分（#）来模拟完整的 URL：

```javascript
const router = createRouter({
  history: createWebHashHistory(),
  routes
})
```

### HTML5 模式

使用 HTML5 History API，URL 更美观：

```javascript
const router = createRouter({
  history: createWebHistory(),
  routes
})
```

**注意**：使用 HTML5 模式需要服务器配置，以处理直接访问 URL 的情况。

## 动态路由

### 定义动态路由

```javascript
const routes = [
  {
    path: '/user/:id',
    component: User,
    children: [
      {
        path: 'profile',
        component: UserProfile
      },
      {
        path: 'posts',
        component: UserPosts
      }
    ]
  }
]
```

### 获取路由参数

```vue
<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

// 访问参数
console.log(route.params.id)
</script>
```

### 响应式参数

```vue
<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

watch(
  () => route.params.id,
  (newId, oldId) => {
    // 响应参数变化
    fetchUser(newId)
  }
)
</script>
```

## 导航守卫

### 全局前置守卫

```javascript
router.beforeEach((to, from, next) => {
  // 检查用户是否已登录
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login')
  } else {
    next()
  }
})
```

### 路由独享守卫

```javascript
const routes = [
  {
    path: '/admin',
    component: Admin,
    beforeEnter: (to, from, next) => {
      if (!isAdmin()) {
        next('/')
      } else {
        next()
      }
    }
  }
]
```

### 组件内守卫

```vue
<script setup>
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

// 离开路由前
onBeforeRouteLeave((to, from) => {
  const answer = window.confirm('确定要离开吗？')
  if (!answer) return false
})

// 路由更新前
onBeforeRouteUpdate(async (to, from) => {
  // 响应路由参数变化
  userData.value = await fetchUser(to.params.id)
})
</script>
```

## 路由元信息

```javascript
const routes = [
  {
    path: '/admin',
    component: Admin,
    meta: {
      requiresAuth: true,
      title: '管理后台'
    }
  }
]

// 使用元信息
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }
  
  // 权限检查
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login')
  } else {
    next()
  }
})
```

## 编程式导航

### 基本导航

```javascript
import { useRouter } from 'vue-router'

const router = useRouter()

// 字符串路径
router.push('/users/eduardo')

// 带查询参数
router.push({ path: '/users', query: { page: 2 } })

// 命名路由
router.push({ name: 'user', params: { username: 'eduardo' } })

// 替换当前位置
router.replace({ path: '/home' })

// 前进/后退
router.go(1)  // 前进一页
router.go(-1) // 后退一页
```

## 路由懒加载

```javascript
const routes = [
  {
    path: '/about',
    component: () => import('../views/About.vue')
  },
  {
    path: '/user/:id',
    component: () => import('../views/User.vue')
  }
]
```

## 嵌套路由

```javascript
const routes = [
  {
    path: '/user/:id',
    component: User,
    children: [
      {
        path: '',
        component: UserHome
      },
      {
        path: 'profile',
        component: UserProfile
      },
      {
        path: 'posts',
        component: UserPosts
      }
    ]
  }
]
```

## 命名视图

```javascript
const routes = [
  {
    path: '/',
    components: {
      default: Home,
      sidebar: Sidebar,
      footer: Footer
    }
  }
]
```

使用：

```vue
<template>
  <router-view></router-view>
  <router-view name="sidebar"></router-view>
  <router-view name="footer"></router-view>
</template>
```

## 滚动行为

```javascript
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 始终滚动到顶部
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})
```

## 最佳实践

1. **使用命名路由**：便于维护和重构
2. **合理使用懒加载**：提高首屏加载速度
3. **添加路由元信息**：用于权限控制和页面标题
4. **使用导航守卫**：处理权限验证和数据获取
5. **保持路由配置清晰**：按功能模块组织路由
6. **处理 404 页面**：添加通配符路由

```javascript
{
  path: '/:pathMatch(.*)*',
  name: 'NotFound',
  component: NotFound
}
```