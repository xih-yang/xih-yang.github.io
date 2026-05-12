# 12、JVM 实战 - JVM之运行时数据区 - Java堆
- 来源：https://ddkk.com/zhuanlan/java/jvm/1/12.html
- 分类：JVM 实战
- 分组：教程目录
### 一、Java堆

堆区（Heap区）是JVM运行时数据区占用内存最大的一块区域，每一个JVM进程只存在一个堆区，它在JVM启动时被创建，JVM规范中规定堆区可以是物理上不连续的内存，但必须是逻辑上连续的内存。

1、堆区是线程共享共享的区域，同时也是JVM管理最大的内存区域。

2、JVM规范中描述，所有的对象实例及数组都应该在运行时分配在堆上。而他们的引用会被保存在虚拟机栈中，当方法结束，这些实例不会被立即清除，而是等待垃圾回收。

3、由于堆占用内存大，所以是垃圾回收的重点区域。

### 二、堆区的组成

堆区的组成分为年轻代(Young Generation)、老年代(Old Generation)，年轻代被分为伊甸区和幸存者区，幸存区又被分为Survivor 0(S0)和Survivor 1(S1)。年轻代和老年代比例为1:2，伊甸区和S0、S1比例为8:1:1,当然这个比例都是可以通过JVM参数设置，不同区域存放的对象不同:

1、伊甸区(Eden) ：存放大部分新创建对象。

2、幸存区(Survivor)：存放Minor GC 之后，Eden区和幸存区(Survivor)本身没有被回收的对象。

3、老年代：存放Minor GC之后且年龄计数器达到15依然存活的对象、Major GC和Full GC之后仍然存活的对象。

### 三、堆空间的大小设置

#### 1、-Xms、-Xmx和-Xmn

Java堆的内存大小是可修改的，默认情况下，初始堆内存为物理内存的1/64，最大为物理内存的1/4。

- -Xms:设置初始堆内存，如-Xms64m
- -Xmx: 设置最大堆内存，如-Xmx64m
- —Xmn: 设置年轻代内存，如-Xmx32m

#### 2、各内存区域比例

年轻代与老年代默认为1:2，可通过-XX:NewRatio参数修改，如-XX:NewRatio=4，即为1:4

伊甸区和S0、S1区默认为8:1:1，可通过-XX:SurvivorRatio参数修改，如-XX:SurvivorRatio=6，通过监测发现设置，以后并不是6:1:1，这是因为Java堆的内存分配策略，关闭内存分配策略，-XX:-UseAdaptiveSizePolicy

#### 3、内存溢出

当JVM无法申请到足够内存给堆空间或者没有足够的空间存储当前堆中的对象，就会出现java.lang.OutOfMemoryError。

### 四、代码验证堆空间大小分布

```java
public class HeapPartDemo {
    public static void main(String[] args) throws InterruptedException {
        // runtime对象相当于JVM实例中的运行时数据区
        Runtime runtime = Runtime.getRuntime();
        // JVM实例当前堆空间
        long curHeapSize = runtime.totalMemory();
        // JVM的堆空间剩余可用内存
        long useHeapSize = runtime.freeMemory();
        // JVM实例能够从操作系统获取到的最大内存
        long maxHeadSize = runtime.maxMemory();
        System.out.println(String.format("当前堆空间内存：%s M", (curHeapSize / 1024.0 / 1024.0)));
        System.out.println(String.format("剩余可用空间内存：%s M", (useHeapSize / 1024.0 / 1024.0)));
        System.out.println(String.format("最大堆空间内存：%s M", (maxHeadSize / 1024.0 / 1024.0)));
    }
}
```

如上代码，Runtime类相当于运行时数据区的实例，该类无法通过应用程序创建，只能由JVM启动时创建，通过getRuntime()方法可以获取到实例。

- runtime.totalMemory(): 获取当前堆空间内存。
- runtime.freeMemory(): 获取剩余可用堆空间内存。
- runtime.maxMemory(): 获取能够从操作系统分配给JVM的最大堆空间大小。

#### 1、验证默认情况堆空间

