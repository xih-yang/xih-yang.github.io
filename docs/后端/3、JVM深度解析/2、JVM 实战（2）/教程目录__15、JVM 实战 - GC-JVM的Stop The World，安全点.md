# 15、JVM 实战 - GC-JVM的Stop The World，安全点
- 来源：https://ddkk.com/zhuanlan/java/jvm/2/15.html
- 分类：JVM 实战
- 分组：教程目录
## 一、概述

可达性性分析中从GC Roots节点找引用链这个操作，可作为GC Roots的节点主要在全局性的引用（如常量或类静态属性）与执行上下文（如栈帧中的本地变量表）中，现在很多应用仅仅方法区就有数百兆，如果要逐个检查这里面的引用，那么必然会消耗很多时间。

另外，可达性分析对执行事件的敏感还体现在GC停顿上，因为这项分析工作必须在一个能确保一致性的快照中进行。一致性是指整个分析期间整个执行系统看起来就像被冻结在某个时间点上，不可以出现在分析过程中对象引用关系还在不断变化的情况。该点不满足的话分析结果准确性就无法得到保证。这点是导致GC进行时必须停顿所有java线程的其中一个重要原因（Sun称之为Stop-The-World），即使是在号称（几乎）不会发生停顿的CMS收集器中，枚举跟节点时也是必须要停顿的。

在主流的JVM使用的是准确式GC，所以当执行系统停顿下来后，并不需要一个不漏地检查所有执行上下文和全局的引用位置，虚拟机应当是有办法直接得知哪些地方存放着对象引用。

在HotSpot实现中，是使用一组称为OopMapde 的数据结构来达到这个目的，在类加载完的时候，HotSpot就把对象内什么偏移量上是什么类型的数据计算出来，在JIT编译过程中，也会在特定位置记录下栈和寄存器中哪些位置是引用。这样，GC扫码时就可以直接指导这些信息。

## 1.1、安全点

安全点的选定基本上是以程序”是否具有让程序长时间执行的特征“为标准进行选定的。长时间执行，明显的特征就是指令序列复用，如方法调用，循环跳转，异常跳转等，所以具有这些功能的指令才会产生Safepoint。

对于安全点，如何在GC发生时让所有线程（不包括JNI调用的线程）都跑到最近的安全点上在停顿下来。两种方案：强先式中断和主动式中断。

强先式中断，不需要线程的执行代码主动去配合，在GC发生时，首先把所有线程全部中断，如果发现有线程中断的地方不在安全点上，就恢复线程，让他跑到安全点。现代JVM，几乎不使用

主动式中断，需要中断线程的时候，不直接对线程操作，仅仅简单地设置一个标志，各个线程执行时主动去轮询这个标志，发现中断标志为真时就自己中断挂起。轮询标志的地方和安全点是重合的，另外再加上创建对象需要分配的内存的地方。

## 1.2、安全区域

Safepoint机制保证了程序执行时，在不太长的时间内就会遇到可进入GC的Safepoint。但是程序“不执行”的时候呢？没有分配时间片，如线程Sleep或Blocked状态，这时线程无法想用JVM的中断请求，也无法去中断，这时需要安全区域（Safe Region）来解决。

安全区域是指在一段代码片段中，引用关系不会发生变化。在这个区域中的任意地方开始GC都是安全的，扩展了的Safepoint。

## 1.3、java对象内存申请过程

[007-对象内存分配与回收,垃圾收集过程](/zhuanlan/java/jvm/2/7.html)，简单叙述如下：

1.JVM会试图为相关Java对象在Eden中初始化一块内存区域；当Eden空间足够时，内存申请结束。否则到下一步；

2.JVM试图释放在Eden中所有不活跃的对象（minor collection），释放后若Eden空间仍然不足以放入新对象，则试图将部分Eden中活跃对象放入Survivor区；

3.Survivor区被用来作为Eden及old的中间交换区域，当old区空间足够时，Survivor区的对象会被移到Old区，否则会被保留在Survivor区；

4.当old区空间不够时，JVM会在old区进行major collection；

5.垃圾收集后，若Survivor及old区仍然无法存放从Eden复制过来的部分对象，导致JVM无法在Eden区为新对象创建内存区域，则出现"Out of memory错误"；

