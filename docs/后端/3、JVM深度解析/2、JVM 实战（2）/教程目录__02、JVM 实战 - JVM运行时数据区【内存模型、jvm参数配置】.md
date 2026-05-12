# 02、JVM 实战 - JVM运行时数据区【内存模型、jvm参数配置】
- 来源：https://ddkk.com/zhuanlan/java/jvm/2/2.html
- 分类：JVM 实战
- 分组：教程目录
## 一、概述

JVM在执行java程序的时候，会把对应的物理内存划分成不同的内存区域，每个区域存放不同的数据，不同的创建以及销毁机制。

JVM定义了不同运行时数据区，他们是用来执行应用程序的。某些区域随着JVM启动及销毁，另外一些区域的数据是线程性独立的，随着线程创建和销毁。

在JDK1.8之前，JVM运行时数据区分为堆、虚拟机栈、本地方法栈、方法区、程序计数器。如下

查看所有默认的jvm参数：java -XX:+PrintFlagsFinal -version

## 1.1、程序计数器

无论任何语言，最终都是需要由操作系统通过控制总线向CPU发送机器指令。

是最小的一块内存区域，它的作用是当前线程所执行的字节码的行号指示器，在虚拟机的模型里，字节码解释器工作时就是通过改变这个计数器的值来选取下一条需要执行的字节码指令，分支、循环、异常处理、线程恢复等基础功能都需要依赖计数器完成。

在任何时候，一个处理器只执行其中一个线程中的指令，为了能够在cpu时间片轮转切换上下文之后顺利回到正确位置，每个线程都需要具有一个独立的程序计数器，各个线程之间互不影响，因此JVM将此块内存区域设计成线程私有的。

也叫PC寄存器，JVM支持多个线程同时运行，每个线程都有自己的程序计数器。倘若当前执行的是 JVM 的方法，则该寄存器中保存当前执行指令的地址；倘若执行的是native方法，则PC寄存器中为空。（PS：线程执行过程中并不都是一口气执行完，有可能在一个CPU时钟周期内没有执行完，由于时间片用完了，所以不得不暂停执行，当下一次获得CPU资源时，通过程序计数器就知道该从什么地方开始执行）

多线程时，当线程数超过CPU数量或CPU内核数量，线程之间就要根据时间片轮询抢夺CPU时间资源。因此每个线程有要有一个独立的程序计数器，记录下一条要运行的指令。线程私有的内存区域。如果执行的是JAVA方法，计数器记录正在执行的java字节码地址，如果执行的是native方法，则计数器为空。

## 1.2、本地方法栈

线程私有，这部分主要与虚拟机用到的Native方法相关，一般情况下，并不需要关心这部分的内容。本地方法是用C、C++实现的。

## 1.3、方法区【永久代，非堆】

方法区存放类的信息（包括类的字节码，类的结构）、虚拟机加载的类信息、常量、静态变量即时编译器编译后的代码等。字符串常量池就是在方法区中。虽然Java虚拟机规范把方法区描述为堆的一个逻辑部分，但是它却有一个别名叫做Non-Heap（非堆），目的是与Java堆区分开来。很多人都更愿意把方法区称为“永久代”（Permanent Generation）。从jdk1.7已经开始准备“去永久代”的规划，jdk1.7的HotSpot中，已经把原本放在方法区中的静态变量、字符串常量池等移到堆内存中。

是各个线程共享的内存区域。默认最小值为16MB，最大值为64MB，可以通过-XX:PermSize 和 -XX:MaxPermSize 参数限制方法区的大小。**如： -XX:PermSize=256M -XX:MaxPermSize=512m**

运行时常量池：是方法区的一部分，Class文件中除了有类的版本、字段、方法、接口等描述信息外，还有一项信息是常量池，用于存放编译器生成的各种符号引用，这部分内容将在类加载后放到方法区的运行时常量池中。

如果hotspot虚拟机确定一个类的定义信息不会被使用，也会将其回收。回收的基本条件至少有：所有该类的实例被回收，而且装载该类的ClassLoader被回收

