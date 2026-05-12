# 03、TypeScript 实战 - 基础静态类型和对象静态类型
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/3.html
- 分类：前端框架
- 分组：教程目录
前言：在 TypeScript 静态类型分为两种，一种是基础静态类型，一种是对象类型，这两种都经常使用，非常重要

## 1. 基础静态类型

基础静态类型非常简单，只要在声明变量的后边加一个:号，然后加上对应的类型哦。比如下面的代码，就是声明了一个数字类型的变量，叫做count。

```java
const count : number = 666;
const myName ：string = 'hahaya'
```

类似这样常用的**基础类型**还有，我这里就举几个最常用的哦,**null,undefinde,symbol,boolean，void**这些都是最常用的基础数据类型，我就不详细的写了

## 2.对象类型

我先新建一个文件demo3.ts 写一个例子，你一眼睛就可以看出个大概

```java
let a:{
    name:string,
    age:number
}={
    name:"小哈",
    age:23
}
console.log(a.name);
```

写完后，我们在terminal（终端）中输入ts-node demo3.ts，可以看到结果输出了小哈。这就是一个经典的对象类型，也是最简单的对象类型。对象类型也可以是数组，比如现在我们有很多朋友，就可以用到数组类型

## 3.数组类型

直接看代码

这时候的意思是，变量friends必须是一个数组，数组里的内容必须是字符串。你可以试着把字符串改为数字，VSCode会直接给我们报错。

## 4.class类 类型

现在都讲究面向对象编程，我们再来看看下面的代码，这个代码就是用类的形式，来定义变量。

```java
class Person {
     }
const xiaoha: Person = new Person();
```

这个意思就是xiaoha必须是一个Person类对应的对象才可以。

## 5.函数类型

我们还可以定义一个函数类型，并确定返回值类型为string。代码如下：

```java
const b:()=>string =() =>{
	return "小哈"
}
console.log(b()) //打印结果为小哈
```

**以上这几种形式我们在TypeScript里叫做对象类型。**
