# 24、TypeScript 实战 - 使用import语法
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/24.html
- 分类：前端框架
- 分组：教程目录
上节我们学到`命名空间`，其实我们的代码也可以使用`import`进引入的

## 修改component.ts文件

现在去掉`components.ts`里的n`amespace`命名空间代码，写成 `ES6` 的 `export` 导出模式。代码如下：

```java
        export class Header {
            constructor(){
                const cdiv = document.createElement("div")
                cdiv.innerText ="This is Header"
                document.body.appendChild(cdiv)
            }
        }
        export class Content {
            constructor(){
                const cdiv = document.createElement("div")
                cdiv.innerText ="This is Content"
                document.body.appendChild(cdiv)
            }
        }
        export class Footer {
            constructor(){
                const cdiv = document.createElement("div")
                cdiv.innerText ="This is Footer"
                document.body.appendChild(cdiv)
            }
        }
```

这三个类就都已经用`export`导出了，也就是说可以实现用`import`进行引入了。

## 修改page.ts文件

在`page.ts`文件，去掉`namespace`命名空间对应的代码，然后使用 `import` 语法进行导入`Header`、`Content`和`Footer`,代码如下：

```java
import {
     Header,Content,Footer } from "./Componets"
export class Page {
    constructor(){
        new Header()
        new Content()
        new Footer()
    }
}
```

现在可以使用`tsc`进行编译。然后可以看到编译好的代码都是`define`开头的(这是 `amd` 规范的代码，不能直接在浏览器中运行，可以在 `Node` 中直接运行)，这种代码在浏览器中是没办法被直接运行的，需要其他库(`require.js`)的支持。

## 引入require.js

使用了一个现成的 CDN 的`require.js`,地址可以直接复制，然后用``标签进行引入

> Require.js 的 CDN 地址： https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.js

复制好URL 地址后，使用``标签引入

```java
<script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.js"></script>
```

这时候就可以解析`define`这样的语法了。然后把page.ts中加入`default`关键字，如果不加是没办法直接引用到的。

```java
import {
     Header,Content,Footer } from "./Componets"
export default class Page {
    constructor(){
        new Header()
        new Content()
        new Footer()
    }
}
```

这时候再用`tsc`进行编译一下，你会发现还是又问题。因为使用`export default`这种形式的语法，需要在`html`里用`require`来进行引入。

## requir方法引入

现在可以直接在代码中使用`require`了，具体代码如下

```java
<script>
    require(["page"], function (page) {
      new page.default();
    });
</script>
```

这样配置完成之后就页面就可以正常的显示内容了，但是配置起来个人觉得相当的麻烦

如果使用`webpack`或`Parcel`这些打包工具来处理那就简单多了