### 1.3.1、PermGen（永久代）【jdk1.7及以前】

“方法区”是JVM的规范，而“永久代”是方法区的一种实现，并且只有HotSpot才有“PermGen space”，而对于其他类型的虚拟机并没有“PermGen space”。

在JDK1.8中，HotSpot已经没有“PermGen space”这个区间了，取而代之是Metaspace（元空间）

### 1.3.2、Metaspace（元空间）【jdk1.8】

在JDK1.8中，永久代已经不存在，存储的类信息、编译后的代码数据等已经移动到了MetaSpace（元空间）中，元空间并没有处于堆内存上，而是直接占用的本地内存（NativeMemory）。

元空间的本质和永久代类似，都是对JVM规范中方法区的实现。

不过元空间与永久代之间最大的区别在于：**元空间并不在虚拟机中，而是使用本地内存**。

**元空间的大小仅受本地内存限制，可以通过以下参数来指定元空间大小**：

-XX:MetaspaceSize，初始空间大小，达到该值就会触发垃圾收集进行类型卸载，同时GC会对该值进行调整：如果释放了大量的空间，就适当降低该值；如果释放了很少的空间，那么在不超过MaxMetaspaceSize时，适当提高该值

-XX:MaxMetaspaceSize，最大空间，默认是没有限制的

-XX:MinMetaspaceFreeRatio，在GC之后，最小的Metaspace剩余空间容量的百分比，减少为分配空间所导致的垃圾收集

-XX:MaxMetaspaceFreeRatio，在GC之后，最大的Metaspace剩余空间容量的百分比，减少为释放空间所导致的垃圾收集

## 1.4、堆【java 堆、GC堆】

线程共享的，存放所有对象实例和数组（所有new的对象，数组也是对象），是java虚拟机所管理的内存中最大的一块内存区域。垃圾回收的主要区域。当申请不到空间时会抛出OutOfMemoryError。

由于现在收集器都是采用分代收集算法，堆被划分为新生代和老年代(tenured)。

### 1.4.1、堆内存划分

在JDK1.7以及其前期的JDK版本中，堆内存通常被分为三块区域：Young Generation、Old Generation、Permanent Generation for VM Matedata

**jdk7及以前→ jdk8以后**

JDK8中已经用Metaspace(元数据区)完全替代了永久代(即方法区)

而且元数据区内存不在JVM中，而是使用的本地内存，默认情况下受操作系统内存限制。

调整元数据区内存大小的参数 -XX:MetaspaceSize -XX:MaxMetaspaceSize

**0>公用配置**

**-Xms和-Xmx**：用于设置堆内存的大小，-Xmx为JAVA堆的最大值，默认为物理内存的1/4；-Xms JAVA堆内存的初始，一般最好和-Xmx一样大，避免在程序运行过程中动态的申请调整堆内存

如：-Xmx1024m -Xms512m ；最大堆内存内1024MB，初始堆内存512MB；

-XX:NewRatio=3：代表新生代和老年代的比例为1：3, 年轻代占整个堆栈的1/4，默认值：2

**1>Young Generation 新生代【年轻代】**

程序新创建的对象都是从新生代分配内存，新生代用于存放刚创建的对象以及年轻的对象(尚未进入老年代的对象)，如果对象一直没有被回收，生存得足够长，老年对象就会被移入老年代。

新生代由Eden Space、两块相同大小的SurvivorSpace(通常又称s0,from space、s1,to space)。刚创建的对象都放入eden,s0和s1都至少经过一次GC并幸存。

-XX:NewSize：新生代初始化内存的大小(注意：该值需要小于-Xms的值)，示例：-XX:NewSize=128m

-XX:MaxNewSize：新生代可被分配的内存的最大上限(注意：该值需要小于-Xmx的值)。用于设置年轻代的大小，建议设为整个堆大小的1/3或者1/4,两个值设为一样大。-XX:MaxNewSize=128m

**-Xmn**：对-XX:newSize、-XX:MaxnewSize两个参数同时进行配置（注意：JDK1.4之后才有该参数）,可设置这个替代上面两个，示例：-Xmn2g 设置新生代为2g大小

