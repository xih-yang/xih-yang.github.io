# 20、JavaScript 对象基本认识
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/20.html
- 分类：前端框架
- 分组：教程目录
### 编程发展历史

汇编语言->汇编、C语言 （面向过程语言）

java c++ js object-C python （ 面向对象语言）

例子：有一辆车时速60km/h 一条路1000km。问题：需要花多长走完

面向过程：只考虑数学逻辑

```java
var  hour =1000/60
```

面向对象：物理逻辑映射到我们的程序

**1、** 分析有哪些实体；

**2、** 设置实体属性和功能；

**3、** 实体之间的相互作用；

车：属性：speed 60km/h

功能：可以跑在路上

路：属性：length

最后车真的跑在路上得出结果

实现面向对象语法：（在js中没有类这个概念，只有对象，es6新增了类）

类：一类具有相同特征的事物的抽象概念。

对象：具体某一个个体或某一实例

类对象

狗你遇到那只

电脑你桌上那台

对象声明：

**1、** 通过new运算符声明对象；

```java
var obj1=new Object()
```

**2、** 通过省略new；

```java
var obj2=Object()
```

**3、** 对象常量赋值；

```java
var obj3={
     }
```

新增属性:使用起来和普通的变量没有任何区别。主要区别在访问

```java
/* 新增普通属性 */
// 两种方式：任选其一
obj3.username='baby'
obj3['age']=17
/* 普通属性访问 */
// 两种方式：任选其一		
console.log(obj3['username',obj3.age])		console.log(obj3.username,obj3.age,obj3['age'])
```

注：不管是添加属性还是属性访问[]里面必须是字符串

[]新增的属性既可以使用对象名.属性名方式访问，还可以通过对象名[‘属性名’]

新增方法属性

```java
obj3.fn1=function(){
    console.log(1)
}
obj3['fn2']=function(){
    console.log(2)
}
/* 方法访问 */
console.log(obj3.fn1,obj3['fn1'])
console.log(obj3['fn2'],obj.fn2)
/* 方法调用 */
obj3['fn1']();
obj3.fn1()
obj3['fn2']();
obj3.fn2()
```

普通属性添加和方法属性的添加第三种：

```java
var obj4={
     username:'baby',age:18,fn:function(){
     }}
console.log(obj4.username,obj4['username'])
obj4.fn();
obj4['fn']()
```

delete 关键字:删除对象的属性和方法

```java
delete obj4.username
delete obj4.fn
console.log(obj4.username)
obj4.fn()
```

### 面向对象编程思想：

例子：有一辆车时速60km/h 一条路1000km。问题：需要花多长走完

```java
1.分析有哪些实体
2.设置实体属性和功能
3.实体之间的相互作用 
```

```java
var smallcar = {
//对象1
speed: 60, //属性
run: function(load) {
//功能
    return load.length / smallcar.speed
}
}
var bigload = {
//对象2
length: 1000,
}
console.log(smallcar.run(bigload))
```
