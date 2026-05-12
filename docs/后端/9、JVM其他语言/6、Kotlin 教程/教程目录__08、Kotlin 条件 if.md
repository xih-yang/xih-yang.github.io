# 08、Kotlin 条件 if
- 来源：https://ddkk.com/zhuanlan/java/kotlin/8.html
- 分类：Kotlin 教程
- 分组：教程目录
程序代码默认是一条接着一条顺序执行下去，但有时候我们需要根据一些判断条件执行一些另一些语句或者根据判断条件忽略执行一些语句。 我们把程序的这种行为称之为流程控制

Kotlin 编程语言流程控制语句通过程序设定一个或多个条件语句来设定

**1、** 在条件为true时执行指定程序代码；

**2、** 在条件为false时执行其他指定代码；

### 下图是是典型的流程控制流程图：

## IF 表达式

一个if 语句包含一个布尔表达式和一条或多条语句

```java
// 只有 if
var max = a 
if (a < b) max = b
```

## if...else 表达式

```java
var max: Int
if (a > b) {
    max = a
} else {
    max = b
}
```

## if 表达式的结果可以赋值给一个变量

```java
val max = if (a > b) {
    print("Choose a")
    a
} else {
    print("Choose b")
    b
}
```

if的这种功能可以代替其它语言的 **三元操作符**

```java
val c = if (condition) a else b
```

## if 表达式范例

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
fun main(args: Array<String>)
{
    var x = 5
    if(x>3){
        println("x 大于 3")
    }else if(x==3){
        println("x 等于 3")
    }else{
        println("x 小于 3")
    }
    var a = 3
    var b = 4
    val c = if (a>=b) a else b
    println("c 的值为 $c")
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
x 大于 3
c 的值为 3
```
