# 04、JVM 调优实战 - VM的垃圾回收机制
- 来源：https://ddkk.com/zhuanlan/java/jvm/8/4.html
- 分类：JVM 实战
- 分组：教程目录
## 1. 对象的分配与引用

有如下一段代码，通过 “loadReplicasFromDisk” 方法的执行，去磁盘上加载需要的副本数据。然后通过 “ReplicaManager” 对象实例完成这个操作。

根据JVM运行原理，上述代码的运行流程如下：

首先一个 main 线程肯定会来执行 main() 方法里的代码，main 线程有一个Java虚拟机栈， 会把 main() 方法的栈帧压入 Java 虚拟机栈。

接着main() 方法里调用了 loadReplicasFromDisk(）方法。

那么就会创建 loadReplicasFromDisk() 方法的栈帧，压入 main 线程的 Java 虚拟机栈里去。

在loadReplicasFromDisk() 方法里，有一个 “replicaManager” 变量，他会在该方法对应的栈帧里，放入一个 “replicaManager” 变量。

接着在代码里创建了一个 “ReplicaManager” 类的实例对象，就会在 Java 堆内存中分配这个实例对象的内存空间。

同时，让 loadReplicasFromDisk() 方法的栈帧内的 “replicaManager” 局部变量去指向那个 Java 堆内存里的 ReplicaManager 实例对象，如下图：

接下来，就会执行通过 “replicaManager” 局部变量引用的 **“ReplicaManager” 实例对象去执行它的 load() 方法**，去完成要实现的业务逻辑。

## 2. 一个方法执行完毕之后会怎么样？

在上述代码中，“replicaManager.load()” 方法里的代码执行完毕，那么方法就执行完毕了，也就是说 loadReplicasFromDisk() 方法就执行完毕了。

一旦你的 loadReplicasFromDisk() 方法执行完毕，就会把 loadReplicasFromDisk() 方法对应的栈帧从 main 线程的 Java 虚拟机栈里出栈。

一旦loadReplicasFromDisk() 方法的栈帧出栈，那么在那个栈帧里的局部变量 “replicaManager” 也就没有了。此时就没有变量指向Java堆内存里的 “ReplicaManager” 实例对象。

## 3. 创建的 Java对象都是占用内存资源的

当Java 堆内存里的 “ReplicaManager” 实例对象没有人引用它了，就不应该继续留在内存里了。

核心原因：**我们在 Java 堆内存里创建的对象，都是占用内存资源的，而且内存资源有限**。

比如：JVM进程占用的部分内存资源为 2G，而“ReplicaManager” 实例对象，可能会占用500字节的内存。

## 4. 不再需要的那些对象应该怎么处理

当“ReplicaManager” 对象实例不再需要使用，已经没有任何方法的局部变量在引用这个实例对象，而它还空占着内存资源，此时就该启动 **JVM的垃圾回收机制**。

JVM本身有垃圾回收机制，当你启动一个JVM进程，它就会自带一个后台自动运行的垃圾回收的线程。该线程会在后台不断坚持 JVM 堆内存中的各个实例对象。

如果某个势力对象没有任何一个方法的局部变量指向他，也没有任何一个类的静态变量，包括常量等地方指向他。

那么垃圾回收线程，就会把这个没人指向的 “ReplicaManager” 实例对象给回收掉，从内存里清除掉，让他不再占用任何内存资源。

这些不再被人指向的对象实例，即 JVM 中的“**垃圾**” ，就会定期的被后台垃圾回收线程清理掉，不断释放内存资源。

## 5. 思考题

我们创建的那些对象，到底在 Java 堆内存里会占用多少内存空间呢？

答：一个对象对内存空间的占用，大致分为两块：

- 一个是对象自己本身的一些信息
- 一个是对象的实例变量作为数据占用的空间

比如对象头，如果在 64 位的linux 操作系统上，会占用 16 字节，然后如果你的实例对象内部有个 int 类型的实例变量，他会占用 4 个字节，如果是 long 类型的实例变量，会占用 8个字节，如果是数组、Map之类的，那么久会占用更多的内存了。