-XX:SurvivorRatio=4：设置年轻代中Eden区与其中一个Survivor区的大小比值。设置为4，则两个Survivor区与一个Eden区的比值为2:4，一个Survivor区占整个年轻代的1/6，默认值为8

Sun官方推荐配置为整个堆的3/8

**2>老年代**

如果幸存对象经过一定时间仍存在，则进入老年代(tenured)。用于存放经过多次新生代GC（Minor GC）任然存活的对象，例如缓存对象。

新建的对象也有可能直接进入老年代，主要有两种情况：

①.大对象，可通过启动参数设置-XX:PretenureSizeThreshold=1024(单位为字节，默认为0)来代表超过多大时就不在新生代分配，而是直接在老年代分配。默认0

②.大的数组对象，且数组中无引用外部对象。

老年代所占的内存大小为-Xmx对应的值减去-Xmn对应的值。

**3>常用命令以及配置**

**jps 查看进程、或者pgrep -lf java、ps -ef |grep java**

**1、** 堆栈存储快照；

jmap -dump:live,file=b.map pid 将live进程生成java堆转储快照

**2、** 查看堆栈信息；

**jmap -heap 打印堆的使用情况**

**从打印信息参看**堆的结构，分为Young Generation （年轻代） 和 Old Generation （老年代）

Young Generation又被划分为：Eden Space ， From Space 和 To Space

可以看到这里To区是干净的，还未被使用，From区已经使用了95%了

**3、.查看java堆中对象的相关信息，包含数量以及占用的空间大小**

**jmap -histo PID | head**

**打印类的实例数量、占用的内存、类的名称，通常我们并不需要看所有的，只需要看前几条即可**

**4、查看监控 heap size 和 jvm垃圾回收情况，尤其是gc情况的监控，如果老年代发生full gc，那么很可能会导致内存泄漏的可能性**

**jstat -gcutil pid**

**可以看到新生代survivor S0, survivor S1 heap上的空间 使用百分比，堆中新生代Eden 的空间使用百分比，老年代Old 空间的使用百分比，内存的使用百分比，新生代Yong gc 的统计次数，新生代gc 花费的时间,full gc 的次数，花费的时间，当前进程总的gc时间，这里要注意一点，full gc很具有代表性，full gc次数 和时间 指标很能显示系统性能问题，这两个指标很大，很大程度上说明了程序中有问题，垃圾一直回收不掉**

**5、jstack**

**先使用 top 查看系统中消耗cpu比较多的进程，然后使用 top -p PID -H来查看当前进程中比较消耗cpu的线程，拿到消耗cpu比较高的线程pid,先转换成16进制的，最后使用jstack pid|grep 16进制的线程id**

**jstack -pid可以用来分析进程情况**

**更多配置**

其大小通过-Xms(最小值)和-Xmx(最大值)参数设置，-Xms为JVM启动时申请的最小内存，默认为操作系统物理内存的1/64但小于1G，-Xmx为JVM可申请的最大内存，默认为物理内存的1/4但小于1G，默认当空余堆内存小于40%时，JVM会增大Heap到-Xmx指定的大小，可通过-XX:MinHeapFreeRation=来指定这个比列；当空余堆内存大于70%时，JVM会减小heap的大小到-Xms指定的大小，可通过XX:MaxHeapFreeRation=来指定这个比列，对于运行系统，为避免在运行时频繁调整Heap的大小，通常-Xms与-Xmx的值设成一样。

默是指：不设置Xmx、-Xmx参数的情况下，JVM的默认值；可以用jvisualvm工具查看。visualvm jdk安装目录bin目录下。

自定义配置：

```java
-Xms(堆，最小值)：默认为操作系统物理内存的1/64但小于1G
-Xmx(堆，最大值)：默认为物理内存的1/4但小于1G
-XX:MinHeapFreeRation【空余堆内存小于】默认当空余堆内存小于40%时，JVM会增大Heap到-Xmx指定的大小
XX:MaxHeapFreeRation【空余堆内存大于70%】当空余堆内存大于70%时，JVM会减小heap的大小到-Xms指定的大小
注意：对于运行系统，为避免在运行时频繁调整Heap的大小，通常-Xms与-Xmx的值设成一样
```

