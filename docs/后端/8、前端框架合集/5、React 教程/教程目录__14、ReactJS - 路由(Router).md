# 14、ReactJS - 路由(Router)
- 来源：https://ddkk.com/zhuanlan/qianduan/react/14.html
- 分类：前端框架
- 分组：教程目录
解决复杂的URL和层级组件之间的映射关系式React Router 的核心

本章节中我们将学习如何使用 React 的 **Router** 路由组件

## React Router 安装

**React Router** 的安装命令

```js
$ npm install react-router
```

## Step 2 - 定义页面组件

**Router 组件** 本身只是一个容器，真正的路由要通过**Route组件** 定义

接下来我们会创建四个组件 - **App** 组件展示一个 **tab** 目录，总共有三个 tab : 首页，关于，联系我们 - **Home** 组件显示首页 - **About** 组件显示关于我们页面 - **Contact** 组件显示联系我们页面

### main.js

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router'
class App extends React.Component {
   render() {
      return (
         <div>
            <ul>
               <li>Home</li>
               <li>About</li>
               <li>Contact</li>
            </ul>
           {this.props.children}
         </div>
      )
   }
}
export default App;
class Home extends React.Component {
   render() {
      return (
         <div>
            <h1>Home...</h1>
         </div>
      )
   }
}
export default Home;
class About extends React.Component {
   render() {
      return (
         <div>
            <h1>About...</h1>
         </div>
      )
   }
}
export default About;
class Contact extends React.Component {
   render() {
      return (
         <div>
            <h1>Contact...</h1>
         </div>
      )
   }
}
export default Contact;
```

## 添加路由

页面组件已经写好了，现在给我们的应用添加路由。这里添加的方式和前几章不一样，因为我们使用了 **Router**

### main.js

```js
ReactDOM.render((
   <Router history = {browserHistory}>
      <Route path = "/" component = {App}>
         <IndexRoute component = {Home} />
         <Route path = "home" component = {Home} />
         <Route path = "about" component = {About} />
         <Route path = "contact" component = {Contact} />
      </Route>
   </Router>
), document.getElementById('app'))
```

运行我们的 App,你会看到如下效果 单击每个 tab 试一试吧。
