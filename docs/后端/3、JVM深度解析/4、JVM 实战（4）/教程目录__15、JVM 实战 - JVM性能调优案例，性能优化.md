# 15、JVM 实战 - JVM性能调优案例，性能优化
- 来源：https://ddkk.com/zhuanlan/java/jvm/4/15.html
- 分类：JVM 实战
- 分组：教程目录
### 1、为什么要调优？

- 防止出现OOM，进行JVM规划和预调优
- 解决程序运行中各种OOM
- 减少Full GC出现的频率，解决运行慢、卡顿问题

### 2、调优的大方向

- 合理地编写代码
- 充分并合理的使用硬件资源
- 合理地进行JVM调优

### 3、调优监控的依据

- 运行日志异常堆栈
- GC日志
- 线程快照
- 堆转储快照

### 4、性能优化的步骤

第1步：熟悉业务场景

第2步（发现问题)：性能监控

- GC频繁
- cpu lgad过高
- OOM
- 内存泄漏死锁
- 程序响应时间较长

第3步（排查问题)：性能分析

- 打印GC日志，通过GCviewer或者http://gceasy.io来分析日志信息
- 灵活运用命令行工具，jstack, jmap， jinfo等
- dump出堆文件，使用内存分析工具分析文件
- 使用阿里Arthas，或jconsole，JVisualVM来实时查看JVM
- jstack查看堆栈信息

第4步（解决问题）：性能调优

- 适当增加内存，根据业务背景选择垃圾回收器
- 优化代码，控制内存使用
- 增加机器，分散节点压力
- 合理设置线程池线程数量
- 使用中间件提高程序效率，比如缓存，消息队列等其他.......

## 一、调整堆大小提高服务的吞吐量

## 二、JVM优化之JIT优化

即时编译对代码的优化

### 1、逃逸分析

- 如何将堆上的对象分配到栈，需要使用逃逸分析手段。
- 逃逸分析(Escape Analysis)是目前Java虚拟机中比较前沿的优化技术。这是一种可以有效减少Java程序中同步负载和内存堆分配压力的跨函数全局数据流分析算法。
- 通过逃逸分析，Java Hotspot编译器能够分析出一个新的对象的引用的使用范围，从而决定是否要将这个对象分配到堆上。
- 逃逸分析的基本行为就是分析对象动态作用域：
- 当一个对象在方法中被定义后，对象只在方法内部使用，则认为没有发生逃逸。
- 当一个对象在方法中被定义后，它被外部方法所引用，则认为发生逃逸。例如作为调用参数传递到其他地方中。
- 没有发生逃逸的对象，则可以分配到栈上，随着方法执行的结束，栈空间就被移除。
- 逃逸分析包括：
- 全局变量赋值逃逸
- 方法返回值逃逸
- 实例引用发生逃逸
- 线程逃逸：赋值给类变量或可以在其他线程中访问的实例变量

如何快速的判断是否发生了逃逸分析，大家就看new的对象实体是否有可能在方法外被调用。

### 2、代码优化一：栈上分配

使用逃逸分析，编译器可以对代码做如下优化：

- 栈上分配。将堆分配转化为栈分配。如果经过逃逸分析后发现，一个对象并没有逃逸出方法的话，那么就可能被优化成栈上分配。这样就无需在堆上分配内存，也无须进行垃圾回收了。可以减少垃圾回收时间和次数。
- JIT编译器在编译期间根据逃逸分析的结果，发现如果一个对象并没有逃逸出方法的话，就可能被优化成栈上分配。分配完成后，继续在调用栈内执行，最后线程结束，栈空间被回收，局部变量对象也被回收。这样就无须进行垃圾回收了。

### 3、代码优化二：同步省略(消除)

同步省略。如果一个对象被发现只能从一个线程被访问到，那么对于这个对象的操作可以不考虑同步：

