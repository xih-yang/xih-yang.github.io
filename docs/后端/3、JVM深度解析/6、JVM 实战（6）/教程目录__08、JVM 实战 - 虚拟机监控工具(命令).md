# 08、JVM 实战 - 虚拟机监控工具(命令)
- 来源：https://ddkk.com/zhuanlan/java/jvm/6/8.html
- 分类：JVM 实战
- 分组：教程目录
### 1.jps (Java Virtual Machine Process Status Tool)

用来查看基于HotSpot的JVM里面中，所有具有访问权限的Java进程的具体状态, 包括进程ID，进程启动的路径及启动参数等等，与unix上的ps类似，只不过jps是用来显示java进程，可以把jps理解为ps的一个子集。

jps[options] [hostid]

如果不指定hostid就默认为当前主机或服务器；如果指定了hostid，它就会显示指定hostid上面的java进程，不过这需要远程服务上开启了jstatd服务。

-q：忽略输出的类名、Jar名以及传递给main方法的参数，只输出pid。

-m：输出传递给main方法的参数，如果是内嵌的JVM则输出为null。

-l：输出完全的包名，应用主类名，jar的完全路径名

-v：输出传给jvm的参数

-V：输出通过标记的文件传递给JVM的参数（.hotspotrc文件，或者是通过参数-XX:Flags=指定的文件）。

-J用于传递jvm选项到由javac调用的java加载器中，例如，“-J-Xms48m”将把启动内存设置为48M，使用-J选项可以非常方便的向基于Java的开发的底层虚拟机应用程序传递参数。

jps-mlv

```java
9680 org.jetbrains.idea.maven.server.RemoteMavenServer -Djava.awt.headless=true -Didea.version==2017.1.1 -Xmx768m -Didea.maven.embedder.version=3.2.5 -Dfile.encoding=GBK
2356 org.jetbrains.jps.cmdline.Launcher C:/Program Files/JetBrains/IntelliJ IDEA 2017.1.1/lib/openapi.jar;C:/Program Files/JetBrains/IntelliJ IDEA 2017.1.1/lib/jgoodies-forms.jar;C:/Program Files/JetBrains/IntelliJ IDEA 2017.1.1/lib/javac2.jar;C:/Program Files/JetBrains/IntelliJ IDEA 2017.1.1/lib/idea_rt.jar;C:/Program Files/JetBrains/IntelliJ IDEA 2017.1.1/lib/jna-platform.jar;C:/Program Files/JetBrains/IntelliJ IDEA 2017.1.1/lib/netty-all-4.1.9.Final.jar;C:/Program Files/JetBrains/IntelliJ IDEA 2017.1.1/lib/protobuf-2.5.0.jar;C:/Program Files/JetBrains/IntelliJ IDEA 2017.1.1/lib/annotations.jar;C:/Program Files/JetBrains/IntelliJ IDEA 2017.1.1/lib/trove4j.jar;C:/Program Files/JetBrains/IntelliJ IDEA 2017.1.1/lib/nanoxml-2.2.3.jar;C:/Program Files/JetBrains/IntelliJ IDEA 2017.1.1/lib/forms_rt.jar;C:/Program Files/JetBrains/IntelliJ IDEA 2017.1.1/lib/jdom.jar;C:/Program Files/JetBrains/IntelliJ IDEA 2017.1.1/lib/asm-all.jar;C:/Program Files/JetBrains/IntelliJ IDEA 2017.1.1/lib/jps-model.jar;C:/Program Files/JetBra -Xmx700m -Djava.awt.headless=true -Djava.endorsed.dirs="" -Djdt.compiler.useSingleThread=true -Dcompile.parallel=false -Drebuild.on.dependency.change=true -Djava.net.preferIPv4Stack=true -Dio.netty.initialSeedUniquifier=-8384703316530083662 -Dfile.encoding=GBK -Djps.file.types.component.name=FileTypeManager -Duser.language=zh -Duser.country=CN -Didea.paths.selector=IntelliJIdea2017.1 -Didea.home.path=C:\Program Files\JetBrains\IntelliJ IDEA 2017.1.1 -Didea.config.path=C:\Users\vincent\.IntelliJIdea2017.1\config -Didea.plugins.path=C:\Users\vincent\.IntelliJIdea2017.1\config\plugins -Djps.log.dir=C:/Users/vincent/.IntelliJIdea2017.1/system/log/build-log -Djps.fallback.jdk.home=C:/Program Files/JetBrains/IntelliJ IDEA 2017.1.1/jre64 -Djps.fallback.jdk.version=1.8.0_112-release -Dio.netty.noUnsafe=true -Djava.io.tmpdir=C:/Users/vincent/.IntelliJIdea2017.1/system/compile-server/es-demo_7a0f3d0f/_temp_ -Djps.backward.ref.index.builder=true -Dkotlin.incremental.compilation.experimental=true -Dkotlin.daemon.enabled
4116  -Xms128m -Xmx750m -XX:ReservedCodeCacheSize=240m -XX:+UseConcMarkSweepGC -XX:SoftRefLRUPolicyMSPerMB=50 -ea -Dsun.io.useCanonCaches=false -Djava.net.preferIPv4Stack=true -XX:+HeapDumpOnOutOfMemoryError -XX:-OmitStackTraceInFastThrow -Djb.vmOptionsFile=C:\Program Files\JetBrains\IntelliJ IDEA 2017.1.1\bin\idea64.exe.vmoptions -Xbootclasspath/a:C:\Program Files\JetBrains\IntelliJ IDEA 2017.1.1\lib\boot.jar -Didea.jre.check=true -Didea.paths.selector=IntelliJIdea2017.1 -XX:ErrorFile=C:\Users\vincent\java_error_in_idea_%p.log -XX:HeapDumpPath=C:\Users\vincent\java_error_in_idea.hprof
16776 sun.tools.jps.Jps -mlv -Denv.class.path=.;D:\jdk\lib\dt.jar;D:\jdk\lib\tools.jar;  -Dapplication.home=D:\jdk -Xms8m
```