## 1.4、STP（Stop-The-World）诱因

在新生代进行的GC叫做minor GC，在老年代进行的GC都叫major GC，Full GC同时作用于新生代和老年代。在垃圾回收过程中经常涉及到对对象的挪动（比如上文提到的对象在Survivor 0和Survivor 1之间的复制），进而导致需要对对象引用进行更新。为了保证引用更新的正确性，Java将暂停所有其他的线程，这种情况被称为“Stop-The-World”，导致系统全局停顿。Stop-The-World对系统性能存在影响，因此垃圾回收的一个原则是尽量减少“Stop-The-World”的时间。

不同垃圾收集器的Stop-The-World情况，Serial、Parallel和CMS收集器均存在不同程度的Stop-The-Word情况；而即便是最新的G1收集器也不例外。

Java中一种全局暂停的现象,jvm挂起状态

全局停顿，所有Java代码停止，native代码可以执行，但不能和JVM交互

**多半由于jvm的GC引起，如**：

**1、** 老年代空间不足；

**2、** 永生代（jkd7）或者元数据空间（jkd8）不足；

**3、** System.gc()方法调用；

**4、** CMSGC时出现promotionfailed和concurrentmodefailure；

**5、** YoungGC时晋升老年代的内存平均值大于老年代剩余空间；

**6、** 有连续的大对象需要分配；

**除了GC还有以下原因**：

**1、** Dump线程--人为因素；

**2、** 死锁检查；

**3、** 堆Dump--人为因素；

Full GC 是清理整个堆空间—包括年轻代和老年代。

**其他**

**1、** Biased lock revocation 取消偏向锁

**2、** Class redefinition (e.g. javaagent，AOP的代码植入)

**3、** Various debug operation (e.g. thread dump 一条或所有线程，heapduump等)

打开JDK8源码的vm_operations.hpp，有大概完整58项列表。

## 1.5、STP（Stop-The-World）四个阶段

根据-XX:+PrintSafepointStatistics –XX:PrintSafepointStatisticsCount=1 参数虚拟机打印的日志文件可以看出，safepoint的执行一共可以分为四个阶段：

Spin阶段。因为jvm在决定进入全局safepoint的时候，有的线程在安全点上，而有的线程不在安全点上，这个阶段是等待未在安全点上的用户线程进入安全点。

Block阶段。即使进入safepoint，用户线程这时候仍然是running状态，保证用户不在继续执行，需要将用户线程阻塞。http://blog.csdn.net/iter_zc/article/details/41892567这篇bog详细说明了如何将用户线程阻塞。

Cleanup。这个阶段是JVM做的一些内部的清理工作。

VM Operation. JVM执行的一些全局性工作，例如GC,代码反优化。

常用JVM参数：

-XX:+PrintGCApplicationStoppedTime：JVM的停顿时间（不只是GC），打印在GC日志里。

-XX:+PrintSafepointStatistics -XX:PrintSafepointStatisticsCount=1这两个参数用于记录STW发生的原因、线程情况、STW各个阶段的停顿时间等。当添加这两个参数后，程序运行期间会打印如下内容

如：