- 线程同步的代价是相当高的，同步的后果是降低并发性和性能。
- 在动态编译同步块的时候，JIT编译器可以借助逃逸分析来判断同步块所使用的锁对象是否只能够被一个线程访问而没有被发布到其他线程。如果没有，那么JIT编译器在编译这个同步块的时候就会取消对这部分代码的同步。这样就能大大提高并发性和性能。这个取消同步的过程就叫同步省略，也叫锁消除。

demo：

```java
public class SynchronizedTest {
    public void f() {
        Object hollis = new Object();
        // 代码中对hollis这个对象进行加锁，但是hollis对象的生命周期只在f()方法中，并不会被其他线程所访问到，所以在JIT编译阶段就会被优化掉。
        synchronized (hollis) {
            System.out.println(hollis);
        }
        /*
        JIT优化后:
        Object hollis = new Object();
         System.out.println(hollis);
         */
    }
}
```

### 4、代码优化三：标量替换

- 标量(Scalar）是指一个无法再分解成更小的数据的数据。Java中的原始数据类型就是标量。
- 相对的，那些还可以分解的数据叫做聚合量（Aggregate) , Java中的对象就是聚合量，因为他可以分解成其他聚合量和标量。
- 在JIT阶段，如果经过逃逸分析，发现一个对象不会被外界访问的话，那么经过JIT优化，就会把这个对象拆解成若干个其中包含的若干个成员变量来代替。这个过程就是标量替换。

**参数配置**：-XX:+EliminateAllocations，开启标量替换(默认打开)，允许将对象打散分配在栈上。

**demo**：

```java
public class MyTestDemo {
    public static void main(String[] args) {
        alloc();
    }
    private static void alloc() {
        Point point = new Point(1, 2);
        System.out.println("point.x=" + point.x + "; point.y=" + point.y);
    }
    static class Point {
        private int x;
        private int y;
        public Point(int x, int y) {
            this.x = x;
            this.y = y;
        }
    }
    //alloc方法经过标量替换后，就会变成:
    private static void alloc1() {
        int x = 1;
        int y = 2;
        System.out.println("point.x=" + x + "; point.y=" + y);
    }
} 
```

### 5、逃逸分析小结

- 逃逸分析无法保证非逃逸分析的性能消耗一定能高于他的消耗。虽然经过逃逸分析可以做标量替换、栈上分配、和锁消除。但是逃逸分析自身也是需要进行一系列复杂的分析的，这其实也是一个相对耗时的过程。
- 一个极端的例子，就是经过逃逸分析之后，发现没有一个对象是不逃逸的。那这个逃逸分析的过程就白白浪费掉了。
- 虽然这项技术并不十分成熟，但是它也是即时编译器优化技术中一个十分重要的手段。
- 注意到有一些观点，认为通过逃逸分析，JVM会在栈上分配那些不会逃逸的对象，这在理论上是可行的，但是取决于JVM设计者的选择。
- 目前很多书籍还是基于JDK 7以前的版本，JDK已经发生了很大变化， intern字符串的缓存和静态变量曾经都被分配在永久代上，而永久代已经被元数据区取代。但是，intern字符串缓存和静态变量并不是被转移到元数据区，而是直接在堆上分配，所以这一点同样符合前面一点的结论：对象实例都是分配在堆上。
- JVM默认开启逃逸分析，只要开启逃逸分析，没发生逃逸，就会栈上分配

## 三、合理配置堆内存

### 1、推荐配置

- Java整个堆大小设置，Xmx 和 Xms设置为老年代存活对象的3-4倍，即FullGC之后的老年代内存占用的3-4倍
- 永久代（jdk8为元数据MetaSpace）PermSize和MaxPermSize设置为FullGC之后老年代存活对象的1.2-1.5倍
- 年轻代Xmn的设置为FullGC之后老年代存活对象的1-1.5倍。
- 老年代的内存大小设置为FullGC之后老年代存活对象的2-3倍。

### 2、如何计算老年代存活对象

方式一（推荐）：查看日志