### 2. jstack

jstack主要用来查看某个Java进程内的线程堆栈信息。

jstack [option] pid

jstack [option] executable core

jstack [option] [server-id@]remote-hostname-or-ip

-llong listings，会打印出额外的锁信息，在发生死锁时可以用**jstack -l pid**来观察锁持有情况

-mmixed mode，不仅会输出Java堆栈信息，还会输出C/C++堆栈信息（比如Native方法）

jstack可以定位到线程堆栈，根据堆栈信息我们可以定位到具体代码，所以它在JVM性能调优中使用得非常多。下面我们来一个实例找出某个Java进程中最耗费CPU的Java线程并定位堆栈信息，用到的命令有ps、top、printf、jstack、grep。

第一步： 先找出Java进程ID，服务器上的Java应用名称为wordcount.jar：

```java
root@ubuntu:/# ps -ef | grep mrf-center | grep -v grep
root     21711     1  1 14:47 pts/3    00:02:10 java -jar mrf-center.jar
```

得到进程ID为21711，第二步找出该进程内最耗费CPU的线程，可以使用ps -Lfp pid或者ps -mp pid -o THREAD, tid, time或者top -Hp pid，我这里用第三个，输出如下：

TIME列就是各个Java线程耗费的CPU时间，CPU时间最长的是线程ID为21742的线程，用

```java
printf "%x\n" 21742
```

得到21742的十六进制值为54ee，下面会用到。

OK，下一步终于轮到jstack上场了，它用来输出进程21711的堆栈信息，然后根据线程ID的十六进制值grep，如下：

```java
root@ubuntu:/# jstack 21711 | grep 54ee
```

```java
"PollIntervalRetrySchedulerThread" prio=10 tid=0x00007f950043e000 nid=0x54ee in Object.wait() [0x00007f94c6eda000]
```