## 1.5、虚拟机栈 (Java Virtual Machine Stacks)

线程私有的，与线程在同一时间创建。管理JAVA方法执行的内存模型。每个方法执行时都会创建一个桢栈来存储方法的私有变量、操作数栈、动态链接方法、返回值、返回地址等信息。栈的大小决定了方法调用的可达深度（递归多少层次，或嵌套调用多少层其他方法，-Xss参数可以设置虚拟机栈大小）。栈的大小可以是固定的，或者是动态扩展的。Thread的stackSize参数可以控制，一般不设置。

栈里面是一个一个“栈帧”，每个栈帧对应一次方法调用。栈帧中存放了局部变量表（基本数据类型变量和对象引用）、操作数栈、方法出口等信息。当栈调用深度大于JVM所允许的范围，会抛出StackOverflowError的错误。

如果栈的深度是固定的，请求的栈深度大于最大可用深度，则抛出stackOverflowError；如果栈是可动态扩展的，但没有内存空间支持扩展，则抛出OutofMemoryError。

**放在栈中的运算是比java堆速度快，所以尽量使用方法内的局部变量运算速度会比较快。**

使用jclasslib工具可以查看class类文件的结构。下图为栈帧结构图：

栈帧(Stack Frame)是用于支持虚拟机进行方法调用和方法执行的数据结构，它是虚拟机运行时数据区的虚拟机栈(Virtual Machine Stack)的栈元素。栈帧存储了方法的局部变量表，操作数栈，动态连接和方法返回地址等信息。第一个方法从调用开始到执行完成，就对应着一个栈帧在虚拟机栈中从入栈到出栈的过程。

每一个栈帧都包括了局部变量表，操作数栈，动态连接，方法返回地址和一些额外的附加信息。在编译代码的时候，栈帧中需要多大的局部变量表，多深的操作数栈都已经完全确定了，并且写入到了方法表的Code属性中，因此一个栈帧需要分配多少内存，不会受到程序运行期变量数据的影响，而仅仅取决于具体虚拟机的实现。

一个线程中的方法调用链可能会很长，很多方法都同时处理执行状态。对于执行引擎来讲，活动线程中，只有虚拟机栈顶的栈帧才是有效的，称为当前栈帧(Current Stack Frame)，这个栈帧所关联的方法称为当前方法(Current Method)。执行引用所运行的所有字节码指令都只针对当前栈帧进行操作。

**1》局部变量表**

局部变量表是一组变量值存储空间，用于存放方法参数和方法内部定义的局部变量。在Java程序编译为Class文件时，就在方法表的Code属性的max_locals数据项中确定了该方法需要分配的最大局部变量表的容量。

在方法执行时，虚拟机是使用局部变量表完成参数变量列表的传递过程，如果是实例方法，那么局部变量表中的每0位索引的Slot默认是用于传递方法所属对象实例的引用，在方法中可以通过关键字“this”来访问这个隐含的参数，其余参数则按照参数列表的顺序来排列，占用从1开始的局部变量Slot，参数表分配完毕后，再根据方法体内部定义的变量顺序和作用域来分配其余的Slot。局部变量表中的Slot是可重用的，方法体中定义的变量，其作用域并不一定会覆盖整个方法，如果当前字节码PC计算器的值已经超出了某个变量的作用域，那么这个变量对应的Slot就可以交给其它变量使用。

局部变量不像前面介绍的类变量那样存在“准备阶段”。类变量有两次赋初始值的过程，一次在准备阶段，赋予系统初始值；另外一次在初始化阶段，赋予程序员定义的值。因此即使在初始化阶段程序员没有为类变量赋值也没有关系，类变量仍然具有一个确定的初始值。但局部变量就不一样了，如果一个局部变量定义了但没有赋初始值是不能使用的。

**2》操作数栈**

