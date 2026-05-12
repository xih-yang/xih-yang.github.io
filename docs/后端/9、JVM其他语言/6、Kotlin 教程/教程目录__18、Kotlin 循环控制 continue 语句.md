# 18、Kotlin 循环控制 continue 语句
- 来源：https://ddkk.com/zhuanlan/java/kotlin/18.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin **continue** 语句用于停止执行当前循环剩余的代码，转而开始执行下一次循环

### Kotlin 有三种结构化跳转表达式：

**1、** **return:**默认从最直接包围它的函数或者匿名函数返回；

**2、** **break:**终止最直接包围它的循环；

**3、** **continue:**继续下一次最直接包围它的循环；

## Kotlin 循环控制 continue 语句

Kotlin 循环语句支持传统的 continue 操作符

```java
fun main(args: Array<String>) {
    for (i in 1..10) {
        if (i==3) continue  // i 为 3 时跳过当前循环，继续下一次循环
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
4
5
6
```

## Continue 标签

Kotlin 语言中任何表达式都可以用标签（label）来标记

标签的格式为标识符后跟 @ 符号，例如：abc@、fooBar@都是有效的标签

要为一个表达式加标签，我们只要在其前加标签即可

```java
loop@ for (i in 1..100) {
    // ……
}
```

现在，我们可以用标签限制 break 或者 continue

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
fun main(args: Array<String>) {
    loop@ for (i in 1..3) {
        for (j in 1..2) {
            if (i == 2) continue@loop
            if ( i == 3 && j == 1) break
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
```

continue 标签指定的是下一次迭代开始的位置
