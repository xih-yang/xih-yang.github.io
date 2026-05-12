# 06、Kotlin 基础语法
- 来源：https://ddkk.com/zhuanlan/java/kotlin/6.html
- 分类：Kotlin 教程
- 分组：教程目录
在继续学习 Kotlin 开发之前，我们先来了解一下 Kotlin 的一些基础知识

## Kotlin 文件扩展名

**Kotlin** 文件的扩展名是 .kt

## Kotlin 包声明

Kotlin 和运行在 JVM 之上的其它语言一样，使用 package 来声明一个包

```java
package com.ddkk.main
import java.util.*
fun hello() {}
class Twle {}
```

Kotlin 中包名不是强制要求的，如果没有指定包名，那这个文件的内容就从属于没有名字的 "default" 包

> 一般情况下，每个文件都要在正式代码之前先声明所属的包

Kotlin 语言不强制要求源文件要匹配包的路径，源文件可以放在任何文件目录

上面的范例中 test() 的全名是 com.ddkk.main.test，Twle 类的的全名是 com.ddkk.main.Twle

### 默认导入

Kotlin 默认会导入以下包到每个 .kt 文件中，你使用时无需重新导入

- kotlin.*
- kotlin.annotation.*
- kotlin.collections.*
- kotlin.comparisons.*
- kotlin.io.*
- kotlin.ranges.*
- kotlin.sequences.*
- kotlin.text.*

## 定义常量与变量

可变变量就是一般的变量

Kotlin 使用 **var** 关键字定义可变变量

### 语法

```java
var <标识符> : <类型> = <初始化值>
```

不可变变量俗称常量，是只能赋值一次的变量(类似 Java 中 final 修饰的变量)

Kotlin 使用 **val** 关键字定义不可变变量

```java
val <标识符> : <类型> = <初始化值>
```

Kotlin 允许常量与变量定义时可以不用初始化，但在引用前必须初始化

Kotlin 编译器支持自动类型判断,即声明时可以不指定类型,由编译器判断

```java
val a: Int = 1
val b = 1       // 系统自动推断变量类型为Int
val c: Int      // 如果不在声明时初始化则必须提供变量类型
c = 1           // 明确赋值
var x = 5        // 系统自动推断变量类型为Int
x += 1           // 变量可修改
```

## 注释

Kotlin 支持单行和多行注释

```java
// 这是一个单行注释
/* 这是一个多行的
   块注释。 */
```

与Java 不同, Kotlin 中的块注释允许嵌套

## 函数定义

Kotlin 使用 fun 关键字定义函数, **fun** 是 function 的缩写

### 语法

Kotlin 定义函数的语法一般如下

```java
fun [function_name] ( [parameter list]): [return_type]
{
   [statement]
   ...
}
```

- **[function_name]** 是函数名，比如 hello, hello_world 等
- **[parameter list]** 是参数列表
- **[return_type]** 是函数的返回值类型
- **[statement]** 函数体，是具体的实现函数功能的代码语句

下面的代码定义了一个名字叫 **sum** 的函数，它接收两个 Int 类型参数 a, b ，然后返回 Int 类型的值

```java
fun sum(a: Int, b: Int): Int {  // Int 参数，返回值 Int
    return a + b
}
```

当使用表达式作为函数体的时候，因为返回类型自动推断，所以可以省略，就像下面一样

```java
fun sum(a: Int, b: Int) = a + b
```

当然也有例外，就是 fun 前加上了访问范围修饰符的时候，就要明确写出返回类型

```java
public fun sum(a: Int, b: Int): Int = a + b   // public 方法则必须明确写出返回类型
```

如果一个函数没有返回值，可以将返回类型声明为 Unit ( 类似 Java 中的 void )

```java
fun printSum(a: Int, b: Int): Unit { 
    print(a + b)
}
```

当然了，如果是返回 Unit 类型，则可以省略( 对于 public 方法也是这样)

```java
public fun printSum(a: Int, b: Int) { 
    print(a + b)
}
```

### 可变长参数函数

可以用**vararg** 关键字来修饰函数的参数，那么这个函数就可以接收可变数量的参数

#### main.kt

```java
fun vars(vararg v:Int){
    for(vt in v){
        print(vt)
    }
}
// 测试
fun main(args: Array<String>) {
    vars(1,2,3,4,5)  // 输出12345
}
```

运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
12345
```

### lambda(匿名函数)

Kotlin 支持匿名函数，也就是支持 lambda 格式的函数

#### main.kt

```java
// 测试
fun main(args: Array<String>) {
    val sumLambda: (Int, Int) -> Int = {x,y -> x+y}
    println(sumLambda(1,2))  // 输出 3
}
```

运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
3
```

