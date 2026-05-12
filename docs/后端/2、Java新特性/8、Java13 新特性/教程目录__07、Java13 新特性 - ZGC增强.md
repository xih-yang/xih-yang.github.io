# 07、Java13 新特性 - ZGC增强
- 来源：https://ddkk.com/zhuanlan/java/java13/7.html
- 分类：Java 13 新特性
- 分组：教程目录
ZGC或 Z 垃圾收集器是在 Java 11 中引入的，作为一种低延迟垃圾收集机制。ZGC 确保垃圾收集暂停时间不依赖于堆大小。无论堆大小是 2MB 还是 2GB，它都不会超过 10 毫秒。

但是ZGC 在将未使用的堆内存返回给操作系统方面存在限制，例如 G1 和 Shenandoah 等其他 HotSpot VM GC。以下是使用 Java 13 完成的增强功能：

- ZGC 默认将未提交的内存返回给操作系统，直到达到最大堆大小。
- ZGC 通过减少内存占用来提高性能。
- 与 4TB 的大小限制相比，ZGC 现在支持 16 TB 的堆大小。

为了回到 Java 11 的垃圾回收方式，我们可以使用以下选项：

- 使用 -XX:-ZUncommit 选项
- 将 -Xms 和 -Xmx 堆大小设置为相同。
