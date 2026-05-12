# 11、JVM 实战 - Jstat-资源和性能等监控、jmap-查看jvm参数设置以及内存使用情况、jinfo基础用法
- 来源：https://ddkk.com/zhuanlan/java/jvm/2/11.html
- 分类：JVM 实战
- 分组：教程目录
## 一、jstat概述

Jstat 是JDK自带的一个轻量级小工具。全称“Java Virtual Machine statistics monitoring tool”，它位于java的bin目录下，主要利用JVM内建的指令对Java应用程序的资源和性能进行实时的命令行的监控，包括了对Heap size和垃圾回收状况的监控。可见，Jstat是轻量级的、专门针对JVM的工具，非常适用。由于JVM内存设置较大，图中百分比变化不太明显

一个极强的监视VM内存工具。可以用来监视VM内存内的各种堆和非堆的大小及其内存使用量。

jstat工具特别强大，有众多的可选项，详细查看堆内各个部分的使用量，以及加载类的数量。使用时，需加上查看进程的进程id，和所选参数。

执行：cd $JAVA_HOME/bin中执行jstat，注意jstat后一定要跟参数。

## 1.1、语法结构：

Usage: jstat -help|-options

jstat - [-t] [-h]  [ []]

jstat [-命令选项] [vmid] [间隔时间/毫秒] [查询次数]

参数解释：

Options — 选项，我们一般使用 -gcutil 查看gc情况

vmid — VM的进程号，即当前运行的java进程号

interval– 间隔时间，单位为秒或者毫秒

count — 打印次数，如果缺省则打印无数次

示例：jstat -gcutil 15670 1000 10

## 1.2、具体使用

其中Pid获取

window下：jps

linux：jps或ps -ef | grep java

### 1》垃圾回收统计： jstat -gc pid

```java
S0C：第一个幸存区的大小
S1C：第二个幸存区的大小
S0U：第一个幸存区的使用大小
S1U：第二个幸存区的使用大小
EC：伊甸园区的大小
EU：伊甸园区的使用大小
OC：老年代大小
OU：老年代使用大小
MC：方法区大小
MU：方法区使用大小
CCSC:压缩类空间大小
CCSU:压缩类空间使用大小
YGC：年轻代垃圾回收次数
YGCT：年轻代垃圾回收消耗时间
FGC：老年代垃圾回收次数
FGCT：老年代垃圾回收消耗时间
GCT：垃圾回收消耗总时间
```

### 2》堆内存统计：jstat -gccapacity pid

可以显示，VM内存中三代（young,old,perm）对象的使用和占用大小，

如：PGCMN显示的是最小perm的内存使用量，PGCMX显示的是perm的内存最大使用量，

PGC是当前新生成的perm内存占用量，PC是但前perm内存占用量。

其他的可以根据这个类推， OC是old内纯的占用量。

```java
NGCMN：新生代最小容量
NGCMX：新生代最大容量
NGC：当前新生代容量
S0C：第一个幸存区大小
S1C：第二个幸存区的大小
EC：伊甸园区的大小
OGCMN：老年代最小容量
OGCMX：老年代最大容量
OGC：当前老年代大小
OC:当前老年代大小
MCMN:最小元数据容量
MCMX：最大元数据容量
MC：当前元数据空间大小
CCSMN：最小压缩类空间大小
CCSMX：最大压缩类空间大小
CCSC：当前压缩类空间大小
YGC：年轻代gc次数
FGC：老年代GC次数
```

### 3》统计gc信息统计:jstat -gcutil pid

```java
S0：幸存1区当前使用比例
S1：幸存2区当前使用比例
E：伊甸园区使用比例
O：老年代使用比例
M：元数据区使用比例
CCS：压缩使用比例
YGC：年轻代垃圾回收次数
FGC：老年代垃圾回收次数
FGCT：老年代垃圾回收消耗时间
GCT：垃圾回收消耗总时间
```

示例：jstat -gcutil 15670 1000 10

```java
  S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT   
  0.00   0.00  10.00   0.00  17.63  19.90      0    0.000     0    0.000    0.000
```

### 4》新生代垃圾回收统计：jstat -gcnew pid

