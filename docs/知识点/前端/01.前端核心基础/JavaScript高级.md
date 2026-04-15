---
title: JavaScript 高级
category: 知识点
tags:
  - 前端
  - JavaScript
  - 高级
---

# JavaScript 高级

高级 JavaScript 解决的是"为什么这样写能成立"。理解语言机制后，框架源码、性能优化和复杂状态问题都会更容易吃透。

## 核心范围

- 闭包、作用域链、执行上下文
- 原型链、继承、`this`、面向对象设计
- ES6+：解构、模板字符串、类、模块、迭代器、生成器、Promise
- 算法与正则：数组处理、字符串处理、常见查找排序、正则表达式
- 防抖与节流：触发时机、应用场景、封装思路

## 一、执行上下文与作用域

### 1. 执行上下文（代码运行环境）
- **全局上下文**：页面加载时创建，唯一
- **函数上下文**：函数调用时创建
- **块级上下文**：let/const 产生
- **执行顺序**：创建阶段 → 执行阶段
- **创建阶段**：变量提升、this 指向、作用域链确定

### 2. 作用域（变量可访问范围）
- 全局作用域
- 函数作用域
- 块级作用域（let/const）

### 3. 作用域链【必背】
- **变量查找规则**：当前作用域 → 外层 → 全局
- **作用**：保证变量有序访问、保护变量不被污染

### 4. 闭包
- **定义**：函数嵌套，内部函数访问外部函数变量
- **作用**：缓存数据、私有化变量
- **注意**：不滥用，避免内存泄漏
- **优点**：缓存数据、模块化、防止变量污染
- **应用场景**：防抖、节流、私有变量、模块化、函数柯里化

## 二、原型链、继承、this、面向对象【必背】

### 1. 原型与原型链【必背】

#### 三个核心属性
- **prototype**：函数拥有，指向原型对象
- **__proto__**：对象拥有，指向原型
- **constructor**：指向构造函数

#### 原型链
- 对象.__proto__ → 原型对象.__proto__ → Object.prototype → null
- **作用**：共享方法、节省内存、实现继承

### 2. 继承【必背】
- 原型链继承
- 借用构造函数继承
- 组合继承（常用）
- **ES6 class extends 继承【重点】**

```js
class Student extends Person {
  constructor() { super() }
}
```

### 3. this
- **普通函数**：谁调用指向谁
- **箭头函数**：继承外层作用域的 `this`

#### this 指向规则
- **默认绑定**：全局 → window
- **隐式绑定**：obj.fn() → obj
- **显式绑定**：call/apply/bind
- **new 绑定**：指向新实例
- **箭头函数**：继承外层 this
- **优先级**：new > bind > call/apply > 隐式 > 默认

### 4. 面向对象（OOP）【重点】
- **三大特性**：
  - 封装：隐藏实现，暴露接口
  - 继承：子类复用父类
  - 多态：同一接口不同实现
- **设计思想**：高内聚、低耦合、易维护

## 三、ES6+ 核心新特性【必背】

### 1. 变量声明
- let / const 块级作用域、无提升

### 2. 解构赋值【必背】
- **对象解构**：`const {name} = obj`
- **数组解构**：`const [a,b] = arr`

### 3. 模板字符串【必背】
- `` `姓名：${name}` `` 支持换行、变量、表达式

### 4. 箭头函数【必背】
- 无 this、无 arguments
- 简洁、适合回调

### 5. class 类【必背】
- class、constructor、extends、super、static

### 6. 模块化【必背】
- export 导出
- import 导入

### 7. 数组 / 对象扩展
- 展开运算符 ...
- 合并、拷贝、传参

### 8. 迭代器 & 生成器【掌握】
- **迭代器**：Symbol.iterator
- **生成器**：function* + yield
- 可中断、可恢复、异步流程控制

### 9. Promise【必背】
- **状态**：pending → fulfilled / rejected
- **方法**：then / catch / finally
- **静态方法**：all / race / allSettled
- 配合 async/await 优雅写异步

```js
new Promise((resolve, reject) => {
  // 成功 resolve()
  // 失败 reject()
}).then(res => {})
```

### 10. async / await（Promise 语法糖）
```js
async function fn() {
  try {
    const res = await promise
  } catch (err) {
    // 捕获错误
  }
}
```

