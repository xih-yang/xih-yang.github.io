# 01、JVM 调优实战 - JVM之GC 调优基础知识
- 来源：https://ddkk.com/zhuanlan/java/jvm/10/1.html
- 分类：JVM 实战
- 分组：教程目录
关于JVM的理论知识，大家都略知一二，从今天开始这里咱们只分析JVM实战使用,第一篇就从GC调优开始，首先介绍JDK为我们提供的工具：

**1、** 这些工具在windows上，就是这些exe，其他的平台不同；

在linux 中，一般自带了 OpenJdk ， 一般情况下 JPS 等命令不能用，要么选择去安装 JPS 等插件，要么把 OpenJdk 卸载，去重新安装 Oracle 的 JDK，我推荐后者。

## 命令行工具

**1、** JSP:14024是java进程；

列出当前机器上正在运行的虚拟机进程， JPS 从操作系统的临时目录上去找（所以有一些信息可能显示不全）。

q:仅仅显示进程，

-m: 输出主函数传入的参数 . 下的 hello 就是在执行程序时从命令行输入的参数

-l: 输出应用程序主类完整 package 名称或 jar 完整名称 .

-v: 列出 jvm 参数 , -Xms20m -Xmx50m 是启动程序指定的 jvm 参数

**2、****jstat**；

是用于监视虚拟机各种运行状态信息的命令行工具。它可以显示本地或者远程虚拟机进程中的类装载、内存、垃圾收集、 JIT 编译等运行数据，在没有 GUI

图形界面，只提供了纯文本控制台环境的服务器上，它将是运行期定位虚拟机性能问题的首选工具。

常用参数：

-class ( 类加载器 )

-compiler (JIT)

-gc (GC 堆状态 )

-gccapacity ( 各区大小 )

-gccause ( 最近一次 GC 统计和原因 )

-gcnew ( 新区统计 )

-gcnewcapacity ( 新区大小 )

-gcold ( 老区统计 )

-gcoldcapacity ( 老区大小 )

-gcpermcapacity ( 永久区大小 )

-gcutil (GC 统计汇总 )

-printcompilation (HotSpot 编译统计 )

比如输入 jstat -class 20456 查看类加载信息

比如说：我们要统计 GC ，就是垃圾回收，那么只需要使用这样的命令。

jstat-gc 13616

（这个 13616 是 JVM 的进程，通过 JPS 命令得到），这样统计出来是的实时值。

所以很多情况下，我们为了看变化值的，可以这么玩。

jstat -gc 20456 查看垃圾回收信息

假设需要每 250 毫秒查询一次进程 20456 垃圾收集状况，一共查询 10 次，那命令应当是：jstat-gc 20456 250 10

**S0C****：** 第一个幸存区（ From 区）的大小

**S1C****：** 第二个幸存区（ To 区）的大小

**S0U****：** 第一个幸存区的使用大小

**S1U****：** 第二个幸存区的使用大小

**EC****：** 伊甸园（ Eden ）区的大小

**EU****：** 伊甸园（ Eden ）区的使用大小

**OC****：** 老年代大小

**OU****：** 老年代使用大小

**MC****：** 方法区大小

**MU****：** 方法区使用大小

**CCSC:** 压缩类空间大小

**CCSU:** 压缩类空间使用大小

**YGC****：** 年轻代垃圾回收次数

**YGCT****：** 年轻代垃圾回收消耗时间

**FGC****：** 老年代垃圾回收次数

**FGCT****：** 老年代垃圾回收消耗时间

**GCT****：** 垃圾回收消耗总时间

**3、****jinfo**；

查看和修改虚拟机的参数

jinfo –sysprops 可以查看由 System.getProperties() 取得的参数

jinfo –flag 未被显式指定的参数的系统默认值

jinfo –flags （注意 s ）显示虚拟机的参数

**VM****参数分类**

JVM 的命令行参数参考： https://docs.oracle.com/javase/8/docs/technotes/tools/unix/java.html

**1、标准：****-****开头，所有的****HotSpot****都支持**

保证Java 虚拟机（ JVM ）的所有实现都支持标准选项。它们用于执行常见操作，例如检查 JRE 版本，设置类路径，启用详细输出等

**2、标准：****-X****开头，特定版本****HotSpot****支持特定命令**

非标准选项是特定于 Java HotSpot 虚拟机的通用选项，因此不能保证所有 JVM 实现都支持它们，并且它们可能会发生变化。这些选项以开头 -X 。

-Xms30m -Xmx30m -Xss1m

**3、高级选项** ：以开头 -XX:

这些是开发人员选项，用于调整 Java HotSpot 虚拟机操作的特定区域，这些区域通常具有特定的系统要求，并且可能需要对系统配置参数的特权访问。也

