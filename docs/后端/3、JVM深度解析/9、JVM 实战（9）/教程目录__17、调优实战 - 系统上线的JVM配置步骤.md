# 17、调优实战 - 系统上线的JVM配置步骤
- 来源：https://ddkk.com/zhuanlan/java/jvm/9/17.html
- 分类：JVM 实战
- 分组：教程目录
## 1. 预评估阶段

对于一个新系统面临上线，需要设置线上的jvm参数，最严谨的方法当然是：

**1、** 评估系统中各个接口的一次请求大概会产生多少M的对象；

**2、** 评估系统一秒大概会接收到多少个请求，这些请求分布在哪些接口，一共会产生多少M的对象；

**3、** 根据每秒生成的对象大小，估计新生代需要给多少的内存，YGC发生的频率，进入老年代的频率；

**4、** 再估计老年代应该给多少的内存，FGC发生的频率等；

**5、** 最终得到需要选择什么样配置的机器，和大概的JVM配置参数；

但是这个实现起来非常复杂，如果经验不足往往也很难评估得准确，最后还是要进行不小的调整与优化，所以一般就不采用这种方法了。

## 2. JVM 参数模板

一般来说，公司都会有一套自己的初始参数模板，当然这个模板只是初始的，是需要后面进行测试和优化的，不过可以先使用这套模板来把系统部署起来进行测试。

- 负载一般的系统：
- ParNew + CMS:

```java
-Xms2G -Xmx2G -Xmn1200m -Xss1M -XX:MetaspaceSize=256M -XX:MaxMetaspaceSize=256M 
-XX:+UseParNewGC -XX:+UseConcMarkSweepGC -XX:CMSInitiatingOccupancyFaction=92 
-XX:+UseCMSCompactAtFullCollection -XX:CMSFullGCsBeforeCompaction=0 -XX:+CMSParallelInitialMarkEnabled
-XX:+CMSScavengeBeforeRemark -XX:+DisableExplicitGC
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/usr/local/app/oom
```

- G1:

```java
-Xms2G -Xmx2G -Xss1M -XX:MetaspaceSize=256M -XX:MaxMetaspaceSize=256M 
-XX:+UseG1GC -XX:CMSInitiatingOccupancyFaction=70 -XX:MaxGCPauseMillis=200 
-XX:+CMSParallelInitialMarkEnabled -XX:+DisableExplicitGC 
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/usr/local/app/oom
```

负载大一点的系统：

- ParNew + CMS:

```java
-Xms4G -Xmx4G -Xmn3G -Xss1M -XX:MetaspaceSize=512M -XX:MaxMetaspaceSize=512M 
-XX:+UseParNewGC -XX:+UseConcMarkSweepGC -XX:CMSInitiatingOccupancyFaction=92 
-XX:+UseCMSCompactAtFullCollection -XX:CMSFullGCsBeforeCompaction=0 -XX:+CMSParallelInitialMarkEnabled
-XX:+CMSScavengeBeforeRemark -XX:+DisableExplicitGC
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/usr/local/app/oom
```

- G1:

```java
-Xms4G -Xmx4G -Xss1M -XX:MetaspaceSize=512M -XX:MaxMetaspaceSize=512M 
-XX:+UseG1GC -XX:CMSInitiatingOccupancyFaction=70 -XX:MaxGCPauseMillis=200 
-XX:+CMSParallelInitialMarkEnabled -XX:+DisableExplicitGC
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/usr/local/app/oom
```

## 3. 压力测试

使用上面的JVM参数模板把系统部署上线之后，就需要进行测试了，首先肯定是正常测试，如果正常测试都有问题就先优化参数配置；

正常测试结束之后，重点要进行压力测试，否则的话系统在遇到一些稍高并发的请求下就会挂掉了。

在正常测试和压力测试的时候，都需要使用jstat等命令来观察jvm运行时的内存模型，主要的观察指标为：

- Eden区每秒的对象增长速率；
- YGC的频率；
- YGC的耗时；
- YGC后有多少对象存活，Survivor区是否能放下；
- YGC后有多少对象进入老年代；
- FGC的频率；
- FGC的耗时；

在得到这些指标之后，如果有不合理的地方，再进行jvm参数的调整和优化；优化的重点是: **尽量避免存活对象频繁进入老年代，导致频繁的 Full GC**;

## 4. 上线后的监控

在系统正式部署上线之后，一般都需要对系统进行长久的监控；

**1、** 可以通过Zabbix、Open-Falcon、自己公司的监控工具等来监控系统的jvm运行情况，并且可以配置邮件、短信等告警手段，在出现问题时及时收到告警；

**2、** 定期手动使用jstat命令监控系统的JVM运行情况，查看是否存在问题；

**3、** 根据jstat命令的运行原理，写一个脚本来定期统计JVM的运行情况，并把监控信息写入文件，再对这个文件进行分析处理和告警；（手动实现一个监控工具）；

**4、** …；

在系统运行时的监控过程中如果发现如 频繁Full GC等问题的，就及时进行优化。