### 11. Promise 常用方法

#### 11.1 Promise.all()
- 等待所有成功
- 一个失败 → 全部失败
- **适用**：批量请求、并行加载

#### 11.2 Promise.race()
- 谁快返回谁（不管成功失败）
- **适用**：超时控制

#### 11.3 Promise.allSettled()
- 等待所有结束
- 返回每个结果（成功 / 失败都保留）
- **适用**：需要知道每个请求结果

#### 11.4 Promise.resolve()
- 快速返回成功 Promise

#### 11.5 Promise.reject()
- 快速返回失败 Promise

## 四、算法与正则【重点】

### 1. 数组处理（高频算法）
- **遍历**：forEach、map、filter、reduce
- **去重**：`[...new Set(arr)]`
- **查找**：find、indexOf、includes
- **排序**：sort、冒泡、选择、快排

### 2. 字符串处理
- **截取**：substr、slice、substring
- **替换**：replace
- **分割**：split
- **其他**：拼接、查找、判断前缀/后缀

### 3. 常见查找与排序【掌握】
- 冒泡排序
- 快速排序
- 二分查找（效率最高）

### 4. 正则表达式【必背】

#### 常用方法
- `test()` 匹配判断
- `exec()` 捕获匹配

#### 常用规则
- `\d` 数字
- `\w` 字母数字下划线
- `\s` 空格
- `^` 开头 `$` 结尾
- `+` 至少 1 个 `*` 任意个 `?` 0 或 1 个

#### 常用场景
- 手机号、邮箱、密码、身份证、去空格、特殊字符过滤

## 五、异步编程

### 1. 同步：按顺序执行

### 2. 异步：不阻塞代码
- 定时器
- 事件
- AJAX / 接口请求

### 3. 事件循环（Event Loop）
- 宏任务（Macrotask）：setTimeout、setInterval、I/O、DOM 事件
- 微任务（Microtask）：Promise、async/await、process.nextTick
- **执行顺序**：先执行同步代码 → 执行微任务 → 执行宏任务

## 六、防抖与节流

### 1. 防抖
- **定义**：事件触发后延迟执行，如果在延迟期间再次触发则重新计时
- **应用场景**：搜索输入、滚动加载、按钮点击
- **实现**：使用 setTimeout 延迟执行

### 2. 节流
- **定义**：事件触发后立即执行，然后在一段时间内不再执行
- **应用场景**：滚动事件、鼠标移动、游戏射击
- **实现**：使用时间戳或定时器控制执行频率

### 3. 代码实现
```js
// 防抖函数
function debounce(fn, delay) {
    let timer = null;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    };
}

// 节流函数（时间戳版）
function throttle(fn, delay) {
    let lastTime = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastTime >= delay) {
            fn.apply(this, args);
            lastTime = now;
        }
    };
}

// 节流函数（定时器版）
function throttle(fn, delay) {
    let timer = null;
    return function(...args) {
        if (!timer) {
            timer = setTimeout(() => {
                fn.apply(this, args);
                timer = null;
            }, delay);
        }
    };
}
```

### 4. 应用场景对比
| 场景 | 推荐方案 | 原因 |
|------|----------|------|
| 搜索框输入 | 防抖 | 等用户停止输入后再执行搜索，减少请求 |
| 滚动事件 | 节流 | 确保固定间隔执行，避免卡顿 |
| 窗口 resize | 防抖 | 等调整结束后再重新计算布局 |
| 按钮点击 | 节流 | 防止重复提交，确保单位时间内只响应一次 |
| 鼠标移动 | 节流 | 降低触发频率，提升性能 |

### 5. 使用示例
```js
// 防抖：搜索框输入
const handleSearch = debounce((e) => {
    console.log('搜索:', e.target.value);
}, 300);

input.addEventListener('input', handleSearch);

// 节流：滚动事件
const handleScroll = throttle(() => {
    console.log('页面滚动中...');
}, 100);

window.addEventListener('scroll', handleScroll);
```

### 6. 区别总结
- 防抖：最后触发后执行，n 秒内只执行一次
- 节流：固定间隔执行，n 秒内最多执行一次

## 七、高频面试题

