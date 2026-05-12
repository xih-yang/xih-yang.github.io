# 04、TypeScript 实战 - 类型注释和类型推断
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/4.html
- 分类：前端框架
- 分组：教程目录
前言：直接看代码，简单易懂

## 类型注解：简单的来说，就是定义时告知类型

```java
let count : number
count = 1
// 上面这段代码告诉我们count是一个数字类型 这就叫类型注解
```

## 类型推断：自动推测类型

```java
let  countInference = 123
// 我们这个时候并没有告诉countInference的类型,但是你把鼠标放到变量上
//就会发现TypeScript 自动把变量注释为了number（数字）类型
```

## 使用原则

如果TS 能够自动分析变量类型，那我们就什么都不需要做了

如果TS不能自动分析变量类型，按我们就要进行类型注释

## 例子

```java
不用类型注释的例子
let a = 123
let b = 456
let c = a + b
// 此时 c的类型类number
```

```java
需要类型注解的例子
function getTotal(one,two) {
    return one + two
 }
 const three = getTotal(1,2)
// 此时就需要类型注解 one和two都会显示为any类型
//如果此时你传字符串，你的业务逻辑就是错误的，所以你必须加一个类型注解
// 添加类型注解之后
function getTotal(one:number,two:number) {
    return one + two
}
 const three = getTotal(1,2)
// 因为one和two都加了类型注解 所以three通过类型推断得到类型为number
```
