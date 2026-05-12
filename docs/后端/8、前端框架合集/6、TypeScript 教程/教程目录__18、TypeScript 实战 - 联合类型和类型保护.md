# 18、TypeScript 实战 - 联合类型和类型保护
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/18.html
- 分类：前端框架
- 分组：教程目录
## 联合类型

可以理解为`一个变量`有`两种或两种以上`的类型

我们写两个接口`PersonH5`和`PersonJava` 再写一个判断是谁的方法`WhoAreYou`

里边传入一个`animal`(任意值)，这时候可以能是`PersonH5`也可能是`PersonJava`

```java
interface PersonH5{
	isH5:boolean;
	say:()=>{
     }
}
interface PersonJava{
	isH5:boolean;
	say:()=>{
     }
}
```

以下这样的形式就是联合类型

联合类型，关键符号是`|`(竖线)。

```java
function WhoAreYou(animal:PersonH5|PersonJava){
     }
//这就是联合类型
```

我们来写一个方法

```java
function WhoAreYou(animal:PersonH5|PersonJava){
   animal.say() //报错
  //我们直接写一个这样的方法，就会报错，
  //因为WhoAreYou不能准确的判断联合类型具体的实例是什么。
 }
```

所以就需要我们的类型断言了

## 类型保护_类型断言

`关键字as`

```java
function WhoAreYouOne(animal:PersonH5|PersonJava){
    if(animal.isH5){
        (animal as PersonH5).say()
    }else{
        (animal as PersonJava).skill()
    }
}
```

## 类型保护_in语法

我们还经常使用`in`语法来作类型保护，比如用`if`来判断`animal里有没有skill()`方法。

具体程序如下:

```java
function WhoAreYouTwo(animal:PersonH5|PersonJava){
    if("skill" in animal){
        animal.skill()
    }else{
        animal.say()
    }
}
///这里的else部分能够自动判断，得益于TypeScript的自动判断
```

## 类型保护_typeof语法

先来写一个新的`Add`方法，方法接收两个参数，这两个参数可以是`数字number`也可以是`字符串string`,如果我们不做任何的类型保护，只是相加，这时候就会报错。代码如下:

```java
function Add(first: string | number, second: string | number) {
  return first + second;//报错
}
```

解决这个问题，就可以直接使用typeof来进行解决

```java
function Add(first: string | number, second: string | number) {
  if (typeof first === "string" || typeof second === "string") {
    return ${
       first}${
       second};
  }
  return first + second;
}
```

像上面这样写，就不会报错了。

## 类型保护_instanceof语法

比如现在要作类型保护的是一个对象，这时候就可以使用`instanceof`语法来作。现在先写一个`NumberObj`的类，代码如下：

```java
class NumberObj {
  count: number;
}
```

后我们再写一个`addObj`的方法，这时候传递过来的参数，**可以是任意的object**,`也可以是NumberObj的实例`，然后我们返回相加值，当然不进行类型保护，这段代码一定是错误的。

```java
function addObj(first: object | NumberObj, second: object | NumberObj) {
  return first.count + second.count;//报错
}
```

所以我们可以使用`instanceof`语法进行判断一下，就可以解决问题

```java
function addObj(first: object | NumberObj, second: object | NumberObj) {
  if (first instanceof NumberObj && second instanceof NumberObj) {
    return first.count + second.count;
  }
  return 0;
}
```

以上四种是比较常用的类型保护

**注意：instanceof 只能在类上使用**
