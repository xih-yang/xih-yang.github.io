# 19、TypeScript 实战 - 枚举类型
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/19.html
- 分类：前端框架
- 分组：教程目录
写一个小demo

随机数喝酒游戏，我们随机摇到几就喝几杯酒

写一个随机数 随机生成0-6

```java
const RandomNumber = Math.round(Math.random()*6)
```

再写一个方法

```java
function Drink(num:number):string{
    if(num==0){
        return "免喝"
    }else if(num==1){
        return "喝一杯"
    }else if(num==2){
        return "喝两杯"
    }else if(num==3){
        return "喝三杯"
    }else if(num==4){
        return "喝四杯"
    }else if(num==5){
        return "喝五杯"
    }else if(num==6){
        return "喝六杯"
    }
}
console.log(Drink(RandomNumber))
```

这就简单的完成了我们的需求，但是上面的写法是初级者的写法。

我们来改造一下，如下代码

```java
const RandomNumber = Math.round(Math.random()*6)
const Status ={
   zero:0,
   one:1,
   two:2,
   three:3,
   four:4,
   five:5,
   six:6,
}
function Drink(num:number):string{
    if(num==Status.zero){
        return "免喝"
    }else if(num==Status.one){
        return "喝一杯"
    }else if(num==Status.two){
        return "喝两杯"
    }else if(num==Status.three){
        return "喝三杯"
    }else if(num==Status.four){
        return "喝四杯"
    }else if(num==Status.five){
        return "喝五杯"
    }else if(num==Status.six){
        return "喝六杯"
    } 
}
console.log(Drink(RandomNumber))
```

但是上面还是不够高级，高级写法就会用到我们的枚举类型`enum`，如下代码

```java
const RandomNumber = Math.round(Math.random()*6)
enum Status {
    zero,
    one,
    two,
    three,
    four,
    five,
    six
}
function Drink(num:number):string{
    if(num==Status.zero){
        return "免喝"
    }else if(num==Status.one){
        return "喝一杯"
    }else if(num==Status.two){
        return "喝两杯"
    }else if(num==Status.three){
        return "喝三杯"
    }else if(num==Status.four){
        return "喝四杯"
    }else if(num==Status.five){
        return "喝五杯"
    }else if(num==Status.six){
        return "喝六杯"
    } 
}
console.log(Drink(RandomNumber))
```

## 枚举类型的对应值

此时我们传值一个`1`，会输出`喝一杯`

```java
console.log(Drink(1));
//打印结果:喝一杯
```

这看起来很神奇，这是因为枚举类型是有对应的数字值的，默认是从 `0` 开始的。我们直接用`console.log()`就可以看出来了。

```java
console.log(Status.zero); //打印结果为：0
console.log(Status.one);//打印结果为：1
console.log(Status.two);//打印结果为：2
console.log(Status.three);//打印结果为：3
console.log(Status.four);//打印结果为：4
console.log(Status.five);//打印结果为：5
console.log(Status.six);//打印结果为：6
```

以看出结果就是`0,1,2,3,4,5,6`。这时候不想默认从 0 开始，而是想从 10开始。可以这样写

```java
enum Status {
    zero = 10,
    one,
    two,
    three,
    four,
    five,
    six
}
```

我们可以**枚举通过下标来反查**一下是否是从10开始的

```java
console.log(Status.zero)
console.log(Status.one)
console.log(Status[10])
console.log(Status[11])
```

输出的结果为： `10``11``zero``one`
