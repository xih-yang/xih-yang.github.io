# 10、JavaScript 函数
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/10.html
- 分类：前端框架
- 分组：教程目录
### 概念：

函数就是把完成特定功能的一段代码【抽象出来】，使之成为程序中的一个【独立实体】，起个名字（函数名）。可以在同一个程序或其他程序中多次重复使用（通过函数名调用）

### 作用：

**1、** 是程序变得简短而清晰；

**2、** 有利于程序维护；

**3、** 可以提高程序开发效率；

**4、** 提高了代码的重用性；

函数声明：

```java
function 函数名（形参）{
        参数可以省略
​		.....
return ...;  返回值可省略
}
```

函数调用：函数名（实参）

```java
function fn（）{
....
无返回值
}
var result=fn（）  //result== undefined
```

arguments

每一个函数内部都有一个arguments，系统内置的。

伪数组，用于存储**函数调用时**传入的实参，可枚举。

在不确定传参个数可以使用argument，但是尽量不要使用argument，不要违背参数，函数见名思意的理念。

函数作用域：

任何程序在执行的时候都会占用内存空间，函数调用的时候也会占用内存空间。

垃圾回收机制：调用函数时，系统会分配一定的内存空间给这个函数使用（空间大小由这个函数里声明的变量和形参决定）。调用完毕之后，这个内存空间要释放，还给系统

```java
var a=0
function show(){
    console.log(a);
    a++;
}
show()
show()
//a的空间没被释放
alert(a)//不报错，正常显示
```

```java
function show(){
        var a=0
        console.log(a);
        a++;
    }
show()
show()
//a的空间被释放
alert(a)//报错 not defined
```

如果变量没有在函数中声明的话，那么它不会随函数的创建而被创建，也不会随着函数销毁而被销毁，会一直存在内存当中。此时的变量就叫做全局变量

局部变量：随函数的创建而被创建，随着函数销毁而被销毁的变量，有效范围就是函数范围内。

内存管理机制：在函数中声明的变量和形参随函数的创建而被创建，随着函数销毁而被销毁。

就近原则：里那个作用域仅，就是用哪个作用域的变量。

```java
var a=0
var b=0
function show(a){
            var b=100
            a+=5
            console.log(a,b);   //5 ,100
        }
    show(a)
console.log(a,b)//0 0
```

```java
var a=0
var b=0
function show(){
            var b=100
            a+=5
            console.log(a,b);   //5 ,100
        }
    show()
console.log(a,b)//5 0
```

注意：要看函数内部是否声明了同名的形参
