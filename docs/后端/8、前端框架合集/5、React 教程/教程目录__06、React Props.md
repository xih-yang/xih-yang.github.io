# 06、React Props
- 来源：https://ddkk.com/zhuanlan/qianduan/react/6.html
- 分类：前端框架
- 分组：教程目录
state 和 props 主要的区别在于 **props** 是不可变的，而 state 可以根据与用户交互来改变。

因此有些容器组件需要定义 state 来更新和修改数据。

而子组件只能通过 props 来传递数据。

## 使用 Props

### React 在组件中使用 props 范例

```js
var HelloMessage = React.createClass({
  render: function() {
    return <h1>Hello {this.props.name}</h1>;
  }
});
ReactDOM.render(
  <HelloMessage name="DDKK.COM 弟弟快看，程序员编程资料站" />,
  document.getElementById('app')
```

范例中name 属性通过 this.props.name 来获取。

## 默认 Props

可以通过 getDefaultProps() 方法为 props 设置默认值，

```js
var HelloMessage = React.createClass({
  getDefaultProps: function() {
    return {
      name: 'DDKK.COM 弟弟快看，程序员编程资料站'
    };
  },
  render: function() {
    return <h1>Hello {this.props.name}</h1>;
  }
});
ReactDOM.render(
  <HelloMessage />,
  document.getElementById('app')
);
```

## State 和 Props

以下范例演示了如何在应用中组合使用 state 和 props 。我们可以在父组件中设置 state， 并通过在子组件上使用 props 将其传递到子组件上。在 render 函数中, 我们设置 name 和 site 来获取父组件传递过来的数据。

## React 范例

```js
var WebSite = React.createClass({
  getInitialState: function() {
    return {
      name: "DDKK.COM 弟弟快看，程序员编程资料站",
      site: "http://www.ddkk.com"
    };
  },
  render: function() {
    return (
      <div>
        <Name name={this.state.name} />
        <Linksite={this.state.site} />
      </div>
    );
  }
});
var Name = React.createClass({
  render: function() {
    return (
      <h1>{this.props.name}</h1>
    );
  }
});
var Link= React.createClass({
  render: function() {
    return (
      <a href={this.props.site}>
        {this.props.site}
      </a>
    );
  }
});
ReactDOM.render(
  <WebSite />,
  document.getElementById('app')
);
```
