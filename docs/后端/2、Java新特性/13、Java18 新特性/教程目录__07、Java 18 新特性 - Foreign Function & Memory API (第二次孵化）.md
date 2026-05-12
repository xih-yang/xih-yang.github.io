# 07、Java 18 新特性 - Foreign Function & Memory API (第二次孵化）
- 来源：https://ddkk.com/zhuanlan/java/java18/7.html
- 分类：Java 18 新特性
- 分组：教程目录
引入一个 API，Java 程序可以通过该 API 与 Java 运行时之外的代码和数据进行互操作。通过有效地调用外部函数（即 JVM 之外的代码）和安全地访问外部内存（即不受 JVM 管理的内存），使 Java 程序能够调用本机库并处理本机数据，而不会出现像JNI一样脆弱和危险。

新的 API 正在 Project Panama 中开发，目的是取代自 Java 1.1 以来已成为平台一部分的 JNI（Java 本地接口）。 JNI 允许从 Java 调用 C 代码。用过 JNI 的人都知道：JNI 实现起来非常复杂，容易出错，速度慢。

新 API 的目标是将实施工作量减少 90%，并将 API 性能提高 4 到 5 倍。

JEP 419 对 API 进行了广泛的更改。由于这在孵化器阶段经常发生，所以一旦它进入预览阶段，我们将详细介绍该功能。

这是一个孵化功能；需要添加 `--add-modules jdk.incubator.foreign` 来编译和运行 Java 代码，Java 18 改进了相关 API ，使之更加简单易用。

*历史*

- Java 14 [JEP 370 (opens new window) (opens new window)](https://openjdk.java.net/jeps/370)引入了外部内存访问 API（孵化器）。
- Java 15 [JEP 383 (opens new window) (opens new window)](https://openjdk.java.net/jeps/383)引入了外部内存访问 API（第二孵化器）。
- Java 16 [JEP 389 (opens new window) (opens new window)](https://openjdk.java.net/jeps/389)引入了外部链接器 API（孵化器）。
- Java 16 [JEP 393 (opens new window) (opens new window)](https://openjdk.java.net/jeps/393)引入了外部内存访问 API（第三孵化器）。
- Java 17 [JEP 412 (opens new window) (opens new window)](https://openjdk.java.net/jeps/412)引入了外部函数和内存 API（孵化器）。