开启GC日志打印，例配置jvm参数 -XX:+PrintGC 观察多次Full GC后老年代存活对象的大小取平均值为准

方式二（影响线上服务，慎用）：强制触发FullGC

方式1的方式比较可行，但需要更改JVM参数，并分析日志。同时，在使用CMS回收器的时候，有可能不能触发FullGC（只发生CMS GC），所以日志中并没有记录FullGC的日志。在分析的时候就比较难处理。所以，有时候需要强制触发一次FullGC，来观察FullGC之后的老年代存活对象大小。

BTW：使用jstat -gcutil工具来看FullGC的时候， CMS GC是会造成2次的FullGC次数增加。

注：强制触发FullGC，会造成线上服务停顿(STW）。建议的操作方式为，在强制FullCC前先把服务节点摘除，FullGC之后再将服务挂回可用节点，对外提供服务，在不同时间段触发FullGC，根据多次FullGC之后的老年代内存情况来预估FullGC之后的老年代存活对象大小。

### 3、如何强制触发Full GC?

**1、** jmap-dump:live,format=b,file=heap.bin将当前的存活对象dump到文件，此时会触发FullGC；

**2、** jmap-histo:live打印每个class的实例数目,内存占用,类全名信息..live子参数加上后，只统计活的对象数量，此时会触发FullGCI；

**3、** 在性能测试环境，可以通过Java监控工具来触发FullGC，比如使用VisualVM和JConsole，VisualVM集成了JConsole，VisualVM或者JConsole上面有一个触发GC的按钮；

### 4、案例演示

通过idea启动springboot工程，我们将内存初始化为1024M，分析GC日志

- -XX:+PrintGCDetails -XX:MetaspaceSize=64m -Xss512K
- -XX:+HeapDumpOnOutOfMemoryError
- -XX:HeapDumpPath=heap/heapdump3.hprof -XX:SurvivorRatio=8
- -XX:+PrintGCDateStamps -Xms1024M -Xmx1024M
- -Xloggc:log/gc-oom3.log

### 5、估算GC频率

正常情况我们应该根据我们的系统来进行一个内存的估算，这个我们可以在测试环境进行测试，最开始可以将内存设置的大一些，比如4G这样，当然这也可以根据业务系统估算来的。

比如从数据库获取一条数据占用128个字节，需要获取1000条数据，那么一次读取到内存的大小就是(（128 B/1024 Kb/1024M)* 1000 = 0.122M，那么我们程序可能需要并发读取，比如每秒读取100次，那么内存占用就是0.122*100 = 12.2M，如果堆内存设置1个G，那么年轻代大小大约就是333M，那么333M*80% / 12.2M =21.84s ，也就是说我们的程序几乎每分钟进行两到三次youngGC。这样可以让我们对系统有一个大致的估算。

## 四、CPU占用很高排查方案

### 问题分析

**1、** psaux|grepjava查看到当前java进程使用cpu、内存、磁盘的情况获取使用量异常的进程；

**2、** top-Hp进程pid检查当前使用异常线程的pid；

**3、** 线程pid变为16进制如31695-》7bcf然后得到0x7bcf6、jstack进程的pid|grep-A20Ox7bcf得到相关进程的代码；

## 五、G1并发执行的线程数对性能的影响

### 参数配置

export CATALINA_OPTS="$CATALINA_OPTS -XX :+UseG1GC"

export CATALINA_OPTS="$CATALINA_OPTS -Xms30m"

export CATALINA_OPTS="$CATALINA_OPTS -Xmx30m"

export CATALINA_OPTS="$CATALINA_OPTS -XX :+PrintGCDetails"

export CATALINA_OPTS="$CATALINA_OPTS -XX:MetaspaceSize=64m"

export CATALINA_OPTS="$CATALINA_OPTS -XX:+PrintGCDateStamps"

export CATALINA_OPTS="$CATALINA_OPTS -Xloggc:/opt/tomcat8.5/logs/gc.log"

export CATALINA_OPTS="$CATALINA_OPTS -XX:ConcGCThreads=1"

说明:最后一个参数可以在使用G1GC测试初始并发GCThreads之后再加上。

初始化内存和最大内存调整小一些，目的发生 FullGC，关注GC时间

关注点是：GC次数，GC时间，以及 Jmeter的平均响应时间

增加线程配置:

export CATALINA_OPTS="$CATALINA_OPTS -XX:ConcGCThreads=2"，可以提高系统的吞吐量

## 六、调整垃圾回收器提高服务的吞吐量

### 初始配置

系统配置是单核，我们看到日志，显示DefNew，说明我们用的是串行收集器，SerialGC

### 优化1

那么就考虑切换一下并行收集器是否可以提高性能，增加配置如下：

export CATALINA_OPTS="$CATALINA_OPTS -Xms60m"

export CATALINA_OPTS="$CATALINA_OPTS -Xmx60m"

export CATALINA_OPTS="$CATALINA_OPTS -xX:+UseParallelGC"

export CATALINA_OPTS="$CATALINA_OPTS -xx:+PrintGCDetails"

export CATALINA_OPTS="$CATALINA_OPTS -XX:MetaspaceSize=64m"

export CATALINA_OPTS="$CATALINA_OPTS -XX :+PrintGCDateStamps"

export CATALINA_OPTS="$CATALINA_OPTS -Xloggc :/opt/tomcat8.5/logs/gc6.log"

查看吞吐量，发现并没有明显变化，我们究其原因，本身UseParallelGC是并行收集器，但是我们的服务器是单核。

### 优化2

系统配置改为8核，并使用优化1的参数配置，发现吞吐量大幅提升，说明我们在多核机器上面采用并行收集器对于系统的吞吐量有一个显著的效果。

### 优化3

8核+G1垃圾收集器

export CATALINA_OPTS="$CATALINA_OPTS -XX:+UseG1GC"

export CATALINA_OPTS="$CATALINA_OPTS -Xms60m"

export CATALINA_OPTS="$CATALINA_OPTS -Xmx60m"

export CATALINA_OPTS="$CATALINA_OPTS -XX:+PrintGCDetails"

export CATALINA_OPTS="$CATALINA_OPTS -XX:MetaspaceSize=64m"

export CATALINA_OPTS="$CATALINA_OPTS -XX:+PrintGCDateStamps"

export CATALINA_OPTS="$CATALINA_OPTS -Xloggc:/opt/tomcat8.5/logs/gc6.log"

相对ParallelGC，使用G1吞吐量大幅提升

## 七、日均百万级订单交易系统如何设置JVM参数

## 八、问题一：系统卡顿、响应慢

有一个50万PV的资料类网站（从磁盘提取文档到内存）原服务器是32位的，1.5G的堆，用户反馈网站比较缓慢。因此公司决定升级，新的服务器为64位，16G的堆内存，结果用户反馈卡顿十分严重，反而比以前效率更低了。

### 1．为什么原网站慢？

频繁的GC，STW时间比较长，响应时间慢

### 2．为什么会更卡顿？

内存空间越大，FGC时间更长，延迟时间更长

### 3．咋办？

- 垃圾回收器：parallel GC；ParNew + CMS；G1
- 配置GC参数：-XX:MaxGCPauseMillis 、-XX:ConcGCThreads
- 根据log日志、dump文件分析，优化内存空间的比例
- jstat jinfo jItack jmap

## 九、问题二：系统内存飙高，如何查找问题？

一方面：jmap -heap . jstat . ...; gc日志情况

另一方面：dump文件分析

## 十、问题三：如何监控JVM？

jps，查看正在运行的Java进程

jstat，查看JVM统计信息

jinfo，实时查看和修改JVM配置参数

jmap，导出内存映像文件&内存使用情况

jhat，JDK自带堆分析工具

jstack，打印JVM中线程快照

jcmd，多功能命令行

jstatd，远程主机信息收集
