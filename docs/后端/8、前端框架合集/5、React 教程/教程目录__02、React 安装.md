# 02、React 安装
- 来源：https://ddkk.com/zhuanlan/qianduan/react/2.html
- 分类：前端框架
- 分组：教程目录
本教程使用了 React 的版本为 15.5.4，你可以在官网 http://facebook.github.io/react/ 下载最新版。

> 官方的的下载包含有大量的学习资料和文档

你也可以直接使用 staticfile.org 的 React CDN 库

```js
<script src="https://cdn.staticfile.org/react/15.5.4/react.min.js"></script>
<script src="https://cdn.staticfile.org/react/15.5.4/react-dom.min.js"></script>
<script src="https://cdn.staticfile.org/babel-standalone/6.24.0/babel.min.js"></script>
```

或者 **bootcss** 上的 React CDN 库

```js
<script src="https://cdn.bootcss.com/react/15.5.4/react.min.js"></script>
<script src="https://cdn.bootcss.com/react/15.5.4/react-dom.min.js"></script>
<script src="https://cdn.bootcss.com/babel-standalone/6.24.0/babel.min.js"></script>
```

## React 范例

以下范例输出了 Hello, DDKK.COM 弟弟快看，程序员编程资料站!

```js
<!doctype html>
<meta charset="utf-8">
<title>React Hello DDKK.COM 弟弟快看，程序员编程资料站 -DDKK.COM 弟弟快看，程序员编程资料站 </title>
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

### 范例解析：

#### 引入 React 库

范例中我们引入了三个库： wreact.min.js 、react-dom.min.js 和 babel.min.js：

- **react.min.js** React 的核心库
- **react-dom.min.js** 提供操作 DOM 相关的功能
- **babel.min.js** Babel 可以将 ES6 代码转为 ES5 代码，这样我们就能在目前不支持 ES6 浏览器上执行 React 代码。Babel 内嵌了对 JSX 的支持。通过将 Babel 和 babel-sublime 包（package）一同使用可以让源码的语法渲染上升到一个全新的水平。

#### render 函数

```js
ReactDOM.render(
    <h1>Hello, DDKK.COM 弟弟快看，程序员编程资料站!</h1>,
    document.getElementById('app')
);
```

以上代码生成一个 h1 标题，插入 id="example" 节点中。

### 注意：

> 如果我们需要使用 JSX，则  标签的 type 属性需要设置为 text/babel。

## 通过 npm 使用 React

如果你的系统还不支持 Node.js 及 NPM

我们建议在 React 中使用 CommonJS 模块系统，比如 browserify 或 webpack，本教程使用 webpack。

因为国内的 npm 速度很慢，推荐你使用淘宝定制的 cnpm (gzip 压缩支持) 命令行工具代替默认的 npm:

```js
$ npm install -g cnpm --registry=https://registry.npm.taobao.org
```

或者你直接通过添加 npm 参数 alias 一个新命令:

```js
alias cnpm="npm --registry=https://registry.npm.taobao.org \
--cache=$HOME/.npm/.cache/cnpm \
--disturl=https://npm.taobao.org/dist \
--userconfig=$HOME/.cnpmrc"
```

或者修改 .bashrc or .zshrc 配置文件

```js
$ echo '\n#alias for cnpm\nalias cnpm="npm --registry=https://registry.npm.taobao.org \
  --cache=$HOME/.npm/.cache/cnpm \
  --disturl=https://npm.taobao.org/dist \
  --userconfig=$HOME/.cnpmrc"' >> ~/.zshrc && source ~/.zshrc
```

更多信息可以查阅： http://npm.taobao.org/

## 使用 create-react-app 快速构建 React 开发环境

create-react-app 命令让我们我们无需配置就能快速构建 React 开发环境。

> create-react-app 自动创建的项目是基于 Webpack + ES6 。

执行以下命令创建项目:

```js
$ cnpm install -g create-react-app
$ create-react-app react-app
$ cd react-app/
$ npm start
```

在浏览器中打开 **http://localhost:3000/** ，结果如下图所示：

项目的目录结构如下：

```js
react-app/
├── README.md
├── menu.txt
├── node_modules/
├── package.json
├── public/
│   ├── favicon.ico
│   ├── index.html
│   └── manifest.json
└── src/
    ├── App.css
    ├── App.js
    ├── App.test.js
    ├── index.css
    ├── index.js
    ├── logo.svg
    └── registerServiceWorker.js
```

尝试修改 src/App.js 文件代码:

```js
import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>欢迎来到DDKK.COM 弟弟快看，程序员编程资料站</h2>
        </div>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
}
export default App;
```

修改后，打开 http://localhost:3000/ （一般自动刷新），输出结果如下：
