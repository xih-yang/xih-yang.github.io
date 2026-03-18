---
title: React Hooks
---

# React Hooks

Hooks 是 React 16.8 引入的新特性，允许你在函数组件中使用状态和其他 React 特性。

## 为什么使用 Hooks？

1. **更简洁的代码**：函数组件比类组件更简洁
2. **逻辑复用**：通过自定义 Hooks 复用状态逻辑
3. **更好的组织**：将相关逻辑放在一起
4. **更好的性能**：函数组件更容易优化

## 常用 Hooks

### useState

用于在函数组件中添加状态。

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

### useEffect

用于执行副作用操作。

```jsx
import { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

### useContext

用于访问 React Context。

```jsx
import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

function ThemedButton() {
  const theme = useContext(ThemeContext);
  
  return (
    <button style={{ background: theme.background, color: theme.foreground }}>
      I am styled by theme context!
    </button>
  );
}
```

### useRef

用于获取 DOM 引用或保存可变值。

```jsx
import { useRef } from 'react';

function TextInputWithFocusButton() {
  const inputEl = useRef(null);
  
  const onButtonClick = () => {
    inputEl.current.focus();
  };
  
  return (
    <>
      <input ref={inputEl} type="text" />
      <button onClick={onButtonClick}>Focus the input</button>
    </>
  );
}
```

### useMemo

用于缓存计算结果。

```jsx
import { useMemo } from 'react';

function ExpensiveComponent({ a, b }) {
  const expensiveValue = useMemo(() => {
    return a * b;
  }, [a, b]);
  
  return <div>{expensiveValue}</div>;
}
```

### useCallback

用于缓存函数引用。

```jsx
import { useCallback } from 'react';

function Parent() {
  const [count, setCount] = useState(0);
  
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  return <Child onClick={handleClick} />;
}
```

## 自定义 Hooks

### 基本结构

```jsx
function useWindowSize() {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  
  useEffect(() => {
    const handleResize = () => {
      setSize([window.innerWidth, window.innerHeight]);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return size;
}
```

### 使用自定义 Hook

```jsx
function MyComponent() {
  const [width, height] = useWindowSize();
  
  return (
    <div>
      <p>Window size: {width} x {height}</p>
    </div>
  );
}
```

### 常用自定义 Hooks

#### useLocalStorage

```jsx
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });
  
  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log(error);
    }
  };
  
  return [storedValue, setValue];
}
```

#### useFetch

```jsx
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        const json = await response.json();
        setData(json);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [url]);
  
  return { data, loading, error };
}
```

## Hooks 规则

1. **只在最顶层使用 Hooks**：不要在循环、条件或嵌套函数中调用 Hooks
2. **只在 React 函数中调用 Hooks**：在 React 函数组件或自定义 Hooks 中调用

## 最佳实践

1. **使用 ESLint 插件**：`eslint-plugin-react-hooks` 帮助你遵循规则
2. **合理拆分 Hooks**：将相关逻辑放在同一个 useEffect 中
3. **注意依赖数组**：确保依赖数组包含所有依赖项
4. **使用自定义 Hooks**：复用状态逻辑
5. **避免过度优化**：只在必要时使用 useMemo 和 useCallback