可以看到CPU消耗在PollIntervalRetrySchedulerThread这个类的Object.wait()，我找了下我的代码，定位到下面的代码。

```java
// Idle wait
getLog().info("Thread [" + getName() + "] is idle waiting...");
schedulerThreadState = PollTaskSchedulerThreadState.IdleWaiting;
long now = System.currentTimeMillis();
long waitTime = now + getIdleWaitTime();
long timeUntilContinue = waitTime - now;
synchronized(sigLock) {
  try {
    if(!halted.get()) {
      sigLock.wait(timeUntilContinue);
    }
  } 
  catch (InterruptedException ignore) {
  }
}
```

它是轮询任务的空闲等待代码，上面的sigLock.wait(timeUntilContinue)就对应了前面的Object.wait()。

### 3. jmap（Memory Map）和jhat（Java Heap Analysis Tool）

jmap用来查看堆内存使用状况，一般结合jhat使用。

jmap语法格式如下：

```java
jmap [option] pid
jmap [option] executable core
jmap [option] [server-id@]remote-hostname-or-ip
```

如果运行在64位JVM上，可能需要指定-J-d64命令选项参数。

**1、** 打印进程的类加载器和类加载器加载的持久代对象信息，输出：类加载器名称、对象是否存活（不可靠）、对象地址、父类加载器、已加载的类大小等信息，如下图：

jmap -permstat pid

**2、** 使用jmap -heap pid查看进程堆内存使用情况，包括使用的GC算法、堆配置参数和各代中堆内存使用情况。比如下面的例子：

jmap -heap pid

```java
[root@storm-master home]# jmap -heap 2860
Attaching to process ID 2860, please wait...
Debugger attached successfully.
Server compiler detected.
JVM version is 20.45-b01
using thread-local object allocation.
Mark Sweep Compact GC
Heap Configuration:
   MinHeapFreeRatio = 40
   MaxHeapFreeRatio = 70
   MaxHeapSize      = 257949696 (246.0MB)
   NewSize          = 1310720 (1.25MB)
   MaxNewSize       = 17592186044415 MB
   OldSize          = 5439488 (5.1875MB)
   NewRatio         = 2
   SurvivorRatio    = 8
   PermSize         = 21757952 (20.75MB)
   MaxPermSize      = 85983232 (82.0MB)
Heap Usage:
New Generation (Eden + 1 Survivor Space):
   capacity = 12189696 (11.625MB)
   used     = 6769392 (6.4557952880859375MB)
   free     = 5420304 (5.1692047119140625MB)
   55.53372290826613% used
Eden Space:
   capacity = 10878976 (10.375MB)
   used     = 6585608 (6.280525207519531MB)
   free     = 4293368 (4.094474792480469MB)
   60.53518272307982% used
From Space:
   capacity = 1310720 (1.25MB)
   used     = 183784 (0.17527008056640625MB)
   free     = 1126936 (1.0747299194335938MB)
   14.0216064453125% used
To Space:
   capacity = 1310720 (1.25MB)
   used     = 0 (0.0MB)
   free     = 1310720 (1.25MB)
   0.0% used
tenured generation:
   capacity = 26619904 (25.38671875MB)
   used     = 15785896 (15.054603576660156MB)
   free     = 10834008 (10.332115173339844MB)
   59.30110040967841% used
Perm Generation:
   capacity = 33554432 (32.0MB)
   used     = 33323352 (31.779624938964844MB)
   free     = 231080 (0.22037506103515625MB)
   99.31132793426514% used
```

**3、** 查看堆内存中的对象数目、大小统计直方图，如果带上live则只统计活对象：

jmap -histo[:live] pid

