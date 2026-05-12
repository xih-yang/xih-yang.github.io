# 10、Angular 4 教程 - TypeScript：基础数据类型
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/10.html
- 分类：前端框架
- 分组：教程目录
这篇文章将会来练习一下如何使用typescript的基础数据类型。

## 学习目标

- **练习typescript的基础数据类型使用方式**

## 学习时间

- **5分钟**

## 事前准备

请参看如下文章，结合gulp进行简单环境搭建：

- **[http://blog.csdn.net/liumiaocn/article/details/78510285](http://blog.csdn.net/liumiaocn/article/details/78510285)**

## 布尔类型

typescript和javascript中都是一样，boolean类型的变量，其值为true或者false，是最为基础的数据格式。

> 使用例：
>
> let isDone: boolean =true;

## 数字类型

在javascript中，所有的数字都是浮点类型，typescript中也是如此。另外除了支持10进制和16进制，typescript中也支持ECMAScript 2015中引入的二进制和八进制。

> 使用例：
>
> let decimal: number = 6;
>
> let hex: number = 0x00ff;
>
> let binary: number = 0b0011;
>
> let octal: number = 0o011;

## 字符串

javascript中使用单引号或者双引号来表示字符串。同时还可以使用`${表达式}` 的方式进行使用。

> 使用例：
>
> let color: string = “blue”;
>
> color = ‘red’;
>
> let namestr: string = `Gene`;
>
> let age: number = 37;
>
> let sentence: string = `Hello, my name is ${ namestr }.
>
> I’ll be ${ age + 1 } years old next month.`;
>
> let sentence: string = “Hello, my name is ” + fullName + “.\n\n” +
>
> “I’ll be ” + (age + 1) + ” years old next month.”;

## 数组Array

像javascript一样，typescript可以有两种方式使用数组

### 方式1：普通方式

> 使用例：let list: number[] = [1, 2, 3];

### 方式2：泛型方式

```java
let list: Array<number> = [1, 2, 3];
```

## 元组Tuple

当你希望使用的数组由不同类型所组成，你就可以使用Tuple，跟很多语言中的Tuple很类似。

> 使用例：
>
> let x: [string, number];
>
> x= [“hello”, 10];

## 枚举Enum

枚举是typescript对javascript的补充，使得代码更容易被阅读。

> 使用例：
>
> enum Color {Red = 1, Green = 2, Blue = 4};
>
> let c: Color = Color.Green;
>
> let colorName: string = Color[2];

枚举类型的元素编号缺省从0开始，也可以手动全部或者部分指定。

## 任意值Any

当我们无法确定编译阶段的类型，有可能为运行时确定的类型时，可以通过Any类型以避开编译器的检查。

> 使用例：let notSure: any = 4;
>
> notSure = “maybe a string instead”;
>
> notSure = false; // okay, definitely a boolean

## void

void更像是any的相反的用法，一般用来定义一个没有返回值的函数，或者定义一个变量而这个变量只能有null或者undefined的赋值可能性。

> 使用例：
>
> function warnUser(): void{
>
> console.log(“This is my warning message”);
>
> }
>
> warnUser();
>
> let unusable: void = undefined;

## Null和Undefined

默认情况下，null和undefined是各种类型的子类型，但是如果当把–strictNullChecks模式打开时，所有情况就变得严格起来了，如果这种情况下再想把null赋值给一个string类型，就要使用别的办法比如union了。缺省这个模式是关闭的，typescript官方是鼓励打开这个模式进行实践的。

> 使用例：
>
> let u: undefined = undefined;
>
> let n: null = null;

## 练习代码

```java
[root@angular proj]# cat src/basic-practice.ts 
let isDone: boolean =true;
console.log("boolean variable: isDone :"+isDone);
let decimal: number = 6;
let hex: number = 0x00ff;
let binary: number = 0b0011;
let octal: number = 0o011;
console.log("number decimal: "+decimal);
console.log("number hex    : "+hex);
console.log("number binary : "+binary);
console.log("number octal  : "+octal);
let namestr: string = "bob";
console.log(namestr);
namestr = "smith";
console.log(namestr);
namestr = Gene;
let age: number = 37;
let sentence: string = Hello, my name is ${ namestr }.
I'll be ${ age + 1 } years old next month.;
console.log(sentence);
let sentence1: string = "Hello, my name is " + namestr + ".\n\n" +
    "I'll be " + (age + 1) + " years old next month.";
console.log(sentence1);
let list: number[] = [1, 2, 3];
console.log("Array info list: " + list);
let list2: Array<number> = [2,3,4];
console.log("Array info list: " + list);
// Declare a tuple type
let x: [string, number];
// Initialize it
x = ["hello", 10]; // OK
console.log("Tuple: x: " + x);
enum Color {Red = 1, Green = 2, Blue = 4};
let c: Color = Color.Green;
let colorName: string = Color[2];
console.log("enum Color : " + Color);
console.log("enum Color c: " + c);
console.log("enum Color colarName: " + colorName);
let notSure: any = 4;
notSure = "maybe a string instead";
console.log("Any type: notSure: " + notSure);
notSure = false; // okay, definitely a boolean
console.log("Any type: notSure: " + notSure);
let list3: any[] = [1, true, "free"]; 
list3[1]=100;
function warnUser(): void{
  console.log("This is my warning message");
}
warnUser();
let unusable: void = undefined;
let u: undefined = undefined;
let n: null = null;
[root@angular proj]#
```

## 生成代码

```java
[root@angular proj]# gulp
[04:34:46] Using gulpfile /tmp/proj/gulpfile.js
[04:34:46] Starting 'default'...
[04:34:54] Finished 'default' after 8.52 s
[root@angular proj]# ls dist/basic-practice.js 
dist/basic-practice.js
[root@angular proj]# grep basic tsconfig.json 
        "src/basic-practice.ts"
[root@angular proj]# 
[root@angular proj]# cat dist/basic-practice.js 
var isDone = true;
console.log("boolean variable: isDone :" + isDone);
var decimal = 6;
var hex = 0x00ff;
var binary = 3;
var octal = 9;
console.log("number decimal: " + decimal);
console.log("number hex    : " + hex);
console.log("number binary : " + binary);
console.log("number octal  : " + octal);
var namestr = "bob";
console.log(namestr);
namestr = "smith";
console.log(namestr);
namestr = "Gene";
var age = 37;
var sentence = "Hello, my name is " + namestr + ".\n\nI'll be " + (age + 1) + " years old next month.";
console.log(sentence);
var sentence1 = "Hello, my name is " + namestr + ".\n\n" +
    "I'll be " + (age + 1) + " years old next month.";
console.log(sentence1);
var list = [1, 2, 3];
console.log("Array info list: " + list);
var list2 = [2, 3, 4];
console.log("Array info list: " + list);
// Declare a tuple type
var x;
// Initialize it
x = ["hello", 10]; // OK
console.log("Tuple: x: " + x);
var Color;
(function (Color) {
    Color[Color["Red"] = 1] = "Red";
    Color[Color["Green"] = 2] = "Green";
    Color[Color["Blue"] = 4] = "Blue";
})(Color || (Color = {}));
;
var c = Color.Green;
var colorName = Color[2];
console.log("enum Color : " + Color);
console.log("enum Color c: " + c);
console.log("enum Color colarName: " + colorName);
var notSure = 4;
notSure = "maybe a string instead";
console.log("Any type: notSure: " + notSure);
notSure = false; // okay, definitely a boolean
console.log("Any type: notSure: " + notSure);
var list3 = [1, true, "free"];
list3[1] = 100;
function warnUser() {
    console.log("This is my warning message");
}
warnUser();
var unusable = undefined;
var u = undefined;
var n = null;
[root@angular proj]#
```

## 结果确认

```java
[root@angular proj]# node dist/basic-practice.js 
boolean variable: isDone :true
number decimal: 6
number hex    : 255
number binary : 3
number octal  : 9
bob
smith
Hello, my name is Gene.
I'll be 38 years old next month.
Hello, my name is Gene.
I'll be 38 years old next month.
Array info list: 1,2,3
Array info list: 1,2,3
Tuple: x: hello,10
enum Color : [object Object]
enum Color c: 2
enum Color colarName: Green
Any type: notSure: maybe a string instead
Any type: notSure: false
This is my warning message
[root@angular proj]#
```

## 总结

这篇文章练习了一些简单的typescript基础数据类型的写法。