## 字符串模板

Kotlin 语言使用 `$` 符号在字符串中引用一个变量或者常量

`$` varName 表示变量值

`$` {varName.fun()} 表示变量的方法返回值

```java
var a = 1
// 模板中的简单名称：
val s1 = "a is $a" 
a = 2
// 模板中的任意表达式：
val s2 = "${s1.replace("is", "was")}, but now is $a"
```

使用REPL 运行以上范例输出如下

```java
$ kotlinc
Welcome to Kotlin version 1.1.51 (JRE 1.8.0_101-b13)
Type :help for help, :quit for quit
>>> var a = 1
>>> val s1 = "a is $a"
>>> s1
a is 1
>>> a = 2
>>> val s2 =  "${s1.replace("is", "was")}, but now is $a"
>>> s2
a was 1, but now is 2
>>> 
```

## NULL 检查机制

Kotlin 使用一种叫 **空安全** 的机制来处理声明可为空的参数

在使用声明可为空的参数时要进行空判断处理，有两种处理方式:

**1、** 字段后加!!，会像Java一样抛出空异常；

**2、** 字段后加?，可不做处理返回值为null或配合?:做空判断处理；

```java
//类型后面加?表示可为空
var age: String? = "23" 
//抛出空指针异常
val ages = age!!.toInt()
//不做处理返回 null
val ages1 = age?.toInt()
//age为空返回-1
val ages2 = age?.toInt() ?: -1
```

当一个引用可能为 null 值时, 对应的类型声明必须明确地标记为可为 null

下面的代码，当 str 中的字符串内容不是一个整数时, 返回 null

```java
fun parseInt(str: String): Int? {
  // ...
}
```

以下范例演示如何使用一个返回值可为 null 的函数

#### main.kt

```java
fun main(args: Array<String>) {
  if (args.size < 2) {
    print("Two integers expected")
    return
  }
  val x = parseInt(args[0])
  val y = parseInt(args[1])
  // 直接使用 x * y 会导致错误, 因为它们可能为 null.
  if (x != null && y != null) {
    // 在进行过 null 值检查之后, x 和 y 的类型会被自动转换为非 null 变量
    print(x * y)
  }
}
```

## 类型检测及自动类型转换

Kotlin 使用 is 运算符检测一个表达式是否某类型的一个实例，这类似于 Java 中的 instanceof 关键字)

```java
fun getStringLength(obj: Any): Int? {
  if (obj is String) {
    // 做过类型判断以后，obj会被系统自动转换为String类型
    return obj.length 
  }
  //在这里还有一种方法，与Java中instanceof不同，使用!is
  // if (obj !is String){
  //   // XXX
  // }
  // 这里的obj仍然是Any类型的引用
  return null
}
```

或者

```java
fun getStringLength(obj: Any): Int? {
  if (obj !is String)
    return null
  // 在这个分支中, obj 的类型会被自动转换为 String
  return obj.length
}
```

甚至还可以

```java
fun getStringLength(obj: Any): Int? {
  // 在 && 运算符的右侧, obj 的类型会被自动转换为 String
  if (obj is String && obj.length > 0)
    return obj.length
  return null
}
```

## 区间

Kotlin 支持区间表达式

区间表达式由具有操作符形式 .. 的 rangeTo 函数辅以 in 和 !in 形成

区间是为任何可比较类型定义的，但对于整型原生类型，它有一个优化的实现

以下是使用区间的一些范例

```java
for (i in 1..4) print(i) // 输出“1234”
for (i in 4..1) print(i) // 什么都不输出
if (i in 1..10) { // 等同于 1 <= i && i <= 10
    println(i)
}
// 使用 step 指定步长
for (i in 1..4 step 2) print(i) // 输出“13”
for (i in 4 downTo 1 step 2) print(i) // 输出“42”
// 使用 until 函数排除结束元素
for (i in 1 until 10) {   // i in [1, 10) 排除了 10
     println(i)
}
```

### 范例

#### main.kt

```java
fun main(args: Array<String>) {
    print("循环输出：")
    for (i in 1..4) print(i) // 输出“1234”
    println("\n----------------")
    print("设置步长：")
    for (i in 1..4 step 2) print(i) // 输出“13”
    println("\n----------------")
    print("使用 downTo：")
    for (i in 4 downTo 1 step 2) print(i) // 输出“42”
    println("\n----------------")
    print("使用 until：")
    // 使用 until 函数排除结束元素
    for (i in 1 until 4) {   // i in [1, 4) 排除了 4
        print(i)
    }
    println("\n----------------")
}
```

运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar 
循环输出：1234
----------------
设置步长：13
----------------
使用 downTo：42
----------------
使用 until：123
----------------
```