```java
Total time for which application threads were stopped: 0.0053256 seconds, Stopping threads took: 0.0000221 seconds
time:14464
[GC (Allocation Failure) [DefNew: 959K->64K(960K), 0.0045369 secs] 523263K->523259K(524224K), 0.0045726 secs] [Times: user=0.01 sys=0.00, real=0.00 secs] 
         vmop                    [threads: total initially_running wait_to_block]    [time: spin block sync cleanup vmop] page_trap_count
14.610: GenCollectForAllocation          [      13          0              0    ]      [     0     0     0     0     4    ]  0   
Total time for which application threads were stopped: 0.0047146 seconds, Stopping threads took: 0.0000224 seconds
[GC (Allocation Failure) [DefNew: 960K->960K(960K), 0.0000229 secs][Tenured: 523195K->523263K(523264K), 0.4558175 secs] 524155K->524154K(524224K), [Metaspace: 3842K->3842K(1056768K)], 0.4559020 secs] [Times: user=0.45 sys=0.00, real=0.46 secs] 
         vmop                    [threads: total initially_running wait_to_block]    [time: spin block sync cleanup vmop] page_trap_count
14.636: GenCollectForAllocation          [      13          0              0    ]      [     0     0     0     0   455    ]  0   
Total time for which application threads were stopped: 0.4560633 seconds, Stopping threads took: 0.0000231 seconds
time:14962
[Full GC (Allocation Failure) [Tenured: 523263K->523263K(523264K), 0.4344774 secs] 524223K->524221K(524224K), [Metaspace: 3842K->3842K(1056768K)], 0.4345167 secs] [Times: user=0.43 sys=0.01, real=0.43 secs] 
         vmop                    [threads: total initially_running wait_to_block]    [time: spin block sync cleanup vmop] page_trap_count
15.094: GenCollectForAllocation          [      13          0              0    ]      [     0     0     0     0   434    ]  0   
Total time for which application threads were stopped: 0.4346385 seconds, Stopping threads took: 0.0000174 seconds
[Full GC (Allocation Failure) [Tenured: 523263K->523263K(523264K), 0.4154644 secs] 524223K->524223K(524224K), [Metaspace: 3842K->3842K(1056768K)], 0.4154981 secs] [Times: user=0.41 sys=0.00, real=0.42 secs] 
[Full GC (Allocation Failure) [Tenured: 523263K->515874K(523264K), 0.4559588 secs] 524223K->515874K(524224K), [Metaspace: 3842K->3842K(1056768K)], 0.4559872 secs] [Times: user=0.46 sys=0.00, real=0.46 secs] 
         vmop                    [threads: total initially_running wait_to_block]    [time: spin block sync cleanup vmop] page_trap_count
15.529: GenCollectForAllocation          [      13          0              0    ]      [     0     0     0     0   871    ]  0   
Total time for which application threads were stopped: 0.8716535 seconds, Stopping threads took: 0.0000320 seconds
time:15398
```

详细说明：

```java
         vmop                    [threads: total initially_running wait_to_block]    [time: spin block sync cleanup vmop] page_trap_count
14.610: GenCollectForAllocation          [      13          0              0    ]      [     0     0     0     0     4    ]  0   
```

第一段是时间戳，VM Operation的类型，以及线程概况

- total: 所有的java线程数

initially_running: 号召进入安全点时，还是Running状态的线程数
wait_to_block: 所有线程都不Running时，仍不是Block状态的线程数

第二段是到达安全点的各个阶段以及执行操作所花的时间，其中最重要的是vmop

- spin: VMOP线程使用自旋，等待所有线程都不是Running的时间

block: VMOP线程基于锁，等待所有线程都是Block的时间
sync: spin+block +其他，这是从开始到进入安全点的总耗时
cleanup: 退出清理所用时间
vmop: 真正执行VM Operation的时间

## 二、监控点应用

如果能在监控系统上显示JVM进入安全点的次数和时间，那我们排查服务超时时就可以第一时间先上监控系统观察下当时JVM停顿时间的情况。

## 2.1、在应用里往外吐信息

hotspot 里提供里一个API，但是没挂到JMX上，所以只适合由泡在应用里的代码往外吐。

```java
import sun.management.HotspotRuntimeMBean;
import sun.management.ManagementFactoryHelper;
public class StopTheWorldSout {
    private static HotspotRuntimeMBean mbean = (HotspotRuntimeMBean) ManagementFactoryHelper.getHotspotRuntimeMBean();
    public static void main(String[] args) {
        long count = mbean.getSafepointCount();
        long time = mbean.getTotalSafepointTime();
        long syncTime = mbean.getSafepointSyncTime();
    }
}
```

## 三、示例

- -Xmn1m代表年轻代几乎没有空间。对象都到老年代了。
- 类PrintThread是打印线程，每100毫秒打印一次，如果应用线程暂停了，那么会延迟。
- 类MyThread是消耗jvm内存的线程，每到450M，会让对象失去引用。

代码

