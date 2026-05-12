# 06、JVM 实战 - GC-HotSpot JVM收集器
- 来源：https://ddkk.com/zhuanlan/java/jvm/2/6.html
- 分类：JVM 实战
- 分组：教程目录
## 一、概述

## 1.1、分类

上面有7种收集器，分为两块，上面为新生代收集器，下面是老年代收集器。如果两个收集器之间存在连线，就说明它们可以搭配使用。

JVM给出了3类选择：串行收集器、并行收集器、并发收集器。串行收集器只适用于小数据量的情况，所以生产环境的选择主要是并**行收集器和并发收集器**。

默认情况下JDK5.0以前都是使用串行收集器，如果想使用其他收集器需要在启动时加入相应参数。JDK5.0以后，JVM会根据当前系统配置进行智能判断。

GC主要分，新生代GC，老年代GC；

新生代GC包括：串行GC、并行GC、并行回收GC

老年代GC包括：串行GC、并行GC、CMS

整堆收集器：G1，同时支持新生代和老年代

## 1.2、GC选择

GC在选择上，主要关注两点，吞吐量优先和暂停时间优先，

对于吞吐量优先的采用server默认的并行GC(Parallel GC)方式（上图蓝色区域），

对于暂停时间优先的选用并发GC（CMS）方式（上图黄色区域），常用场景：互联网、电商类

## 1.3、常用GC开启方式

查看默认配置：

```java
$ java -XX:+PrintCommandLineFlags -version
-XX:InitialHeapSize=268435456 -XX:MaxHeapSize=4294967296 -XX:+PrintCommandLineFlags -XX:+UseCompressedClassPointers -XX:+UseCompressedOops -XX:+UseParallelGC 
```

暂停时间优先: 并行GC + CMS

开启方式[ -XX:+UseConcMarkSweepGC -XX:+UseParNewGC ]

吞吐量优先: 并行回收GC + 并行GC

开启方式 [ -XX:+UseParallelOldGC ] ，此GC也时server模式默认的配置

G1:[ -XX:+UseG1GC ]

适用于服务器端、大内存、多CPU情景的垃圾收集器；

G1的目标是在维持高效率回收的同时，提供软实时中断特性

常用场景：hadoop、elasticsearch

## 1.4、按类解说

### 串行收集器

- -XX:+UseSerialGC：设置串行收集器。

### 并行收集器（吞吐量优先）

-XX:+UseParallelGC：设置为并行收集器。此配置仅对年轻代有效。即年轻代使用并行收集，而年老代仍使用串行收集。

-XX:ParallelGCThreads=20：配置并行收集器的线程数，即：同时有多少个线程一起进行垃圾回收。此值建议配置与CPU数目相等。

-XX:+UseParallelOldGC：配置年老代垃圾收集方式为并行收集。JDK6.0开始支持对年老代并行收集。

-XX:MaxGCPauseMillis=100：设置每次年轻代垃圾回收的最长时间（单位毫秒）。如果无法满足此时间，JVM会自动调整年轻代大小，以满足此时间。

-XX:+UseAdaptiveSizePolicy：设置此选项后，并行收集器会自动调整年轻代Eden区大小和Survivor区大小的比例，以达成目标系统规定的最低响应时间或者收集频率等指标。此参数建议在使用并行收集器时，一直打开。

### 并发收集器（响应时间优先）

-XX:+UseConcMarkSweepGC：即CMS收集，设置年老代为并发收集。CMS收集是JDK1.4后期版本开始引入的新GC算法。它的主要适合场景是对响应时间的重要性需求大于对吞吐量的需求，能够承受垃圾回收线程和应用线程共享CPU资源，并且应用中存在比较多的长生命周期对象。CMS收集的目标是尽量减少应用的暂停时间，减少Full GC发生的几率，利用和应用程序线程并发的垃圾回收线程来标记清除年老代内存。

-XX:+UseParNewGC：设置年轻代为并发收集。可与CMS收集同时使用。JDK5.0以上，JVM会根据系统配置自行设置，所以无需再设置此参数。

-XX:CMSFullGCsBeforeCompaction=0：由于并发收集器不对内存空间进行压缩和整理，所以运行一段时间并行收集以后会产生内存碎片，内存使用效率降低。此参数设置运行0次Full GC后对内存空间进行压缩和整理，即每次Full GC后立刻开始压缩和整理内存。

