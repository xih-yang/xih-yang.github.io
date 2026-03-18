---
title: React Router
---

# React Router

React Router 是 React 的官方路由库，用于构建单页应用 (SPA)。

## 安装

```bash
npm install react-router-dom
# 或使用 bun
bun add react-router-dom
```

## 基本使用

### 1. 创建路由配置

```jsx
// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### 2. 导航链接

```jsx
import { Link, NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <nav>
      <Link to="/">首页</Link>
      <Link to="/about">关于</Link>
      
      {/* NavLink 可以设置激活状态样式 */}
      <NavLink 
        to="/contact"
        className={({ isActive }) => isActive ? 'active' : ''}
      >
        联系我们
      </NavLink>
    </nav>
  );
}
```

### 3. 编程式导航

```jsx
import { useNavigate } from 'react-router-dom';

function LoginButton() {
  const navigate = useNavigate();
  
  function handleLogin() {
    // 登录逻辑
    navigate('/dashboard');
  }
  
  return <button onClick={handleLogin}>登录</button>;
}
```

## 路由参数

### 定义动态路由

```jsx
<Route path="/user/:id" element={<User />} />
```

### 获取路由参数

```jsx
import { useParams } from 'react-router-dom';

function User() {
  const { id } = useParams();
  
  return <div>用户ID: {id}</div>;
}
```

### 查询参数

```jsx
import { useSearchParams } from 'react-router-dom';

function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q');
  
  return <div>搜索: {query}</div>;
}
```

## 嵌套路由

```jsx
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="users" element={<Users />}>
            <Route path=":id" element={<User />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// Layout.jsx
import { Outlet } from 'react-router-dom';

function Layout() {
  return (
    <div>
      <nav>{/* 导航 */}</nav>
      <main>
        <Outlet /> {/* 子路由渲染位置 */}
      </main>
    </div>
  );
}
```

## 路由守卫

### 认证路由

```jsx
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const isAuthenticated = checkAuth(); // 你的认证逻辑
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

// 使用
<Route 
  path="/dashboard" 
  element={
    <PrivateRoute>
      <Dashboard />
    </PrivateRoute>
  } 
/>
```

## 懒加载

```jsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

## 最佳实践

1. **使用 BrowserRouter**：提供更好的 URL 体验
2. **合理组织路由**：按功能模块组织
3. **使用懒加载**：提高首屏加载速度
4. **添加 404 页面**：处理未知路由
5. **保护私有路由**：使用路由守卫