```java
root@ubuntu:/# jmap -histo:live 21711 | more
 num    instances        bytes  class name
----------------------------------------------
   1:         38445        5597736  <constMethodKlass>
   2:         38445        5237288  <methodKlass>
   3:          3500        3749504  <constantPoolKlass>
   4:         60858        3242600  <symbolKlass>
   5:          3500        2715264  <instanceKlassKlass>
   6:          2796        2131424  <constantPoolCacheKlass>
   7:          5543        1317400  [I
   8:         13714        1010768  [C
   9:          4752        1003344  [B
  10:          1225         639656  <methodDataKlass>
  11:         14194         454208  java.lang.String
  12:          3809         396136  java.lang.Class
  13:          4979         311952  [S
  14:          5598         287064  [[I
  15:          3028         266464  java.lang.reflect.Method
  16:           280         163520  <objArrayKlassKlass>
  17:          4355         139360  java.util.HashMap$Entry
  18:          1869         138568  [Ljava.util.HashMap$Entry;
  19:          2443          97720  java.util.LinkedHashMap$Entry
  20:          2072          82880  java.lang.ref.SoftReference
  21:          1807          71528  [Ljava.lang.Object;
  22:          2206          70592  java.lang.ref.WeakReference
  23:           934          52304  java.util.LinkedHashMap
  24:           871          48776  java.beans.MethodDescriptor
  25:          1442          46144  java.util.concurrent.ConcurrentHashMap$HashEntry
  26:           804          38592  java.util.HashMap
  27:           948          37920  java.util.concurrent.ConcurrentHashMap$Segment
  28:          1621          35696  [Ljava.lang.Class;
  29:          1313          34880  [Ljava.lang.String;
  30:          1396          33504  java.util.LinkedList$Entry
  31:           462          33264  java.lang.reflect.Field
  32:          1024          32768  java.util.Hashtable$Entry
  33:           948          31440  [Ljava.util.concurrent.ConcurrentHashMap$HashEntry;
```

class name是对象类型，说明如下：

```java
B  byte
C  char
D  double
F  float
I  int
J  long
Z  boolean
[  数组，如[I表示int[]
[L+类名 其他对象
```

还有一个很常用的情况是：用jmap把进程内存使用情况dump到文件中，再用jhat分析查看。jmap进行dump命令格式如下：

```java
jmap -dump:format=b,file=dumpFileName
```

一样地对上面进程ID为21711进行Dump：

```java
root@ubuntu:/# jmap -dump:format=b,file=/tmp/dump.dat 21711     
Dumping heap to /tmp/dump.dat ...
Heap dump file created
```

dump出来的文件可以用MAT、VisualVM等工具查看，这里用jhat查看：

```java
root@ubuntu:/# jhat -port 9998 /tmp/dump.dat
Reading from /tmp/dump.dat...
Dump file created Tue Jan 28 17:46:14 CST 2014
Snapshot read, resolving...
Resolving 132207 objects...
Chasing references, expect 26 dots..........................
Eliminating duplicate references..........................
Snapshot resolved.
Started HTTP server on port 9998
Server is ready.
```

然后就可以在浏览器中输入主机地址:9998查看了：

### 4.jstat（JVM统计监测工具）

看看各个区内存和GC的情况

stat [ generalOption | outputOptions vmid [interval[s|ms] [count]] ]

vmid是Java虚拟机ID，在Linux/Unix系统上一般就是进程ID。interval是采样时间间隔。count是采样数目。比如下面输出的是GC信息，采样时间间隔为250ms，采样数为6：

```java
[root@storm-master Desktop]# jstat -gc 2860 250 6  
```

```java
S0C、S1C、S0U、S1U：Survivor 0/1区容量（Capacity）和使用量（Used）  
EC、EU：Eden区容量和使用量  
OC、OU：年老代容量和使用量  
PC、PU：永久代容量和使用量  
YGC、YGT：年轻代GC次数和GC耗时  
FGC、FGCT：Full GC次数和Full GC耗时  
GCT：GC总耗时  
```

### 5.jinfo

jinfo是jdk自带的命令，用来查看jvm的配置参数。通常会先使用jps查看java进程的id，然后使用jinfo查看指定pid的jvm信息

jinfo -flags process_id

```java
jps
```

```java
4704 Launcher
9680 RemoteMavenServer
4116
13052 Jps
```

```java
jinfo -flags 9680
```

