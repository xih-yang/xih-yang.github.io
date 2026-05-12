# 17、TypeScript 实战 - 配置文件-初识 compilerOptions 配置内容详解
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/17.html
- 分类：前端框架
- 分组：教程目录
**complierOptions**里的配置项详情可以去如下网站查看

> https://www.tslang.cn/docs/handbook/compiler-options.html (编译选项详解)

`complierOptions`里的配置项内容很多，挑几个重要的看一下

## rootDir和outDir

现在我们的`js`文件直接编译到了根目录下，和`ts`文件混在了一起。我们当然是不喜欢这种方法的，工作中我们希望打包的`js`都生成在特定的一个文件夹里,比如`build`。

这样编译的文件会放在指定的文件夹中

## 编译 ES6 语法到 ES5 语法-allowJs

我们在src文件夹下新建一个Demo.ts文件，并写上一段简单的代码，代码如下

```java
export let person:string = "小哈"
```

如果不做任何配置，这时候试用tsc是没有效果的。需要到tsconfig.js文件里进行修改，修改的地方有两个。

```java
"target":'es5' ,  // 这一项默认是开启的，你必须要保证它的开启，才能转换成功
"allowJs":true,   // 这个配置项的意思是联通
```

这两项都开启后，在使用`tsc`编译时，就会编译`js`文件了

## sourceMap属性

如果把`sourceMap`的注释去掉，在打包的过程中就会给我们生成`sourceMap`文件

> sourceMap 简单说，Source map 就是一个信息文件，里面储存着位置信息。也就是说，转换后的代码的每一个位置，所对应的转换前的位置。有了它，出错的时候，除错工具将直接显示原始代码，而不是转换后的代码。这无疑给开发者带来了很大方便。

## noUnusedLocals 和 noUnusedParameters

假如我们修改Demo.ts文件的代码，如下

```java
let xiaoha:string="小哈"
export const name="xiaha"
```

编译之后的文件：

```java
//编译后的文件:
"use strict";
Object.defineProperty(exports, "__esModule", {
      value: true });
exports.name = void 0;
var xiaoha = "小哈";
exports.name = "xiaha";
```

我们会发现`xiaoha`这个变量没有任何地方使用，但是我们编译的话，它依然会被编译出来，这就是一种资源的浪费。

> 如果可以开启noUnusedLocals：true，开启后我们的程序会直接给我们提示不能这样编写代码，有已声明却没有使用的变量。

`noUnusedParameters`是针对于没有使用的函数，方法和`noUnusedLocals：true`一样