-XX:+UseCMSCompactAtFullCollection：打开内存空间的压缩和整理，在Full GC后执行。可能会影响性能，但可以消除内存碎片。

-XX:+CMSIncrementalMode：设置为增量收集模式。一般适用于单CPU情况。

-XX:CMSInitiatingOccupancyFraction=70：表示年老代内存空间使用到70%时就开始执行CMS收集，以确保年老代有足够的空间接纳来自年轻代的对象，避免Full GC的发生。

## 1.5、按新生代，老年代6种

### 1.5.1、Serial(串行GC)收集器

Serial收集器是最基本的、发展历史最悠久的收集器。JDK1 .3之前唯一选择

**特点：**单线程、简单高效（与其他收集器的单线程相比），对于限定单个CPU的环境来说，Serial收集器由于没有线程交互的开销，专心做垃圾收集自然可以获得最高的单线程手机效率。收集器进行垃圾回收时，必须暂停其他所有的工作线程，直到它结束（Stop The World）。

**应用场景**：适用于Client模式下的虚拟机的新生代收集器。

**Serial / Serial Old收集器运行示意图**

****

### 1.5.2、ParNew(并行GC)收集器

ParNew收集器其实就是Serial收集器的多线程版本。

除了使用多线程外其余行为均和Serial收集器一模一样（参数控制、收集算法、Stop The World、对象分配规则、回收策略等）。

**特点**：多线程、ParNew收集器默认开启的收集线程数与CPU的数量相同，在CPU非常多的环境中，可以使用-XX:ParallelGCThreads参数来限制垃圾收集的线程数。

和Serial收集器一样存在Stop The World问题

**应用场景**：ParNew收集器是许多运行在Server模式下的虚拟机中首选的新生代收集器，因为它是除了Serial收集器外，唯一一个能与CMS收集器配合工作的。

**ParNew/Serial Old组合收集器运行示意图如下：**

****

### 1.5.3、Parallel Scavenge(并行回收GC)收集器

与吞吐量关系密切，故也称为吞吐量优先收集器。

**特点**：属于新生代收集器也是采用复制算法的收集器，又是并行的多线程收集器（与ParNew收集器类似）。

该收集器的目标是达到一个可控制的吞吐量。还有一个值得关注的点是：GC自适应调节策略（与ParNew收集器最重要的一个区别）它的关注点与其他收集器不同，CMS等收集器的关注点是尽可能地缩短垃圾收集时用户线程的停顿时间

吞吐量= 程序运行时间/(程序运行时间 + 垃圾收集时间)，虚拟机总共运行了100分钟。其中垃圾收集花掉1分钟，那吞吐量就是99%。

**GC自适应调节策略**：Parallel Scavenge收集器可设置-XX:+UseAdptiveSizePolicy参数。当开关打开时不需要手动指定新生代的大小（-Xmn）、Eden与Survivor区的比例（-XX:SurvivorRation）、晋升老年代的对象年龄（-XX:PretenureSizeThreshold）等，虚拟机会根据系统的运行状况收集性能监控信息，动态设置这些参数以提供最优的停顿时间和最高的吞吐量，这种调节方式称为GC的自适应调节策略。

Parallel Scavenge收集器使用两个参数控制吞吐量：

- XX:MaxGCPauseMillis 控制最大的垃圾收集停顿时间
- XX:GCRatio 直接设置吞吐量的大小。

### 1.5.4、Serial Old(串行GC)收集器

Serial Old是Serial收集器的老年代版本。

**特点**：同样是单线程收集器，采用标记-整理算法。

**应用场景**：主要也是使用在Client模式下的虚拟机中。也可在Server模式下使用。

Server模式下主要的两大用途（在后续中详细讲解···）：

**1、** 在JDK1.5以及以前的版本中与ParallelScavenge收集器搭配使用；

**2、** 作为CMS收集器的后备方案，在并发收集ConcurentModeFailure时使用；

Serial / Serial Old收集器工作过程图（Serial收集器图示相同）：

### 1.5.5、Parallel Old(并行GC)收集器

是Parallel Scavenge收集器的老年代版本。

**特点**：多线程，采用标记-整理算法。

**应用场景**：注重高吞吐量以及CPU资源敏感的场合，都可以优先考虑Parallel Scavenge+Parallel Old 收集器。

**Parallel Scavenge/Parallel Old收集器工作过程图：**

****

### 1.5.6、CMS(并发GC)收集器

CMS(Concurrent Mark Sweep)，一种以获取最短回收停顿时间为目标的收集器。

