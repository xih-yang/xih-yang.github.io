# 14、TypeScript 实战 - 类的只读属性和抽象类
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/14.html
- 分类：前端框架
- 分组：教程目录
## 类的只读属性 readonly

先新建一个类实例化并赋值

```java
class Person {
    constructor(public name:string){
     }
}
let person = new Person("小哈")
person.name= "小哈二号"
console.log(person.name)
//打印结果:小哈二号
```

我们可以得出类的属性`name`的值(小哈)被赋为小哈二号

如果在实例化对象时赋予的名字，以后**不能再更改**了，也就是我们**常说的只读属性**

```java
class Person{
    public readonly _name:string
    constructor(name:string){
        this._name=name
    }
 }
 let person = new Person("小哈")
 //person._name="小嘻" //报错 无法分配到 "name" ，因为它是只读属性
```

这样通过实例化`person._name="小嘻"` 赋值是会报错的，此时的`_name`是只读属性,不能改变

## 抽象类abstract:

什么是抽象类,比如我开了一个一家科技公司，里边有前端工程师，有后端工程师(Java)，有UI设计，每一个岗位我都写成一个类，那代码就是这样的

```java
class frontEnd{
     }
class Java{
     }
class UI {
     }
```

每个岗位都要各司其职,那我们可以写一个抽象类

抽象类的关键词是`abstract`,里边的抽象方法也是`abstract`开头的，现在我们就写一个`Boy`的抽象类。

```java
abstract class Boy{
    abstract skill() //因为没有具体的方法，所以这里不写{}括号
}
```

```java
class FrontEnd extends Boy{
    skill(){
        console.log("我是做前端开发的")
    }
}
class Java extends Boy{
    skill(){
        console.log("我是搞Java开发的")
    }
}
class UI extends Boy{
    skill(){
        console.log("我是搞UI设计的")
    }
}
const frontEnd=new FrontEnd()
const java = new Java()
const ui = new UI()
console.log(frontEnd.skill(),java.skill(),ui.skill())
//我是做前端开发的 我是搞Java开发的 我是搞UI设计的
```