```java
/**
 * 启动参数：-Xmx512m -Xms512m -XX:+UseSerialGC -XX:+PrintGCDetails -Xmn1m
 * <p>
 * -XX:+UseSerialGC:新生代和老年代都用单线程的串行回收器。适合单核并发能力差得处理器。
 * -XX:+UseParNewGC:新生代用并行的ParNew回收期，老年代都用单线程的串行回收器。适合多核，并发能力强的处理器。
 * -XX:+UseParallelGC:新生代使用ParallelGC回收器，老年代使用串行回收器。
 * -XX:+UseParallelOldGC:新生代使用ParallelGC回收器，老年代使用ParallelOldGC回收器。
 * 1）--
 * -XX:+UseConclMarkSweepGC:老年代使用CMS回收器。
 **/
public class StopTheWorldTest {
    public static class MyThread extends Thread {
        HashMap<Long, byte[]> map = new HashMap<Long, byte[]>();
        @Override
        public void run() {
            try {
                while (true) {
                    if (map.size() * 512 / 1024 / 1024 >= 450) {
                        System.out.println("============准备清理==========:" + map.size());//大于450M时，清理内存。
                        map.clear();
                        System.out.println("clean map");
                    }
                    for (int i = 0; i < 100; i++) {
                        map.put(System.nanoTime(), new byte[512]);//消耗内存。
                    }
                    Thread.sleep(1);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
    public static class PrintThread extends Thread {
        public static final long starttime = System.currentTimeMillis();
        @Override
        public void run() {
            try {
                while (true) {
                    long t = System.currentTimeMillis() - starttime;
                    System.out.println("time:" + t);
                    Thread.sleep(100);
                }
            } catch (Exception e) {
            }
        }
    }
    public static void main(String[] args) {
        MyThread t = new MyThread();
        PrintThread p = new PrintThread();
        t.start();
        p.start();
    }
}
```

输出

```java
time:14548
[GC (Allocation Failure) [DefNew: 959K->64K(960K), 0.0050998 secs] 521756K->521753K(524224K), 0.0051346 secs] [Times: user=0.00 sys=0.00, real=0.01 secs] 
[GC (Allocation Failure) [DefNew: 960K->64K(960K), 0.0048306 secs] 522649K->522646K(524224K), 0.0048594 secs] [Times: user=0.01 sys=0.00, real=0.00 secs] 
[GC (Allocation Failure) [DefNew: 960K->960K(960K), 0.0000189 secs][Tenured: 522582K->523263K(523264K), 0.4516206 secs] 523542K->523538K(524224K), [Metaspace: 3838K->3838K(1056768K)], 0.4516858 secs] [Times: user=0.44 sys=0.01, real=0.46 secs] 
time:15068
[Full GC (Allocation Failure) [Tenured: 523263K->523263K(523264K), 0.4217772 secs] 524223K->524218K(524224K), [Metaspace: 3838K->3838K(1056768K)], 0.4218278 secs] [Times: user=0.42 sys=0.00, real=0.42 secs] 
time:15507[Full GC (Allocation Failure) [Tenured: 523263K->523263K(523264K), 0.4132856 secs] 524223K->524223K(524224K), [Metaspace: 3838K->3838K(1056768K)], 0.4133185 secs] [Times: user=0.41 sys=0.00, real=0.42 secs] 
[Full GC (Allocation Failure) [Tenured: 523263K->515940K(523264K), 0.4557615 secs] 524223K->515940K(524224K), [Metaspace: 3838K->3838K(1056768K)], 0.4557908 secs] [Times: user=0.45 sys=0.01, real=0.45 secs] 
[GC (Allocation Failure) [DefNew: 896K->63K(960K), 0.0027436 secs] 516836K->516802K(524224K), 0.0027752 secs] [Times: user=0.01 sys=0.00, real=0.01 secs] 
[GC (Allocation Failure) [DefNew: 959K->64K(960K), 0.0048657 secs] 517698K->517697K(524224K), 0.0049047 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
[GC (Allocation Failure) [DefNew: 960K->64K(960K), 0.0041075 secs] 518593K->518578K(524224K), 0.0041432 secs] [Times: user=0.01 sys=0.00, real=0.01 secs] 
[GC (Allocation Failure) [DefNew: 960K->63K(960K), 0.0040883 secs] 519474K->519473K(524224K), 0.0041230 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
time:16481
```

说明：

- 15.068秒前都是100ms打印一次，线程没有停顿。但是之后发生了因full gc引发零点几秒甚至将近1s的停顿。
- 因为对象的引用还在，老年代的对象不会被回收。如：

[Full GC (Allocation Failure) [Tenured: 523263K->523263K(523264K),