操作数栈也常被称为操作栈，它是一个后入先出栈。同局部变量表一样，操作数栈的最大深度也是编译的时候被写入到方法表的Code属性的max_stacks数据项中。操作数栈的每一个元素可以是任意Java数据类型，包括long和double。32位数据类型所占的栈容量为1，64位数据类型所占的栈容量为2。栈容量的单位为“字宽”，对于32位虚拟机来说，一个”字宽“占4个字节，对于64位虚拟机来说，一个”字宽“占8个字节。

当一个方法刚刚执行的时候，这个方法的操作数栈是空的，在方法执行的过程中，会有各种字节码指向操作数栈中写入和提取值，也就是入栈与出栈操作。例如，在做算术运算的时候就是通过操作数栈来进行的，又或者调用其它方法的时候是通过操作数栈来行参数传递的。

另外，在概念模型中，两个栈帧作为虚拟机栈的元素，相互之间是完全独立的，但是大多数虚拟机的实现里都会作一些优化处理，令两个栈帧出现一部分重叠。让下栈帧的部分操作数栈与上面栈帧的部分局部变量表重叠在一起，这样在进行方法调用返回时就可以共用一部分数据，而无须进行额外的参数复制传递了，重叠过程如下图：

**3》动态连接**

每个栈帧都包含一个指向运行时常量池中该栈帧所属性方法的引用，持有这个引用是为了支持方法调用过程中的动态连接。在Class文件的常量池中存有大量的符号引用，字节码中的方法调用指令就以常量池中指向方法的符号引用为参数。这些符号引用一部分会在类加载阶段或第一次使用的时候转化为直接引用，这种转化称为静态解析。另外一部分将在每一次的运行期期间转化为直接引用，这部分称为动态连接。

**4》方法返回地址**

当一个方法被执行后，有两种方式退出这个方法。第一种方式是执行引擎遇到任意一个方法返回的字节码指令，这时候可能会有返回值传递给上层的方法调用者(调用当前方法的的方法称为调用者)，是否有返回值和返回值的类型将根据遇到何种方法返回指令来决定，这种退出方法方式称为正常完成出口(Normal Method Invocation Completion)。

另外一种退出方式是，在方法执行过程中遇到了异常，并且这个异常没有在方法体内得到处理，无论是Java虚拟机内部产生的异常，还是代码中使用athrow字节码指令产生的异常，只要在本方法的异常表中没有搜索到匹配的异常处理器，就会导致方法退出，这种退出方式称为异常完成出口(Abrupt Method Invocation Completion)。一个方法使用异常完成出口的方式退出，是不会给它的调用都产生任何返回值的。

无论采用何种方式退出，在方法退出之前，都需要返回到方法被调用的位置，程序才能继续执行，方法返回时可能需要在栈帧中保存一些信息，用来帮助恢复它的上层方法的执行状态。一般来说，方法正常退出时，调用者PC计数器的值就可以作为返回地址，栈帧中很可能会保存这个计数器值。而方法异常退出时，返回地址是要通过异常处理器来确定的，栈帧中一般不会保存这部分信息。

方法退出的过程实际上等同于把当前栈帧出栈，因此退出时可能执行的操作有：恢复上层方法的局部变量表和操作数栈，把返回值(如果有的话)压入调用都栈帧的操作数栈中，调用PC计数器的值以指向方法调用指令后面的一条指令等。

**5》附加信息**

虚拟机规范允许具体的虚拟机实现增加一些规范里没有描述的信息到栈帧中，例如与高度相关的信息，这部分信息完全取决于具体的虚拟机实现。在实际开发中，一般会把动态连接，方法返回地址与其它附加信息全部归为一类，称为栈帧信息。

## 1.6、直接内存

直接内存并不是虚拟机内存的一部分，也不是Java虚拟机规范中定义的内存区域。jdk1.4中新加入的NIO，引入了通道与缓冲区的IO方式，它可以调用Native方法直接分配堆外内存，这个堆外内存就是本机内存，不会影响到堆内存的大小。

## 二、设计问答

## 2.1、为什么新生代有两个Survivor分区？

