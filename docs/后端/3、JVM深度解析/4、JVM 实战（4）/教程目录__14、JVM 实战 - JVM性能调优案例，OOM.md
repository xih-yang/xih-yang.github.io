# 14、JVM 实战 - JVM性能调优案例，OOM
- 来源：https://ddkk.com/zhuanlan/java/jvm/4/14.html
- 分类：JVM 实战
- 分组：教程目录
## 一、堆溢出

### 报错信息

java.lang.OutOfMemoryError: Java heap space

### 参数配置

-XX:+PrintGCDetails -XX: MetaspaceSize=64m

-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=heap/heapdump.hprof

-XX:+PrintGCDateStamps -Xms200M -Xmx200M -Xloggc:log/gc-oomHeap.log

### 日志分析工具

在线网站 https://gceasy.io/

jdk自带的 Visual VM，在jdk的bin文件下

### 原因

**1、** 代码中可能存在大对象分配；

**2、** 可能存在内存泄漏，导致在多次GC之后，还是无法找到一块足够大的内存容纳当前对象；

### 解决方法

**1、** 检查是否存在大对象的分配，最有可能的是大数组分配；

**2、** 通过jmap命令，把堆内存dump下来，使用MAT等工具分析一下，检查是否存在内存泄漏的问题；

**3、** 如果没有找到明显的内存泄漏，使用-Xmx加大堆内存；

**4、** 还有一点容易被忽略，检查是否有大量的自定义的Finalizable对象，也有可能是框架内部提供的，考虑其存在的必要性；

## 二、元空间溢出

### 元空间存储数据类型

方法区（Method Area）与 Java堆一样，是各个线程共享的内存区域，它用于存储已被虚拟机加载的类信息、常量、即时编译器编译后的代码等数据。虽然Java 虚拟机规范把方法区描述为堆的一个逻辑部分，但是它却有一个别名叫做 Non-Heap（非堆〉，目的应该是与Java堆区分开来。

Java虚拟机规范对方法区的限制非常宽松，除了和 Java 堆一样不需要连续的内存和可以选择固定大小或者可扩展外，还可以选择不实现垃圾收集。垃圾收集行为在这个区域是比较少出现的，其内存回收目标主要是针对常量池的回收和对类型的卸载。当方法区无法满足内存分配需求时，将抛出 OutOfMemoryError异常。

### 报错信息

java.lang.OutOfMemoryError: Metaspace

### 参数配置

-XX:+PrintGCDetails -XX:MetaspaceSize=60m-XX:MaxMetaspaceSize=60m

-Xss512K -XX:+HeapDumpOnOutOfMemoryError

-XX:HeapDumpPath=heap/heapdumpMeta.hprof -XX:SurvivorRatio=8

-XX:+TraceClassLoading -XX:+TraceClassUnloading -XX:+PrintGCDateStamps

-Xms60M -Xmx60M -Xloggc:log/gc-oomMeta.log

### 原因

**1、** 运行期间生成了大量的代理类，导致方法区被撑爆，无法卸载；

**2、** 应用长时间运行，没有重启；

**3、** 元空间内存设置过小；

### 解决方法

**1、** 检查是否永久代空间或者元空间设置的过小；

**2、** 检查代码中是否存在大量的反射操作；

**3、** dump之后通过mat检查是否存在大量由于反射生成的代理类；

## 三、GC overhead limit exceeded

### 原因

这个是JDK6新加的错误类型，一般都是堆太小导致的。Sun官方对此的定义:超过98%的时间用来做GC并且回收了不到2%的堆内存时会抛出此异常。本质是一个预判性的异常，抛出该异常时系统没有真正的内存溢出。

### 解决方法

**1、** 检查项目中是否有大量的死循环或有使用大内存的代码，优化代码；

**2、** 添加参数`-XX:-UseGCOverheadLimit`禁用这个检查，其实这个参数解决不了内存问题，只是把错误的信息延后，最终出现java.lang.OutOfMemoryError:Javaheapspace；

**3、** dump内存，检查是否存在内存泄漏，如果没有，加大内存；

## 四、线程溢出

### 报错信息

java.lang.OutOfMemoryError : unable tocreate new native Thread

### 原因

出现这种异常，基本上都是创建了大量的线程导致的

### 解决方法

方向一：

- 通过-Xss设置每个线程栈大小的容量
- JDK5.0以后每个线程堆栈大小为1M，以前每个线程堆栈大小为256K。
- 正常情况下，在相同物理内存下，减小这个值能生成更多的线程。但是操作系统对一个进程内的线程数还是有限制的，不能无限生成，经验值在3000~5000左右。
- 能创建的线程数的具体计算公式：(MaxProcessMemory - JVMMemory - ReservedOsMemory) / (ThreadStackSize) = Numberof threads。
- MaxProcessMemory，进程可寻址的最大空间。32位系统为2的32次方=4GB，64=2的64次方=几乎无穷大

JVMMemory，JVM内存

ReservedOsMemory，保留的操作系统内存

ThreadStackSize，线程栈的大小

方向二：

线程总数也受到系统空闲内存和操作系统的限制，检查是否该系统下有此限制：

- /procsys/kernel/pid_max，系统最大pid值，在大型系统里可适当调大
- /proc/sys/kernel/threads-max，系统允许的最大线程数
- maxus rprocess (ulimit -u)，系统限制某用户下最多可以运行多少进程或线程
- /proc/sys/vm/max_map__count
