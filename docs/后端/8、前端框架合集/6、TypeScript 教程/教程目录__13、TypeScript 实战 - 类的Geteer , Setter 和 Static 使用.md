# 13、TypeScript 实战 - 类的Geteer , Setter 和 Static 使用
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/13.html
- 分类：前端框架
- 分组：教程目录
## 我们都知道小哥哥的体重都是不愿意随便告诉别人,所以我们使用private,这样只有他本人知道自己的真实体重

创建一个(Boy)类

```java
class Boy {
     constructor(private _weight:number){
     }
}
```

## 但是想让其他人知道的话,那就得使用getter这个属性,它像方法但是它并不是方法，归根到底还是属性,它得关键字是get

## getter:

```java
    class Boy {
        constructor(private _weight:number){
     }
        get weigth(){
            return this._weight
        }
    }
    let boy = new Boy(140)
    console.log(boy.weigth)
//打印结果:140
```

## 但是别人问的时候你不想告知真实的体重,那么我们可以偷偷摸摸的减少20kg,这就是它的玄妙之处

```java
class Boy{
    constructor(private _weight:number){
     }
    get weight(){
        return this._weight-20
    }
}
let boy= new Boy(140)
console.log(boy.weight);
//打印结果为:120
```

通过上面这个小demo我们就更加的熟悉了`private`和`getter`的用处

## setter

我们知道上面demo中的`_weight`属性是内部私有的,外部无法改变,如果想要改变就可以使用`setter`属性进行操作

```java
class Boy {
    constructor(private _weight:number){
     }
    get weight(){
        return this._weight-20
    }
    set weight(num:number){
      //set 必须要有且只有一个参数
        this._weight=num
    }
}
let boy =new Boy(140)
boy.weight=160
console.log(boy.weight)
//打印结果为:140
```

## 静态修饰符 static:

简单来说 类在没有`new`实例化的时候可以使用里面的方法

```java
class Person{
    static SayHi(){
        return "你好"
    } 
} 
console.log(Person.SayHi())
//打印结果:你好
```
