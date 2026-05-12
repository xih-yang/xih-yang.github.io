# 22、TypeScript 实战 - namespace命名空间（上）
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/22.html
- 分类：前端框架
- 分组：教程目录
之前我们的TS效果是在控制台终端输出的，现在我们新建一个简单的项目，让我们的ts在项目中运行

## 搭建最基础的TS开发环境

**1、** 建立好文件夹后，打开VSCode，把文件夹拉到编辑器当中，然后打开终端，运行`npminit-y`,创建`package.json`文件；

**2、** 生成文件后，我们接着在终端中运行`tsc-init`,生成`tsconfig.json`文件；

**3、** 新建`src`和`build`文件夹，再建一个`index.html`文件；

**4、** 在`src`目录下，新建一个`page.ts`文件，这就是我们要编写的`ts`文件了；

**5、** 配置`tsconfig.json`文件，设置`outDir`和`rootDir`，也就是设置需要编译的文件目录，和编译好的文件目录；

**6、** 然后编写`index.html`，引入``,当让我们现在还没有`page.js`文件；

**7、** 编写`page.ts`文件，加入一句输出`console.log('哈哈小猿')`,再在控制台输入`tsc`,就会生成`page.js`文件；

**8、** 再到浏览器中查看`index.html`文件，如果按F12可以看到`哈哈小猿`，说明我们的搭建正常了；

```java
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="./build/page.js"></script>
    <title>Document</title>
  </head>
  <body></body>
</html>
```

上面就是开发最基础的前端项目时需要作的环境配置（在做项目，尽量使用TypeScript来进行编写）

## 没有命名空间时的问题

为了更好的理解，先写一下这样代码，用类的形式在index.html中实现header,content和Footer部分，类似我们常说的模板。

在`page.ts`文件里，写出下面的代码：

```java
class Header {
  constructor() {
    const elem = document.createElement("div");
    elem.innerText = "This is Header";
    document.body.appendChild(elem);
  }
}
class Content {
  constructor() {
    const elem = document.createElement("div");
    elem.innerText = "This is Content";
    document.body.appendChild(elem);
  }
}
class Footer {
  constructor() {
    const elem = document.createElement("div");
    elem.innerText = "This is Footer";
    document.body.appendChild(elem);
  }
}
class Page {
  constructor() {
    new Header();
    new Content();
    new Footer();
  }
}
```

写完后我们用`tsc`进行编译一次，然后修改`index.html`文件，在标签里引入

```java
<body>
  <script>new Page();</script>
</body>
```

上面的代码看起来是没有任何问题的

但是你打开`page.js`文件你会发现里面的`变量全是全局变量`，都是用`var`声明的。

**过多的全局变量使得我们的项目变得沉重复杂，代码变得不可维护**

我们理想的状态是只要一个`Page`的全局变量就行了，其他的可以模块化封装起来，不能暴露到全局里面。

所以就可以使用我们的命名空间了

## 命名空间的使用

命名空间声明关键词：`namespace`

例如:声明一个`namespace Home`,需要暴露出去的类，可以使用`export`关键词，这样只有暴漏出去的类是全局的，其他的不会再生成全局污染了，代码如下：

```java
namespace Home {
  class Header {
    constructor() {
      const elem = document.createElement("div");
      elem.innerText = "This is Header";
      document.body.appendChild(elem);
    }
  }
  class Content {
    constructor() {
      const elem = document.createElement("div");
      elem.innerText = "This is Content";
      document.body.appendChild(elem);
    }
  }
  class Footer {
    constructor() {
      const elem = document.createElement("div");
      elem.innerText = "This is Footer";
      document.body.appendChild(elem);
    }
  }
  export class Page {
    constructor() {
      new Header();
      new Content();
      new Footer();
    }
  }
}
```

TS代码写完后，再到`index.html`文件中进行修改，用命名空间的形式进行调用。 写完后，用`tsc`编译一下，也可以使用`tsc -w`进行监视了，只要有改变就会进行重新编译。

这就是TypeScript 给我们提供的类似模块化开发的语法，它的好处就是让全局变量减少了很多，实现了基本的封装，减少了全局变量的污染。
