# 10、Kotlin 条件控制 when 语句
- 来源：https://ddkk.com/zhuanlan/java/kotlin/10.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin **when** 语句将它的参数和所有的分支条件顺序比较，直到某个分支满足条件

when 既可以被当做表达式使用也可以被当做语句使用

**1、** 如果它被当做表达式，符合条件的分支的值就是整个表达式的值；

**2、** 如果当做语句使用，则忽略个别分支的值；

### Kotlin when 语句范例

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
fun main(args: Array<String>) {
    var x = 2
    when (x) {
        1 -> print("x == 1")
        2 -> print("x == 2")
    }
}
```

输出结果为

```java
x == 2
```

## when..else 语句

Kotlin when 语句中如果其他分支都不满足条件将会求值 **else** 分支

### when..else 语句范例

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
fun main(args: Array<String>) {
    var x = 3
    when (x) {
        1 -> print("x == 1")
        2 -> print("x == 2")
        else -> print("x > 2")
    }
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
x > 2
```

如果很多分支需要用相同的方式处理，则可以把多个分支条件放在一起，用逗号分隔

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
fun main(args: Array<String>) {
    var x = 3
    when (x) {
        0, 1 -> print("x == 0 or x == 1")
        else -> print("otherwise")
    }
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
otherwise
```

when 也可以用来取代 if-else if 链

如果不提供参数，所有的分支条件都是简单的布尔表达式，而当一个分支的条件为真时则执行该分支：

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
fun main(args: Array<String>) {
    var x = 3
    when {
        x.isOdd() -> print("x is odd")
        x.isEven() -> print("x is even")
        else -> print("x is funny")
    }
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
x is odd
```
