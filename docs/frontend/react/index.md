---
title: React 介绍
category: 前端
tags:
  - React
  - 前端
  - 框架
---

# React 介绍

## 什么是 React？

React 是一个用于构建用户界面的 JavaScript 库，由 Facebook 开发和维护。它采用组件化的开发模式，通过虚拟 DOM 提高渲染性能。

## React 的特点

### 1. 组件化

React 将 UI 拆分为独立、可复用的组件，每个组件负责自己的状态和渲染逻辑。

```jsx
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}
```

### 2. 声明式

React 使用声明式编程，你只需要描述 UI 应该是什么样子，React 会自动处理 DOM 更新。

```jsx
function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

### 3. 虚拟 DOM

React 使用虚拟 DOM 来优化性能，通过对比前后两次虚拟 DOM 的差异，最小化真实 DOM 的操作。

### 4. 单向数据流

数据从父组件流向子组件，通过 props 传递，使得数据流动更加可预测。

## React 核心概念

### JSX

JSX 是 JavaScript 的语法扩展，允许在 JavaScript 中编写类似 HTML 的代码：

```jsx
const element = <h1>Hello, world!</h1>;
```

### 组件

React 组件可以是函数组件或类组件：

```jsx
// 函数组件
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

// 类组件
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
```

### Props

Props 是组件之间传递数据的方式：

```jsx
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

<Welcome name="Sara" />
```

### State

State 是组件内部管理的数据：

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

## 学习路径

1. **基础**：JSX、组件、Props、State
2. **Hooks**：useState、useEffect、useContext 等
3. **进阶**：性能优化、错误边界、Portals
4. **生态**：React Router、Redux、Next.js

## 相关资源

- [React 官方文档](https://react.dev/)
- [React Router 文档](https://reactrouter.com/)
- [Redux 文档](https://redux.js.org/)
- [Next.js 文档](https://nextjs.org/)

## 为什么选择 React？

- **生态系统丰富**：有大量的第三方库和工具
- **社区活跃**：庞大的开发者社区和丰富的学习资源
- **灵活性高**：可以与其他库或框架结合使用
- **就业市场好**：React 是目前最流行的前端框架之一
