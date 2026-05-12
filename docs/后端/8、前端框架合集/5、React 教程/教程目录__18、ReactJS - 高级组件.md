# 18、ReactJS - 高级组件
- 来源：https://ddkk.com/zhuanlan/qianduan/react/18.html
- 分类：前端框架
- 分组：教程目录
高阶组件就是一个 React 组件包裹着另外一个 React 组件

这种模式通常使用函数来实现，基本上是一个类工厂（是的，一个类工厂！）

高阶组件是用于向已有组件添加附加，它接收数据的输入，然后返回另一些数据。 一旦输入的数据发生变化，高级组件就会重新运行。

更改组件的返回值，不应该更改高级组件HOC，而是去更改组件使用的输入数据。

在本章节中，我们用一个很简单的例子来演示**高级组件**。 高级组件 **MyHOC** 唯一的功能就是向组件 **MyComponent** 传递数据，它组合 **MyComponent**, 使用 **newData** 来增强功能，然后返回一个高级的组件用于数据的显示.

```js
<!doctype html>
<meta charset="utf-8">
<title>React High Order Components -DDKK.COM 弟弟快看，程序员编程资料站</title>
<script src="https://cdn.staticfile.org/react/15.5.4/react.min.js"></script>
<script src="https://cdn.staticfile.org/react/15.5.4/react-dom.min.js"></script>
<script src="https://cdn.staticfile.org/babel-standalone/6.24.0/babel.min.js"></script>
<div id="root"></div>
<script type="text/babel">
var newData = {
   data: '从 Hoc 里传出来的数据...',
}
var MyHOC = ComposedComponent => class extends React.Component {
   componentDidMount() {
      this.setState({
         data: newData.data
      });
   }
   render() {
      return <ComposedComponent {...this.props} {...this.state} />;
   }
};
class MyComponent extends React.Component {
   render() {
      return (
         <div>
            <h1>{this.props.data}</h1>
         </div>
      )
   }
}
var App = MyHOC(MyComponent);
ReactDOM.render(<App/>, document.getElementById('root'));
</script>
```

运行上面的代码，我们就会看到新的 **data** 被传递到了 **MyComponent** 组件中

**额外阅读**

高级组件通过添加**单一职责**函数实现各种不同的功能，这种编程艺术是开发的精髓之一。 通过使用高级组件，我们的应用就会变得更容易维护和升级。