```java
S0C：第一个幸存区大小
S1C：第二个幸存区的大小
S0U：第一个幸存区的使用大小
S1U：第二个幸存区的使用大小
TT:对象在新生代存活的次数
MTT:对象在新生代存活的最大次数
DSS:期望的幸存区大小
EC：伊甸园区的大小
EU：伊甸园区的使用大小
YGC：年轻代垃圾回收次数
YGCT：年轻代垃圾回收消耗时间
```

### 5》新生代内存统计：jstat -gcnewcapacity pid

```java
NGCMN：新生代最小容量
NGCMX：新生代最大容量
NGC：当前新生代容量
S0CMX：最大幸存1区大小
S0C：当前幸存1区大小
S1CMX：最大幸存2区大小
S1C：当前幸存2区大小
ECMX：最大伊甸园区大小
EC：当前伊甸园区大小
YGC：年轻代垃圾回收次数
FGC：老年代回收次数
```

### 6》老年代垃圾回收统计：jstat -gcold pid

```java
MC：方法区大小
MU：方法区使用大小
CCSC:压缩类空间大小
CCSU:压缩类空间使用大小
OC：老年代大小
OU：老年代使用大小
YGC：年轻代垃圾回收次数
FGC：老年代垃圾回收次数
FGCT：老年代垃圾回收消耗时间
GCT：垃圾回收消耗总时间
```

### 7》老年代内存统计：jstat -gcoldcapacity pid

```java
OGCMN：老年代最小容量
OGCMX：老年代最大容量
OGC：当前老年代大小
OC：老年代大小
YGC：年轻代垃圾回收次数
FGC：老年代垃圾回收次数
FGCT：老年代垃圾回收消耗时间
GCT：垃圾回收消耗总时间
```

### 8》持久代：jstat -gcpermcapacity pid

perm对象的信息及其占用量。

### 9》类加载统计：jstat -class pid

```java
Loaded:加载class的数量
Bytes：所占用空间大小
Unloaded：未加载数量
Bytes:未加载占用空间
Time：时间　
```

### 10》编译统计：jstat -compiler pid

```java
Compiled：编译数量。
Failed：失败数量
Invalid：不可用数量
Time：时间
FailedType：失败类型
FailedMethod：失败的方法
```

### 11》JVM编译方法统计：jstat -printcompilation pid

```java
Compiled：最近编译方法的数量
Size：最近编译方法的字节码数量
Type：最近编译方法的编译类型。
Method：方法名标识。
```

### 12、jstat -gcmetacapacity pid元数据空间统计

```java
MCMN:最小元数据容量
MCMX：最大元数据容量
MC：当前元数据空间大小
CCSMN：最小压缩类空间大小
CCSMX：最大压缩类空间大小
CCSC：当前压缩类空间大小
YGC：年轻代垃圾回收次数
FGC：老年代垃圾回收次数
FGCT：老年代垃圾回收消耗时间
GCT：垃圾回收消耗总时间
```

## 1.3、术语的中文解释：

S0C：年轻代中第一个survivor（幸存区）的容量 (字节)

S1C：年轻代中第二个survivor（幸存区）的容量 (字节)

S0U：年轻代中第一个survivor（幸存区）目前已使用空间 (字节)

S1U：年轻代中第二个survivor（幸存区）目前已使用空间 (字节)

EC：年轻代中Eden（伊甸园）的容量 (字节)

EU：年轻代中Eden（伊甸园）目前已使用空间 (字节)

OC：Old代的容量 (字节)

OU：Old代目前已使用空间 (字节)

PC：Perm(持久代)的容量 (字节)

PU：Perm(持久代)目前已使用空间 (字节)

YGC：从应用程序启动到采样时年轻代中gc次数

YGCT：从应用程序启动到采样时年轻代中gc所用时间(s)

FGC：从应用程序启动到采样时old代(全gc)gc次数

FGCT：从应用程序启动到采样时old代(全gc)gc所用时间(s)

GCT：从应用程序启动到采样时gc用的总时间(s)

NGCMN：年轻代(young)中初始化(最小)的大小 (字节)

NGCMX：年轻代(young)的最大容量 (字节)

NGC：年轻代(young)中当前的容量 (字节)

OGCMN：old代中初始化(最小)的大小 (字节)

OGCMX：old代的最大容量 (字节)

OGC：old代当前新生成的容量 (字节)

PGCMN：perm代中初始化(最小)的大小 (字节)

PGCMX：perm代的最大容量 (字节)