**特点**：基于标记-清除算法实现。并发收集、低停顿。

**应用场景**：适用于注重服务的响应速度，希望系统停顿时间最短，给用户带来更好的体验等场景下。如web程序、b/s服务。

**CMS收集器的运行过程分为下列4步：**

**初始标记**：（CMS initial mark）标记GC Roots能直接到的对象。速度很快但是仍存在Stop The World问题。

**并发标记**：（CMS concurrenr mark）进行GC Roots Tracing 的过程，找出存活对象且用户线程可并发执行。

**重新标记**：（CMS remark）为了修正并发标记期间因用户程序继续运行而导致标记产生变动的那一部分对象的标记记录。仍然存在Stop The World问题。

**并发清除**：（CMS concurrent sweep）对标记的对象进行清除回收。

由于整个过程中耗时最长的并发标记和并发清除过程中，收集器线程都可以与用户线程一起工作，整体来说，CMS收集器的内存回收过程是与用户线程一起并发执行的。

CMS收集器的优点：并发收集、低停顿，但是CMS还远远达不到完美。

CMS收集器的工作过程图：

其中初始标记、重新标记这两个步骤任然需要停顿其他用户线程。初始标记仅仅只是标记出GC ROOTS能直接关联到的对象，速度很快，并发标记阶段是进行GC ROOTS 根搜索算法阶段，会判定对象是否存活。而重新标记阶段则是为了修正并发标记期间，因用户程序继续运行而导致标记产生变动的那一部分对象的标记记录，这个阶段的停顿时间会被初始标记阶段稍长，但比并发标记阶段要短。

CMS收集器主要有三个显著缺点：

对CPU资源非常敏感。在并发阶段，虽然不会导致用户线程停顿，但是会占用CPU资源而导致引用程序变慢，总吞吐量下降。CMS默认启动的回收线程数是：(CPU数量+3) / 4。

CMS收集器无法处理浮动垃圾，可能出现“Concurrent Mode Failure“，失败后而导致另一次Full GC的产生。由于CMS并发清理阶段用户线程还在运行，伴随程序的运行自热会有新的垃圾不断产生，这一部分垃圾出现在标记过程之后，CMS无法在本次收集中处理它们，只好留待下一次GC时将其清理掉。这一部分垃圾称为“浮动垃圾”。也是由于在垃圾收集阶段用户线程还需要运行，即需要预留足够的内存空间给用户线程使用，因此CMS收集器不能像其他收集器那样等到老年代几乎完全被填满了再进行收集，需要预留一部分内存空间提供并发收集时的程序运作使用。在默认设置下，CMS收集器在老年代使用了68%的空间时就会被激活，也可以通过参数-XX:CMSInitiatingOccupancyFraction的值来提供触发百分比，以降低内存回收次数提高性能。要是CMS运行期间预留的内存无法满足程序其他线程需要，就会出现“Concurrent Mode Failure”失败，这时候虚拟机将启动后备预案：临时启用Serial Old收集器来重新进行老年代的垃圾收集，这样停顿时间就很长了。所以说参数-XX:CMSInitiatingOccupancyFraction设置的过高将会很容易导致“Concurrent Mode Failure”失败，性能反而降低。

CMS是基于“标记-清除”算法实现的收集器，使用“标记-清除”算法收集后，会产生大量碎片。空间碎片太多时，将会给对象分配带来很多麻烦，比如说大对象，内存空间找不到连续的空间来分配不得不提前触发一次Full GC。为了解决这个问题，CMS收集器提供了一个-XX:UseCMSCompactAtFullCollection开关参数，用于在Full GC之后增加一个碎片整理过程，还可通过-XX:CMSFullGCBeforeCompaction参数设置执行多少次不压缩的Full GC之后，跟着来一次碎片整理过程。

## 1.5.7、G1收集器

G1(Garbage First)收集器是JDK1.7提供的一个新收集器，一款面向服务端应用的垃圾收集器。G1收集器基于“标记-整理”算法实现，也就是说不会产生内存碎片。还有一个特点之前的收集器进行收集的范围都是整个新生代或老年代，而G1将整个Java堆(包括新生代，老年代)。

**特点如下：**

并行与并发：G1能充分利用多CPU、多核环境下的硬件优势，使用多个CPU来缩短Stop-The-World停顿时间。部分收集器原本需要停顿Java线程来执行GC动作，G1收集器仍然可以通过并发的方式让Java程序继续运行。