分代收集器会把内存空间分为：老生代和新生代两个区域，而新生代又会分为：Eden 区和两个 Survivor区（From Survivor、To Survivor），来看内存空间分布图，如下：

可以看出 Eden 和 Survivor 分区的默认比例是 8:1:1，这个值可以通过：–XX:SurvivorRatio 设定，默认值： –XX:SurvivorRatio=8。

为什么Survivor 分区不能是 0 个？

如果 Survivor 是 0 的话，也就是说新生代只有一个 Eden 分区，每次垃圾回收之后，存活的对象都会进入老生代，这样老生代的内存空间很快就被占满了，从而触发最耗时的 Full GC ，显然这样的收集器的效率是我们完全不能接受的。

为什么Survivor 分区不能是 1 个？

如果 Survivor 分区是 1 个的话，假设我们把两个区域分为 1:1，那么任何时候都有一半的内存空间是闲置的，显然空间利用率太低不是最佳的方案。

但如果设置内存空间的比例是 8:2 ，只是看起来似乎“很好”，假设新生代的内存为 100 MB（ Survivor 大小为 20 MB ），现在有 70 MB 对象进行垃圾回收之后，剩余活跃的对象为 15 MB 进入 Survivor 区，这个时候新生代可用的内存空间只剩了 5 MB，这样很快又要进行垃圾回收操作，显然这种垃圾回收器最大的问题就在于，需要频繁进行垃圾回收。

为什么Survivor 分区是 2 个？

如果 Survivor 分区有 2 个分区，我们就可以把 Eden、From Survivor、To Survivor 分区内存比例设置为 8:1:1 ，那么任何时候新生代内存的利用率都 90% ，这样空间利用率基本是符合预期的。再者就是虚拟机的大部分对象都符合“朝生夕死”的特性，所以每次新对象的产生都在空间占比比较大的 Eden 区，垃圾回收之后再把存活的对象方法存入 Survivor 区，如果是 Survivor 区存活的对象，那么“年龄”就 +1 ，当年龄增长到 15 （可通过 -XX:+MaxTenuringThreshold 设定）对象就升级到老生代。

总结

根据上面的分析可以得知，当新生代的 Survivor 分区为 2 个的时候，不论是空间利用率还是程序运行的效率都是最优的，所以这也是为什么 Survivor 分区是 2 个的原因了。

原文地址：https://segmentfault.com/a/1190000018244125

## 2.2、永久代替换元数据区

### 2.2.1、字符串常量池问题

JDK1.7 就开始“去永久代”的工作了。 1.7把字符串常量池从永久代中剥离出来，存放在堆空间中。但是没有全面

jvm参数

```java
-XX:MaxPermSize=10m
-XX:PermSize=10m
-Xms64m
-Xmx64m
-XX:-UseGCOverheadLimit
```

测试代码

```java
public class ThreadDemo03StringOom {
    public static void main(String[] args) {
        try {
            List<String> list = new ArrayList<String>();
            for (int i = 0; ; i++) {
                System.out.println(i);
                list.add(String.valueOf("String" + i++).intern());
            }
        } catch (java.lang.Exception e) {
            e.printStackTrace();
        }
    }
}
```

jdk1.6，永久代OOM

```java
146484
Exception in thread "main" java.lang.OutOfMemoryError: PermGen space
    at java.lang.String.intern(Native Method)
    at com.github.bjlhx15.common.threaddemo.ThreadDemo03StringOom.main(ThreadDemo03StringOom.java from InputFileObject:19)
```

jdk1.7、jdk1.8，是堆OOM，并且伴随着频繁的FullGC， CPU一直高位运行

```java
1457428
Exception in thread "main" java.lang.OutOfMemoryError: Java heap space
    at java.lang.Integer.toString(Integer.java:403)
    at java.lang.String.valueOf(String.java:3099)
    at java.io.PrintStream.print(PrintStream.java:597)
    at java.io.PrintStream.println(PrintStream.java:736)
    at com.github.bjlhx15.common.threaddemo.ThreadDemo03StringOom.main(ThreadDemo03StringOom.java:18)
```

