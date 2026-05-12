# 05、React State(状态)
- 来源：https://ddkk.com/zhuanlan/qianduan/react/5.html
- 分类：前端框架
- 分组：教程目录
React 把组件看成是一个状态机（State Machines）。通过与用户的交互，实现不同状态，然后渲染 UI，让用户界面和数据保持一致。

React 里，只需更新组件的 state，然后根据新的 state 重新渲染用户界面（不要操作 DOM）。

以下范例中创建了 **LikeButton** 组件，getInitialState 方法用于定义初始状态，也就是一个对象，这个对象可以通过 this.state 属性读取。当用户点击组件，导致状态变化，this.setState 方法就修改状态值，每次修改以后，自动调用 this.render 方法，再次渲染组件。

## React 范例

```js
var LikeButton = React.createClass({
  getInitialState: function() {
    return {liked: false};
  },
  handleClick: function(event) {
    this.setState({liked: !this.state.liked});
  },
  render: function() {
    var text = this.state.liked ? '喜欢' : '不喜欢';
    return (
      <p onClick={this.handleClick}>
        你<b>{text}</b>我。点我切换状态。
      </p>
    );
  }
});
ReactDOM.render(
  <LikeButton />,
  document.getElementById('app')
);
```
