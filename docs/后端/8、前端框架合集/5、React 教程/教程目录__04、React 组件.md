# 04、React 组件
- 来源：https://ddkk.com/zhuanlan/qianduan/react/4.html
- 分类：前端框架
- 分组：教程目录
使用组件能够让应用变得更容易管理。

接下来我们封装一个输出 "Hello DDKK.COM 弟弟快看，程序员编程资料站！" 的组件，组件名为 HelloMessage：

## React 范例

```js
var HelloMessage = React.createClass({
  render: function() {
    return <h1>Hello DDKK.COM 弟弟快看，程序员编程资料站！</h1>;
  }
});
ReactDOM.render(
  <HelloMessage />,
  document.getElementById('app')
);
```

### 范例解析：

**React.createClass** 方法用于生成一个组件类 **HelloMessage** 。

范例组件类并输出信息。

### 注意

> 原生 HTML 元素名以小写字母开头，而自定义的 React 类名以大写字母开头，比如 HelloMessage 不能写成 helloMessage。除此之外还需要注意组件类只能包含一个顶层标签，否则也会报错。

如果我们需要向组件传递参数，可以使用 **this.props** 对象,范例如下：

## React 范例

```js
var HelloMessage = React.createClass({
  render: function() {
    return <h1>Hello {this.props.name}</h1>;
  }
});
ReactDOM.render(
  <HelloMessage name="DDKK.COM 弟弟快看，程序员编程资料站" />,
  document.getElementById('app')
);
```

以上范例中 **name** 属性通过this.props.name来获取。

### 注意

> 在添加属性时， class 属性需要写成 className ，for 属性需要写成 htmlFor ，这是因为 class 和 for 是 JavaScript 的保留字。

## 复合组件

我们可以通过创建多个组件来合成一个组件，即把组件的不同功能点进行分离。

以下范例我们实现了输出网站名字和网址的组件：

## React 范例

```js
var WebSite = React.createClass({
  render: function() {
    return (
      <div>
        <Name name={this.props.name} />
        <Linksite={this.props.site} />
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
  <WebSite name="DDKK.COM 弟弟快看，程序员编程资料站" site="https://www.ddkk.com" />,
  document.getElementById('app')
);
```

范例中WebSite 组件使用了 Name 和 Link组件来输出对应的信息，也就是说 WebSite 拥有 Name 和 Link的范例。
