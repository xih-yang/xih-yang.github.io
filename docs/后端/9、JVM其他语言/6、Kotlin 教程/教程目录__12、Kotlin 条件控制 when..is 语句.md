# 12、Kotlin 条件控制 when..is 语句
- 来源：https://ddkk.com/zhuanlan/java/kotlin/12.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin **when** 语句中可以使用 **is** 或者 **!is** 运算符来检测一个特定类型的值

> is 运算符因为会智能转换，所以我们可以直接访问该类型的方法和属性而无需任何额外的检测

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
fun hasPrefix(x: Any) = when(x) {
    is String -> x.startsWith("hello")
    else -> false
}
fun main(args: Array<String>) {
    print(hasPrefix("hello world"))
    print(hasprefix(1))
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar
true
false
```