不能保证所有 JVM 实现都支持它们，并且它们可能会发生变化。

在windows 上可以通过以下 java -XX:+PrintFlagsFinal –version 查询所有 -XX 的，如图：

**注意：****manageable****的参数，代表可以运行时修改。**

看某个进程的信息 jinfo -flags 20456

演示例子如下：

首先我们得知 PrintGC 这个 XX 参数是可以运行时修改的。

jinfo –flag -[ 参数 ] pid 可以修改参数

先查：jinfo -flag PrintGC 20456，-XX:-PrintGC : 高级的 （XX）, 没有开启(-)

再开启：jinfo -flag +PrintGC 20456

用完之后关闭：

总结：通过 jinfo 命令，我可以在生产上临时打开一下 GC 日志或者进行一些数据的配置，用完之后可以关闭（不需要重启应用条件下），也是我们去排查问题的一个关键命令。

**4、****jmap**；

用于生成堆转储快照（一般称为 heapdump 或 dump 文件）。 jmap 的作用并不仅仅是为了获取 dump 文件，它还可以查询 finalize 执行队列、 Java 堆和永 久代的详细信息，如空间使用率、当前用的是哪种收集器等。和 jinfo 命令一样， jmap 有不少功能在 Windows 平台下都是受限的，除了生成 dump 文件的 -dump 选项和用于查看每个类的实例、空间占用统计的 -histo 选项在所有操作系统都提供之外，其余选项都只能在 Linux/Solaris 下使用。jmap命令看使用方法，如图：

**-heap****打印****heap****的概要信息，使用到的对空间，已用和未用等，下面有详细介绍：**

jmap –heap <pid

Heap Configuration: ## 堆配置情况，也就是 JVM 参数配置的结果 [ 平常说的 tomcat 配置 JVM 参数，就是在配置这些 ]

MinHeapFreeRatio = 40 ## 最小堆使用比例

MaxHeapFreeRatio = 70 ## 最大堆可用比例

MaxHeapSize = 2147483648 ( 2048 .0MB) ## 最大堆空间大小

NewSize = 268435456 ( 256 .0MB) ## 新生代分配大小

MaxNewSize = 268435456 ( 256 .0MB) ## 最大可新生代分配大小

OldSize = 5439488 ( 5 .1875MB) ## 老年代大小

NewRatio = 2 ## 新生代比例

SurvivorRatio = 8 ## 新生代与 suvivor 的比例

PermSize = 134217728 ( 128 .0MB) ##perm 区 永久代大小

MaxPermSize = 134217728 ( 128 .0MB) ## 最大可分配 perm 区 也就是永久代大小

Heap Usage: ## 堆使用情况【堆内存实际的使用情况】

New Generation (Eden + 1 Survivor Space): ## 新生代（伊甸区 Eden 区 + 幸存区 survior(1+2) 空间）

capacity = 241631232 ( 230 .4375MB) ## 伊甸区容量

used = 77776272 ( 74 .17323303222656MB) ## 已经使用大小

free = 163854960 ( 156 .26426696777344MB) ## 剩余容量

32.188004570534986 % used ## 使用比例

Eden Space: ## 伊甸区

capacity = 214827008 ( 204 .875MB) ## 伊甸区容量

used = 74442288 ( 70 .99369812011719MB) ## 伊甸区使用

free = 140384720 ( 133 .8813018798828MB) ## 伊甸区当前剩余容量

34.65220164496263 % used ## 伊甸区使用情况

From Space: ##survior1 区

capacity = 26804224 ( 25 .5625MB) ##survior1 区容量

used = 3333984 ( 3 .179534912109375MB) ##surviror1 区已使用情况

free = 23470240 ( 22 .382965087890625MB) ##surviror1 区剩余容量

12.43827838477995 % used ##survior1 区使用比例

To Space: ##survior2 区

capacity = 26804224 ( 25 .5625MB) ##survior2 区容量

used = 0 ( 0 .0MB) ##survior2 区已使用情况

free = 26804224 ( 25 .5625MB) ##survior2 区剩余容量

0.0 % used ## survior2 区使用比例

PS Old Generation: ## 老年代使用情况

capacity = 1879048192 ( 1792 .0MB) ## 老年代容量

used = 30847928 ( 29 .41887664794922MB) ## 老年代已使用容量

free = 1848200264 ( 1762 .5811233520508MB) ## 老年代剩余容量

1.6416783843721663 % used ## 老年代使用比例

**-histo****打印每个****class****的实例数目****,****内存占用****,****类全名信息****.**

jmap –histo

jmap –histo:live

如果live 子参数加上后 , 只统计活的对象数量 .

