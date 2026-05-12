# 11、React 表单与事件
- 来源：https://ddkk.com/zhuanlan/qianduan/react/11.html
- 分类：前端框架
- 分组：教程目录
Web开发中表单必不可少，本章节讨论如何在 React 中使用表单。

## 一个简单 React 表单的范例

在范例中我们设置了输入框 input 值 **value = {this.state.data}** 。在输入框值发生变化时我们可以更新 state。我们可以使用 **onChange** 事件来监听 input 的变化，并修改 state。

```js
var HelloMessage = React.createClass({
  getInitialState: function() {
    return {value: 'Hello DDKK.COM 弟弟快看，程序员编程资料站!'};
  },
  handleChange: function(event) {
    this.setState({value: event.target.value});
  },
  render: function() {
    var value = this.state.value;
    return <div>
            <input type="text" value={value} onChange={this.handleChange} /> 
            <h4>{value}</h4>
           </div>;
  }
});
ReactDOM.render(
  <HelloMessage />,
  document.getElementById('app')
);
```

上面的代码将渲染出一个值为 Hello DDKK.COM 弟弟快看，程序员编程资料站! 的 input 元素，并通过 onChange 事件响应更新用户输入的值。

### React 子控件表单范例

在子组件上使用表单

**onChange** 方法将触发 state 的更新并将更新的值传递到子组件的输入框的 **value** 上来重新渲染界面。

需要在父组件通过创建事件句柄 ( **handleChange** ) ，并作为 prop ( **updateStateProp** ) 传递到你的子组件上。

```js
var Content = React.createClass({
  render: function() {
    return  <div>
            <input type="text" value={this.props.myDataProp} onChange={this.props.updateStateProp} /> 
            <h4>{this.props.myDataProp}</h4>
            </div>;
  }
});
var HelloMessage = React.createClass({
  getInitialState: function() {
    return {value: 'Hello DDKK.COM 弟弟快看，程序员编程资料站!'};
  },
  handleChange: function(event) {
    this.setState({value: event.target.value});
  },
  render: function() {
    var value = this.state.value;
    return <div>
            <Content myDataProp = {value} 
              updateStateProp = {this.handleChange}></Content>
           </div>;
  }
});
ReactDOM.render(
  <HelloMessage />,
  document.getElementById('app')
);
```

## React 事件修改数据范例

可以通过 onClick 事件来修改数据:

```js
var HelloMessage = React.createClass({
  getInitialState: function() {
    return {value: 'Hello DDKK.COM 弟弟快看，程序员编程资料站!'};
  },
  handleChange: function(event) {
    this.setState({value: 'DDKK.COM 弟弟快看，程序员编程资料站'})
  },
  render: function() {
    var value = this.state.value;
    return <div>
            <button onClick={this.handleChange}>点我</button>
            <h4>{value}</h4>
           </div>;
  }
});
ReactDOM.render(
  <HelloMessage />,
  document.getElementById('app')
);
```

## React 子组件更新父组件 state 范例

当需要从子组件中更新父组件的 **state** 时,需要在父组件通过创建事件句柄 ( **handleChange** ) ，并作为 prop ( **updateStateProp** ) 传递到你的子组件上。:

```js
var Content = React.createClass({
  render: function() {
    return  <div>
              <button onClick = {this.props.updateStateProp}>点我</button>
              <h4>{this.props.myDataProp}</h4>
           </div>
  }
});
var HelloMessage = React.createClass({
  getInitialState: function() {
    return {value: 'Hello DDKK.COM 弟弟快看，程序员编程资料站!'};
  },
  handleChange: function(event) {
    this.setState({value: 'DDKK.COM 弟弟快看，程序员编程资料站'})
  },
  render: function() {
    var value = this.state.value;
    return <div>
            <Content myDataProp = {value} 
              updateStateProp = {this.handleChange}></Content>
           </div>;
  }
});
ReactDOM.render(
  <HelloMessage />,
  document.getElementById('app')
);
```