分代收集：G1能够独自管理整个Java堆，并且采用不同的方式去处理新创建的对象和已经存活了一段时间、熬过多次GC的旧对象以获取更好的收集效果。

空间整合：G1运作期间不会产生空间碎片，收集后能提供规整的可用内存。

可预测的停顿：G1除了追求低停顿外，还能建立可预测的停顿时间模型。能让使用者明确指定在一个长度为M毫秒的时间段内，消耗在垃圾收集上的时间不得超过N毫秒。

**G1为什么能建立可预测的停顿时间模型？**

因为它有计划的避免在整个Java堆中进行全区域的垃圾收集。G1跟踪各个Region里面的垃圾堆积的大小，在后台维护一个优先列表，每次根据允许的收集时间，优先回收价值最大的Region。这样就保证了在有限的时间内可以获取尽可能高的收集效率。

**G1与其他收集器的区别**：

其他收集器的工作范围是整个新生代或者老年代、G1收集器的工作范围是整个Java堆。在使用G1收集器时，它将整个Java堆划分为多个大小相等的独立区域（Region）。虽然也保留了新生代、老年代的概念，但新生代和老年代不再是相互隔离的，他们都是一部分Region（不需要连续）的集合。

**G1收集器存在的问题：**

Region不可能是孤立的，分配在Region中的对象可以与Java堆中的任意对象发生引用关系。在采用可达性分析算法来判断对象是否存活时，得扫描整个Java堆才能保证准确性。其他收集器也存在这种问题（G1更加突出而已）。会导致Minor GC效率下降。

**G1收集器是如何解决上述问题的？**

采用Remembered Set来避免整堆扫描。G1中每个Region都有一个与之对应的Remembered Set，虚拟机发现程序在对Reference类型进行写操作时，会产生一个Write Barrier暂时中断写操作，检查Reference引用对象是否处于多个Region中（即检查老年代中是否引用了新生代中的对象），如果是，便通过CardTable把相关引用信息记录到被引用对象所属的Region的Remembered Set中。当进行内存回收时，在GC根节点的枚举范围中加入Remembered Set即可保证不对全堆进行扫描也不会有遗漏。

**如果不计算维护 Remembered Set 的操作，G1收集器大致可分为如下步骤：**

**初始标记**：仅标记GC Roots能直接到的对象，并且修改TAMS（Next Top at Mark Start）的值，让下一阶段用户程序并发运行时，能在正确可用的Region中创建新对象。（需要线程停顿，但耗时很短。）

**并发标记**：从GC Roots开始对堆中对象进行可达性分析，找出存活对象。（耗时较长，但可与用户程序并发执行）

**最终标记**：为了修正在并发标记期间因用户程序执行而导致标记产生变化的那一部分标记记录。且对象的变化记录在线程Remembered Set Logs里面，把Remembered Set Logs里面的数据合并到Remembered Set中。（需要线程停顿，但可并行执行。）

**筛选回收**：对各个Region的回收价值和成本进行排序，根据用户所期望的GC停顿时间来制定回收计划。（可并发执行）

**G1收集器运行示意图：**

****

## CMS和G1区别

Cms堆 -> 年轻代老年代

G1堆 -> 多个区 -> 每个区里(年轻代老年代)

Cms标记清理算法

G1压缩复制算法,不产生碎片

G1时间停顿可设置，相关参数[ -XX:MaxGCPauseMillis=100 -XX:GCPauseIntervalMillis=200 ]

## 1.6、垃圾收集器参数总结

> -XX:+ 启用选项
>
> -XX:- 不启用选项
>
> -XX:=
>
> -XX:=

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

Client、Server模式默认GC

新生代GC方式
老年代和持久代GC方式

Client

Serial 串行GC
Serial Old 串行GC

Server
Parallel Scavenge  并行回收GC
Parallel Old 并行GC

Sun/oracle JDK GC组合方式

新生代GC方式
老年代和持久代GC方式

-XX:+UseSerialGC

Serial 串行GC
Serial Old 串行GC

-XX:+UseParallelGC
Parallel Scavenge  并行回收GC
Serial Old  并行GC

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

参考链接：

[http://blog.csdn.net/java2000_wl/article/details/8030172](http://blog.csdn.net/java2000_wl/article/details/8030172)

[https://my.oschina.net/u/175660/blog/351774](https://my.oschina.net/u/175660/blog/351774)

https://www.cnblogs.com/chenpt/p/9803298.html
