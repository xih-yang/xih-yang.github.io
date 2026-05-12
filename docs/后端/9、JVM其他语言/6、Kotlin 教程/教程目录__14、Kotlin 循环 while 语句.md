# 14、Kotlin 循环 while 语句
- 来源：https://ddkk.com/zhuanlan/java/kotlin/14.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin **while** 语句是最基本的循环

while 语句的语法如下

```java
while( 布尔表达式 ) {
  //循环内容
}
```

### Kotlin while 语句范例

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
fun main(args: Array<String>) {
    println("----while 使用-----")
    var x = 5
    while (x > 0) {
        println( x--)
    }
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
----while 使用-----
5
4
3
2
1
```
