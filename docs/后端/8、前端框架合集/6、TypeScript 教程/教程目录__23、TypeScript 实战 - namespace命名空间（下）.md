# 23、TypeScript 实战 - namespace命名空间（下）
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/23.html
- 分类：前端框架
- 分组：教程目录
## 命名空间实现组件化

上一篇文章实现了模块化和避免全局变量的污染，但是我们工作中分的要更细致一些，会单独写一个`components`的文件，然后进行组件化。

在`src`目录下新建一个文件`components.ts`，编写代码如下：

```java
namespace Components {
  export class Header {
    constructor() {
      const elem = document.createElement("div");
      elem.innerText = "This is Header";
      document.body.appendChild(elem);
    }
  }
  export class Content {
    constructor() {
      const elem = document.createElement("div");
      elem.innerText = "This is Content";
      document.body.appendChild(elem);
    }
  }
  export class Footer {
    constructor() {
      const elem = document.createElement("div");
      elem.innerText = "This is Footer";
      document.body.appendChild(elem);
    }
  }
}
```

每个类(`class`)都使用了`export`导出，导出后就可以在`page.ts`中使用这些组件了。

代码如下：

```java
namespace Home {
  export class Page {
    constructor() {
      new Components.Header();
      new Components.Content();
      new Components.Footer();
    }
  }
}
```

这个时候使用tsc进行重新编译，但在预览时，你会发现还是会报错，找不到`Components`,想解决这个问题，我们必须要在`index.html`里进行引入`components.js`文件。

```java
<script src="./build/page.js"></script>
<script src="./build/components.js"></script>
```

## 多TS文件编译成一个js文件

直接打开`tsconfig.json`文件，然后找到`outFile`配置项，这个就是用来生成一个文件的设置，但是如果设置了它，就不再支持`"module":"commonjs"`设置了，我们需要把它改成`"module":"amd"`,然后在去掉对应的`outFile`注释，设置成下面的样子。

```java
{
  "outFile": "./build/page.js"
}
```

配置好后，删除掉`build`下的`js`文件，然后用`tsc`进行再次编译。

然后删掉`index.html`文件中的`component.js`,在浏览器里还是可以正常运行的。

## 子命名空间

顾名思义，就是在命名空间里，还可以继续写命名空间，例如我在`Components.ts`文件下修改代码如下：

```java
namespace Components {
    export namespace subspace{
        export class unordered{
            constructor(){
                const cul = document.createElement("ul")
                const cli = document.createElement("li")
                cli.innerHTML = `<p style="color:red">`我是ul li标签`</p>`
                cul.appendChild(cli)
                document.body.appendChild(cul)
            }
        }
    }
}
```

写完后在控制台再次编辑`tsc`，然后在浏览器中也是可以看到这样一段话的。
