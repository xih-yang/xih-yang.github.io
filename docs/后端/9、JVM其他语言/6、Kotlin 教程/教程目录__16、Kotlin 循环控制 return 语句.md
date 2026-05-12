# 16、Kotlin 循环控制 return 语句
- 来源：https://ddkk.com/zhuanlan/java/kotlin/16.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin **return** 语句用于从函数中返回或者跳出循环

### Kotlin 有三种结构化跳转表达式：

**1、** **return:**默认从最直接包围它的函数或者匿名函数返回；

**2、** **break:**终止最直接包围它的循环；

**3、** **continue:**继续下一次最直接包围它的循环；

## 结构化跳转表达式 return 语句

Kotlin 有函数字面量、局部函数和对象表达式

因此Kotlin 的函数可以被嵌套

标签限制的 return 允许我们从外层函数返回

**return** 语句最重要的一个用途就是从 lambda 表达式中返回

回想一下我们这么写的时候

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
fun foo() {
    val ints = arrayOf(1, 2, 3, 4, 5, 6)
    ints.forEach {
        if (it == 3) return
        println(it)
    }
}
fun main(args: Array<String>) {
    foo()
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
1
2
```

这个return 表达式从最直接包围它的函数即 foo 中返回

这种非局部的返回只支持传给内联函数的 lambda 表达式

如果我们需要从 lambda 表达式中返回，我们必须给它加标签并用以限制 return

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
fun foo() {
    val ints = arrayOf(1, 2, 3, 4, 5, 6)
    ints.forEach lit@ {
        if (it == 0) return@lit
        println(it)
    }
}
fun main(args: Array<String>) {
    foo()
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
1
2
3
5
6
```

现在，它只会从 lambda 表达式中返回

通常情况下使用隐式标签更方便

标签与接受该 lambda 的函数同名

```java
fun foo() {
    val ints = arrayOf(1, 2, 3, 4, 5, 6)
    ints.forEach lit@ {
        if (it == 3) return@lit
        println(it)
    }
}
fun main(args: Array<String>) {
    foo()
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

或者，我们用一个匿名函数替代 lambda 表达式

匿名函数内部的 return 语句将从该匿名函数自身返回

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
fun foo() {
    val ints = arrayOf(1, 2, 3, 4, 5, 6)
    ints.forEach(fun(value: Int) {
        if (value == 0) return
        print(value)
    })
}
fun main(args: Array<String>) {
    foo()
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
6
```

当要返一个回值的时候，解析器优先选用标签限制的 return，即

```java
return@a 1
```

意为"从标签 @a 返回 1" ，而不是 "返回一个标签标注的表达式 (@a 1)"
