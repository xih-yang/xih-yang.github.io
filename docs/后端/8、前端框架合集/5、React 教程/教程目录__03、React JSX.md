# 03、React JSX
- 来源：https://ddkk.com/zhuanlan/qianduan/react/3.html
- 分类：前端框架
- 分组：教程目录
React 使用 JSX 来替代常规的 JavaScript。

JSX是一个看起来很像 XML 的 JavaScript 语法扩展。

虽然不需要一定使用 JSX，但它有以下优点：

- JSX 执行更快，因为它在编译为 JavaScript 代码后进行了优化。
- 它是类型安全的，在编译过程中就能发现错误。
- 使用 JSX 编写模板更加简单快速。

## 使用 JSX

JSX看起来类似 HTML ，我们可以看下范例:

```js
ReactDOM.render(
    <h1>Hello, world!</h1>,
    document.getElementById('app')
);
```

我们可以在以上代码中嵌套多个 HTML 标签，需要使用一个 div 元素包裹它，范例中的 p 元素添加了自定义属性 **data-myattribute** ，添加自定义属性需要使用 **data-** 前缀。

## React 范例

```js
ReactDOM.render(
    <div>
    <h1>DDKK.COM 弟弟快看，程序员编程资料站</h1>
    <h2>欢迎学习 React</h2>
    <p data-myattribute = "somevalue">这是一个很不错的 JavaScript 库!</p>
    </div>
    ,
    document.getElementById('app')
);
```

### 独立文件

你的React JSX 代码可以放在一个独立文件上，例如我们创建一个helloworld_react.js文件，代码如下:

```js
ReactDOM.render(
  <h1>Hello, world!</h1>,
  document.getElementById('app')
);
```

然后在HTML 文件中引入该 JS 文件：

## React 范例

```js
<body>
  <div id="app"></div>
<script type="text/babel" src="/static/media/reactjs/helloworld_react.js">
</script>
</body>
```

## JavaScript 表达式

我们可以在 JSX 中使用 JavaScript 表达式。表达式写在花括号 **{}** 中。范例如下：

## React 范例

```js
ReactDOM.render(
    <div>
      <h1>{7+13}</h1>
    </div>
    ,
    document.getElementById('app')
);
```

在JSX 中不能使用 **if else** 语句，但可以使用 **conditional (三元运算)** 表达式来替代。以下范例中如果变量 **i** 等于 **7** 浏览器将输出 **真！** , 如果修改 i 的值，则会输出 **假** .

## React 范例

```js
var i = 7;
ReactDOM.render(
    <div>
      <h1>{i == 7 ? '真!' : '假'}</h1>
    </div>
    ,
    document.getElementById('apple')
);
```

## 样式

React 推荐使用内联样式。我们可以使用 **camelCase** 语法来设置内联样式. React 会在指定元素数字后自动添加 **px** 。以下范例演示了为 **h1** 元素添加 **mh1** 内联样式：

## React 范例

```js
var mh1 = {
    fontSize: 100,
    color: '#FF00FF'
};
ReactDOM.render(
    <h1 style = {mh1}>DDKK.COM 弟弟快看，程序员编程资料站</h1>,
    document.getElementById('app')
);
```

## 注释

注释需要写在花括号中，范例如下：

## React 范例

```js
ReactDOM.render(
    <div>
    <h1>DDKK.COM 弟弟快看，程序员编程资料站</h1>
    {/*注释...*/}
    <p>注释不会显示出来</p>
     </div>,
    document.getElementById('app')
);
```

## 数组

JSX允许在模板中插入数组，数组会自动展开所有成员：

## React 范例

```js
var arr = [
  <h1>DDKK.COM 弟弟快看，程序员编程资料站</h1>,
  <h2>DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站</h2>,
];
ReactDOM.render(
  <div>{arr}</div>,
  document.getElementById('app')
);
```

## HTML 标签 vs. React 组件

React 可以渲染 HTML 标签 (strings) 或 React 组件 (classes)。

要渲染HTML 标签，只需在 JSX 里使用小写字母的标签名。

```js
var myDivElement = <div className="foo" />;
ReactDOM.render(myDivElement, document.getElementById('example'));
```

要渲染React 组件，只需创建一个大写字母开头的本地变量。

```js
var MyComponent = React.createClass({/*...*/});
var myElement = <MyComponent someProperty={true} />;
ReactDOM.render(myElement, document.getElementById('example'));
```

React 的 JSX 使用大、小写的约定来区分本地组件的类和 HTML 标签。

### 注意:

> 由于 JSX 就是 JavaScript，一些标识符像class和for不建议作为 XML 属性名。作为替代，React DOM 使用className和htmlFor来做对应的属性。