```java
Debugger attached successfully.
Server compiler detected.
JVM version is 25.91-b15
Non-default VM flags: -XX:CICompilerCount=4 -XX:InitialHeapSize=268435456 -XX:MaxHeapSize=805306368 -XX:MaxNewSize=268435456 -XX:MinHeapDeltaBytes=524288 -XX:NewSize=89128960 -XX:OldSize=179306496 -XX:+UseCompressedClassPointers -XX:+UseCompressedOops -XX:+UseFastUnorderedTimeStamps -XX:-UseLargePagesIndividualAllocation -XX:+UseParallelGC
Command line:  -Djava.awt.headless=true -Didea.version==2017.1.1 -Xmx768m -Didea.maven.embedder.version=3.2.5 -Dfile.encoding=GBK
```

### 6.hprof（Heap/CPU Profiling Tool）

hprof能够展现CPU使用率，统计堆内存使用情况。

2SE中提供了一个简单的命令行工具来对java程序的cpu和heap进行 profiling，叫做HPROF。HPROF实际上是JVM中的一个native的库，它会在JVM启动的时候通过命令行参数来动态加载，并成为 JVM进程的一部分。若要在java进程启动的时候使用HPROF，用户可以通过各种命令行参数类型来使用HPROF对java进程的heap或者 （和）cpu进行profiling的功能。HPROF产生的profiling数据可以是二进制的，也可以是文本格式的。这些日志可以用来跟踪和分析 java进程的性能问题和瓶颈，解决内存使用上不优的地方或者程序实现上的不优之处。二进制格式的日志还可以被JVM中的HAT工具来进行浏览和分析，用 以观察java进程的heap中各种类型和数据的情况。在J2SE 5.0以后的版本中，HPROF已经被并入到一个叫做Java Virtual Machine Tool Interface（JVM TI）中。

```java
java -agentlib:hprof[=options] ToBeProfiledClass  
java -Xrunprof[:options] ToBeProfiledClass  
javac -J-agentlib:hprof[=options] ToBeProfiledClass  
```

```java
Option Name and Value  Description                    Default  
---------------------  -----------                    -------  
heap=dump|sites|all    heap profiling                 all  
cpu=samples|times|old  CPU usage                      off  
monitor=y|n            monitor contention             n  
format=a|b             text(txt) or binary output     a  
file=<file>            write data to file             java.hprof[.txt]  
net=<host>:<port>      send data over a socket        off  
depth=<size>           stack trace depth              4  
interval=<ms>          sample interval in ms          10  
cutoff=<value>         output cutoff point            0.0001  
lineno=y|n             line number in traces?         y  
thread=y|n             thread in traces?              n  
doe=y|n                dump on exit?                  y  
msa=y|n                Solaris micro state accounting n  
force=y|n              force output to <file>         y  
verbose=y|n            print messages about dumps     y  
```

-Get sample cpu information every 20 millisec, with a stack depth of 3:

java -agentlib:hprof=cpu=samples,interval=20,depth=3 classname

-Get heap usage information based on the allocation sites:

java -agentlib:hprof=heap=sites classname

上面每隔20毫秒采样CPU消耗信息，堆栈深度为3，生成的profile文件名称是java.hprof.txt，在当前目录。

默认情况下，java进程profiling的信息（sites和dump）都会被 写入到一个叫做java.hprof.txt的文件中。大多数情况下，该文件中都会对每个trace，threads，objects包含一个ID，每一 个ID代表一个不同的观察对象。通常，traces会从300000开始。 默认，force=y，会将所有的信息全部输出到output文件中，所以如果含有 多个JVMs都采用的HRPOF enable的方式运行，最好将force=n，这样能够将单独的JVM的profiling信息输出到不同的指定文件。 interval选项只在 cpu=samples的情况下生效，表示每隔多少毫秒对java进程的cpu使用情况进行一次采集。 msa选项仅仅在Solaris系统下才有效， 表示会使用Solaris下的Micro State Accounting功能 .
