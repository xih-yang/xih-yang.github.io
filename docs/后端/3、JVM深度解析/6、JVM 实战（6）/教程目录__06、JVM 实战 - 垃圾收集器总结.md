# 06、JVM 实战 - 垃圾收集器总结
- 来源：https://ddkk.com/zhuanlan/java/jvm/6/6.html
- 分类：JVM 实战
- 分组：教程目录
**1、** 垃圾收集器的组合；

JAVA垃圾收集器一共有7个，减去还没有正式大规模使用的G1，还有6个，其中新生代3个，老生代3个。

因为垃圾收集器都是一组一组的工作，这6个收集器一共构成了5中使用模式。

参数

描述

-XX:+UseSerialGC

Jvm运行在Client模式下的默认值，打开此开关后，使用Serial + Serial Old的收集器组合进行内存回收

-XX:+UseParNewGC

打开此开关后，使用ParNew + Serial Old的收集器进行垃圾回收

-XX:+UseConcMarkSweepGC

使用ParNew + CMS +  Serial Old的收集器组合进行内存回收，Serial Old作为CMS出现“Concurrent Mode Failure”失败后的后备收集器使用。

-XX:+UseParallelGC

Jvm运行在Server模式下的默认值，打开此开关后，使用Parallel Scavenge +  Serial Old的收集器组合进行回收

-XX:+UseParallelOldGC

使用Parallel Scavenge +  Parallel Old的收集器组合进行回收

**2、** 垃圾收集器组合关系图例；

常用的6个垃圾收集器，由这五个方法进行调度和使用。

**3、** 部分JVM参数；

一些其他的JAVA虚拟机的参数，以便需要的时候查阅。

-XX:SurvivorRatio

新生代中Eden区域与Survivor区域的容量比值，默认为8，代表Eden:Subrvivor = 8:1

-XX:PretenureSizeThreshold

直接晋升到老年代对象的大小，设置这个参数后，大于这个参数的对象将直接在老年代分配

-XX:MaxTenuringThreshold

晋升到老年代的对象年龄，每次Minor GC之后，年龄就加1，当超过这个参数的值时进入老年代

-XX:UseAdaptiveSizePolicy

动态调整java堆中各个区域的大小以及进入老年代的年龄

-XX:+HandlePromotionFailure

是否允许新生代收集担保，进行一次minor gc后, 另一块Survivor空间不足时，将直接会在老年代中保留

-XX:ParallelGCThreads

设置并行GC进行内存回收的线程数

-XX:GCTimeRatio

GC时间占总时间的比列，默认值为99，即允许1%的GC时间，仅在使用Parallel Scavenge 收集器时有效

-XX:MaxGCPauseMillis

设置GC的最大停顿时间，在Parallel Scavenge 收集器下有效

-XX:CMSInitiatingOccupancyFraction

设置CMS收集器在老年代空间被使用多少后出发垃圾收集，默认值为68%，仅在CMS收集器时有效，-XX:CMSInitiatingOccupancyFraction=70

-XX:+UseCMSCompactAtFullCollection

由于CMS收集器会产生碎片，此参数设置在垃圾收集器后是否需要一次内存碎片整理过程，仅在CMS收集器时有效

-XX:+CMSFullGCBeforeCompaction

设置CMS收集器在进行若干次垃圾收集后再进行一次内存碎片整理过程，通常与UseCMSCompactAtFullCollection参数一起使用

-XX:+UseFastAccessorMethods

原始类型优化

-XX:+DisableExplicitGC

是否关闭手动System.gc

-XX:+CMSParallelRemarkEnabled

降低标记停顿

-XX:LargePageSizeInBytes

内存页的大小不可设置过大，会影响Perm的大小，-XX:LargePageSizeInBytes=128m

**4、** JDKGC组合方式的一些特性；

新生代GC方式

老年代和持久代GC方式

-XX:+UseSerialGC

Serial 串行GC

Serial Old 串行GC

-XX:+UseParallelGC

Parallel Scavenge  并行回收GC

Serial Old 串行GC

-XX:+UseConcMarkSweepGC

ParNew 并行GC

CMS 并发GC
当出现“Concurrent Mode Failure”时
采用Serial Old 串行GC

-XX:+UseParNewGC

ParNew 并行GC

Serial Old 串行GC

-XX:+UseParallelOldGC

Parallel Scavenge  并行回收GC

Parallel Old 并行GC

-XX:+UseConcMarkSweepGC
-XX:+UseParNewGC

Serial 串行GC

CMS 并发GC
当出现“Concurrent Mode Failure”时
采用Serial Old 串行GC
