# 07、Java10 新特性 - JIT编译器
- 来源：https://ddkk.com/zhuanlan/java/java10/7.html
- 分类：Java 10 新特性
- 分组：教程目录
JIT编译器是用 C++ 编写的，用于将 Java 转换为字节码。现在 Java 10 可以选择启用基于 Java 的实验性 JIT 编译器 Graal 来代替标准的 JIT 编译器。Graal 正在使用 Java 9 中引入的 JVMCI，即 JVM 编译器接口。 Graal 在 Java 9 中也可用。使用 Java 10，我们可以启用 Graal 来测试和调试实验性 JVM 编译器。

## JIT编译器语法

```java
java -XX:+UnlockExperimentalVMOptions -XX:+UseJVMCICompiler
```

Graal 编译器完全重写了基于 C++ 的早期编译器，针对基于 Linux/x64 的平台。Graal 是在 Java 9 中引入的，作为目前使用的 JIT 编译器的替代品。Graal 是 JVM 的插件，可以动态插入。它也支持多语言解释。

## JIT编译器的风险和假设

由于Graal 是实验性的，并且考虑到各种 Hotspots 和带有各种标志选项的 jdk 测试，因此需要进行测试工作。与标准的 JIT Ahead of Time 编译器相比，它可能无法通过一些性能基准测试。
