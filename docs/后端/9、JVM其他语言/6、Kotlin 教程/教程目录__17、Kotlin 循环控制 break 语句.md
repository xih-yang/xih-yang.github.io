# 17、Kotlin 循环控制 break 语句
- 来源：https://ddkk.com/zhuanlan/java/kotlin/17.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin **break** 语句用于终止最直接包围它的循环

### Kotlin 有三种结构化跳转表达式：

**1、** **return:**默认从最直接包围它的函数或者匿名函数返回；

**2、** **break:**终止最直接包围它的循环；

**3、** **continue:**继续下一次最直接包围它的循环；

## Kotlin 循环控制 break 语句

Kotlin 循环语句中 支持传统的 **break**

```java
fun main(args: Array<String>) {
    for (i in 1..10) {
        println(i)
        if (i>5) break   // i 为 6 时 跳出循环
    }
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
1
2
3
4
5
6
```

## break 标签

Kotlin 语言支持任何表达式都可以用标签（label）来标记

标签的格式为标识符后跟 @符号，例如：abc@、fooBar@都是有效的标签

要为一个表达式加标签，我们只要在其前加标签即可

```java
loop@ for (i in 1..100) {
    // ……
}
```

现在，我们可以用标签限制 break

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
fun main(args: Array<String>) {
    loop@ for (i in 1..5) {
        for (j in 1..3) {
            if ( i == 2 && j == 2 ) break@loop
            println("$i $j")
        }
    }
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
1 1
1 2
1 3
2 1
```

标签限制的 break 跳转到刚好位于该标签指定的循环后面的执行点
