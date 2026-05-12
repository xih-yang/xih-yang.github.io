# 15、Kotlin 循环 do..while 语句
- 来源：https://ddkk.com/zhuanlan/java/kotlin/15.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin **do..while** 循环语句可以先执行一次循环体然后再判断条件

对于while 语句而言，如果不满足条件，则不能进入循环. 但有时候我们需要即使不满足条件，也至少执行一次，这种情况下就可以使用 do..while 循环语句

### Kotlin do..while 循环语句语法如下

```java
do {
 //代码语句
}while(布尔表达式);
```

### Kotlin do..while 循环语句范例

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
fun main(args: Array<String>) {
    println("----do...while 使用-----")
    var y = 5
    do {
        println(y--)
    } while(y>0)
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
----do...while 使用-----
5
4
3
2
1
```
