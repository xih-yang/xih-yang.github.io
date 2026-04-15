---
title: React 全家桶
category: 知识点
tags:
  - 前端
  - React
  - 框架
---

# React 全家桶

React 生态强调组件化、单向数据流和以状态驱动 UI。学习时要把 React 本体和周边生态分开看。

## 核心范围

- React 基础：JSX、组件、Props、State、Hooks
- 路由：React Router 的页面组织、嵌套路由和数据流转
- 状态管理：Redux、Zustand、Jotai 等方案的取舍
- 工程协作：TypeScript、测试、样式方案和目录拆分
- 服务端能力：Next.js、Server Components、Server Actions 的关系

React 复习核心知识点

一、React 基础核心

1. React 特性与理念

声明式编程：描述UI应该是什么样子，而不是如何实现
组件化：UI拆分为独立、可复用的组件
单向数据流：数据从父组件流向子组件
虚拟DOM：React在内存中维护DOM的轻量级副本，通过Diff算法优化更新

2. JSX 语法规则

JSX是React.createElement的语法糖
必须有一个根元素（React Fragment <></> 可包裹多个元素）
class属性需改为 className
表单元素的for属性需改为 htmlFor
内联样式对象：style={{ color: 'red', fontSize: '16px' }}
自闭合标签必须使用 /：<img />, <input />, <br />
JavaScript表达式用花括号包裹：{variable}，但不能在花括号中写语句（如if/for）

3. 组件定义方式

函数组件（推荐）

jsx
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

// 箭头函数
const Welcome = ({ name }) => <h1>Hello, {name}</h1>;


类组件（React 18+ 仍支持，但不推荐新项目使用）

jsx
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}


4. Props（属性）

父组件向子组件传递数据
Props是只读的，子组件不应修改
解构赋值简化props访问
PropTypes 或 TypeScript 进行类型检查
默认Props：
函数组件：function Greeting({ name = 'Guest' })
或使用 Greeting.defaultProps = { name: 'Guest' }（不推荐）

5. State（状态）

组件内部的可变数据
Class组件：this.state 和 this.setState
函数组件：useState Hook

jsx
const [count, setCount] = useState(0);
const [user, setUser] = useState({ name: '', age: 0 });

// 函数式更新（依赖前一个值）
setCount(prev => prev + 1);

// 对象/数组更新需创建新对象（不可变性）
setUser(prev => ({ ...prev, age: prev.age + 1 }));


6. 生命周期（函数组件对应Hooks）

Class组件生命周期	函数组件Hooks	说明
componentDidMount	useEffect(() => {}, [])	组件挂载后执行一次
componentDidUpdate	useEffect(() => { ... }, [dependency])	依赖变化时执行
componentWillUnmount	useEffect(() => { return cleanup; }, [])	组件卸载前执行清理
getDerivedStateFromProps	无对应Hook	不推荐使用
shouldComponentUpdate	React.memo	控制组件是否更新

7. 事件处理

jsx
<button onClick={handleClick}>Click Me</button>
<input onChange={handleChange} />
<form onSubmit={handleSubmit}>

// 事件对象e
function handleClick(e) {
  e.preventDefault(); // 阻止默认行为
  e.stopPropagation(); // 阻止事件冒泡
  console.log(e.target.value);
}


8. 条件渲染

jsx
// 三元运算符
{isLoggedIn ? <Dashboard /> : <Login />}

// 逻辑与(&&)
{isLoggedIn && <Dashboard />}

// 立即执行函数
{showWarning() && <Warning />}

// 变量存储
const button = isLoggedIn ? <LogoutButton /> : <LoginButton />;
return <nav>{button}</nav>;


9. 列表渲染与Key

jsx
// 使用map生成列表
{items.map(item => (
  <li key={item.id}>{item.name}</li>
))}

// Key的重要性
// 使用唯一、稳定的ID作为key（如数据库ID）
// 避免使用数组索引作为key（特别是列表可排序、插入、删除时）


10. 受控组件与非受控组件

受控组件（推荐）

jsx
const [value, setValue] = useState('');

<input
  type="text"
  value={value}
  onChange={e => setValue(e.target.value)}
/>

// 多个表单元素
const [formData, setFormData] = useState({
  username: '',
  password: ''
});

function handleChange(e) {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
}


非受控组件

jsx
const fileInputRef = useRef(null);

<input type="file" ref={fileInputRef} />

function handleSubmit() {
  console.log(fileInputRef.current.files[0]);
}


11. 表单处理

jsx
function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // 提交逻辑...
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <input
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <textarea
        name="message"
        value={formData.message}
        onChange={handleChange}
        required
      />
      <button type="submit">Send</button>
    </form>
  );
}


二、React Hooks 核心精要

1. Hooks 规则

只能在函数组件顶层调用Hooks（不在循环、条件或嵌套函数中）
只能在React函数组件或自定义Hook中调用Hooks
遵循 use 前缀命名约定

2. useState

管理函数组件内部状态
返回值：[当前状态值, 更新状态的函数]
函数式更新：setCount(c => c + 1)
对象/数组更新需不可变性（创建新对象/数组）

jsx
// 基础用法
const [count, setCount] = useState(0);

// 惰性初始化（只执行一次）
const [data, setData] = useState(() => {
  return heavyComputation();
});

// 对象更新
const [user, setUser] = useState({ name: 'John', age: 30 });
setUser(prevUser => ({ ...prevUser, age: prevUser.age + 1 }));

// 数组更新
const [items, setItems] = useState([1, 2, 3]);
setItems(prevItems => [...prevItems, 4]); // 添加
setItems(prevItems => prevItems.filter(item => item !== 2)); // 删除


