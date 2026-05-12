# 09、Kotlin 条件 if...in
- 来源：https://ddkk.com/zhuanlan/java/kotlin/9.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin **if...in** 运算符用来检测某个数字是否在指定区间内，区间格式为 x..y

## if..in 使用范例

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
fun main(args: Array<String>) 
{
    val x = 12
    if (x in 1..8) {
        println("x 在区间内")
    } else {
        println("不在区间内")
    }
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
不在区间内
```
