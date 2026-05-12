# 09、TypeScript 实战 - interface 接口2
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/9.html
- 分类：前端框架
- 分组：教程目录
## 复制demo8经过优化之后的代码，一份简历都有自己自由发挥的空间,这个时候就需要任意值

## 插入任意值

`[propname:string]:any` 属性的名字是字符串类型，属性的值可以是任何类型。

```java
interface Resume{
    name:string;
    age:number,
    workingAge:number,
    // 接口非选值 是否恋爱
    spouse ?:string,
    //这个的意思是，属性的名字是字符串类型，属性的值可以是任何类型。
    [propname:string]:any
}
```

## 此时我们给对象一个性别

```java
const girl ={
    name:"小哈",
    age:23,
    workingAge:3,
    spouse:"否",
    sex:"男"
}
```

在修改一下代码，程序就不会报错了

```java
const LookResume=(girl:Resume)=>{
    console.log("姓名:"+girl.name+",年龄:"+girl.age+",工作年限:"+girl.workingAge)
    girl.spouse&&console.log(girl.name+"是否恋爱:"+girl.spouse)
    girl.sex&&console.log("面试者性别是:"+girl.sex)
}
```

`//如果去掉 [propname:string]:any 就会报错`

## 接口里的方法:

接口里不仅可以存属性，还可以存方法，比如这时候有个say()方法，返回值是string类型。这时候你就不要再想成简历了，你需要更面向对象化的编程，想象成一个人

```java
interface Resume{
    name:string;
    age:number,
    workingAge:number,
    // 接口非选值 是否恋爱
    spouse ?:string,
    [propname:string]:any,
    // 写一个say方法 返回值是string类型
    say():string,
}
```

此时的程序就会报错,因为我们的对象里没有say方法,那我们添加一下

```java
const girl ={
    name:"小哈",
    age:23,
    workingAge:3,
    spouse:"否",
    sex:"男",
    say(){
        return "欢迎您加入我们这个团体"
    }
}
```

添加`say()`方法之后,程序可以顺利运行了

## 接口和类的约束

JavaScript 从ES6里是有类这个概念的，类可以和接口很好的结合

例:

```java
class XiaoJieJie implements Resume{
     }
```

这个时候`XiaoJieJie`这个类直接报错,所以我们要把这个类写完整

```java
class XiaoJieJie implements Resume{
    name:"小美"
    age:18
    workingAge:3
    say(){
        return "我是小美"
    }
}
```

## 接口间的继承:

接口也是可以被继承的,例如我们新写一个`PartyMember`接口,继承`Resume`于接口

```java
// 接口之间的继承 extends
interface PartyMember extends Resume{
    partyMember():string
}
```

此时老板说只看partyMember级别的简历,那我们就要修改`LookResume()`方法了

```java
const LookResume=(girl:PartyMember)=>{
    console.log("姓名:"+girl.name+",年龄:"+girl.age+",工作年限:"+girl.workingAge)
    girl.spouse&&console.log(girl.name+"是否恋爱:"+girl.spouse)
    girl.sex&&console.log("面试者性别是:"+girl.sex)
}
```

修改后，你就会发现下面我们调用LookResume()方法的地方报错了,因为这时候传的值必须有`PartyMembe`方法,我们需要修改`girl`对象,增加`PartyMembe`方法就ok了

```java
const girl ={
    name:"小哈",
    age:23,
    workingAge:3,
    spouse:"否",
    sex:"男",
    say(){
        return "欢迎您加入我们这个团体"
    },
    partyMember(){
        return "我是党员"
    }
}
```

通过两个小demo,基本包含了接口的80%的知识,还有些基本不用的语法,在以后遇到在讲

## 注意(1):

在类的声明中，通过关键字extends来创建一个类的子类。

一个类通过关键字implements声明自己使用一个或者多个接口。

extends 是继承某个类, **继承之后可以使用父类的方法, 也可以重写父类的方法**;

implements 是实现多个接口, *接口的方法一般为空的, 必须重写才能使用*

## 注意(2):

extends是继承父类，只要那个类不是声明为final或者那个类定义为abstract的就能继承

Java中不支持多重继承，但是可以用接口 来实现，这样就要用到implements，继承只能继承一个类，

**但implements可以实现多个接口**，用逗号分开就行了

**比如 ：class A extends B implements C,D,E**
