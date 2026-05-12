# 21、TypeScript 实战 - 类中的泛型
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/21.html
- 分类：前端框架
- 分组：教程目录
## 类中的泛型使用:

我们在写一个基本class类 在构造函数中需要传递一组女角色的名称,然后通过`getGirlsNmae`发方法展示女角色的名称

```java
class GirlRole{
    constructor(private girls:string[]){
     }
    getGirlsNmae(index:number):string{
        return this.girls[index]
    }
}
let girl = new GirlRole(["虚空之女","希维尔","暗影猎手","霞"])
girl.getGirlsNmae(1)
console.log(girl.getGirlsNmae(1))
//终端控制台打印结果:希维尔
```

现在更好的保护角色的私密性，这些角色使用编号了，那我们程序就应该这样修改一下

```java
class GirlRole{
    constructor(private girls:string[]|number[]){
     }
    getGirlsNmae(index:number):string|number{
        return this.girls[index]
    }
}
let girl = new GirlRole(["虚空之女","希维尔","暗影猎手","霞"])
girl.getGirlsNmae(1)
console.log(girl.getGirlsNmae(1))
```

很显然上述的代码是没有问题,但不够优雅,代码看起来比较复杂

这个时候可以使用`泛型`来解决这个问题，在我们日常编写发杂的代码时候 `泛型`是经常被使用的

```java
class GirlRole<T>{
    constructor(private girls:T[]){
     }
    getGirlsNmae(index:number):T{
        return this.girls[index]
    }
}
let girl = new GirlRole(["虚空之女","希维尔","暗影猎手","霞"])
girl.getGirlsNmae(1)
console.log(girl.getGirlsNmae(0))
//终端控制台输出结果:虚空之女
```

我们使用了`泛型`,程序也没有报错,但是你会发现我们在`实例化对象的时候,类型是通过推断出的`

我们说过在**使用了泛型,** 就 **最好不要使用类型推断**

所以我们可以这样写

```java
	 let girl = new GirlRole<string>(["虚空之女","希维尔","暗影猎手","霞"])
```

## 泛型中的继承:

现在需求又变了，要求返回是一个对象中的roleName,也就是下面的代码要改成这个样子。

```java
getGirlsNmae(index:number):string{
    return this.girls[index].roleName
}
```

之前的代码肯定是报错的

但是这时候还要求我们这么做，意思就是说传递过来的值必须是一个对象类型的，里边还要有`roleName`属性。

这时候就要用到继承了，我用接口的方式来实现。写一个`Role`的接口，每个接口里都要有 `roleName` 属性。代码如下：

```java
interface Role{
    roleName:string
}
```

有了接口我们可以使用`extends`关键字实现泛型的继承

```java
class GirlRole extends Role{
  ...
 }
```

这句代码的意思是泛型里必须有一个`roleName`属性，因为它继承了`Role`接口。

这时候应该是一个`string`类型才对，所以代码应该改为下面的样子：

```java
interface Role{
    roleName:string
}
class GirlRole <T extends Role>{
    constructor(private girls:T[]){
     }
    getGirlsNmae(index:number):string{
        return this.girls[index].roleName
    }
}
let girlRole = new GirlRole([
    {
     roleName:"虚空之女"},
    {
     roleName:"希维尔"},
    {
     roleName:"暗影猎手"},
    {
     roleName:"霞"},
])
girlRole.getGirlsNmae(0)
console.log(girlRole.getGirlsNmae(0))
//打印结果：虚空之女
```

## 泛型的约束:

现在的泛型可以是任意类型，可以是对象、字符串、布尔、数字都是可以的。

但现在要求这个泛型必须是string或者number类型。我们还是拿上面的例子，不过把代码改为最初的样子。

```java
class GirlRole <T>{
    constructor(private girls:T[]){
     }
    getGirlsNmae(index:number):T{
        return this.girls[index]
    }
}
let girl = new GirlRole(["虚空之女","希维尔","暗影猎手","霞"])
```

然后进行约束，这时候还是可以使用关键字`extends`来进行约束，把代码改成下面的样子

```java
class GirlRole <T extends string|number>{
    constructor(private girls:T[]){
     }
    getGirlsNmae(index:number):T{
        return this.girls[index]
    }
}
 let girl = new GirlRole(["虚空之女","希维尔","暗影猎手","霞"])
```

上面就是最基本泛型讲解，在实际工作中，泛型的应用更广泛更复杂

一起学习，一起加油!!!
