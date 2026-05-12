# 06、Java 20 新特性 - 外部函数 & 内存 API（第二个预览版）
- 来源：https://ddkk.com/zhuanlan/java/java20/6.html
- 分类：Java 20 新特性
- 分组：教程目录
Java 程序一直可以选择与 Java 运行时外部的代码和数据进行交互，可以使用 Java 本地接口（JNI）调用外部函数（在 JVM 之外但在同一台机器上）。使用 ByteBuffer API 或 `sun.misc.Unsafe API` 可以访问外部内存（在 JVM 之外，因此是堆外内存）。

但是，这三种机制都具有自己的缺点，因此现在提出了更现代的 API 以更好地支持外部函数和外部内存。

性能关键的库（如 Tensorflow、Lucene 或 Netty）通常依赖使用外部内存，因为它们需要更多地控制它们使用的内存以防止垃圾回收带来的成本和不可预测性。

**示例代码**

为了演示新 API，JEP 434 列出了一个代码示例，该示例获取 C 库函数 radixsort 的方法句柄，然后将其用于排序最初作为 Java 数组元素的四个字符串：

```java
// 1. Find foreign function on the C library path
Linker linker          = Linker.nativeLinker();
        SymbolLookup stdlib    = linker.defaultLookup();
        MethodHandle radixsort = linker.downcallHandle(stdlib.find("radixsort"), ...);
// 2. Allocate on-heap memory to store four strings
        String[] javaStrings = { "mouse", "cat", "dog", "car" };
// 3. Use try-with-resources to manage the lifetime of off-heap memory
        try (Arena offHeap = Arena.openConfined()) {
        // 4. Allocate a region of off-heap memory to store four pointers
        MemorySegment pointers = offHeap.allocateArray(ValueLayout.ADDRESS, javaStrings.length);
        // 5. Copy the strings from on-heap to off-heap
        for (int i = 0; i < javaStrings.length; i++) {
        MemorySegment cString = offHeap.allocateUtf8String(javaStrings[i]);
        pointers.setAtIndex(ValueLayout.ADDRESS, i, cString);
        }
        // 6. Sort the off-heap data by calling the foreign function
        radixsort.invoke(pointers, javaStrings.length, MemorySegment.NULL, '\0');
        // 7. Copy the (reordered) strings from off-heap to on-heap
        for (int i = 0; i < javaStrings.length; i++) {
        MemorySegment cString = pointers.getAtIndex(ValueLayout.ADDRESS, i);
        javaStrings[i] = cString.getUtf8String(0);
        }
        } // 8. All off-heap memory is deallocated here
        assert Arrays.equals(javaStrings, new String[] {"car", "cat", "dog", "mouse"});  // true
```

让我们仔细看看代码中用到的一些类型，了解它们在外部函数和内存 API 中的功能和目的：

**Linker:** 提供了从Java代码访问外部函数和从外部函数访问Java代码的功能。它通过downcall方法句柄允许Java代码链接到外部函数。它还通过生成upcall stubs允许外部函数调用Java方法句柄。有关更多信息，请参见此类型的JavaDoc。

**SymbolLookup:** 检索一个或多个库中符号的地址。有关更多信息，请参见此类型的JavaDoc。

**Arena:** 控制内存段的生命周期。Arena具有称为竞技场范围的范围。当竞技场关闭时，竞技场范围不再存在。因此，与竞技场范围关联的所有段都无效，它们的支撑内存区域被释放（在适用的情况下），并且在竞技场关闭后不能再访问它们。有关更多信息，请参见此类型的JavaDoc。

**MemorySegment:** 提供对连续内存区域的访问。有两种类型的内存段：heap segments（在Java内存堆中）和native segments（在Java内存堆之外）。有关更多信息，请参见此类型的JavaDoc。

**ValueLayout:** 对基本数据类型的值进行建模，例如integral值、floating-point值和address值。除此之外，它还为Java原始类型和地址定义了有用的值布局常量。有关更多信息，请参见此类型的JavaDoc。

## 与 Java 19 有何不同

在Java 19 中，此功能处于第一次预览状态（以 JEP 424 形式存在），因此语言功能已经完成并收集了开发者反馈。基于这些反馈，Java 20 发生了以下变化：

- 合并了 MemorySegment 和 MemoryAddress 抽象（内存地址现在由零长度的内存段建模）；
- 密封的 MemoryLayout 层次结构得到了增强，以便与 switch 模式匹配一起使用；
- MemorySession 已被分成 Arena 和 SegmentScope，以便跨维护边界共享段。