3. useEffect

处理副作用（数据获取、订阅、手动DOM操作）
依赖数组决定Effect执行时机
返回的清理函数在下一次Effect执行前或组件卸载时执行

jsx
// 无依赖数组：每次渲染后都执行
useEffect(() => {
  console.log('每次渲染');
});

// 空依赖数组：仅在挂载时执行一次（类似componentDidMount）
useEffect(() => {
  console.log('仅挂载时');
  // 清理函数：组件卸载时执行
  return () => {
    console.log('卸载时清理');
  };
}, []);

// 有依赖数组：依赖变化时执行（类似componentDidUpdate）
useEffect(() => {
  console.log('userId变化时');
}, [userId]);

// 多个依赖
useEffect(() => {
  // 当userId或postId任一变化时执行
}, [userId, postId]);


4. useContext

跨组件共享状态，避免props drilling
配合 Context.Provider 使用
订阅context的组件会在context值变化时重新渲染

jsx
// 创建Context
const ThemeContext = createContext('light');

// 提供Context值
function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

// 消费Context
function Toolbar() {
  const theme = useContext(ThemeContext);
  return <div>Current theme: {theme}</div>;
}

// 多个Context组合
function App() {
  return (
    <ThemeContext.Provider value="dark">
      <UserContext.Provider value={{ name: 'Alice' }}>
        <Main />
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
}


5. useReducer

管理复杂状态逻辑
useState 的替代方案，适用于state逻辑较复杂且包含多个子值
接受 (state, action) => newState 类型的reducer

jsx
const initialState = { count: 0, step: 1 };

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + state.step };
    case 'decrement':
      return { ...state, count: state.count - state.step };
    case 'setStep':
      return { ...state, step: action.payload };
    default:
      throw new Error();
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <>
      Count: {state.count}
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'setStep', payload: 10 })}>
        Set Step to 10
      </button>
    </>
  );
}


6. useRef

访问DOM元素或在渲染间保持可变值
返回一个可变的ref对象，.current 属性可被修改且不会触发重新渲染
常用于：访问DOM、存储定时器ID、存储前一个值等

jsx
// 访问DOM元素
const inputRef = useRef(null);

function FocusInput() {
  useEffect(() => {
    inputRef.current.focus();
  }, []);

  return <input ref={inputRef} />;
}

// 存储可变值（不触发重新渲染）
function Timer() {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      console.log('Tick');
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  return <div>Timer running</div>;
}

// 存储前一个值
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}


7. useMemo

缓存计算结果，避免不必要的重复计算
依赖数组变化时才重新计算
适用于：复杂计算、对象/数组引用稳定性

jsx
function ExpensiveComponent({ items }) {
  // 仅当items变化时才重新排序
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => a.id - b.id);
  }, [items]);

  // 缓存对象引用，避免子组件不必要的重新渲染
  const expensiveValue = useMemo(() => ({
    data: heavyComputation(items),
    timestamp: Date.now()
  }), [items]);

  return <ChildComponent value={expensiveValue} />;
}


8. useCallback

缓存函数引用，避免子组件因props函数引用变化而重新渲染
依赖数组变化时才返回新的函数
常与 React.memo 配合使用

jsx
function Parent() {
  const [count, setCount] = useState(0);

  // 每次Parent渲染都创建新函数引用
  // 传递给已用React.memo优化的子组件时，会导致子组件重新渲染
  const handleClick = () => {
    console.log('Clicked');
  };

  // 使用useCallback缓存函数引用
  const memoizedHandleClick = useCallback(() => {
    console.log('Clicked');
  }, []); // 空依赖数组，函数引用永不变化

  return <ChildComponent onClick={memoizedHandleClick} />;
}

// 与useMemo对比
// useCallback(fn, deps) ≈ useMemo(() => fn, deps)


9. 自定义Hooks

提取组件逻辑到可复用的函数
自定义Hook名称以 use 开头
可以调用其他Hooks

jsx
// 自定义Hook：useWindowSize
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// 使用自定义Hook
function ResponsiveComponent() {
  const { width, height } = useWindowSize();

  return <div>Window: {width}x{height}</div>;
}


10. React 18 新Hooks

useTransition

标记更新为非紧急更新（过渡更新），允许React优先处理更重要的更新
返回 [isPending, startTransition]
isPending: 是否有过渡更新在进行
startTransition: 标记更新为过渡

jsx
import { useTransition } from 'react';

function SearchComponent({ data }) {
  const [isPending, startTransition] = useTransition();
  const [inputValue, setInputValue] = useState('');

  function handleChange(e) {
    // 紧急更新：输入值立即更新
    setInputValue(e.target.value);

    // 非紧急更新：搜索列表更新可延后
    startTransition(() => {
      setSearchQuery(e.target.value);
    });
  }

  return (
    <div>
      <input value={inputValue} onChange={handleChange} />
      {isPending && <Spinner />}
      <SearchResults query={inputValue} data={data} />
    </div>
  );
}


useDeferredValue

延迟更新UI的某些部分
与 useTransition 类似，但操作的是值而非函数
适用于：列表渲染、文本输入等

jsx
import { useDeferredValue } from 'react';

function Typeahead({ suggestions }) {
  const [text, setText] = useState('');
  // 延迟text的更新，避免在快速输入时频繁重新渲染列表
  const deferredText = useDeferredValue(text);

  return (
    <>
      <input value={text} onChange={e => setText(e.target.value)} />
      <Suggestions text={deferredText} suggestions={suggestions} />
    </>
  );
}


useId

生成唯一ID（服务端与客户端保持一致）
解决服务端渲染时ID不一致问题
常用于表单label与input的关联

