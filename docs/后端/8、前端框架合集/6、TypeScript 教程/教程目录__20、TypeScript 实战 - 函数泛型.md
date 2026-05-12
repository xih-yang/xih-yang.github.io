# 20、TypeScript 实战 - 函数泛型
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/20.html
- 分类：前端框架
- 分组：教程目录
## 函数泛型

我们先写一个简单的联合类型demo

为了保证方法可用 我们就利用字符串模板来拼接这两个参数

```java
function join(first:string|number,second:string|number){
    return ${
       first}${
       second}
}
join("哈哈","小猿")
```

上后面的代码是没有任何问题的。

现有一个新的需求：`first`这个参数为`string`类型时, `second`也要为`string`类型，反之同理。

利用我们前面所学的知识很难实现,所以这个时候就需要`泛型`来解决这个问题

## 函数泛型的写法

尖括号``，括号里面的`T`是任何字母或单词都可以替换的 写你想写的名字,但是最好要语义化 ,一般情况下我们约定俗成写`T`(显得专业)

```java
function join<T>(first:T,second:T){
    return ${
       first}${
       second}
}
join<string>("哈哈","小猿")
```

在我们调时`join`函数方法时,使用`join(参数)`(例如：`join("哈哈","小猿")`) 在尖括号里面填写相应的类型即可

如果想要两个参数都是`number`那就可以这样写

```java
join<number>(1,2）
```

## 泛型中数组的使用

如果传递过来的是数组，我们有两种定义方法

- 泛型后面添加[]
- 泛型前面添加Array

```java
//第一种
function Monkey<T>(one:T[]){
    return one
}
Monkey<string>(["哈哈","小猿"])
```

```java
//第二种
function Monkey<T>(one:Array<T>){
    return one
}
Monkey<number>([1,2])
console.log(Monkey<number>([1,2]))
//终端输出结果:[ 1, 2 ]
```

## 多个泛型的定义:

一个函数可以定义多个泛型

```java
function join<T,P>(one:T,two:P){
    return ${
       one}${
       two}
}
join<string,number>("我是哈哈小猿",23)
console.log(join<string,number>("我是哈哈小猿",23))
```

## 泛型的类型推断:

```java
function join<T,P>(one:T,two:P){
    return ${
       one}${
       two}
}
join("我是哈哈小猿",23)
```

上面一段代码我们在调用join函数方法时没有规定类型，其实程序已经推断出我们的类型了

把鼠标放在`join("我是哈哈小猿",23)`这行代码上，你就会发现其中的奥秘

**注意：** 我们在使用泛型的时候使用类型推断,会降低代码的可读性。 **使用了泛型，那就最好不要使用类型推断。**
