# 01、React 基础教程
- 来源：https://ddkk.com/zhuanlan/qianduan/react/1.html
- 分类：前端框架
- 分组：教程目录
React 是 Facebook 推出的一个用来构建用户界面的 JavaScript 库。具备以下特性：

- 不是一个 MVC 框架
- 不使用模板
- 响应式更新非常简单
- HTML5 仅仅是个开始
- 仅仅是 UI

许多人使用 React 作为 MVC 架构的 V 层。

## React 特点

- **声明式设计** −React采用声明范式，可以轻松描述应用。
- **高效** −React通过对DOM的模拟，最大限度地减少与DOM的交互。
- **灵活** −React可以与已知的库或框架很好地配合。
- **JSX** − JSX 是 JavaScript 语法的扩展。React 开发不一定使用 JSX ，但我们建议使用它。
- **组件** − 通过 React 构建组件，使得代码更加容易得到复用，能够很好的应用在大项目的开发中。
- **单向响应的数据流** − React 实现了单向响应的数据流，从而减少了重复代码，这也是它为什么比传统数据绑定更简单。

## 阅读本教程前，我们希望你了解一下知识：

在开始学习 React 之前，您需要具备以下基础知识：

- HTML5
- CSS
- JavaScript

> 本教程使用了 React 的版本为 15.5.4，你可以在官网 http://facebook.github.io/react/下载最新版。

## React Hello DDKK.COM 弟弟快看，程序员编程资料站范例

```js
<!doctype html>
<meta charset="utf-8">
<title>React Hello World -DDKK.COM 弟弟快看，程序员编程资料站 </title>
<script src="https://cdn.staticfile.org/react/15.5.4/react.min.js"></script>
<script src="https://cdn.staticfile.org/react/15.5.4/react-dom.min.js"></script>
<script src="https://cdn.staticfile.org/babel-standalone/6.24.0/babel.min.js"></script>
<div id="app"></div>
<script type="text/babel">
  ReactDOM.render(
    <h1>Hello, DDKK.COM 弟弟快看，程序员编程资料站!</h1>,
    document.getElementById('app')
  );
</script>
```

运行结果如图
