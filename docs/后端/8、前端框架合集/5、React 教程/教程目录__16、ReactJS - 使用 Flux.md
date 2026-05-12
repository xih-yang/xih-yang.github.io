# 16、ReactJS - 使用 Flux
- 来源：https://ddkk.com/zhuanlan/qianduan/react/16.html
- 分类：前端框架
- 分组：教程目录
要将 **Redux** 和 **React** 结合起来使用，就还需要一些额外的库，其中最重要的是 **react-redux**

**react-redux** 提供了两个重要的对象，**Provider** 和 **connect**，前者使 React 组件可被连接（connectable），后者把 React 组件和 Redux 的 store 真正连接起来

本章节将介绍如何实现 **Flux**模式。 我们使用 **Redux** 类库，然后一步一步的把 **Redux** 和 **React** 组合在一起

## 第一步 - 安装 Redux

安装 **Redux** 的命令如下

```js
npm install --save react-redux
```

## 第二步 - 生成项目目录和文件

创建目录结构和相应的文件

## 第三步 - Actions

**Action** 是纯声明式的数据结构，只提供事件的所有要素，不提供逻辑。

### actions/actions.js

```js
export const ADD_TODO = 'ADD_TODO'
let nextTodoId = 0;
export function addTodo(text) {
   return {
      type: ADD_TODO,
      id: nextTodoId++,
      text
   };
}
```

## 第四步 - Reducers

**reducer** 是一个匹配函数，action的发送是全局的：所有的reducer都可以捕捉到并匹配与自己相关与否，相关就拿走action中的要素进行逻辑处理，修改store中的状态，不相关就不对state做处理原样返回

**reducers** 作为事件处理函数，它接收 **state** 和 **action** 作为参数，进行一系列的计算，然后返回计算后的 **state**

在本范例中，我们定义了两个函数，**todo** 用来添加待办事项, **todos** 用来生成列表。

帮助函数 **combineReducers** 方便管理和添加 **reducers** .

### reducers/reducers.js

```js
import { combineReducers } from 'redux'
import { ADD_TODO } from '../actions/actions'
function todo(state, action) {
   switch (action.type) {
      case ADD_TODO:
         return {
            id: action.id,
            text: action.text,
         }
      default:
      return state
   }
}
function todos(state = [], action) {
   switch (action.type) {
      case ADD_TODO:
         return [
            ...state,
            todo(undefined, action)
         ]
      default:
      return state
   }
}
const todoApp = combineReducers({
   todos
})
export default todoApp
```

## Step 5 - Store

Redux 的 **store** 用来管理 React 应用的所有**状态(state)**。 可以简单的使用 **createStore** 创建一个 **store** ，然后把它赋值给 **provider** 的 **store**属性就可以完成 **store** 和 **provider**的绑定

### main.js

```js
import React from 'react'
import { render } from 'react-dom'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import App from './App.jsx'
import todoApp from './reducers/reducers'
let store = createStore(todoApp)
let rootElement = document.getElementById('app')
render(
   <Provider store = {store}>
      <App />
   </Provider>,
   rootElement
)
```

## 第六步 6 - App Component

**App** 组件是应用程序的入口组件，只有 **App** 组件能被 redux 唤醒。 其中 **connect** 函数是最重要的部分，他把 App 组件连接到 Redux 的 **store**。

**connect** 使用 **select** 作为参数,而 **select** 函数从 Redux 的 **store** 中提取 state 数据，然后注入 props ( **visibleTodos** ) 到我们的组件中.

### App.js

```js
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { addTodo } from './actions/actions'
import AddTodo from './components/AddTodo.jsx'
import TodoList from './components/TodoList.jsx'
class App extends Component {
   render() {
      const { dispatch, visibleTodos } = this.props
      return (
         <div>
            <AddTodo
               onAddClick = {text ⇒
               dispatch(addTodo(text))}
            />
            <TodoList todos = {visibleTodos}/>
         </div>
      )
   }
}
function select(state) {
   return {
      visibleTodos: state.todos
   }
}
export default connect(select)(App)
```

## Step 7 - Other Components

下面这些组件不会被 **Redux** 唤醒 也就是说，下面这些组件和 redux 可以说没有任何关系。

### components/AddTodo.js

```js
import React, { Component, PropTypes } from 'react'
export default class AddTodo extends Component {
   render() {
      return (
         <div>
            <input type = 'text' ref = 'input' />
            <button onClick = {(e) ⇒ this.handleClick(e)}>
               Add
            </button>
         </div>
      )
   }
   handleClick(e) {
      const node = this.refs.input
      const text = node.value.trim()
      this.props.onAddClick(text)
      node.value = ''
   }
}
```

### components/Todo.js

```js
import React, { Component, PropTypes } from 'react'
export default class Todo extends Component {
   render() {
      return (
         <li>
            {this.props.text}
         </li>
      )
   }
}
```

### components/TodoList.js

```js
import React, { Component, PropTypes } from 'react'
import Todo from './Todo.jsx'
export default class TodoList extends Component {
   render() {
      return (
         <ul>
            {this.props.todos.map(todo ⇒
               <Todo
               key = {todo.id}
               {...todo}
               />
            )}
         </ul>
      )
   }
}
```

运行我们的 App,添加一个 待办事项 试一试吧
