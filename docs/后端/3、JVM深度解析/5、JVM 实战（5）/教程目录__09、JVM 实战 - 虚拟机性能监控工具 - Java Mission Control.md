# 09、JVM 实战 - 虚拟机性能监控工具 - Java Mission Control
- 来源：https://ddkk.com/zhuanlan/java/jvm/5/9.html
- 分类：JVM 实战
- 分组：教程目录
## 一、写在前面

[上一篇文章](/zhuanlan/java/jvm/5/8.html) 我们介绍了性能监控的一些命令，包括 jmap （生成堆存储快照）和 jstack（生成线程快照），事实上，在没有一些监控工具之前，我们用的最多的也是这两个命令来进行虚拟机性能的监控调优。但是这两个命令都有自己不足的地方：

- 使用 jmap 命令，从 Heap Dump 开始，整个 JVM 都是停顿的，几G 的 Heap 可能产生几秒的停顿，在生产环境上执行时需要谨慎再谨慎。
- 使用 jstack 命令，ThreadDump 同样会造成 JVM 停顿，加了 -l 参数，停顿时间更长，在生产环境上执行要谨慎再谨慎。

后来一些监控工具就应运而生，比如 Jconsule、VisualVM 以及收费的 JProfiler 等，这篇文章主要介绍 Java Mission Control。

## 二、Java Mission Control

Java Mission Control（简称 JMC） 是一个用于对 Java 应用程序进行管理、监视、概要分析和故障排除的工具套件，在 JDk7 7u40之后免费自带，运行 “JAVA_HOME”\bin\jmc.exe 即可运行 JMC。

JMC的另一个优点就是：采用取样，而不是传统的代码植入技术，对应用性能的影响非常非常小，完全可以开着 JMC 来做压测（唯一影响可能是 full gc 多了）。

JMC主要包括两种功能：

- 实时监控 JVM 运行时的状态
- Java Flight Recorder 取样分析

### 2.1 实时监控

如果是远程服务器，使用前要开 JMX

```java
-Dcom.sun.management.jmxremote.port=${YOUR PORT}
-Dcom.sun.management.jmxremote 
-Dcom.sun.management.jmxremote.authenticate=false 
-Dcom.sun.management.jmxremote.ssl=false 
-Djava.rmi.server.hostname=${YOUR HOST/IP}
```

文件-> 连接 -> 创建新连接， 填入上面 JMX 参数的 host 和 port

通过“+”按需添加各种统计图表。

“触发器” tab 可以根据 CPU、线程等信息，设定一定的阈值，来触发报警。

“内存” tab 提供 heap 和 GC 的信息。可以关注 GC次数、时间以及随着 GC 发生 heap 的内存变化情况，以此来调整 jvm 参数。

“线程” tab 可以关注每条线程所占的CPU、死锁情况以及线程堆栈信息。

### 2.2 Flight Recorder（取样分析）

要采用取样，必须先添加参数：

```java
-XX:+UnlockCommercialFeatures 
-XX:+FlightRecorder
```

取样时间默认 1 分钟，可自行按需调整，事件设置选为 profiling，然后可以设置取样 profile 哪些信息，比如：

- 加上对象数量的统计：Java Virtual Machine -> GC -> Detailed -> Object Count/Object Count after GC
- 方法调用采样的间隔从 10ms 改为 1ms(但不能低于 1ms，否则会影响性能了): Java Virtual Machine -> Profiling -> Method Profiling Sample/Method Sampling Information
- Socket 与 File 采样, 10ms 太久，但即使改为 1ms 也未必能抓住什么，可以干脆取消掉: Java Application->File Read/FileWrite/Socket Read/Socket Write

然后就开始 Profile，到时间后 Profile 结束，会自动把记录下载回来，在 JMC 中展示。

从展示信息中，我们大致可以读到 JVM参数、GC、热点代码、对象分配以及线程等详细信息。

一般来说，尽可能确保以下几点，你的程序会跑得更快：

- 分配更少的对象
- 尽可能少进行 full gc
- 尽可能少在 TLAB 外分配对象