但是这样显示太多了，一般在 linux 上会这么操作jmap –histo 1196 | head -20 （这样只会显示排名前 20 的数据）

不太重要的参数 -finalizerinfo 打印正等候回收的对象的信息，还有 jmap –clstats 这个命令最好也不要去使用

**-dump** 生成的堆转储快照（比较重要） ，导出文件很占内存，不能随便使用

jmap -dump:live,format=b,file=heap.bin

例如：jmap -dump:live,format=b,file=E:\heap.bin 21588

SunJDK 提供 jhat （ JVM Heap Analysis Tool ）命令与 jmap 搭配使用，来分析 jmap 生成的堆转储快照。

**5、****jhat**；

jhat dump 文件名

后屏幕显示“ Server is ready. ”的提示后，用户在浏览器中键入 http://localhost:7000/ 就可以访问详情

使用jhat 可以在服务器上生成堆转储文件分析（一般不推荐，毕竟占用服务器的资源，比如一个文件就有 1 个 G 的话就需要大约吃一个 1G 的内存资源）

**6、** jstack；

（Stack Trace for Java ）命令用于生成虚拟机当前时刻的线程快照。线程快照就是当前虚拟机内每一条线程正在执行的方法堆栈的集合，生成线程快照的主 要目的是定位线程出现长时间停顿的原因，如线程间死锁、死循环、请求外部资源导致的长时间等待等都是导致线程长时间停顿的常见原因。如图：说明此线程正在运行

在代码中可以用 java.lang.Thread 类的 getAllStackTraces （）方法用于获取虚拟机中所有线程的 StackTraceElement 对象。使用这个方法可以通过简单的几行 代码就完成 jstack 的大部分功能，在实际项目中不妨调用这个方法做个管理员页面，可以随时使用浏览器来查看线程堆栈。 一般来说 jstack 主要是用来排查是否有死锁的情况。

例如先运行一个死锁：

通过jstack 11312 命令查找死锁信息：

**7、****命令工具总结**；

**生产服务器推荐开启**

-XX:-HeapDumpOnOutOfMemoryError 默认关闭，建议开启，在 java.lang.OutOfMemoryError 异常出现时，输出一个 dump 文件，记录当时的堆内存快照。

-XX:HeapDumpPath=./java_pid.hprof

用来设置堆内存快照的存储文件路径，默认是 java 进程启动位置。

**调优之前开启、调优之后关闭**

-XX:+PrintGC

调试跟踪之 打印简单的 GC 信息参数 :

-XX:+PrintGCDetails, +XX:+PrintGCTimeStamps

打印详细的 GC 信息

-Xlogger:logpath

设置gc 的日志路，如： -Xlogger:log/gc.log ， 将 gc.log 的路径设置到当前目录的 log 目录下 .

应用场景： 将 gc 的日志独立写入日志文件，将 GC 日志与系统业务日志进行了分离，方便开发人员进行追踪分析。

**考虑使用**

-XX:+PrintHeapAtGC ， 打印推信息

参数设置： -XX ： +PrintHeapAtGC

应用场景： 获取 Heap 在每次垃圾回收前后的使用状况

-XX:+TraceClassLoading 参数方法： -XX:+TraceClassLoading

应用场景： 在系统控制台信息中看到 class 加载的过程和具体的 class 信息，可用以分析类的加载顺序以及是否可进行精简操作。

-XX:+DisableExplicitGC 禁止在运行期显式地调用 System.gc()

## 可视化工具

**1、** JMX（JavaManagementExtensions，即Java管理扩展）是一个为应用程序、设备、系统等植入管理功能的框架JMX可以跨越一系列异构操作系统平台、生成环境一般不会使用，不安全、占资源自己开发环境玩一玩可以；

系统体系结构和网络传输协议，灵活的开发无缝集成的系统、网络和服务管理应用。

**管理远程进程需要在远程程序的启动参数中增加：**

-Djava.rmi.server.hostname=…..

-Dcom.sun.management.jmxremote

-Dcom.sun.management.jmxremote.port=8888

-Dcom.sun.management.jmxremote.authenticate=false

-Dcom.sun.management.jmxremote.ssl=false

**1、** Jconsole，点击进去就可以看到相关信息；

**2、****visualvm**；

插件中心地址

https://visualvm.github.io

但是注意版本问题，不同的 JDK 所带的 visualvm 是不一样的，下载插件时需要下对应的版本。

一般来说，这个工具是本机调试用，一般生产上来说，你一般是用不了的（除非启用远程连接）。

生成环境一般不会使用，不安全、占资源。自己开发环境玩一玩可以。

jvm的基础命令行工具和可视化工具分析完，大家一定要多操作。下一篇我们分析一款开源工具 Arthas，敬请期待！
