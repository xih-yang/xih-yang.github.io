---
title: React 状态管理
---

# React 状态管理

## 什么是状态管理？

状态管理是指在应用中管理和共享数据的方式。在 React 应用中，随着组件数量的增加，组件之间的数据共享会变得复杂。状态管理库提供了一种集中式的方式来管理应用的状态。

## Redux

Redux 是 React 最流行的状态管理库之一，它使用单一状态树和纯函数来管理状态。

### 安装

```bash
npm install @reduxjs/toolkit react-redux
# 或使用 bun
bun add @reduxjs/toolkit react-redux
```

### 创建 Store

```javascript
// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});
```

### 创建 Slice

```javascript
// store/counterSlice.js
import { createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: {
    value: 0,
  },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
  },
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;
export default counterSlice.reducer;
```

### 在应用中使用

```jsx
// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
```

### 在组件中使用

```jsx
import { useSelector, useDispatch } from 'react-redux';
import { increment, decrement } from './store/counterSlice';

function Counter() {
  const count = useSelector((state) => state.counter.value);
  const dispatch = useDispatch();

  return (
    <div>
      <div>{count}</div>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(decrement())}>-</button>
    </div>
  );
}
```

## Context API

React 内置的 Context API 可以用于简单的状态管理。

### 创建 Context

```jsx
// contexts/ThemeContext.js
import { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

### 使用 Context

```jsx
import { useTheme } from './contexts/ThemeContext';

function ThemedButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: theme === 'light' ? '#fff' : '#333',
        color: theme === 'light' ? '#333' : '#fff',
      }}
    >
      切换主题
    </button>
  );
}
```

## Zustand

Zustand 是一个轻量级的状态管理库，API 简洁易用。

### 安装

```bash
npm install zustand
# 或使用 bun
bun add zustand
```

### 创建 Store

```javascript
// store/useStore.js
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

export default useStore;
```

### 在组件中使用

```jsx
import useStore from './store/useStore';

function Counter() {
  const { count, increment, decrement } = useStore();

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}
```

## 状态管理方案对比

| 特性 | Redux | Context API | Zustand |
|------|-------|-------------|---------|
| 学习曲线 | 较陡 | 平缓 | 平缓 |
| 适用场景 | 大型应用 | 小型应用 | 中小型应用 |
| 性能 | 优秀 | 一般 | 优秀 |
| 开发工具 | 丰富 | 无 | 有 |
| 中间件 | 丰富 | 无 | 有 |

## 最佳实践

1. **选择合适的工具**：根据应用规模选择合适的状态管理方案
2. **状态最小化**：只将必要的状态放入全局状态管理
3. **使用 Selector**：避免不必要的重渲染
4. **模块化组织**：按功能模块组织状态
5. **持久化状态**：使用本地存储持久化重要状态