jsx
function Checkbox({ label }) {
  const id = useId();

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} type="checkbox" />
    </>
  );
}


useSyncExternalStore

订阅外部数据源（如浏览器API、状态管理库）
React 18新增，用于优化与外部存储的集成
常用于：集成非React状态管理库、浏览器localStorage

jsx
import { useSyncExternalStore } from 'react';

// 订阅外部store
function useExternalStore(store, subscribe) {
  return useSyncExternalStore(
    subscribe, // 订阅函数，返回取消订阅函数
    () => store.getSnapshot() // 获取快照函数
  );
}

// 使用示例
function Counter() {
  const count = useExternalStore(
    externalStore,
    (callback) => externalStore.subscribe(callback)
  );

  return <div>Count: {count}</div>;
}


三、React Router（路由）

1. React Router DOM v6/v7 核心

安装

bash
npm install react-router-dom
# 或
yarn add react-router-dom


基本设置

jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/users/:id" element={<UserDetail />} />
      </Routes>
    </BrowserRouter>
  );
}


路由组件

组件	说明
<BrowserRouter>	使用HTML5 history API的路由器（推荐）
<HashRouter>	使用URL hash的路由器（用于静态部署）
<Routes>	包裹一组Route，匹配第一个符合条件的
<Route>	定义路由路径与元素
<Link>	声明式导航（无刷新页面跳转）
<NavLink>	支持激活状态样式的Link
<Outlet>	渲染子路由的占位符（嵌套路由）
<Navigate>	编程式导航（重定向）

路由跳转

jsx
import { Link, NavLink, useNavigate } from 'react-router-dom';

// 声明式导航
<Link to="/">Home</Link>

// NavLink（激活样式）
<NavLink
  to="/about"
  className={({ isActive }) => isActive ? 'active' : ''}
>
  About
</NavLink>

// 编程式导航
function LoginButton() {
  const navigate = useNavigate();

  function handleLogin() {
    // 登录成功后跳转
    navigate('/dashboard');

    // 替换历史记录（无法后退）
    navigate('/dashboard', { replace: true });

    // 后退
    navigate(-1);

    // 传递state
    navigate('/profile', { state: { fromLogin: true } });
  }

  return <button onClick={handleLogin}>Login</button>;
}


路由参数

jsx
import { useParams, useSearchParams, useLocation } from 'react-router-dom';

// 动态路由参数
// 路由定义：<Route path="/users/:id" element={<UserDetail />} />
function UserDetail() {
  const { id } = useParams(); // 获取URL参数
  // ...
}

// 查询字符串参数
function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q'); // 获取 ?q=xxx

  // 设置查询参数
  searchParams.set('q', 'new query');
}

// 获取location对象（包含pathname、search、hash、state）
function CurrentPath() {
  const location = useLocation();
  console.log(location.pathname); // 当前路径
  console.log(location.search); // 查询字符串
  console.log(location.state); // 导航时传递的state

  return <div>Path: {location.pathname}</div>;
}


嵌套路由与布局

jsx
// 父布局组件
import { Outlet, Link } from 'react-router-dom';

function Layout() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
      <Outlet /> {/* 子路由在此渲染 */}
      <footer>© 2025</footer>
    </div>
  );
}

// 路由配置
<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={<Home />} />
    <Route path="dashboard" element={<Dashboard />}>
      <Route path="settings" element={<Settings />} />
    </Route>
  </Route>
</Routes>


路由守卫（Auth）

jsx
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // 保存当前路径，登录后跳回
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// 使用
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>


404与错误处理

jsx
<Routes>
  <Route path="/" element={<Home />} />
  {/* 匹配所有未定义的路由（404） */}
  <Route path="*" element={<NotFound />} />
</Routes>


2. React Router v7 Data API（Loader与Action）

React Router v7引入了类似Remix的数据路由概念，将数据获取与路由生命周期绑定。

Loader（路由数据加载）

jsx
// loaders/userLoader.js
export async function userLoader({ params }) {
  const userId = params.id;
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) {
    throw new Response('Not Found', { status: 404 });
  }
  return response.json();
}

// 路由配置
<Route
  path="/users/:id"
  element={<UserDetail />}
  loader={userLoader}
/>

// 组件中使用loaderData
import { useLoaderData } from 'react-router-dom';

function UserDetail() {
  const user = useLoaderData(); // 获取loader返回的数据
  // ...
}


Action（路由数据变更）

jsx
// actions/createPostAction.js
export async function createPostAction({ request }) {
  const formData = await request.formData();
  const title = formData.get('title');
  // 创建逻辑...
  return redirect('/posts'); // 重定向
}

// 路由配置
<Route
  path="/posts/new"
  element={<NewPost />}
  action={createPostAction}
/>

// 组件中使用actionData
import { useActionData } from 'react-router-dom';

function NewPost() {
  const actionData = useActionData(); // 获取action返回的数据（如错误）
  const navigation = useNavigation(); // 获取导航状态（idle/submitting/loading）

  return (
    <form method="post">
      {/* form action会自动触发对应的route action */}
      <input name="title" />
      <button disabled={navigation.state === 'submitting'}>
        {navigation.state === 'submitting' ? 'Submitting...' : 'Create'}
      </button>
      {actionData?.error && <p>{actionData.error}</p>}
    </form>
  );
}


useNavigation

获取全局导航状态，用于显示加载指示器、禁用按钮等。

jsx
import { useNavigation } from 'react-router-dom';

function GlobalLoader() {
  const navigation = useNavigation();
  // navigation.state: 'idle' | 'submitting' | 'loading'

  return navigation.state !== 'idle' ? <Spinner /> : null;
}


useFetcher

触发不导航的action，适用于后台操作（如点赞、收藏）。

