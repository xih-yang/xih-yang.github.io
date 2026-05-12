# 15、JVM 实战 - 局部变量表
- 来源：https://ddkk.com/zhuanlan/java/jvm/6/15.html
- 分类：JVM 实战
- 分组：教程目录
在《[JVM 之1、 运行时数据区](https://blog.csdn.net/wuzhiwei549/article/details/80559845)》提到，虚拟机栈是 描述Java方法执行的内存模型：每个方法在执行的同时都会创建一个栈帧（Stack Frame）用于存储局部变量表、操作数栈、动态链接、方法出口等信息。本篇主要分析局部变量表的原理结构。

局部变量表是一组变量值存储空间，用于存放方法参数和方法内部定义的局部变量。在Java程序被编译为Class文件时，就在方法的Code属性的max_locals数据项中确定了方法所需要分配的最大局部变量表的容量。

局部变量表的容量以变量槽（Variable Slot）为最小单位，虚拟机规范中并没有明确指明一个Slot暂用的内存空间大小，只是很有“导向性”地说明每个Slot都应该能存放一个boolean,byte,char,short,int,float,refrence,returnAddress类型的数据，这种描述明确指出 “每个Slot占用32位长度的内存空间” 有一些差别，它允许Slot的长度随着处理器，操作系统或虚拟机的不同而发生变化。不过无论如何，即使在64位虚拟机中使用64位长度的内存空间来实现Slot,虚拟机仍要使用对齐和补白的手段让Slot在外观上看起来和32位虚拟机中得一致。

既然前面提到了数据类型，在此顺便说一下，一个Slot可以存放一个32位以内的数据类型，Java中用32位以内的数据类型有:boolean,byte,char,short,int,float,reference,returnAddress八种类型。reference是对象的引用。虚拟机规范即没有说明它的长度，也没有明确指出这个引用应由怎样的结构，一般来说，虚拟机实现至少都应当能从此引用中直接或间接的查找到对象在Java堆中得起始地址索引和方法区中得对象类型数据。而returnAddress是为字节码指令jsr,jsr_w 和 ret服务的。它指向了一条字节码指令的地址。

对于64位的数据类型，虚拟机会以高位在前的方式为其分配两个连续的Slot空间。Java语言中明确规定的64位的数据类型只有long和double数据类型分割存储的做法与"long和double的非原子性协定" 中把一次long 和double 数据类型读写分割为两次32位读写的做法类似，在阅读JAVA内存模型时对比下。不过，由于局部变量表建在线程的堆栈上，是线程私有的数据，无论读写两个连续的Slot是否是原子操作，都不会引起数据安全问题。

虚拟机通过索引定位的方式使用局部变量表，索引值的范围是从0开始到局部变量表最大的Slot数量。如果32位数据类型的变量，索引N就代表了使用第N个Slot，如果是64位数据类型的变量，则说明要使用第N个和N+1两个Slot。

在方法执行时，虚拟机是使用局部变量表完成参数值到参数变量列表的传递过程。如果是实例方法（非static的方法），那么局部变量表中第0位索引的Slot默认是用于传递方法所属对象实例的引用，在方法中可以通过关键字this来访问这个隐含的参数，其余参数则按照参数表的顺序来排列，暂用从1开始的局部变量Slot，参数表分配完毕后，在根据方法体内部定义的变量顺序和作用域分配其余的Slot。

局部变量表中得slot是可重用的，方法体定义的变量，其作用域并不一定会覆盖整个方法体，如果当前字节码PC计数器的值已经超过了某个变量的作用域，那么这个变量对应的Slot就可以交给其他变量使用。这样的设计不仅仅是为了节省栈空间，在某些情况下Slot的复用会直接影响到系统的垃圾收集行为。例如如下代码：

[java] [view plain](https://blog.csdn.net/kevin_luan/article/details/22986081#)[copy](https://blog.csdn.net/kevin_luan/article/details/22986081#)

**1、** /**；

**2、** *VMargs:-verbose:gc；

**3、** *；

**4、** */；

**5、****public****class**GCTest{；

**6、****publicstatic**voidmain(String[]args){；

**7、****byte**[]_64M=**new****byte**[1024*1024*64];；

**8、** System.gc();；

**9、** }；

**10、** }；

运行结果：

[GC 66558K->65952K(129024K), 0.0015650 secs]

[Full GC 65952K->65853K(129024K), 0.0122710 secs]

从运行结果分析，发现System.gc()运行后并没有回收掉这64M的内存。

没有回收掉"_64M"的内存能说的过去，因为在执行System.gc()时，变量_64M还处于作用域之内，虚拟机自然不敢回收掉该内存。我们把代码位如下：

[java] [view plain](https://blog.csdn.net/kevin_luan/article/details/22986081#)[copy](https://blog.csdn.net/kevin_luan/article/details/22986081#)

**1、** /**；

**2、** *VMargs:-verbose:gc；

**3、** *；

**4、** */；

**5、****public****class**GCTest{；

**6、****publicstatic**voidmain(String[]args){；

**7、** {；

**8、****byte**[]_64M=**new****byte**[1024*1024*64];；

**9、** }；

**10、** System.gc();；

**11、** }；

**12、** }；

从代码逻辑上将，在执行System.gc()的时候，变量“_64M”已经不可能在被访问了，但执行以下这段程序，会发现运行结果如下：

[GC 66558K->65968K(129024K), 0.0014760 secs]

[Full GC 65968K->65853K(129024K), 0.0127180 secs]

这是为什么呢？

在解释为什么之前，我们先对代码进行第二次修改。在调用 System.gc()之前加入代码int x=0, 这个修改看起来莫名其妙，但运行以下程序，却方法这次内存针对被正确回收了。

[java] [view plain](https://blog.csdn.net/kevin_luan/article/details/22986081#)[copy](https://blog.csdn.net/kevin_luan/article/details/22986081#)

**1、** /**；

**2、** *VMargs:-verbose:gc；

**3、** *；

**4、** */；

**5、****public****class**GCTest{；

**6、****publicstatic**voidmain(String[]args){；

**7、** {；

**8、****byte**[]_64M=**new****byte**[1024*1024*64];；

**9、** }；

**10、****int**x=0;；

**11、** System.gc();；

**12、** }；

**13、** }；

[GC 66558K->65936K(129024K), 0.0027120 secs]

[Full GC 65936K->317K(129024K), 0.0129600 secs]

局部变量"_64M"能否被回收的根本原因就是：局部变量表中得Slot是否还存有关于_64M数组对象的引用。第一次修改，代码虽然离开了_64的作用域，但在此之后，没有任何对局部变量表的读写操作，_64M 原本所占用的Slot还没有被其他变量所复用，所以作为GC Roots 一部分的局部变量表让然保持对它的关联。这种关联没有被及时打断，在绝大部分情况下都很轻微。但如果遇到一个方法，其后面的代码有一些耗时很长的操作，而前面又占用了大量的内存，实际上已经不会在被使用的变量，手工将其设置为NULL值(用来代替int x=0)把变量对应的局部变量表Slot情况，就不是一个毫无意义的操作，这种操作可以作为 一种在及特殊情形（对象暂用内存大，此方法的栈帧长时间不能被回收，方法调用次数达不到JIT编译条件）下得“奇技” 来使用。但不应当对赋null值操作有过多的依赖，也没有必要把它当做一个普遍的编码方法来推广，以恰当的变量作用域来控制变量回收时间才是最优雅的解决方法。

另外，赋null值的操作在经过虚拟机JIT编译器优化之后会被消除掉，这时候将变量设置为null实际上是没有意义的。字节码被编译为bending代码后，对GC Roots的枚举也与解释执行时期有所差别，在经过JIT编译后，System.gc()执行时就可以正确的回收掉内存。

打印GC详细日志还可以加上参数：

-XX:+PrintGCDetails -XX:+PrintGCTimeStamps

**[java]**[view plain](https://blog.csdn.net/kevin_luan/article/details/22986081#)[copy](https://blog.csdn.net/kevin_luan/article/details/22986081#)

**1、** /**；

**2、** *VMargs:-verbose:gc；

**3、** *；

**4、** */；

**5、****public****class**GCTest{；

**6、****publicstatic**voidmain(String[]args){；

**7、****byte**[]_64M=**new****byte**[1024*1024*64];；

**8、** System.gc();；

**9、** }；

**10、** }；

运行结果：

[GC 66558K->65952K(129024K), 0.0015650 secs]

[Full GC 65952K->65853K(129024K), 0.0122710 secs]

从运行结果分析，发现System.gc()运行后并没有回收掉这64M的内存。

没有回收掉"_64M"的内存能说的过去，因为在执行System.gc()时，变量_64M还处于作用域之内，虚拟机自然不敢回收掉该内存。我们把代码位如下：

**[java]**[view plain](https://blog.csdn.net/kevin_luan/article/details/22986081#)[copy](https://blog.csdn.net/kevin_luan/article/details/22986081#)

**1、** /**；

**2、** *VMargs:-verbose:gc；

**3、** *；

**4、** */；

**5、****public****class**GCTest{；

**6、****publicstatic**voidmain(String[]args){；

**7、** {；

**8、****byte**[]_64M=**new****byte**[1024*1024*64];；

**9、** }；

**10、** System.gc();；

**11、** }；

**12、** }；

从代码逻辑上将，在执行System.gc()的时候，变量“_64M”已经不可能在被访问了，但执行以下这段程序，会发现运行结果如下：

[GC 66558K->65968K(129024K), 0.0014760 secs]

[Full GC 65968K->65853K(129024K), 0.0127180 secs]

这是为什么呢？

在解释为什么之前，我们先对代码进行第二次修改。在调用 System.gc()之前加入代码int x=0, 这个修改看起来莫名其妙，但运行以下程序，却方法这次内存针对被正确回收了。

**[java]**[view plain](https://blog.csdn.net/kevin_luan/article/details/22986081#)[copy](https://blog.csdn.net/kevin_luan/article/details/22986081#)

**1、** /**；

**2、** *VMargs:-verbose:gc；

**3、** *；

**4、** */；

**5、****public****class**GCTest{；

**6、****publicstatic**voidmain(String[]args){；

**7、** {；

**8、****byte**[]_64M=**new****byte**[1024*1024*64];；

**9、** }；

**10、****int**x=0;；

**11、** System.gc();；

**12、** }；

**13、** }；

[GC 66558K->65936K(129024K), 0.0027120 secs]

[Full GC 65936K->317K(129024K), 0.0129600 secs]

局部变量"_64M"能否被回收的根本原因就是：局部变量表中得Slot是否还存有关于_64M数组对象的引用。第一次修改，代码虽然离开了_64的作用域，但在此之后，没有任何对局部变量表的读写操作，_64M 原本所占用的Slot还没有被其他变量所复用，所以作为GC Roots 一部分的局部变量表让然保持对它的关联。这种关联没有被及时打断，在绝大部分情况下都很轻微。但如果遇到一个方法，其后面的代码有一些耗时很长的操作，而前面又占用了大量的内存，实际上已经不会在被使用的变量，手工将其设置为NULL值(用来代替int x=0)把变量对应的局部变量表Slot情况，就不是一个毫无意义的操作，这种操作可以作为 一种在及特殊情形（对象暂用内存大，此方法的栈帧长时间不能被回收，方法调用次数达不到JIT编译条件）下得“奇技” 来使用。但不应当对赋null值操作有过多的依赖，也没有必要把它当做一个普遍的编码方法来推广，以恰当的变量作用域来控制变量回收时间才是最优雅的解决方法。

另外，赋null值的操作在经过虚拟机JIT编译器优化之后会被消除掉，这时候将变量设置为null实际上是没有意义的。字节码被编译为bending代码后，对GC Roots的枚举也与解释执行时期有所差别，在经过JIT编译后，System.gc()执行时就可以正确的回收掉内存。

打印GC详细日志还可以加上参数：

-XX:+PrintGCDetails -XX:+PrintGCTimeStamps
