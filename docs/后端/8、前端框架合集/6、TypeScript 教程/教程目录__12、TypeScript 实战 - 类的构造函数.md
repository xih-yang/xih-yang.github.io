# 12、TypeScript 实战 - 类的构造函数
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/12.html
- 分类：前端框架
- 分组：教程目录
## 类的构造函数（关键字constructor）

类的里边定义一个`name`，但是`name`我们并不给他值,然后我们希望在new出对象的时候，直接通过传递参数的形式，给`name`赋值，并打印出来。这时候我们就需要用到构造函数了。

```java
class Person {
    public name:string ;
    //关键字constructor 语法糖
    constructor(name:string){
     //
        this.name=name
    }
}
let person = new Person("我是小哈")
console.log(person.name)
//打印结果为:我是小哈
```

简化写法：相当于你定义了一个`name`,然后在构造函数里进行了赋值

```java
class Person {
    constructor(  public name:string){
    }
}
let person = new Person("我是小哈")
console.log(person.name)
//打印结果为:我是小哈
```

## 类继承中的构造器写法

- 在子类中使用构造函数需要用super()调用父类的构造函数
- 如果需要传值,也就必须进行传值操作
- 父类没有构造器,子类也要使用super进行调用

```java
class Person {
    constructor(public name:string){
        this.name=name
    }
}
class XiaoHa extends Person{
    constructor(public age:number){
        super("我是小哈,今年")//没有调用super就会报错 
    }
}
let XH = new XiaoHa(18)
console.log(XH.name+XH.age+"岁")
//打印结果为:我是小哈18
```
