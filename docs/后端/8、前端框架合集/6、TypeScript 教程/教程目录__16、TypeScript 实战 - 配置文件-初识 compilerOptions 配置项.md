# 16、TypeScript 实战 - 配置文件-初识 compilerOptions 配置项
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/16.html
- 分类：前端框架
- 分组：教程目录
## 认识和学习tsconfig.json中compilerOptions配置项

## removeComments属性

`removeComments`是`complerOptions`里的一个子属性，它的用处是告诉TypeScript对编译出来的js文件是否显示注释（注解）。比如我们现在把`removeComments`的值设置为`true`，就是在js中不显示注释。

```java
//我是小哈
let perosn:string ="小哈"
```

写完注释后，直接再终端里，输入tsc,输入完成后，很快就会生成一个Demo.js文件，打开后会看到下面的代码。

```java
"use strict";
var perosn = "小哈";
```

这样写的注释就没有编译到Demo.js里

## strict属性

`strict`属性如果设置为true,就代表我们的编译和书写规范，要按照`TypeScript`最严格的规范来写，如果我们把这个设置为`false`或者注释掉，意思是我们可以对设置一些不严格的写法。

## noImplicitAny属性:

`noImplicitAny`属性的作用是，允许你的注解类型 `any` 不用特意表明

为了更好的说明，我们举个例子,在`Demo.ts`里，写一个方法，方法的参数我们设置成任意类型(any)

```java
function xiaoha(name){
    return name
}
```

这时候我们的`TypeScript`是进行报错的，我们用`tsc`编译也是报错的。这就是因为我们开启了`strict:true,`我们先注释掉，然后把`noImplicitAny`的值设置为`false`,就不再报错了。

- 如果设置为noImplicitAny:true,意思就是值就算是 any（任意值），你也要进行类型注释。

简单的理解为，**noImplicitAny设置为 true**，就是**必须明确置顶 any 类型的值**。

## strictNullChecks属性

`strictNullChecks`设置为`false`,它的意思就是，不强制检查 `NULL` 类型。

如下图:

如果改为`true`时,就要强制检查 `NULL` 类型，如果有就报错

如下图:
