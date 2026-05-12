# 16、JVM 实战 - 直接内存
- 来源：https://ddkk.com/zhuanlan/java/jvm/11/16.html
- 分类：JVM 实战
- 分组：教程目录
直接内存不是虚拟机运行时数据区的一部分，也不是《Java虚拟机规范》中定义的内存区域。

直接内存是在Java堆外的、直接向系统申请的内存区间。来源于[NIO](https://blog.csdn.net/munangs/article/details/123027530)（jdk1.4时期），通过存在堆中的DirectByteBuffer操作Native内存。通常，访问直接内存的速度会优于Java堆。即读写性能高。

- 因此出于性能考虑，读写频繁的场合可能会考虑使用直接内存。
- Java的NIO库允许Java程序使用直接内存，用于数据缓冲区。

**非直接缓冲区**

读写文件，需要与磁盘交互，需要由用户态切换到内核态。在内核态时，需要内存如图的操作。

使用IO，如图。这里需要两份内存存储重复数据，效率低。

**直接缓冲区**

使用NIO时，如图。操作系统划出的直接缓存区可以被java代码直接访问，只有一份。NIO适合对大文件的读写操作。

也可能导致OutOfMemoryError（Direct buffer memory）异常

由于直接内存在Java堆外，因此它的大小不会直接受限于-Xmx指定的最大堆大小但是系统内存是有限的，Java堆和直接内存的总和依然受限于操作系统能给出的最大内存。

缺点：
——分配回收成本较高

——不受JVM内存回收管理

直接内存大小可以通过MaxDirectMemorySize设置如果不指定，默认与堆的最大值-Xmx参数值一致。

java process memory = java heap + native memory
