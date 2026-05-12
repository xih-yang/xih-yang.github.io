# 31、JVM 调优实战 - 硬核技能：JVM的Young GC日志查看方法
- 来源：https://ddkk.com/zhuanlan/java/jvm/8/31.html
- 分类：JVM 实战
- 分组：教程目录
## 1. 程序运行采用的默认JVM参数如何查看？

在GC日志中，可以看到如下内容：

> CommandLine flags: -XX:InitialHeapSize=10485760 -XX:MaxHeapSize=10485760 -XX:MaxNewSize=5242880 ……

这就是告诉你这次运行程序采取的JVM参数是什么，基本都是我们设置的，同时还有一些参数默认就给设置了，不过一般关系不大。

如果没有设置JVM参数，而想看系统用的默认JVM参数，只需要给JVM加一段打印GC日志的参数，就可以在这里看到他默认会给你的JVM进程分配多大的内存空间了。默认给的内存是很小的。

## 2. 一次GC的概要说明

接着看GC日志中的如下一行：

> 0.112: [GC (Allocation Failure) 0.112: [ParNew: 3930K->512K(4608K), 0.0016424 secs] 3930K->551K(9728K), 0.0018267 secs] [Times: user=0.00 sys=0.00, real=0.00 secs]

这个就是概要说明了**本次GC的执行情况**。

