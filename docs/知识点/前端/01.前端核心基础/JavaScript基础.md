---
title: JavaScript 基础
category: 知识点
tags:
  - 前端
  - JavaScript
  - 基础
---

# JavaScript 基础

JavaScript 基础解决的是"如何驱动页面行为"。语法、浏览器 API 和基础请求能力都是日常开发高频项。

## 核心范围

- 语法基础：变量、数据类型、流程控制、函数、对象与数组
- DOM / BOM：节点查询、事件绑定、事件冒泡、`location`、`history`、`storage`
- 原生业务特效：选项卡、轮播图、拖拽、懒加载、表单校验
- AJAX / Fetch：请求发送、响应处理、错误处理、取消请求与封装

## 一、JS 基础核心

### 1. 是什么
- 脚本语言，实现网页**交互、逻辑、动态效果**
- 组成：ECMAScript（语法） + DOM（操作页面） + BOM（操作浏览器）

### 2. 变量声明（必考）
- `let` 变量，可改，不允许重复声明
- `const` 常量，声明必须赋值，不可改
- `var` 旧写法，有变量提升，尽量不用
- **优先级**：const > let > var

### 3. 数据类型

#### 基本类型（值类型）
- `String` 字符串
- `Number` 数字
- `Boolean` 布尔
- `Undefined` 未定义
- `Null` 空
- `Symbol` 唯一值
- `BigInt` 大数字

#### 引用类型
- `Object`、`Array`、`Function`

### 4. 类型判断
- `typeof` 判断基本类型
- `===` 严格相等（必用）
- `==` 自动类型转换，尽量不用

## 二、运算符与流程控制

### 1. 常用运算符
- **算术**：`+ - * / %`
- **赋值**：`= += -= *=`
- **比较**：`> < >= <= === !==`
- **逻辑**：`&& 与` `|| 或` `! 非`

### 2. 流程语句
- `if else` 条件判断
- `switch case` 多条件
- `while` 循环
- `for` 最常用循环
- `break` 跳出 / `continue` 跳过

## 三、函数（核心）

### 1. 函数声明
```js
function 函数名(参数) {
  return 返回值
}
```

### 2. 箭头函数（常用）
```js
const fn = () => {}
```
- 没有 `this`
- 没有 `arguments`
- 写法更简洁

### 3. 函数参数
- **形参**：定义时的变量
- **实参**：调用时传的值

### 4. 作用域
- 全局作用域
- 函数作用域
- 块级作用域（let/const）

## 四、数组常用方法（高频必背）
- `push()` 末尾添加
- `pop()` 末尾删除
- `shift()` 头部删除
- `unshift()` 头部添加
- `forEach()` 遍历
- `map()` 映射返回新数组
- `filter()` 过滤
- `find()` 查找第一个满足项
- `some()` 只要有一个满足
- `every()` 全部满足
- `indexOf()` 查找索引
- `includes()` 判断是否包含

## 五、对象基础

### 1. 创建
```js
const obj = { name: 'zs', age: 18 }
```

### 2. 访问
- `obj.name`
- `obj['name']`

### 3. 方法
```js
const obj = { say(){ console.log('hi') } }
```

## 六、DOM 操作（网页操作）

### 1. 获取元素
- `document.querySelector('选择器')`
- `document.querySelectorAll('选择器')`

### 2. 操作内容
- `innerText` 纯文本
- `innerHTML` 解析标签

### 3. 操作样式
- `style.属性`
- `classList.add()` 添加类
- `classList.remove()` 删除类
- `classList.toggle()` 切换类

### 4. 操作属性
- `getAttribute()`
- `setAttribute()`

### 5. 事件（重点）
```js
元素.addEventListener('click', () => {})
```

**常用事件**：
- `click` 点击
- `input` 输入
- `change` 改变
- `submit` 提交
- `mouseenter` 鼠标进入
- `mouseleave` 鼠标离开

## 七、BOM 操作（浏览器）
- `alert()` 提示
- `confirm()` 确认框
- `prompt()` 输入框
- `setTimeout()` 延时器
- `setInterval()` 定时器
- `location.href` 跳转页面
- `localStorage` 本地存储

## 八、本地存储（必考）
- `localStorage.setItem('key', value)` 存
- `localStorage.getItem('key')` 取
- `localStorage.removeItem('key')` 删
- **注意**：只能存字符串，存对象用 `JSON.stringify`

## 十一、原生业务特效（高频必考）

### 1. 选项卡
- **核心**：点击切换类名 + 显示隐藏对应面板
- **用到**：循环、点击事件、classList、索引对应

### 2. 轮播图
- **核心**：定时器 + 位移 / 切换 + 左右按钮 + 指示器
- **用到**：setInterval、transform、className

### 3. 拖拽
- **核心**：mousedown → mousemove → mouseup
- **用到**：clientX / clientY、offsetLeft / offsetTop

### 4. 图片懒加载
- **核心**：图片进入可视区域再加载
- **用到**：scroll、offsetTop、clientHeight
- **现代**：loading="lazy" / IntersectionObserver

### 5. 表单校验
- **核心**：正则 + 提交前判断
- **常用正则**：手机号、邮箱、密码、不为空
- **用到**：input 事件、submit 阻止默认行为

## 十二、AJAX / Fetch（网络请求必考）

### 1. AJAX（原生）
```js
const xhr = new XMLHttpRequest()
xhr.open('GET', url)
xhr.send()
xhr.onload = function(){}
```

### 2. Fetch（原生现代）
```js
fetch(url)
.then(res => res.json())
.then(data => {})
.catch(err => {})
```

### 3. 核心流程
- 发送请求
- 接收响应
- 处理数据
- 异常捕获

### 4. 错误处理
- 网络错误
- 状态码错误（4xx/5xx）
- 数据解析错误
- 统一 catch 捕获

### 5. 取消请求
- AJAX：xhr.abort()
- Fetch：AbortController

### 6. 请求封装
- 统一 baseURL
- 统一请求头
- 统一处理响应 / 错误
- 统一 loading、token

## 十三、高频面试题

1. **var/let/const 区别？**
   变量提升、块级作用域、不可重复声明

2. **基本数据类型有哪些？**
   String、Number、Boolean、Undefined、Null、Symbol、BigInt

3. **数组常用方法？**
   forEach、map、filter、push、pop、shift、unshift

4. **什么是闭包？**
   函数嵌套访问外部变量，可缓存数据

5. **本地存储？**
   localStorage 永久存储，只能存字符串

6. **DOM 事件流程？**
   捕获 → 目标 → 冒泡

7. **Promise 作用？**
   解决回调地狱，处理异步

8. **表单校验核心？**
   正则判断 + 提交拦截

9. **懒加载目的？**
   减少请求、优化首屏速度

10. **异步方案进化史？**
    回调函数 → Promise → async/await


## 学习重点

- 把"数据变化 -> DOM 更新 -> 用户反馈"这条链路练熟
- 尽量用原生 API 理解事件、选择器、节点操作和异步请求

## 常见问题

- 会写语法，但不知道浏览器 API 怎么串起来
- 事件冒泡、默认行为和事件委托容易混淆
- 请求发得出去，但异常处理和状态同步没设计好

## 学习路线

1. 先把变量、函数、数组、对象和流程控制学扎实。
2. 再补 DOM / BOM 与事件模型。
3. 最后通过原生特效和 Fetch 封装把页面交互串成闭环。