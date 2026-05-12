# 08、JVM 实战 - 虚拟机性能监控命令
- 来源：https://ddkk.com/zhuanlan/java/jvm/5/8.html
- 分类：JVM 实战
- 分组：教程目录
## jps

JVMProcess Status Tool，显示指定系统内所有的 HotSpot 虚拟机进程。显示信息包括虚拟机执行主类名称以及这些进程的本地虚拟机唯一ID（Local Virtual Machine Identifier，LVMID）。

```java
jps [-q] [-mlvV] [<hostid>]
```

选项
作用

-q
只输出 LVMID，省略主类的名称

-m
输出虚拟机进程启动时传递给主类 main() 函数的参数

-l
输出主类的名称，如果进程执行的是 jar 包，输出 jar 路径

-v
输出虚拟机进程启动时 JVM 参数

## jstat

JVMStatistics Monitoring Tool，用于收集 HotSpot 虚拟机各方面的运行数据。包括显示本地或者远程虚拟机进程中的类装载、内存、垃圾收集、JIT 编码等运行数据。

```java
 jstat -<option> [-t] [-h<lines>] <vmid> [<interval> [<count>]]
```

参数interval 和 count 代表查询间隔和次数，如果省略这两个参数，说明只查询一次。

选项
作用

-class
监视类装载、卸载数量、总空间以及类装载所耗费的时间

-compiler
输出 JIT 编译过的方法、耗时等信息

-printcompilation
输出已经被 JIT 编译的方法

-gc
监视 Java 堆状况

-gccapacity
监视 Java 堆状况，关注堆各个区域使用到的最大、最小空间

-gcutil
监视 Java 堆状况，关注已使用空间占总空间的比例

-gccause
与 gcutil 功能一样，额外输出导致上一次 GC 产生的原因

-gcnew
监视新生代 GC 状况

-gcnewcapacity
监视堆新生代 GC 状况，关注使用到的最大、最小空间

-gcold
监视老年代 GC 状况

-gcoldcapacity
监视老年代 GC 状况，关注使用到的最大、最小空间

-gcmetacapacity
输出元空间使用到的最大、最小空间

**tips：** 监控指标的含义，不是本文的重点，可在具体使用到的时候再去查询。

## jinfo

Configuration Info for Java，实时的查看和调整虚拟机的各项参数。

```java
jinfo [option] <pid>
```

选项
作用

-flag
查看虚拟机进程某个配置项的值

-flag [+/-]
开启/关闭虚拟机进程某个配置项

-flag =
动态设置虚拟机进程某个配置项

-flags
打印虚拟机进程非默认的配置项以及用户启动时设置的虚拟机参数

-sysprops
打印虚拟机进程的 System.getProperties() 的内容

## jmap

Memory Map for Java，生成虚拟机的内存存储快照（heapdump 文件或 dump 文件），查询 finalize 执行队列、Java 堆等信息。

```java
jmap [option] <pid>
```

选项
作用

-dump:
生成 Java 堆存储快照。格式为：-dump[:live,]format=b,file=  。其中 live 参数说明只 dump 出存活的对象

-finalizerinfo
显示在 F-Queue 中等待 Finalize 线程执行 finalize 方法的对象

-heap
显示 Java 堆详细信息

-histo
显示堆中对象统计信息，包括类、实例变量、合计容量

-F
当虚拟机进程对 -dump 选项没有响应时，可使用这个选项强制生成 dump 快照

那么问题来了，有了 dump 文件后，我们该怎么对 dump 文件进行解读呢？这里推荐个人一直在使用的网站：[https://console.perfma.com/](https://console.perfma.com/)，只要将生成的 dump 文件上传到网站上，就能得到分析结果。（目测原理是 jhat 命令 —— 虚拟机堆转储快照分析工具）

**tips：** 除了使用 jmap 命令，还可以使用 -XX:+HeapDumpOnOutOfMemoryError 参数，让虚拟机在 OOM 异常出现之后自动生成 dump 文件。

## jstack

Stack Trace for Java，用于生成虚拟机当前时刻的线程快照（一般称为 threaddump 或者 javadoc 文件）。线程快照就是当前虚拟机内每一条线程正在执行的方法堆栈的集合，生成线程快照的主要目的是定位线程出现长时间停顿的原因，如线程间死锁、死循环、请求外部资源导致的长时间等待等都是导致线程长时间停顿的常见原因。

```java
jstack [option] <pid>
```

选项
作用

-F
当正常输出的请求不被响应时，强制输出线程堆栈

-m
如果调用本地方法（native）的话，可以显示 C/C++ 堆栈信息

-l
除堆栈外，显示关于锁的附加信息

堆栈的分析也可以上传到 [https://console.perfma.com/](https://console.perfma.com/) 查看分析结果，需要注意的是 dump 文件中的线程号是以 16 进制表示的，所以我们定位线程的时候，也要把线程号转化为 16 进制。

**tips：** 给一个系统定位问题的时候，知识、经验是关键基础，数据是依据，工具是运用知识处理数据的手段。
