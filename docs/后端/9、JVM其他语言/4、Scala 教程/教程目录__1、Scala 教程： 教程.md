# 1、Scala 教程： 教程
- 来源：https://ddkk.com/zhuanlan/java/scala/1.html
- 分类：Scala 教程
- 分组：教程目录
Scala 是一门多范式（multi-paradigm）的编程语言，设计初衷是要集成面向对象编程和函数式编程的各种特性,也就是创造更好的 **JAVA**

Scala 源代码被编译成Java字节码，所以它可以运行于JVM之上，并可以调用现有的Java类库。

## 谁适合阅读本教程？

本教程适合想从零开始学习 Scala 编程语言的开发人员。 当然本教程也会对一些模块进行深入，让你更好的了解 Scala 的应用。

## 学习本教程前你需要了解

在继续本教程之前，你应该了解一些基本的计算机编程术语。 如果你学习过Java编程语言，将有助于你更快的了解 Scala 编程。

> 强烈建议你有一定的 JAVA 基础，因为 Scala 从 JAVA 演化而来 学习Java 教程)。

## 第一个 Scala 程序：Hello World

以下是用 Scala 编写的典型 Hello World 程序：

## 范例（HelloWorld.scala）

```java
object HelloWorld {
    def main(args: Array[String]): Unit = {
        println("Hello, world!")
    }
}
```

运行代码

将以上代码保存为 HelloWorld.scala 文件，执行以上 scala 程序（你也可以直接在线执行）：

```java
$ scalac HelloWorld.scala
$ scala HelloWorld.scala
```

输出结果为：

```java
Hello, world!
```
