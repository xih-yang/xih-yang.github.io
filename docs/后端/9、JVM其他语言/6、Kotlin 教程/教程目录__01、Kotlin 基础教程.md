# 01、Kotlin 基础教程
- 来源：https://ddkk.com/zhuanlan/java/kotlin/1.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin 是运行在 Java 虚拟机上的静态语言，被称之为 Android 世界的 Swift，由 JetBrains 设计开发并开源

Kotlin 可以编译成 JAVA 字节码，也可以编译成 JavaScript，方便在没有 JVM 的设备上运行

Google I/O 2017 中，Google 宣布 Kotlin 成为 Android 官方开发语言

## 本教程使用的 Kotlin 版本

本教程使用 Kotlin 的版本为 v1.1.51

```java
$ kotlinc -version
info: kotlinc-jvm 1.1.51 (JRE 1.8.0_101-b13)
```

## 第一个 Kotlin 程序

Kotlin 程序文件以 .kt 作为扩展名，如：helloworld.kt 、app.kt、main.kt 等

## 简单版

```java
fun main(args: Array<String>) {  // 程序入口函数，包级可见的函数
   println("Hello World!")       // 分号可以省略
   println("Hello DDKK.COM 弟弟快看，程序员编程资料站!")
}
```

## 面向对象版

```java
// #!/usr/bin/kotlinc
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
package hello
class Greeter(val name: String) {
   fun greet() { 
      println("Hello, $name")
   }
}
fun main(args: Array<String>) {
   Greeter(args[0]).greet()    // 创建一个对象不用 new 关键字
}
```

## 为什么选择 Kotlin ?

**1、** **简洁:**大大减少样板代码的数量；

**2、** **安全:**避免空指针异常等整个类的错误；

**3、** **互操作性:**充分利用JVM、Android和浏览器的现有库；

**4、** **工具友好:**可用任何JavaIDE或者使用命令行构建；

## 参考网站

**1、**[官方网站](http://www.kotlinlang.org)；

**2、**[官方范例](http://try.kotlinlang.org)；

**3、**[官方网站-中文翻译](https://www.kotlincn.net/)；

**4、**[Kotlin在线工具](http://r.ddkk.cn/kotlin)；
