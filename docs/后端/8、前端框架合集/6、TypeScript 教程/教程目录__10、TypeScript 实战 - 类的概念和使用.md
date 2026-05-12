# 10、TypeScript 实战 - 类的概念和使用
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/10.html
- 分类：前端框架
- 分组：教程目录
## 类的基本使用

最基本的用法：

```java
// 例:
class person {
    content = "我是人类"
    say(){
        return this.content
    }
}
let  Persons = new person()
console.log(Persons.say())
//打印结果:我是人类
```

这是最基本的形式，在平时的工作中经常会使用到

## 类的继承

在TypeScript的继承和ES6的继承是一样的,都是通过关键字extends

```java
class person {
    content = "我是人类"
    say(){
        return this.content
    }
}
let  Persons = new person()
class XioHa extends person{
    sayHi(){
        return "你好!"
    }
}
let XH= new XioHa()
console.log(Persons.say())
console.log(XH.sayHi())
// 打印结果：
// 我是人类
// 你好!
```

上面子类`XiaoHa`是继承父类`person`并且在子类中添加了一个`sayHi`的方法

## 类的重写

重写就是子类可以重新编写父类里的代码

我们在XioHa这个子类重写父类中的say方法

```java
class XioHa extends person{
    say(){
          return "我是子类,被重写的人类"
    }
    sayHi(){
        return "你好!"
    }
}
let XH= new XioHa()
console.log(XH.say())
//打印结果：我是子类,被重写的人类
```

## super关键字的使用

假设我们还是想用person类中说的话，但是在后面加上"你好"两个字

这时候就可以使用super关键字，它代表父类中的方法

```java
class XioHa extends person{
    say(){
        return  super.say()+",我是通过super关键字添加的文字"
    }
    sayHi(){
        return "你好!"
    }
}
let XH= new XioHa()
// console.log(XH.say())
// 打印结果：我是人类,我是通过super关键字添加的文字
```

一般情况下是在子类中复制父类中的代码然后进行重写编写
