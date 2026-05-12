# 05、TypeScript 实战 - 函数参数和返回类型定义
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/5.html
- 分类：前端框架
- 分组：教程目录
前言：学习本节之后，就会对函数的参数和返回值类型定义有通透的了解
易错：我们写的代码其实是有一个小坑的，就是我们并没有定义getTotal的返回值类型，虽然TypeScript可以自己推断出返回值是number类型。 但是如果这时候我们的代码写错了，比如写程了下面这个样子。

```java
function getTotal(one:number,two:number){
	return one+two +""
}
const  total =getTotal(1,2)
那么tatal就不是number类型了 ,但是不会报错
```

## 正确写法

```java
正确是写法-返回值为number
function getTotal(one:number,two:number):number {
     return one + two
 }
 const tatal = getTotal(1,2)
这样写就必加严谨了 可以看出tatal的类型为number
```

## 常见的函数返回值：void ，never，函数参数为对象

## void：函数没有返回值

```java
 在实际工作中有很多函数是没有返回值的 例如
function sayhello() {
    console.log("hello world")
}
这就是没有返回值的函数，我们就可以给他一个类型注解void，代表没有任何返回值。
 function sayhello():void {
     console.log("hello world")
 }
如果这样定义后，你再加入任何返回值，程序都会报错
```

## never：如果是一个永远都执行不完的函数，就可以定义为never

```java
执行的时候，抛出了异常，这时候就无法执行完了
 function errFuncyion() {
     throw new Error()
     console.log("hello world")
 }
还有就是循环
 function forNever() {
     while(true){
     }
    console.log("helo world")
 }
```

## 函数参数为对象时

易错：

```java
这个坑是大家都喜欢往里跳的
我们如何定义参数对象的属性类型。
我先写个一般javaScript的写法。
function add({
     a,b}){
     return a + b 
 }
 const three = add({
     a:1,b:2})
 console.log(three)
 此时three的类型为any 
 这时很多人容易这样写 错误代码示例
 function add({
     a:number,b:number}){
     return a + b 
 }
 const three = add({
     a:1,b:2})
//你在编辑器中会看到这种写法是完全错误的。
```

## 正确写法

```java
function getNumber({
      one }:{
     one:number}):number {
    return one;
  }
const one = getNumber({
      one: 1 });
这样写才是正确的写法，
```
