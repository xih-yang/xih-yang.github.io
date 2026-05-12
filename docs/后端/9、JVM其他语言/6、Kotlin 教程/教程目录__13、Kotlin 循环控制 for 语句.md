# 13、Kotlin 循环控制 for 语句
- 来源：https://ddkk.com/zhuanlan/java/kotlin/13.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin for 语句可以对任何提供迭代器（iterator）的对象进行遍历

```java
for (item in collection) print(item)
```

循环体可以是一个代码块:

```java
for (item: Int in ints) {
    // ……
}
```

如上所述，for 可以循环遍历任何提供了迭代器的对象。

如果你想要通过索引遍历一个数组或者一个 list，你可以这么做：

```java
for (i in array.indices) {
    print(array[i])
}
```

> 这种"在区间上遍历"会编译成优化的实现而不会创建额外对象

或者你可以用库函数 withIndex

```java
for ((index, value) in array.withIndex()) {
    println("the element at $index is $value")
}
```

## 对集合进行迭代：

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
fun main(args: Array<String>) {
    val items = listOf("百度", "腾讯", "阿里巴巴")
    for (item in items) {
        println(item)
    }
    for (index in items.indices) {
        println("item at $index is ${items[index]}")
    }
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
百度
腾讯
阿里巴巴
item at 0 is 百度
item at 1 is 腾讯
item at 2 is 阿里巴巴
```