### 1. 闭包相关
1. **什么是闭包？**
   函数嵌套，内部函数访问外部函数变量

2. **闭包的作用？**
   缓存数据、私有化变量、模块化

3. **闭包的优缺点？**
   优点：缓存数据、模块化、防止变量污染
   缺点：可能导致内存泄漏

4. **闭包的应用场景？**
   防抖、节流、私有变量、模块化、函数柯里化

### 2. 作用域相关
5. **作用域链是什么？**
   变量查找规则：当前作用域 → 外层 → 全局

6. **let/const/var 的区别？**
   - let/const：块级作用域、无变量提升、不可重复声明
   - var：函数作用域、有变量提升、可重复声明

### 3. this 相关
7. **this 指向规则？**
   - 默认绑定：全局 → window
   - 隐式绑定：obj.fn() → obj
   - 显式绑定：call/apply/bind
   - new 绑定：指向新实例
   - 箭头函数：继承外层 this

8. **箭头函数的 this 特点？**
   继承外层作用域的 this，没有自己的 this

### 4. 原型链相关
9. **原型链的定义？**
   对象.__proto__ → 原型对象.__proto__ → Object.prototype → null

10. **原型链的核心属性？**
    - prototype：函数拥有，指向原型对象
    - __proto__：对象拥有，指向原型
    - constructor：指向构造函数

11. **原型链的作用？**
    共享方法、节省内存、实现继承

### 5. 继承相关
12. **继承的方式有哪些？**
    原型链继承、借用构造函数继承、组合继承、ES6 class extends 继承

13. **ES6 class extends 继承的原理？**
    使用 extends 关键字，通过 super 调用父类构造函数

### 6. ES6+ 相关
14. **ES6 核心新特性？**
    let/const、解构赋值、模板字符串、箭头函数、class、模块化、展开运算符、Promise

15. **解构赋值的使用场景？**
    对象属性提取、函数参数默认值、数组元素提取

### 7. 异步相关
16. **Promise 特点？**
    状态不可逆、解决回调地狱、异步标准化

17. **Promise 三种状态？**
    pending → fulfilled / rejected

18. **all / race / allSettled 区别？**
    - all：全成功才成功
    - race：谁快返回谁
    - allSettled：全部完成，不管成败

19. **事件循环的执行顺序？**
    先执行同步代码 → 执行微任务 → 执行宏任务

20. **宏任务和微任务的区别？**
    - 宏任务：setTimeout、setInterval、I/O、DOM 事件
    - 微任务：Promise、async/await、process.nextTick

### 8. 防抖与节流
21. **防抖和节流的区别？**
    - 防抖：最后触发后执行，n 秒内只执行一次
    - 节流：固定间隔执行，n 秒内最多执行一次

22. **防抖的应用场景？**
    搜索输入、滚动加载、按钮点击、窗口 resize

23. **节流的应用场景？**
    滚动事件、鼠标移动、游戏射击、按钮防重复点击

### 9. 算法相关
24. **数组去重的方法？**
    `[...new Set(arr)]`、filter + indexOf、reduce

25. **常用排序算法？**
    冒泡排序、快速排序、选择排序、插入排序

26. **二分查找的原理？**
    每次将查找范围减半，时间复杂度 O(log n)

### 10. 正则相关
27. **常用正则表达式规则？**
    - `\d` 数字
    - `\w` 字母数字下划线
    - `\s` 空格
    - `^` 开头 `$` 结尾
    - `+` 至少 1 个 `*` 任意个 `?` 0 或 1 个

28. **正则表达式的常用方法？**
    `test()` 匹配判断、`exec()` 捕获匹配、`replace()` 替换

## 实战关注点

- 异步模型要结合事件循环一起理解
- 面向对象与函数式写法都要会对比使用
- 高频面试题最好能自己画图解释，而不是只背结论

## 常见问题

- 知道结论，但说不清闭包、原型链和 `this` 为什么成立
- 只会用 Promise，不理解事件循环和任务队列
- 高频手写题能背代码，但不会迁移到实际业务里

## 学习路线

1. 先把作用域、闭包、执行上下文和 `this` 串起来。
2. 再学习原型链、继承、ES6+ 和异步模型。
3. 最后通过防抖节流、正则和手写题巩固语言机制。