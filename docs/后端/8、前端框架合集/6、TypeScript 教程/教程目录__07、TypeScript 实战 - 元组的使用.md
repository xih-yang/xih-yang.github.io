# 07、TypeScript 实战 - 元组的使用
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/7.html
- 分类：前端框架
- 分组：教程目录
前言：元组这个概念是JavaScript中没有的。元组在开发中并不常用。其实你可以把元组看成数组的一个加强，它可以更好的控制或者说规范里边的类型。

## 先看一个简单的数组

```java
const person:(string||number)[]=["哈哈",21]
```

## 问题：当你把"小哈"和21调换位置的时候 你会发现 person 中定义的类型并没有报错，但是我们的工作中总会出现定义的类型和内容一一对应，此时元组就可以派上用场了

## 元组的使用

```java
元组:每个元素类型的位置给固定住了，这就叫做元组
let person:[string,number,boolean]=["小哈",21,true]
这样就一一对应了
```

## 联想到上节学习的type alins 我们还可以这样写

```java
type a =[string,number,boolean]
const xioaha:a=["小哈",123,false]
```

这节主要内容是，搞清楚元组和数组的区别，在理解后能在项目中适当的时候使用不同的类型。
