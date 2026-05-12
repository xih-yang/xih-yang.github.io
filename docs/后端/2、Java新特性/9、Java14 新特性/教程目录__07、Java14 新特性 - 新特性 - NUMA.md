# 07、Java14 新特性 - 新特性 - NUMA
- 来源：https://ddkk.com/zhuanlan/java/java14/7.html
- 分类：Java 14 新特性
- 分组：教程目录
NUMA 代表非统一内存访问。它是一种内存架构，其中每个处理器内核都有自己的本地内存，但其他内核有权访问它。

并行GC，当与 -XX:+UseParallelGC 一起使用时，NUMA Aware 已经有几年了。它提高了跨多个套接字运行单个 JVM 的配置的性能。在 Java 14 中，G1 得到了增强，可以更好地管理内存使用。

## Z垃圾收集器

Z垃圾收集器是一个可扩展的低延迟垃圾收集器。它首先在 Java 11 中作为实验性功能引入。它仅支持 Linux/x64。在 Java 14 中，现在 ZGC 也被移植到 Windows 和 Mac OS 上。目前，它也是一个实验性功能。从 Java 15 开始，它将成为标准 JDK 版本的一部分。
