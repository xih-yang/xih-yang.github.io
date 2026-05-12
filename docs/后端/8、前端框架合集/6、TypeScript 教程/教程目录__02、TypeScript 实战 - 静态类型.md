# 02、TypeScript 实战 - 静态类型
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/2.html
- 分类：前端框架
- 分组：教程目录
前言 ：TypeScript的静态类简单来讲就是你一旦定义了，就不可以再改变了(比如你是男人就是男人,一辈子都要作男人,不能变来变去)

## 1.开始学习

新建一个demo2.ts文件并写下一下代码

```java
let count:number= 1
```

此时count就是数字类型的变量，*:number* 就是定义了一个静态类型，*count*永远都是数字类型了，不可改变，我们给*count*赋值一个字符串，此时就会报错了(下图展示错误代码)

但这只是最简单的理解，再往深一层次理解，你会发现这时候的count变量,可以使用number类型上所有的属性和方法。我们可以通过在count后边打上一个 . 看出这个特性，并且编辑器会给你非常好的提示。这也是为什么我喜欢用VScode编辑器的一个原因。

## 1.定义类型

我们可以自己去定义一个静态类型，比如现在我定义一个hahaya的类型，然后在声明变量的时候，就可以使用这个静态类型了，看下面的代码。

```java
// interface 接口 后面会详细讲解
// 定义类型
interface hahaya {
    name : string,
    age  : number 
}
let xiaoha :hahaya={
    name:"哈哈呀",
    age:23
}
```

此时在hahaya 接口中定义的 *name* 是string类型，age 是number类型， 所以下面 *xiaoha*里面的 *name*的内容必须是是字符串，*age*必须是数字，**类型没有对应的话就会报错**。这个特点就大大提高了程序的健壮性，并且编辑器这时候也会给你很好的语法提示，加快了你的开发效率。
