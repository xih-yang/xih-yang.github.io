---
title: React 基础
---

# React 基础

## JSX

JSX 是 JavaScript 的语法扩展，允许在 JavaScript 中编写类似 HTML 的代码。

### 基本语法

```jsx
const element = <h1>Hello, world!</h1>;
```

### 嵌入表达式

```jsx
const name = 'Josh Perez';
const element = <h1>Hello, {name}</h1>;
```

### 条件渲染

```jsx
function Greeting({ isLoggedIn }) {
  if (isLoggedIn) {
    return <h1>Welcome back!</h1>;
  }
  return <h1>Please sign up.</h1>;
}

// 或者使用三元运算符
function Greeting({ isLoggedIn }) {
  return (
    <h1>
      {isLoggedIn ? 'Welcome back!' : 'Please sign up.'}
    </h1>
  );
}
```

### 列表渲染

```jsx
function NumberList({ numbers }) {
  const listItems = numbers.map((number) =>
    <li key={number.toString()}>{number}</li>
  );
  
  return (
    <ul>{listItems}</ul>
  );
}
```

## 组件

### 函数组件

```jsx
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}
```

### 类组件

```jsx
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
```

### 组合组件

```jsx
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

function App() {
  return (
    <div>
      <Welcome name="Sara" />
      <Welcome name="Cahal" />
      <Welcome name="Edite" />
    </div>
  );
}
```

## Props

Props 是组件之间传递数据的方式。

### 传递 Props

```jsx
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

<Welcome name="Sara" />
```

### 解构 Props

```jsx
function Welcome({ name, age }) {
  return (
    <h1>
      Hello, {name}. You are {age} years old.
    </h1>
  );
}
```

### Props 默认值

```jsx
function Welcome({ name = 'Guest' }) {
  return <h1>Hello, {name}</h1>;
}
```

## State

State 是组件内部管理的数据。

### useState Hook

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

### 多个 State

```jsx
function Form() {
  const [name, setName] = useState('');
  const [age, setAge] = useState(0);
  
  return (
    <form>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="number"
        value={age}
        onChange={(e) => setAge(Number(e.target.value))}
      />
    </form>
  );
}
```

### 对象 State

```jsx
function Form() {
  const [person, setPerson] = useState({
    name: '',
    age: 0
  });
  
  function handleNameChange(e) {
    setPerson({
      ...person,
      name: e.target.value
    });
  }
  
  return (
    <form>
      <input
        value={person.name}
        onChange={handleNameChange}
      />
    </form>
  );
}
```

## 事件处理

### 基本事件

```jsx
function Button() {
  function handleClick() {
    alert('You clicked me!');
  }
  
  return (
    <button onClick={handleClick}>
      Click me
    </button>
  );
}
```

### 传递参数

```jsx
function Button() {
  function handleClick(id) {
    alert(`Button ${id} clicked!`);
  }
  
  return (
    <button onClick={() => handleClick(1)}>
      Click me
    </button>
  );
}
```

### 事件对象

```jsx
function Form() {
  function handleSubmit(e) {
    e.preventDefault();
    alert('Form submitted!');
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Submit</button>
    </form>
  );
}
```

## 生命周期

### useEffect Hook

```jsx
import { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);
  
  // 相当于 componentDidMount 和 componentDidUpdate
  useEffect(() => {
    document.title = `You clicked ${count} times`;
  });
  
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```

### 条件执行

```jsx
useEffect(() => {
  document.title = `You clicked ${count} times`;
}, [count]); // 仅在 count 更改时更新
```

### 清理副作用

```jsx
useEffect(() => {
  const subscription = props.source.subscribe();
  
  return () => {
    // 清理订阅
    subscription.unsubscribe();
  };
}, [props.source]);
```

## 表单

### 受控组件

```jsx
function NameForm() {
  const [value, setValue] = useState('');
  
  function handleChange(event) {
    setValue(event.target.value);
  }
  
  function handleSubmit(event) {
    alert('A name was submitted: ' + value);
    event.preventDefault();
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name:
        <input type="text" value={value} onChange={handleChange} />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 文本域

```jsx
function EssayForm() {
  const [value, setValue] = useState('Please write an essay about your favorite DOM element.');
  
  function handleChange(event) {
    setValue(event.target.value);
  }
  
  return (
    <textarea value={value} onChange={handleChange} />
  );
}
```

### 选择框

```jsx
function FlavorForm() {
  const [value, setValue] = useState('coconut');
  
  function handleChange(event) {
    setValue(event.target.value);
  }
  
  return (
    <select value={value} onChange={handleChange}>
      <option value="grapefruit">Grapefruit</option>
      <option value="lime">Lime</option>
      <option value="coconut">Coconut</option>
      <option value="mango">Mango</option>
    </select>
  );
}
```

## 最佳实践

1. **使用函数组件和 Hooks**：更简洁，更易于测试
2. **保持组件小而专注**：每个组件只做一件事
3. **使用 PropTypes 或 TypeScript**：类型检查
4. **避免直接修改 State**：始终使用 setState 或 Hooks
5. **使用 key 属性**：在列表中始终使用 key