PGC：perm代当前新生成的容量 (字节)

S0：年轻代中第一个survivor（幸存区）已使用的占当前容量百分比

S1：年轻代中第二个survivor（幸存区）已使用的占当前容量百分比

E：年轻代中Eden（伊甸园）已使用的占当前容量百分比

O：old代已使用的占当前容量百分比

P：perm代已使用的占当前容量百分比

M：元数据区使用比例

S0CMX：年轻代中第一个survivor（幸存区）的最大容量 (字节)

S1CMX ：年轻代中第二个survivor（幸存区）的最大容量 (字节)

ECMX：年轻代中Eden（伊甸园）的最大容量 (字节)

DSS：当前需要survivor（幸存区）的容量 (字节)（Eden区已满）

TT：持有次数限制

MTT： 最大持有次数限制

## 二、Jmap

### 1、jmap -heap pid

查看jvm参数设置以及内存使用情况

```java
jmap -heap 29310
Attaching to process ID 29310, please wait...
Debugger attached successfully.
Server compiler detected.
JVM version is 25.111-b14
using thread-local object allocation.
Parallel GC with 4 thread(s)
Heap Configuration:
   MinHeapFreeRatio         = 0
   MaxHeapFreeRatio         = 100
   MaxHeapSize              = 2099249152 (2002.0MB)
   NewSize                  = 44040192 (42.0MB)
   MaxNewSize               = 699400192 (667.0MB)
   OldSize                  = 88080384 (84.0MB)
   NewRatio                 = 2
   SurvivorRatio            = 8
   MetaspaceSize            = 21807104 (20.796875MB)
   CompressedClassSpaceSize = 1073741824 (1024.0MB)
   MaxMetaspaceSize         = 17592186044415 MB
   G1HeapRegionSize         = 0 (0.0MB)
Heap Usage:
PS Young Generation
Eden Space:
   capacity = 680525824 (649.0MB)
   used     = 472830496 (450.9263000488281MB)
   free     = 207695328 (198.07369995117188MB)
   69.48016949904901% used
From Space:
   capacity = 9437184 (9.0MB)
   used     = 8669680 (8.268051147460938MB)
   free     = 767504 (0.7319488525390625MB)
   91.86723497178819% used
To Space:
   capacity = 9437184 (9.0MB)
   used     = 0 (0.0MB)
   free     = 9437184 (9.0MB)
   0.0% used
PS Old Generation
   capacity = 612892672 (584.5MB)
   used     = 180096000 (171.7529296875MB)
   free     = 432796672 (412.7470703125MB)
   29.38459019461078% used
43745 interned Strings occupying 4936472 bytes.
```

从结构上分为几个部分：HeapConfiguration、Heap Usage，其中Heap Useage又分为PS Young Generation和PS Old Generation，PS Young Generation又分为Eden Space\From Space\To space，所以可以看出这个命令也主要是围绕GC操纵空间堆来的，包括堆的基本配置以及堆的使用情况，这个命令其实很实用，上面就是配置下面就是实用情况，当堆内存不足的时候可以很直观的看出哪个参数设置得不合理，如果看堆设置没看出有什么问题，那么再结合jstat -gcutil pid看看垃圾回收情况，差不多就能看出大概是什么原因导致堆内存溢出了。

新生代的内存回收就是采用空间换时间的方式；

如果from区使用率一直是100% 说明程序创建大量的短生命周期的实例，使用jstat统计一下jvm在内存回收中发生的频率耗时以及是否有full gc，使用这个数据来评估一内存配置参数、gc参数是否合理；

多次ygc后如果s区没变化，这种情况不出意外就是担保了，可以jstat持续观察下；

根据打印的结果：默认存活区与eden比率=2：8

1、查看eden区：649M

2、两个存活区大小：都为9M

3、年轻代大小：300M

4、老年代大小：400M

5、持久代大小：100M

6、最大堆内存大小：年轻代大小+老年代大小=700M

7、java应用程序占用内存大小：最大堆内存大小+持久代大小=700M+100M=800M

### 2、jmap pid

打印出某个java进程内存内的所有对象的情况，如：产生了哪些对象以及数量

### 3、jmap -dump:format=b,file=heap.bin pid

format 格式，这里b是二进制的意思 ；file 保存路径及文件名；pid 进程号