### 2.2.2、元数据使用

元数据区取代了1.7版本及以前的永久代。元数据区和永久代本质上都是方法区的实现。方法区存放虚拟机加载的类信息，静态变量，常量等数据。

jvm参数配置

```java
-XX:MetaspaceSize=8m 
-XX:MaxMetaspaceSize=50m
```

测试类使用cglib框架生成新类。

```java
public class ThreadDemo04MetaSpaceOom {
    public static void main(String[] args) {
        ClassLoadingMXBean loadingBean = ManagementFactory.getClassLoadingMXBean();
        while (true) {
            Enhancer enhancer = new Enhancer();
            enhancer.setSuperclass(ThreadDemo04MetaSpaceOom.class);
            enhancer.setCallbackTypes(new Class[]{Dispatcher.class, MethodInterceptor.class});
            enhancer.setCallbackFilter(new CallbackFilter() {
                @Override
                public int accept(Method method) {
                    return 1;
                }
                @Override
                public boolean equals(Object obj) {
                    return super.equals(obj);
                }
            });
            Class clazz = enhancer.createClass();
            System.out.println(clazz.getName());
            //显示数量信息（共加载过的类型数目，当前还有效的类型数目，已经被卸载的类型数目）
            System.out.println("total: " + loadingBean.getTotalLoadedClassCount());
            System.out.println("active: " + loadingBean.getLoadedClassCount());
            System.out.println("unloaded: " + loadingBean.getUnloadedClassCount());
        }
    }
}
```

jdk1.8，报MetaSpace OOM ，如果是1.7的jdk，那么报OOM的将是PermGen区域。

```java
com.github.bjlhx15.common.threaddemo.ThreadDemo04MetaSpaceOom$$EnhancerByCGLIB$$89215cc7
total: 6162
active: 6162
unloaded: 0
Exception in thread "main" org.springframework.cglib.core.CodeGenerationException: java.lang.OutOfMemoryError-->Metaspace
    at org.springframework.cglib.core.ReflectUtils.defineClass(ReflectUtils.java:538)
    at org.springframework.cglib.core.AbstractClassGenerator.generate(AbstractClassGenerator.java:363)
    at org.springframework.cglib.proxy.Enhancer.generate(Enhancer.java:585)
    at org.springframework.cglib.core.AbstractClassGenerator$ClassLoaderData$3.apply(AbstractClassGenerator.java:110)
    at org.springframework.cglib.core.AbstractClassGenerator$ClassLoaderData$3.apply(AbstractClassGenerator.java:108)
    at org.springframework.cglib.core.internal.LoadingCache$2.call(LoadingCache.java:54)
    at java.util.concurrent.FutureTask.run(FutureTask.java:266)
    at org.springframework.cglib.core.internal.LoadingCache.createEntry(LoadingCache.java:61)
    at org.springframework.cglib.core.internal.LoadingCache.get(LoadingCache.java:34)
    at org.springframework.cglib.core.AbstractClassGenerator$ClassLoaderData.get(AbstractClassGenerator.java:134)
    at org.springframework.cglib.core.AbstractClassGenerator.create(AbstractClassGenerator.java:319)
    at org.springframework.cglib.proxy.Enhancer.createHelper(Enhancer.java:572)
    at org.springframework.cglib.proxy.Enhancer.createClass(Enhancer.java:419)
    at com.github.bjlhx15.common.threaddemo.ThreadDemo04MetaSpaceOom.main(ThreadDemo04MetaSpaceOom.java:38)
Caused by: java.lang.OutOfMemoryError: Metaspace
    at java.lang.ClassLoader.defineClass1(Native Method)
    at java.lang.ClassLoader.defineClass(ClassLoader.java:763)
    at sun.reflect.GeneratedMethodAccessor1.invoke(Unknown Source)
    at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
    at java.lang.reflect.Method.invoke(Method.java:498)
    at org.springframework.cglib.core.ReflectUtils.defineClass(ReflectUtils.java:535)
    ... 13 more
```
