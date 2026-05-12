# 11、Kotlin 条件控制 when..in 语句
- 来源：https://ddkk.com/zhuanlan/java/kotlin/11.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin **when** 语句可以使用 **in 运算符** 来检测一个值在（in）或者不在（!in）一个区间或者集合中

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
fun main(args: Array<String>) {
    var x = 9
    var validNumbers = arrayOf(1, 2, 3)
    when (x) {
        in 1..10 -> print("x is in the range")
        in validNumbers -> print("x is valid")
        !in 10..20 -> print("x is outside the range")
        else -> print("none of the above")
    }
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
x is in the range
```

Kotlin **when** 语句中使用 **in 运算符**来判断集合内是否包含某实例

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
fun main(args: Array<String>)
{
    val items = setOf("百度", "腾讯", "阿里")
    when 
    {
        "百度" in items -> println("百度")
        "小米" in items -> println("小米 is fine too")
    }
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
百度
```