jsx
import { useFetcher } from 'react-router-dom';

function LikeButton({ postId }) {
  const fetcher = useFetcher();
  const liked = fetcher.formData?.get('intent') === 'like';

  return (
    <fetcher.Form method="post" action="/like">
      <input type="hidden" name="postId" value={postId} />
      <button
        type="submit"
        name="intent"
        value={liked ? 'unlike' : 'like'}
      >
        {liked ? 'Unlike' : 'Like'}
      </button>
    </fetcher.Form>
  );
}


四、状态管理

1. React Context API

适用于：低频更新的全局状态（主题、语言、用户信息）。

基本用法

jsx
// 创建Context
const ThemeContext = createContext(null);

// Provider组件
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 消费Context
function ThemeButton() {
  const { theme, setTheme } = useContext(ThemeContext);

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Switch to {theme === 'light' ? 'dark' : 'light'}
    </button>
  );
}


Context性能优化

Context值变化会导致所有消费组件重新渲染，可通过拆分Context或使用useMemo优化。

jsx
// 拆分Context避免不必要的重新渲染
const ThemeStateContext = createContext(null);
const ThemeDispatchContext = createContext(null);

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeStateContext.Provider value={theme}>
      <ThemeDispatchContext.Provider value={setTheme}>
        {children}
      </ThemeDispatchContext.Provider>
    </ThemeStateContext.Provider>
  );
}

// 组件可单独订阅需要的Context，避免无关Context值变化触发重新渲染
function ThemeDisplay() {
  const theme = useContext(ThemeStateContext); // 仅订阅theme
  // ...
}

function ThemeToggler() {
  const setTheme = useContext(ThemeDispatchContext); // 仅订阅setTheme
  // ...
}


Context最佳实践

仅用于全局、低频更新的状态
避免在Context中存储高频变化的状态（如计时器）
考虑拆分Context以优化性能

2. Redux Toolkit（RTK）

适用于：大型应用、复杂状态逻辑、需要调试和时间旅行功能的项目。

安装

bash
npm install @reduxjs/toolkit react-redux


创建Slice（状态切片）

jsx
// features/counter/counterSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  value: 0,
  status: 'idle' // 'idle' | 'loading' | 'succeeded' | 'failed'
};

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: state => {
      state.value += 1;
    },
    decrement: state => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
    reset: state => {
      state.value = 0;
    }
  }
});

// 导出action creators和reducer
export const { increment, decrement, incrementByAmount, reset } =
  counterSlice.actions;
export default counterSlice.reducer;


配置Store

jsx
// app/store.js
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './features/counter/counterSlice';

const store = configureStore({
  reducer: {
    counter: counterReducer
    // 可添加更多slice reducer: user: userReducer, products: productsReducer
  },
  // middleware配置（默认包含redux-thunk）
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(logger),
  // 开启DevTools（默认开启）
  devTools: process.env.NODE_ENV !== 'production'
});

export default store;

// 导出类型（TypeScript）
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


异步逻辑（createAsyncThunk）

jsx
// features/user/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchUser as fetchUserAPI } from './userAPI';

export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (userId, thunkAPI) => {
    const response = await fetchUserAPI(userId);
    return response.data;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    entities: {},
    ids: [],
    status: 'idle',
    error: null
  },
  reducers: {
    // 同步reducers
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUser.pending, state => {
        state.status = 'loading';
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        userAdapter.addOne(state, action.payload);
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export default userSlice.reducer;


组件中使用

jsx
import { useSelector, useDispatch } from 'react-redux';
import { increment, decrement, fetchUser } from './features/counter/counterSlice';

function Counter() {
  const count = useSelector(state => state.counter.value);
  const dispatch = useDispatch();

  function handleIncrement() {
    dispatch(increment());
  }

  useEffect(() => {
    dispatch(fetchUser(userId));
  }, [dispatch, userId]);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleIncrement}>+</button>
      <button onClick={() => dispatch(decrement())}>-</button>
    </div>
  );
}


Redux Toolkit最佳实践

使用 createSlice 而非手动编写action和reducer
利用Immer直接修改状态（RTK内置Immer）
模块化状态：按业务领域拆分slice
使用选择器函数封装状态访问，提高可维护性
使用 createAsyncThunk 处理异步逻辑
利用Redux DevTools调试状态变化
TypeScript集成：定义RootState和AppDispatch类型

3. Zustand

适用于：中小型项目、轻量级状态管理、需要快速开发的项目。

安装

bash
npm install zustand


基础用法

jsx
// store/useStore.js
import { create } from 'zustand';

const useStore = create(set => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
  decrement: () => set(state => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 })
}));

// 组件中使用
function Counter() {
  // 选择性订阅（仅count变化时重新渲染）
  const count = useStore(state => state.count);
  const increment = useStore(state => state.increment);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
    </div>
  );
}


中间件使用

jsx
// DevTools中间件
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools(set => ({
    count: 0,
    increment: () => set(state => ({ count: state.count + 1 }))
  }))
);

// 持久化中间件（localStorage）
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    set => ({
      theme: 'light',
      toggleTheme: () =>
        set(state => ({
          theme: state.theme === 'light' ? 'dark' : 'light'
        }))
    }),
    {
      name: 'theme-storage', // localStorage中的key
      getStorage: () => localStorage // 可选sessionStorage
    }
  )
);

// 组合中间件（注意顺序）
import { devtools, persist } from 'zustand/middleware';

const useStore = create(
  devtools(
    persist(
      set => ({
        // ...
      }),
      { name: 'my-store' }
    )
  )
);


异步操作

