# 17、ReactJS - 动画
- 来源：https://ddkk.com/zhuanlan/qianduan/react/17.html
- 分类：前端框架
- 分组：教程目录
在本教程中我们将学习如何用 **React** 来制作淡入(fade in)淡出(fade out)动画( Animations )。

## 首先，先安装 React CSS Transitions Group 组件

```js
npm install react-addons-css-transition-group
```

因为我们的淡入淡出动画使用的是 **CSS transitions and animations**。

## 其次，添加应用的样式表文件

先创建一个 **css**目录，再添加 **style.css** 文件，完成后目录结构如下

```js
|--css
|  |-- style.css
```

接着，把创建好的 **style.css** 链接到 **index.html** 中

```js
<Linkrel = "stylesheet" href = "css/style.css">
```

## 再次,给加载列表添加淡入进场动画

**1、** 新建一个**ReactCSSTransitionGroup**组件用来包裹需要动画的html元素；

**2、** 然后设置**transitionAppear**,**transitionAppearTimeout**,**transitionEnter**,**transitionLeave**属性.；

### App.jsx

```js
import React from 'react';
var ReactCSSTransitionGroup = require('react-addons-css-transition-group');
class App extends React.Component {
   render() {
      return (
         <div>
            <ReactCSSTransitionGroup transitionName = "example"
               transitionAppear = {true} transitionAppearTimeout = {500}
               transitionEnter = {false} transitionLeave = {false}>
               <h1>My Element...</h1>
            </ReactCSSTransitionGroup>
         </div>      
      );
   }
}
export default App;
```

### 创建 main.js

```js
import React from 'react'
import ReactDOM from 'react-dom';
import App from './App.jsx';
ReactDOM.render(<App />, document.getElementById('app'));
```

使用 **CSS animation** 非常简单

### 完善样式 css/style.css

```js
.example-appear {
   opacity: 0.01;
}
.example-appear.example-appear-active {
   opacity: 1;
   transition: opacity 500ms ease-in;
}
```

运行我们的应用，我们的元素就会有 **淡入** 动画

## 最后，完善进场动画和退场动画

接下来我们给新增操作添加进场动画，删除操作添加退场动画

### App.jsx

```js
import React from 'react';
var ReactCSSTransitionGroup = require('react-addons-css-transition-group');
class App extends React.Component {
   constructor(props) {
      super(props);
      this.state = {
         items: ['Item 1...', 'Item 2...', 'Item 3...', 'Item 4...']
      }
      this.handleAdd = this.handleAdd.bind(this);
   };
   handleAdd() {
      var newItems = this.state.items.concat([prompt('Create New Item')]);
      this.setState({items: newItems});
   }
   handleRemove(i) {
      var newItems = this.state.items.slice();
      newItems.splice(i, 1);
      this.setState({items: newItems});
   }
   render() {
      var items = this.state.items.map(function(item, i) {
         return (
            <div key = {item} onClick = {this.handleRemove.bind(this, i)}>
               {item}
            </div>
         );
      }.bind(this));
      return (
         <div>      
            <button onClick = {this.handleAdd}>Add Item</button>
            <ReactCSSTransitionGroup transitionName = "example" 
               transitionEnterTimeout = {500} transitionLeaveTimeout = {500}>
               {items}
            </ReactCSSTransitionGroup>
         </div>
      );
   }
}
export default App;
```

### main.js

```js
import React from 'react'
import ReactDOM from 'react-dom';
import App from './App.jsx';
ReactDOM.render(<App />, document.getElementById('app'));
```

### css/style.css

```js
.example-enter {
   opacity: 0.01;
}
.example-enter.example-enter-active {
   opacity: 1;
   transition: opacity 500ms ease-in;
}
.example-leave {
   opacity: 1;
}
.example-leave.example-leave-active {
   opacity: 0.01;
   transition: opacity 500ms ease-in;
}
```

运行我们的应用并单击 **添加** 按钮，你就能看到我们的进场和退场动画

输入名字，然后单击 **添加**按钮, 我们添加的 *新公司* 就会淡入.

现在我们来删除 **Item 3...** ，**Item 3** 这个元素就会淡出