GC(Allocation Failure），看字面意思就可以知道，为啥会发生一次GC？

从原来的图中可以看出，要分配一个2MB的数组，结果Eden区内存不够了，所以就出现了 “Allocation Failure”，也就是对象分配失败。

所以此时就要触发一次Young GC。

**那这次GC是什么时候发生的呢？**

这很简单，看一个数字，“0.112” ，这个意思就是你的系统运行过后过了多少秒发生了本次GC，比如这里就是大概系统运行之后大概100多毫秒，发生了本次GC。

> ParNew: 3930K->512K(4608K), 0.0016424 secs

这个“ParNew” 的意思是，触发的是年轻代的Young GC，所以是用我们指定的ParNew 垃圾回收器执行GC的。

> 3930K->512K(4608K)

这个代表的意思是，年轻代可用空间是4608KB，也就是4.5MB。

之所以是4.5MB，是因为，Eden区是4MB，两个Survivor区中只有一个是可以放存活对象的，另外一个是必须一直保持空闲的，所以它考虑年轻代的可用空间，就是 Eden+1个Survivor的大小，也就是4.5MB。

然后3930K->512K，也死就是对年轻代执行了一次GC，GC之前使用了3930KB了，但是GC之后只有512KB的对象是存活下来的。

**0、** 0016424secs，这个就是本次GC耗费的时间，看这里来说大概耗费了1.6ms，仅仅是回收3MB的对象而已；

> 3930K->551K(9728K), 0.0018267 secs

这段话指的是整个Java堆内存的情况。意思是整个Java堆内存是总可用空间9728KB(9.5MB)，其实就是年轻代4.5MB+老年代5MB，然后GC前整个Java堆内存里使用了3930KB，GC之后Java堆内存使用了551KB。

> Times: user=0.00 sys=0.00, real=0.00 secs

这个意思就是本次GC消耗的时间，可以看出，这里最小单位是小数点之后两位，但是这里全部是0.00 secs，也就是说本次GC就耗费了几毫秒，所以从秒为单位来看，几乎是0。

## 3. 图解GC执行过程

第一个问题，看这行日志，ParNew: 3930K->512K(4608K), 0.0016424 secs

要知道，在GC之前。明明在Eden区里就放了3个1MB的数组，一共是3MB，也就是3072KB的对象，那么GC之前年轻代应该是使用了3072KB的内存才对，为什么确实用了3930KB的内存呢？

关于这个问题，有两点需要了解：

**1、** 程序创建的数组本身虽然是1MB，但是为了存储这个数组，JVM内置还会附带一些其他信息，所以每个数组实际占用个内存是大于1MB的；

**2、** 其次，除了你自己创建的对象外，可能还有一些看不见的对象在Eden区里，至于这些看不见的未知对象是什么，是可以使用专门的工具分析堆内存快照去了解的；

如下图，GC之前，三个数组和其他一些未知对象加起来，就是占据了3930KB的内存。

接着想要在Eden分配一个2MB的数组，此时肯定触发了 “Allocation Failure”，对象分配失败，就触发了Young GC。

然后ParNew执行垃圾回收，回收掉之前我们创建的三个数组，此时因为他们都没人引用了，一定是垃圾对象，如下图：

然后继续看GC日志，ParNew: 3930K->512K(4608K), 0.0016424 secs

gc回收之后，从3930KB内存使用降低到了512KB的内存使用。也就是说这次GC日志有512KB的对象存活了下来，从Eden区转移到了Survivor1区，又称为 Survivor From区，另外一个Survivor叫做 Survivor To区，如下图：

结合GC日志可以看出，这就是本次GC的全过程。

## 4. GC过后的堆内存使用情况

接着看下面的GC日志：

> Heap
>
> par new generation total 4608K, used 2601K [0x00000000ff600000, 0x00000000ffb00000, 0x00000000ffb00000)
>
> eden space 4096K, 51% used [0x00000000ff600000, 0x00000000ff80a558, 0x00000000ffa00000)
>
> from space 512K, 100% used [0x00000000ffa80000, 0x00000000ffb00000, 0x00000000ffb00000)
>
> to space 512K, 0% used [0x00000000ffa00000, 0x00000000ffa00000, 0x00000000ffa80000)
>
> concurrent mark-sweep generation total 5120K, used 39K [0x00000000ffb00000, 0x0000000100000000, 0x0000000100000000)
>
> Metaspace used 2651K, capacity 4486K, committed 4864K, reserved 1056768K
>
> class space used 286K, capacity 386K, committed 512K, reserved 1048576K

这段日志是在JVM退出的时候打印出来的当前堆内存的使用情况。先看如下片段：

> par new generation total 4608K, used 2601K [0x00000000ff600000, 0x00000000ffb00000, 0x00000000ffb00000)
>
> eden space 4096K, 51% used [0x00000000ff600000, 0x00000000ff80a558, 0x00000000ffa00000)
>
> from space 512K, 100% used [0x00000000ffa80000, 0x00000000ffb00000, 0x00000000ffb00000)
>
> to space 512K, 0% used [0x00000000ffa00000, 0x00000000ffa00000, 0x00000000ffa80000)

parnew generation total 4608K, used 2601K ，这就是说 “ParNew” 垃圾回收器负责的年轻代总共有4608KB(4.5MB) 可用内存，目前是使用了 2601KB(2.5MB)。

思考个问题，此时在JVM退出之前，为什么年轻代占用了2.5MB的内存。

简单来说，在GC之后，我们通过如下代码又分配了一个2MB的数组： byte[] array2 = new byte[2 * 1024 * 1024];

所以此时在Eden区中一定会有一个2MB的数组，也就是2048KB，然后上次GC之后在From Survivor区中存活了一个512KB的对象。

此时可以知道， 2048KB +512KB = 2560KB。**但是之前说过年轻代使用了2601KB，那么又是为什么**？

前面说过了一个数组它会额外占据一些内存来存放一些自己这个对象的元数据，所以可以认为多出来的41KB可以是数组对象额外使用的内存空间。

如下图所示：

接着继续看GC日志：

> eden space 4096K, 51% used [0x00000000ff600000, 0x00000000ff80a558, 0x00000000ffa00000)
>
> from space 512K, 100% used [0x00000000ffa80000, 0x00000000ffb00000, 0x00000000ffb00000)
>
> to space 512K, 0% used [0x00000000ffa00000, 0x00000000ffa00000, 0x00000000ffa80000)

通过GC日志可以验证我们的推测是完全准确的，这里说的很清晰了，Eden区此时4MB的内存被使用了51%，就是因为有一个2MB的数组在里面。

然后From Survivor区，512KB是100% 的使用率，此时被之前GC后存活下来的512KB的未知对象给占据了。

接着看GC日志：

> concurrent mark-sweep generation total 5120K, used 39K [0x00000000ffb00000, 0x0000000100000000, 0x0000000100000000)
>
> Metaspace used 2651K, capacity 4486K, committed 4864K, reserved 1056768K
>
> class space used 286K, capacity 386K, committed 512K, reserved 1048576K

concurrent mark-sweep generation total 5120K, used 39K ，这个很简单，就是说Concurrent Mark-Sweep垃圾回收器，也就是CMS垃圾回收器，管理的老年代内存空间一共是5MB，此时使用了62KB的空间。

> Metaspace used 2651K, capacity 4486K, committed 4864K, reserved 1056768K
>
> class space used 286K, capacity 386K, committed 512K, reserved 1048576K

上述两段日志也很简单，意思就是Metaspace元数据空间和Class空间，存放一些类信息、常量池之类的东西，此时他们的总容量，使用内存，等等。