jsx
const useUserStore = create(set => ({
  user: null,
  loading: false,
  error: null,

  fetchUser: async userId => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/users/${userId}`);
      const user = await response.json();
      set({ user, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));


Zustand最佳实践

选择性订阅：使用选择器函数，避免全量订阅导致不必要的重新渲染
拆分Store：复杂项目可按业务模块拆分多个Store
使用中间件扩展功能：DevTools、持久化、日志等
与Redux对比：Zustand更简洁、学习成本低，适合中小型项目

五、工程化与构建工具

1. Vite

新一代前端构建工具，开发体验极佳，已成为React项目主流选择。

核心特性

极速启动：基于原生ESM，无需打包整个应用
快速HMR：模块热更新，保持应用状态
优化的生产构建：使用Rollup进行打包，自动代码分割、压缩
开箱即用：支持TypeScript、JSX、CSS等，无需复杂配置
插件生态：兼容Rollup插件，社区活跃

项目创建

bash
npm create vite@latest my-react-app -- --template react
# 或
yarn create vite my-react-app --template react
# 或
pnpm create vite my-react-app --template react


配置示例（vite.config.js）

jsx
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src' // 路径别名
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 代理API请求
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // 手动代码分割
          react: ['react', 'react-dom'],
          'react-router': ['react-router-dom']
        }
      }
    }
  }
});


环境变量

Vite内置环境变量支持，.env文件：

env
# .env.development
VITE_API_BASE_URL=http://localhost:8080/api

# .env.production
VITE_API_BASE_URL=https://api.example.com


在代码中使用：

jsx
const apiUrl = import.meta.env.VITE_API_BASE_URL;


Vite常用插件

bash
# TypeScript路径别名支持
npm install -D @types/node

# 自动导入Vue API
npm install -D unplugin-auto-import

# 组件自动导入
npm install -D unplugin-vue-components

# 可视化打包分析
npm install -D rollup-plugin-visualizer

# 压缩文件（gzip/brotli）
npm install -D vite-plugin-compression

# PWA支持
npm install -D vite-plugin-pwa


Vite vs Webpack

特性	Vite	Webpack
开发启动速度	极快（<1s）	较慢（项目大时>10s）
HMR速度	快	较慢
配置复杂度	简单	复杂
生产构建	Rollup（优秀）	Webpack（成熟）
生态	新兴，发展快	成熟，插件丰富
适用场景	新项目、追求开发体验	老项目迁移、复杂需求

2. Webpack（简要）

传统构建工具，生态成熟，配置灵活，但学习曲线陡峭。

核心概念

Entry（入口） ：打包的起始文件
Output（输出） ：打包后的文件配置
Loader（加载器） ：处理非JavaScript文件（如babel-loader处理JSX）
Plugin（插件） ：扩展Webpack功能（如HtmlWebpackPlugin生成HTML）
Mode（模式） ：development/production，影响内置优化

配置示例（简化）

jsx
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ],
  devServer: {
    port: 3000,
    hot: true,
    open: true
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
};


六、测试

1. Jest

JavaScript测试框架，React项目常用测试运行器。

基本测试

jsx
// sum.js
export const sum = (a, b) => a + b;

// sum.test.js
import { sum } from './sum';

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});

test('object assignment', () => {
  const data = { one: 1 };
  data['two'] = 2;
  expect(data).toEqual({ one: 1, two: 2 });
});


异步测试

jsx
test('async test', async () => {
  const data = await fetchData();
  expect(data).toBe('peanut butter');
});

// 测试Promise
test('the data is peanut butter', () => {
  return fetchData().then(data => {
    expect(data).toBe('peanut butter');
  });
});

// 使用resolves/rejects
test('the fetch fails with an error', () => {
  return expect(fetchData()).rejects.toMatch('error');
});


Mock函数

jsx
import { forEach, mockFunction } from './mock-functions';
import axios from 'axios';

jest.mock('axios'); // Mock整个axios模块

test('mock functions', () => {
  const mockCallback = jest.fn(x => 42 + x);

  forEach([0, 1], mockCallback);

  // 验证调用次数
  expect(mockCallback.mock.calls.length).toBe(2);

  // 验证首次调用的第一个参数
  expect(mockCallback.mock.calls[0][0]).toBe(0);

  // 验证最后一次调用的返回值
  expect(mockCallback.mock.results[1].value).toBe(43);
});

// Mock返回值
axios.get.mockResolvedValue({ data: 'response data' });


2. React Testing Library（RTL）

测试React组件的推荐库，遵循“测试用户行为而非实现细节”原则。

安装

bash
npm install --save-dev @testing-library/react @testing-library/jest-dom


基本用法

jsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Counter from './Counter';

test('renders counter with initial value 0', () => {
  render(<Counter />);
  const countElement = screen.getByText(/count: 0/i);
  expect(countElement).toBeInTheDocument();
});


查询元素

RTL提供多种查询方式，按优先级排序：

ByRole：推荐，通过元素的角色查询（如button、link）
ByLabelText：通过关联的label文本查询表单元素
ByPlaceholderText：通过placeholder查询
ByText：通过文本内容查询
ByDisplayValue：通过表单元素的当前值查询
ByAltText：通过alt属性查询图片
ByTitle：通过title属性查询
ByTestId：不推荐，通过data-testid属性查询（应作为最后手段）

jsx
// 推荐方式
const button = screen.getByRole('button', { name: /submit/i });
const input = screen.getByLabelText(/email/i);

// 查询多个元素
const buttons = screen.getAllByRole('button');

// 查询可能不存在的元素
const errorMessage = screen.queryByText(/error/i);
if (errorMessage) {
  // ...
}

// 异步查询
const element = await screen.findByText('Loaded!');


用户交互模拟

jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

test('allows user to login', async () => {
  const user = userEvent.setup();
  const handleLogin = jest.fn();

  render(<LoginForm onLogin={handleLogin} />);

  // 使用userEvent模拟更真实的用户行为
  await user.type(screen.getByLabelText(/username/i), 'testuser');
  await user.type(screen.getByLabelText(/password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /login/i }));

  // 验证
  expect(handleLogin).toHaveBeenCalledWith({
    username: 'testuser',
    password: 'password123'
  });
});

// fireEvent（更底层的API）
test('input value changes', () => {
  render(<input type="text" />);
  const input = screen.getByRole('textbox');

  fireEvent.change(input, { target: { value: 'hello' } });

  expect(input.value).toBe('hello');
});


异步组件测试

jsx
import { render, screen, waitFor } from '@testing-library/react';
import UserList from './UserList';

test('loads and displays users', async () => {
  render(<UserList />);

  // 等待元素出现
  await waitFor(() => {
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  // 或使用findBy
  const john = await screen.findByText('John');
  expect(john).toBeInTheDocument();
});

// 测试加载状态
test('shows loading state', () => {
  render(<UserList />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});


快照测试

jsx
import renderer from 'react-test-renderer';
import Link from './Link';

test('renders correctly', () => {
  const tree = renderer
    .create(<Link page="http://www.facebook.com">Facebook</Link>)
    .toJSON();
  expect(tree).toMatchSnapshot();
});


Mock组件与Hooks

jsx
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

test('increment counter', () => {
  const { result } = renderHook(() => useCounter());

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});


测试最佳实践

测试用户行为：从用户角度测试组件功能，而非实现细节
避免测试内部状态：不直接测试组件的state、props等内部实现
使用RTL查询优先级：优先使用getByRole等语义化查询
模拟真实用户操作：使用userEvent模拟用户输入、点击等行为
隔离性：每个测试应独立，不依赖其他测试的执行顺序
命名清晰：测试名称应清晰描述测试的行为

七、React 服务端能力

1. Next.js App Router

基于React Server Components（RSC）构建的下一代路由方案。

目录结构

plaintext
app/
├── layout.tsx           # 根布局（必须）
├── page.tsx            # 首页
├── loading.tsx          # 加载状态
├── error.tsx           # 错误处理
├── not-found.tsx        # 404页面
├── globals.css         # 全局样式
├── about/
│   └── page.tsx        # /about路由
├── blog/
│   ├── layout.tsx      # 布局（嵌套）
│   ├── page.tsx        # /blog列表页
│   └── [slug]/
│       └── page.tsx    # /blog/:slug动态路由
└── api/
    └── hello/
        └── route.ts      # /api/hello API路由


服务端组件（默认）

tsx
// app/page.tsx（默认是服务端组件）
async function HomePage() {
  // 直接在服务端获取数据
  const posts = await db.posts.findMany();

  return (
    <div>
      <h1>Blog</h1>
      <ul>
        {posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}


客户端组件

tsx
// components/Counter.tsx
'use client'; // 必须标记

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}


布局（Layout）

tsx
// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'My Blog',
  description: 'A blog built with Next.js'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
        </nav>
        {children}
        <footer>© 2025 My Blog</footer>
      </body>
    </html>
  );
}


数据获取

tsx
// app/posts/page.tsx
async function PostsPage() {
  // 自动缓存（SSG），可通过revalidate配置ISR
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 } // ISR：每60秒重新验证
  });
  const posts = await res.json();

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}


Server Actions

tsx
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await db.post.create({
    data: { title, content }
  });

  revalidatePath('/posts'); // 重新验证/posts路径
}

// app/posts/new/page.tsx
import { createPost } from '@/app/actions';

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required />
      <button type="submit">Create</button>
    </form>
  );
}


错误处理

tsx
// app/error.tsx
'use client';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}


加载状态

tsx
// app/loading.tsx
export default function Loading() {
  return <div>Loading...</div>;
}


API路由

tsx
// app/api/hello/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({ message: 'Hello from API' });
}

export async function POST(request: Request) {
  const body = await request.json();
  // 处理POST请求...
  return NextResponse.json({ success: true });
}


2. React Server Components（RSC）

React 18+引入的革命性特性，允许组件在服务端执行并渲染，减少客户端JS体积。

核心特性

零客户端JS：服务端组件逻辑不会发送到客户端
直接数据访问：可访问数据库、文件系统等服务器资源
异步组件：支持在组件中直接使用async/await
流式渲染：逐步传输渲染结果，提升首屏加载速度

服务端组件（默认）

tsx
// 服务端组件（默认）
async function Page() {
  const data = await db.query('SELECT * FROM posts');

  return (
    <div>
      {data.map(post => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  );
}


客户端组件

tsx
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}


组合使用

tsx
// 服务端组件
import Counter from './Counter'; // 客户端组件

async function Page() {
  const data = await fetchData();

  return (
    <div>
      <h1>{data.title}</h1>
      <Counter />
    </div>
  );
}


3. 服务端渲染（SSR）策略对比

渲染方式	渲染时机	执行环境	优势	劣势	适用场景
SSG（静态生成）	构建时	服务器	首屏快、SEO好、CDN友好	内容静态、需重新构建	博客、文档、官网
SSR（服务端渲染）	每次请求	服务器	内容实时、SEO好	服务器压力大	电商、新闻、用户专属内容
ISR（增量静态再生成）	构建时+到期更新	服务器	兼顾速度与新鲜度	配置稍复杂	半动态内容（商品详情）
CSR（客户端渲染）	浏览器加载后	浏览器	交互性强、服务器压力小	首屏慢、SEO差	后台管理、SPA

八、React 19 新特性深度解析

React 19是React 18以来的首个重大版本更新，引入了多项革命性特性。

1. React Compiler（编译器）

核心价值：自动优化组件渲染，消除手动 useMemo、useCallback、React.memo。

工作原理

静态分析组件依赖关系
自动识别需要记忆化的计算
自动插入 useMemo、useCallback、React.memo

启用方式

jsx
// babel.config.js
module.exports = {
  presets: ['@babel/preset-react'],
  plugins: ['babel-plugin-react-compiler']
};


影响

开发体验提升：开发者无需手动优化性能
代码更简洁：移除大量 useMemo、useCallback
性能优化：编译器智能分析，避免过度缓存

2. Actions（动作系统）

核心价值：简化数据变更（如表单提交）的样板代码，自动管理加载状态、错误处理、乐观更新。

useActionState

jsx
import { useActionState } from 'react';

const [error, submitAction, isPending] = useActionState(
  async (previousState, formData) => {
    const error = await updateName(formData.get('name'));
    if (error) {
      return error;
    }
    redirect('/path');
    return null;
  },
  null
);

function ChangeName() {
  return (
    <form action={submitAction}>
      <input type="text" name="name" />
      <button type="submit" disabled={isPending}>
        Update
      </button>
      {error && <p>{error}</p>}
    </form>
  );
}


useFormStatus

jsx
import { useFormStatus } from 'react';

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();

  return (
    <button disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}


useOptimistic（乐观更新）

jsx
import { useOptimistic } from 'react';

function MessageList({ messages }) {
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (state, newMessage) => [
      { text: newMessage, sending: true },
      ...state
    ]
  );

  return (
    <div>
      {optimisticMessages.map(msg => (
        <p key={msg.id}>{msg.text} {msg.sending && '...'}</p>
      ))}
    </div>
  );
}


3. 新增Hooks

use（读取Promise或Context）

jsx
import { use } from 'react';

function UserProfile({ userPromise }) {
  // 读取Promise（配合Suspense使用）
  const user = use(userPromise);

  // 读取Context（替代useContext）
  const theme = use(ThemeContext);

  return <div>{user.name}</div>;
}

// use Hook是唯一可以在条件语句中调用的Hook
function Button({ show }) {
  if (show) {
    const theme = use(ThemeContext); // ✅ 可以在条件语句中调用
    return <button className={`btn-${theme}`}>Click</button>;
  }
  return null;
}


4. 语法简化

ref作为普通prop

jsx
// React 18：需要forwardRef
const Input = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

// React 19：ref可直接作为props
function Input({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}


Context简化

jsx
// React 18
<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>

// React 19
<ThemeContext value="dark">
  <App />
</ThemeContext>


文档元数据原生支持

jsx
function BlogPost({ post }) {
  return (
    <article>
      <title>{post.title}</title>
      <meta name="description" content={post.excerpt} />
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}


5. 性能优化改进

扩展的自动批处理

React 19将自动批处理扩展到异步操作，包括 setTimeout、Promise回调等。

jsx
// React 19中会合并为一次渲染
function fetchData() {
  setTimeout(() => {
    setUser(userData);
    setPosts(postData);
    setComments(commentsData);
  }, 1000);
}


useDeferredValue动态调整延迟时间

useDeferredValue 的延迟时间从固定的5ms优化为动态调整（根据设备性能），在低端设备上体验提升明显。

6. 破坏性变更

移除的API

React.FC：不再推荐使用，直接用函数声明
defaultProps：改用ES6默认参数
propTypes：改用TypeScript或Zod

迁移示例

jsx
// React 18
const Button = ({ children, onClick, disabled = false }) => { ... };
Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func
};
Button.defaultProps = {
  disabled: false
};

// React 19
const Button = ({ children, onClick, disabled = false }: ButtonProps) => { ... };
// 类型定义通过TypeScript
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}


九、性能优化最佳实践

1. 组件级优化

jsx
// React.memo：避免不必要的重新渲染
const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }) {
  return <div>{/* 复杂渲染逻辑 */}</div>;
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return prevProps.data.id === nextProps.data.id;
});


2. 记忆化计算与函数

jsx
// useMemo：缓存计算结果
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.id - b.id);
}, [items]);

// useCallback：缓存函数引用
const handleClick = useCallback(() => {
  console.log('Clicked');
}, []); // 空依赖数组，函数引用永不变化


3. 代码分割与懒加载

jsx
import { lazy, Suspense } from 'react';

// 懒加载组件
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}

// 路由级代码分割
import { Routes, Route } from 'react-router-dom';

const Dashboard = lazy(() => import('./Dashboard'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}


4. 虚拟列表渲染

对于超长列表，使用虚拟滚动仅渲染可视区域内的元素。

jsx
import { FixedSizeList as List } from 'react-window';

function VirtualizedList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>{items[index].name}</div>
  );

  return (
    <List
      height={500}
      itemCount={items.length}
      itemSize={35}
      width={300}
    >
      {Row}
    </List>
  );
}


5. 图片优化

jsx
// 使用loading="lazy"实现懒加载
<img
  src="image.jpg"
  alt="Description"
  loading="lazy"
  width="800"
  height="600"
/>

// 响应式图片
<img
  srcSet="image-320w.jpg 320w, image-640w.jpg 640w, image-1280w.jpg 1280w"
  sizes="(max-width: 600px) 320px, (max-width: 1200px) 640px, 1280px"
  src="image-1280w.jpg"
  alt="Responsive image"
/>


十、高频考点速记

1. React基础

React是声明式、组件化的JavaScript库
JSX是React.createElement的语法糖
组件名首字母必须大写
Props是只读的，不应在子组件中修改
State更新是异步的，不要依赖当前state值计算新值
Key应使用唯一、稳定的值（如数据库ID），避免使用数组索引

2. Hooks规则

只能在函数组件顶层调用Hooks（不在循环、条件、嵌套函数中）
只能在React函数组件或自定义Hook中调用Hooks
自定义Hook名称以use开头

3. useEffect依赖数组

空数组[]：仅在挂载时执行一次（类似componentDidMount）
有依赖[dep]：依赖变化时执行（类似componentDidUpdate）
返回的清理函数：组件卸载前或下一次Effect执行前执行

4. Context vs Redux vs Zustand

Context：适用于全局、低频更新的状态（主题、语言）
Redux：适用于大型应用、复杂状态逻辑、需要调试功能
Zustand：适用于中小型项目、轻量级状态管理、快速开发

5. React 19新特性

React Compiler：自动优化，消除手动useMemo/useCallback
Actions：简化表单处理，自动管理加载状态、错误处理
use：唯一可在条件语句中调用的Hook，读取Promise或Context
useOptimistic：实现乐观更新
ref作为普通prop：无需forwardRef

6. 服务端渲染

SSG（静态生成）：构建时渲染，内容静态，适用于博客、文档
SSR（服务端渲染）：每次请求渲染，内容实时，适用于电商、新闻
ISR（增量静态再生成）：构建时渲染+到期更新，适用于半动态内容
CSR（客户端渲染）：浏览器渲染，交互性强，适用于后台管理

7. 性能优化

使用React.memo避免不必要的重新渲染
使用useMemo缓存计算结果
使用useCallback缓存函数引用
使用代码分割和懒加载lazy/Suspense
对于超长列表，使用虚拟滚动

8. 测试最佳实践

测试用户行为而非实现细节
优先使用语义化查询（getByRole、getByLabelText）
使用userEvent模拟真实用户操作
每个测试应独立，不依赖其他测试

十一、学习路径与资源推荐

1. 初学者路径

学习React基础概念：JSX、组件、Props、State
掌握常用Hooks：useState、useEffect、useContext
学习React Router：路由配置、导航、参数
实践：构建小型项目（如待办事项、天气应用）

2. 进阶路径

深入Hooks：useReducer、useMemo、useCallback、自定义Hooks
状态管理：Redux Toolkit或Zustand
性能优化：React.memo、代码分割、虚拟列表
测试：Jest + React Testing Library
服务端渲染：Next.js App Router

3. 高级路径

React 19新特性：React Compiler、Actions、新Hooks
服务端组件：React Server Components
工程化：Vite配置、自定义插件、CI/CD
架构设计：状态管理架构、组件设计模式

4. 推荐资源

官方文档：React.dev（最权威、最新）
Next.js文档：Next.js.org（服务端渲染、App Router）
Redux Toolkit文档：Redux-toolkit.js.org（状态管理）
Testing Library文档：Testing-library.com（测试最佳实践）
Vite文档：Vitejs.cn（构建工具）

十二、常见问题与解决方案

1. 无限循环渲染

问题：组件渲染中调用setState导致无限循环

jsx
// 错误示例
function Counter() {
  const [count, setCount] = useState(0);
  setCount(count + 1); // 每次渲染都触发更新，导致无限循环
  return <div>Count: {count}</div>;
}


解决：将setState放在事件处理函数或useEffect中

jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(1); // 仅挂载时执行一次
  }, []);

  function handleClick() {
    setCount(count + 1); // 仅点击时执行
  }

  return <div onClick={handleClick}>Count: {count}</div>;
}


2. Props drilling问题

问题：深层组件需要访问祖先组件的状态，需要层层传递props

解决：使用Context API或状态管理库

jsx
// 使用Context解决
const UserContext = createContext(null);

function App() {
  const user = { name: 'Alice', age: 30 };

  return (
    <UserContext.Provider value={user}>
      <Header />
      <Content />
    </UserContext.Provider>
  );
}

function DeepComponent() {
  const user = useContext(UserContext); // 直接访问user，无需props drilling
  return <div>{user.name}</div>;
}


3. Stale Closure（过时闭包）

问题：事件处理函数或useEffect中使用了旧的state值

jsx
// 错误示例
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      console.log(count); // 始终打印0，因为count在effect创建时被捕获
    }, 1000);
    return () => clearInterval(id);
  }, []); // 空依赖数组，effect只执行一次
}


解决：添加count到依赖数组，或使用函数式更新

jsx
// 方案1：添加依赖
useEffect(() => {
  const id = setInterval(() => {
    console.log(count); // count变化时，effect重新执行，闭包更新
  }, 1000);
  return () => clearInterval(id);
}, [count]);

// 方案2：函数式更新（推荐）
function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(prevCount => prevCount + 1); // 使用前一个值，避免过时闭包
  };

  useEffect(() => {
    const id = setInterval(increment, 1000);
    return () => clearInterval(id);
  }, [increment]);
}


4. React.StrictMode双重渲染

现象：开发模式下，组件渲染两次（React 18+ StrictMode默认行为）

原因：帮助发现副作用问题

解决：这是预期行为，生产环境不会双重渲染

jsx
// 如果effect中有副作用（如API调用），需要确保清理或去重
useEffect(() => {
  let isMounted = true;

  async function fetchData() {
    const data = await api.fetch();
    if (isMounted) {
      setData(data);
    }
  }

  fetchData();

  return () => {
    isMounted = false;
  };
}, []);


这份React复习核心知识点涵盖了React基础、Hooks、路由、状态管理、工程化、测试、服务端能力以及React19新特性等全面内容，适合考前复习或项目实践参考。