不设置任何JVM参数，操作系统内存16G，所以理论结果应该是堆初始化256m，最大堆应该为4096m。执行结果如下，剩余可用堆空间 + 当前堆空间 = 初始化的堆空间，由此可见，即使我们只写了短短几行代码，但是JVM初始化时却从系统获取了238M + 235.5M的空间。而计算出的最大堆却小于4096m，这是因为系统的一部分内存开销给予本身运行，所以可分配的并不足16G，随之JVM得到也会更少。

```java
当前堆空间内存：238.0 M
剩余可用空间内存：235.49996185302734 M
最大堆空间内存：3509.5 M
```

#### 2、验证年轻代和老年代比例

设置-Xms128m,-Xmx128m,-XX:+PrintGCDetails(打印GC日志)默认情况，年轻代与老年代为1:2，伊甸区和Survivor区比例为8:1:1，在执行之后，设置的128m并没有操作系统相关的开销，**为什么当前堆和最大堆大小依然没有128m呢，这是因为S0和S1始终有一块的是空的，totalMemory()计算只算了其中一块Survivor区，通过GC日志eden + from + to + ParOldGen=33280K + 5120K + 5120K + 87552K = 128M, 除去to区5120K就是123M，年轻代：老年代 = PSYoungGen:ParOldGen = 38400K:87552K ≈ 0.5，eden:from:to = 33280K:5120K:5120K=6.5:1:1，这里不是8:1:1的原因是因为JVM堆自带分配策略优化，可通过-XX:-UseAdaptiveSizePolicy关闭**。

```java
当前堆空间内存：123.0 M
剩余可用空间内存：121.0395278930664 M
最大堆空间内存：123.0 M
Heap
 PSYoungGen      total 38400K, used 4005K [0x00000000fd580000, 0x0000000100000000, 0x0000000100000000)
  eden space 33280K, 12% used [0x00000000fd580000,0x00000000fd969620,0x00000000ff600000)
  from space 5120K, 0% used [0x00000000ffb00000,0x00000000ffb00000,0x0000000100000000)
  to   space 5120K, 0% used [0x00000000ff600000,0x00000000ff600000,0x00000000ffb00000)
 ParOldGen       total 87552K, used 0K [0x00000000f8000000, 0x00000000fd580000, 0x00000000fd580000)
  object space 87552K, 0% used [0x00000000f8000000,0x00000000f8000000,0x00000000fd580000)
 Metaspace       used 3806K, capacity 4610K, committed 4864K, reserved 1056768K
  class space    used 422K, capacity 430K, committed 512K, reserved 1048576K
```

#### 3、验证内存溢出

设置-Xmx128m -XX:+PrintGCDetails(打印GC日志),执行如下程序，创建一个128M数组，该数组既无法在eden区存放，也无法在老年代存放，同时，也会触发一次Full GC，Full GC之后，依然无法存放，抛出OMM异常。

```java
public class HeapSetDemo {
    public static void main(String[] args) {
        byte[] b = new byte[1024 * 1024 * 128];
    }
}
```

```java
[GC (Allocation Failure) [PSYoungGen: 2007K->856K(38400K)] 2007K->864K(125952K), 0.0007477 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
[GC (Allocation Failure) [PSYoungGen: 856K->808K(38400K)] 864K->816K(125952K), 0.0005979 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
[Full GC (Allocation Failure) [PSYoungGen: 808K->0K(38400K)] [ParOldGen: 8K->611K(87552K)] 816K->611K(125952K), [Metaspace: 3210K->3210K(1056768K)], 0.0040897 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
[GC (Allocation Failure) [PSYoungGen: 0K->0K(38400K)] 611K->611K(125952K), 0.0002508 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
[Full GC (Allocation Failure) [PSYoungGen: 0K->0K(38400K)] [ParOldGen: 611K->593K(87552K)] 611K->593K(125952K), [Metaspace: 3210K->3210K(1056768K)], 0.0042290 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
Exception in thread "main" java.lang.OutOfMemoryError: Java heap space
    at heap.HeapSetDemo.main(HeapSetDemo.java:13)
```