这个命令会在当前路径生成一个名为heap.bin的二进制内存dump文件，这种文件有专门的分析工具如jvirsual Vm ,mat等

jmap -dump:format=b,file=outfile 3024 可以将3024进程的内存heap输出出来到outfile文件里，再配合MAT（内存分析工具(Memory Analysis Tool）或与jhat (Java Heap Analysis Tool)一起使用，能够以图像的形式直观的展示当前内存是否有问题。

从安全点日志看，从Heap Dump开始，整个JVM都是停顿的，考虑到IO（虽是写到Page Cache，但或许会遇到background flush），几G的Heap可能产生几秒的停顿，在生产环境上执行时谨慎再谨慎。

live的选项，实际上是产生一次Full GC来保证只看还存活的对象。有时候也会故意不加live选项，看历史对象。

Dump出来的文件建议用JDK自带的VisualVM或Eclipse的MAT插件打开，对象的大小有两种统计方式：

- 本身大小(Shallow Size)：对象本来的大小。
- 保留大小(Retained Size)： 当前对象大小 + 当前对象直接或间接引用到的对象的大小总和。

看本身大小时，占大头的都是char[] ,byte[]之类的，没什么意思（用jmap -histo:live pid 看的也是本身大小）。所以需要关心的是保留大小比较大的对象，看谁在引用这些char[], byte[]。

(MAT能看的信息更多，但VisualVM胜在JVM自带，用法如下：命令行输入jvisualvm，文件->装入->堆Dump－>检查 -> 查找20保留大小最大的对象，就会触发保留大小的计算，然后就可以类视图里浏览，按保留大小排序了)

### 4、jmap -histo:live pid|less

堆中活动对象以及其大小

说明：instances（实例数）、bytes（大小）、classs name（类名）。它基本是按照使用使用大小逆序排列的。

```java
 num    instances        bytes  class name
----------------------------------------------
   1:          3640         281760  [C
   2:           476         164320  [B
   3:          3624          86976  java.lang.String
   4:           728          82880  java.lang.Class
   5:           651          39824  [Ljava.lang.Object;
   6:           636          25440  java.util.LinkedHashMap$Entry
……
 287:             1             16  sun.util.resources.LocaleData$LocaleDataResourceBundleControl
Total         12964         822808
```

从上面的信息可以看出排在前三位的分别是java.lang.String、java.lang.class以及java.util.LinkHashMap$Entry

```java
#instance 是对象的实例个数 
#bytes 是总占用的字节数 
class name 对应的就是 Class 文件里的 class 的标识 
B 代表 byte
C 代表 char
D 代表 double
F 代表 float
I 代表 int
J 代表 long
Z 代表 boolean
前边有 [ 代表数组， [I 就相当于 int[]
对象用 [L+ 类名表示
```

jmap -histo:live pid>a.log

可以观察heap中所有对象的情况（heap中所有生存的对象的情况）。包括对象数量和所占空间大小。 可以将其保存到文本中去，在一段时间后，使用文本对比工具，可以对比出GC回收了哪些对象。

jmap -histo:live 这个命令执行，JVM会先触发gc，然后再统计信息。

## 三、jinfo

可以输出并修改运行时的java进程信息，预发： jinfo --help

```java
Usage:
    jinfo [option] <pid>
        (to connect to running process)
    jinfo [option] <executable <core>
        (to connect to a core file)
    jinfo [option] [server_id@]<remote server IP or hostname>
        (to connect to remote debug server)
where <option> is one of:
    -flag <name>         to print the value of the named VM flag
    -flag [+|-]<name>    to enable or disable the named VM flag
    -flag <name>=<value> to set the named VM flag to the given value
    -flags               to print VM flags
    -sysprops            to print Java system properties
    <no option>          to print both of the above
    -h | -help           to print this help message
```

查看jvm参数：jinfo -flags

查看系统参数：jinfo -sysprops

虚拟机参数：java -XX:+PrintFlagsFinal -version | grep manageable

查看是否开启 GC 日志的打印：jinfo -flag PrintGC  或 jinfo -flag PrintGCDetails

打开日志：jinfo -flag +PrintGC 43520 或 jinfo -flag +PrintGCDetails 43520

关闭日志：jinfo -flag -PrintGC 43520 或 jinfo -flag -PrintGCDetails 43520
