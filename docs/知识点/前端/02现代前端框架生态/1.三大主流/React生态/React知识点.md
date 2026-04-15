一、【必背】组件核心完整
1. 组件定义
   函数组件
   类组件
   纯组件
   高阶组件 HOC
   函数作为子组件（render props）
   插槽实现
2. Props 完整知识点
   props 传递
   props 校验（prop-types）
   props 默认值
   props 只读（不能修改）
   props children
   props 透传
3. 事件系统完整
   合成事件（SyntheticEvent）
   事件绑定
   事件传参
   事件冒泡 / 捕获
   原生事件与 React 事件区别
   事件池
   阻止默认行为 e.preventDefault ()
   阻止冒泡 e.stopPropagation ()
4. 条件渲染
   if / else
   三元表达式
   && 逻辑与
   控制元素显示隐藏
5. 列表渲染
   map 循环
   key 的作用、原理、注意事项
   index 作为 key 的问题
   列表优化
6. 表单完整（超级全）
   受控组件
   非受控组件（useRef）
   多选、单选、下拉、上传、富文本
   表单验证
   React 19 原生表单 Action
   useActionState
   useFormStatus
   二、【必背】Hooks 完整（一个不漏）
   基础 Hooks
   useState
   useEffect
   useRef
   useContext
   useReducer
   useCallback
   useMemo
   useImperativeHandle
   useLayoutEffect
   useDebugValue
   React 18 Hooks
   useTransition
   useDeferredValue
   useId
   React 19 Hooks（新增）
   useActionState
   useFormStatus
   useOptimistic
   useEffectEvent
   useWebGPU (实验性)
   Hooks 原理 & 规则
   只能在顶层调用
   只能在组件 / Hooks 中调用
   Hooks 链表结构
   依赖项规则
   闭包陷阱
   无限循环问题
   依赖如何正确写
   三、【必背】React 生命周期（完整）
   挂载
   constructor
   getDerivedStateFromProps
   render
   componentDidMount
   更新
   getDerivedStateFromProps
   shouldComponentUpdate
   render
   getSnapshotBeforeUpdate
   componentDidUpdate
   卸载
   componentWillUnmount
   错误处理
   componentDidCatch
   getDerivedStateFromError
   四、【必背】状态管理完整（全家桶）
   Context API
   createContext
   Provider
   useContext
   状态提升
   跨组件共享
   Redux Toolkit 完整
   store
   reducer
   slice
   action
   dispatch
   selector
   异步处理（createAsyncThunk）
   持久化 redux-persist
   Zustand 完整
   create
   get
   set
   切片模式
   异步支持
   无 Provider
   Jotai 完整
   atom
   useAtom
   原子状态
   派生状态
   Recoil
   atom
   selector
   五、【必背】路由 React Router v6 完整
   createBrowserRouter
   createHashRouter
   RouterProvider
   Route
   Outlet
   Link / NavLink
   useNavigate
   useParams
   useLocation
   useRoutes
   useRouteError
   useLoaderData
   路由懒加载
   路由守卫
   嵌套路由
   动态路由
   错误边界路由
   加载中路由
   六、【必背】异步请求完整
   fetch
   axios 封装
   请求拦截
   响应拦截
   取消请求
   错误处理
   重试
   防抖提交
   React Query / TanStack Query
   useQuery
   useMutation
   useInfiniteQuery
   queryKey
   queryFn
   缓存策略
   乐观更新
   分页 / 加载更多
   SWR
   useSWR
   重新请求
   重新聚焦
   七、【必背】React 18/19 所有新特性（完整）
   React 18
   并发渲染
   Automatic Batching 自动批处理
   Transitions
   Suspense
   服务端组件
   流式 SSR
   React 19
   原生表单 Actions
   useActionState
   useOptimistic
   useEffectEvent
   React Compiler
   服务端组件稳定
   客户端组件 'use client'
   异步组件 async/await
   自动清理 effect
   组件 ref 直接指向实例
   命名导出改进
   资源加载优化
   八、【必背】性能优化（完整）
   React.memo
   useMemo
   useCallback
   useTransition
   useDeferredValue
   懒加载 React.lazy
   Suspense
   虚拟列表
   图片懒加载
   代码分割
   减少渲染次数
   合理使用 key
   避免内联函数
   避免匿名对象
   依赖优化
   React 19 自动优化
   九、【必背】高级 API（完整）
   lazy
   Suspense
   memo
   forwardRef
   createRef
   createContext
   createPortal 传送门
   cloneElement
   isValidElement
   Fragment
   StrictMode 严格模式
   十、【必背】错误处理（完整）
   Error Boundary 错误边界
   use
   异步错误
   渲染错误
   事件错误
   服务端组件错误
   十一、【必背】模块化 & 工程化
   组件拆分
   公共组件
   业务组件
   自定义 Hooks
   工具函数
   常量管理
   环境变量
   打包优化
   依赖分析
   十二、【必背】SSR / SSG / ISR / RSC 完整
   SSR 服务端渲染
   SSG 静态站点生成
   ISR 增量静态生成
   RSC 服务端组件
   客户端组件
   流式渲染
   首屏优化
   十三、【必背】测试相关
   Jest
   React Testing Library
   单元测试
   组件测试
   Hooks 测试
   十四、【必背】安全相关
   XSS 防御
   CSRF 防御
   敏感信息处理
   依赖漏洞
   十五、【必背】面试必考
   合成事件是什么
   批处理更新
   闭包陷阱
   useEffect 执行时机
   useLayoutEffect 与 useEffect 区别
   状态批量更新
   异步渲染
   函数组件与类组件区别
   为什么 Hooks 不能在条件中使用
   组件为什么会重复渲染
   如何避免重复渲染
   合成事件与原生事件区别
   事件绑定方式
   组件复用方式
   状态管理选型
   路由原理
   虚拟 DOM 优点
   key 的作用
   为什么不要用 index 做 key
   受控 vs 非受控
   服务端组件优势




diff、Fiber