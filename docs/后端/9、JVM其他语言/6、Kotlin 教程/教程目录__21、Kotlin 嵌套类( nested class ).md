# 21、Kotlin 嵌套类( nested class )
- 来源：https://ddkk.com/zhuanlan/java/kotlin/21.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin 支持一个类内部再定义另一个类，里面的类又称之为嵌套类

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
class Outer {                  // 外部类
    private val bar: Int = 1
    class Nested {             // 嵌套类
        fun foo() = 2
    }
}
fun main(args: Array<String>) {
    val demo = Outer.Nested().foo() // 调用格式：外部类.嵌套类.嵌套类方法/属性
    println(demo)    // == 2
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
2
```
