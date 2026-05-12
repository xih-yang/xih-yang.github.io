# 07、JVM 实战 - 堆空间
- 来源：https://ddkk.com/zhuanlan/java/jvm/3/7.html
- 分类：JVM 实战
- 分组：教程目录
## 1. 堆的核心概述

### 1.1 概述

堆针对一个JVM进程来说是唯一的，也就是**一个进程只有一个JVM** ,但是**进程包含多个线程，他们是共享同一堆空间的**, 前面所学习到的 程序计数器 本地方法栈, 虚拟机栈, 是每个线程独立占有的一份, 而 堆空间 和后面所说的 方法区, 则是 所有线程共享的,

如下图, 灰色区域表示的是每个线程独有的, 红色区域表示所有线程 共有的

### 1.2 对堆的认识

**1、** 一个JVM实例只存在一个堆内存，堆也是Java内存管理的核心区域；

**2、** Java堆区**在JVM启动的时候即被创建**，其空间大小也就确定了，堆是JVM管理的最大一块内存空间，并且**堆内存的大小是可以调节的**；

**3、** 《Java虚拟机规范》规定，**堆可以处于物理上不连续的内存空间中，但在逻辑上它应该被视为连续的**；

**4、** 所有的线程共享Java堆，在这里还可以划分**线程私有的缓冲区**（ThreadLocalAllocationBuffer，TLAB）；

**5、** 《Java虚拟机规范》中对Java堆的描述是：**所有的对象实例以及数组都应当在运行时分配在堆上**（Theheapistherun-timedataareafromwhichmemoryforallclassinstancesandarraysisallocated）；

**6、** 但是从实际使用角度看，“几乎”所有的对象实例都在这里分配内存因为还有一些对象是在栈上分配的（逃逸分析，标量替换）；

**7、** 数组和对象可能永远不会存储在栈上，因为栈帧中保存引用，这个引用指向对象或者数组在堆中的位置；

**8、** 在方法结束后，堆中的对象不会马上被移除，仅仅在垃圾收集的时候才会被移除也就是触发了GC的时候，才会进行回收.如果堆中对象马上被回收，那么用户线程就会收到影响，因为有stoptheword(GC线程执行时,将用户线程停止了)；

**9、** 堆，是GC（GarbageCollection，垃圾收集器）执行垃圾回收的重点区域；

java 线程运行时的 虚拟机栈 和 堆内存 和方法区之间的关系

### 1.3 堆内存大小可调节

一个JVM实例只存在一个堆内存，并且堆内存的大小是可以调节的

指令:

```java
-Xms10m -Xmx10m  // 初始堆大小   最大堆大小
```

编写两个main方法程序,并在运行时 分别指定其堆内存 为10M 和 20M:

使用java 自带的 jvm监控程序:**Java VisualVM** ,在java_home下的 bin目录下

进程1jvm参数:

进程2jvm参数:

## 2. 堆内存细分

堆内存 可分为三部分, 在jdk8 后 有不同的调整

Java 7及之前堆内存逻辑上分为三部分：新生区+养老区+**永久区**

- Young/New Generation Space 新生区，又被划分为Eden区和Survivor区
- Old/Tenure generation space 养老区
- Permanent Space永久区 Perm

Java 8及之后堆内存逻辑上分为三部分：新生区+养老区+**元空间**

- Young/New Generation Space 新生区，又被划分为Eden区和Survivor区
- Old/Tenure generation space 养老区
- Meta Space 元空间 Meta

相关名词的其他叫法: **新生区  新生代  年轻代 、 养老区  老年区  老年代、 永久区  永久代**

堆内存主要还是指 新生区 和 老年区

使用**Java VisualVM ** 查看之前分配 10M 内存的程序

首先安装 Visual GC 插件:

查看堆内存的具体划分: 总共10M 的内存全部被 新生区和老年区占用

## 3. 堆空间的设置和查看

### 3.1 设置和查看

Java堆区用于存储Java对象实例，那么堆的大小在JVM启动时就已经设定好了，大家可以通过选项"-Xms"和"-Xmx"来进行设置。

- **-Xms**用于表示堆区的起始内存，等价于 **-XX:InitialHeapSize**
- **-Xmx**则用于表示堆区的最大内存，等价于 **-XX:MaxHeapSize**

一旦堆区中的内存大小超过“-Xmx"所指定的最大内存时，将会抛出OutofMemoryError异常。

通常会将-Xms和-Xmx两个参数配置相同的值，其目的是为了能够在Java垃圾回收机制清理完堆区后不需要重新分隔计算堆区的大小，节省频繁的扩容和回收堆空间的工作,从而提高性能。

**默认情况下:**

- 初始内存大小：物理电脑内存大小/64
- 最大内存大小：物理电脑内存大小/4

代码演示:

```java
/**
 * 1. 设置堆空间大小的参数
 * -Xms 用来设置堆空间（年轻代+老年代）的初始内存大小
 *      -X 是jvm的运行参数
 *      ms 是memory start
 * -Xmx 用来设置堆空间（年轻代+老年代）的最大内存大小
 *
 * 2. 默认堆空间的大小
 *      初始内存大小：物理电脑内存大小 / 64
 *      最大内存大小：物理电脑内存大小 / 4
 *
 * 3. 手动设置：-Xms600m -Xmx600m
 *     开发中建议将初始堆内存和最大的堆内存设置成相同的值。
 *
 * 4. 查看设置的参数：方式一： jps   /  jstat -gc 进程id
 *                  方式二：-XX:+PrintGCDetails
 */
public class HeapSpaceInitial {
    public static void main(String[] args) {
        //返回Java虚拟机中的堆内存总量
        long initialMemory = Runtime.getRuntime().totalMemory() / 1024 / 1024;
        //返回Java虚拟机试图使用的最大堆内存量
        long maxMemory = Runtime.getRuntime().maxMemory() / 1024 / 1024;
        System.out.println("-Xms : " + initialMemory + "M");
        System.out.println("-Xmx : " + maxMemory + "M");
    }
}
```

设置堆内存为 600M 后打印出的信息

发现运行时参数打印出的数字比设置的要少,下面 使用两种方式 查看 堆内存 的信息

**方式一：**命令行依次执行如下两个指令

- jps
- jstat -gc 进程id

其中画黄色框子的区域分别为 两个Survivor 区的大小 , Eden 的区大小, OC 为 老年代的大小

(25600*2 + 153600 + 409600 )/1024 = 600 : 600M 为我们设置的 空间

但是在堆空间中,因为垃圾回收算法(后面说),Survivor 区必有一个是空的,用于复制,

所以实际的空间只为 (25600 + 153600 + 409600 )/1024 = 575 : 为我们打印的 数字大小

**方式二**: 设置虚拟机参数 -XX:+PrintGCDetails

控制台打印信息如下

### 3.2 堆内存中的OOM错误

代码演示:

```java
/**
 * -Xms600m -Xmx600m
 */
public class OOMTest {
    public static void main(String[] args) {
        ArrayList<Picture> list = new ArrayList<>();
        while(true){
            try {
                Thread.sleep(20);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            list.add(new Picture(new Random().nextInt(1024 * 1024)));
        }
    }
}
class Picture{
    private byte[] pixels;
    public Picture(int length) {
        this.pixels = new byte[length];
    }
}
```

如上代码,Picture类中使用 数组 存储, 并在main方法中,大量创建,设置堆内存大小`-Xms600m -Xmx600m`执行一段时间后,报错

使用监视工具 ,可以看到 堆内存中内存的分配情况

## 4. 新生代和老年代

### 4.1 概述

存储在JVM中的Java对象可以被划分为两类：

- 一类是生命周期较短的瞬时对象，这类对象的创建和消亡都非常迅速生命周期短的，及时回收即可
- 另外一类对象的生命周期却非常长，在某些极端的情况下还能够与JVM的生命周期保持一致

针对这两类 ,Java堆区进一步细分，可以划分为**年轻代**（YoungGen）和**老年代**（oldGen）

其中年轻代又可以划分为Eden(伊甸园)空间、Survivor0空间和Survivor1空间（幸存者区）

根据圣经中的故事,可以更好的理解 这两个区, 新建的在Eden 犹如亚当夏娃, 而垃圾回收后幸存下来的 则转入 Survivor区

### 4.2 配置比例

**配置新生代与老年代的比例**

**1、** 默认 **-XX:NewRatio** =2，表示新生代占1，老年代占2，新生代占整个堆的1/3；

**2、** 可以修改 **-XX:NewRatio** =4，表示新生代占1，老年代占4，新生代占整个堆的1/5；

一般不会调整,除非当确认在整个项目中，生命周期长的对象偏多，那么就可以通过调整老年代的大小，来进行调优

**新生区中的比例**

**1、** 在HotSpot中，Eden空间和另外两个survivor空间缺省所占的比例是8:1:1，当然开发人员可以通过选项**-XX:SurvivorRatio**调整这个空间比例比如-XX:SurvivorRatio=8；

**2、** 几乎所有的Java对象都是在Eden区被new出来的绝大部分的Java对象的销毁都在新生代进行了（有些大的对象在Eden区无法存储时候，将直接进入老年代）IBM公司的专门研究表明，新生代中80%的对象都是“朝生夕死”的；

**3、** 可以使用选项"-Xmn"设置新生代最大内存大小(同时和上面的设置以这个为准)，但这个参数一般使用默认值就可以了；

**4、** 新生区的对象默认生命周期超过15，就会去养老区养老；

代码演示

```java
/**
 * -Xms600m -Xmx600m
 *
 * -XX:NewRatio ： 设置新生代与老年代的比例。默认值是2.
 * -XX:SurvivorRatio ：设置新生代中Eden区与Survivor区的比例。默认值是8
 * -XX:-UseAdaptiveSizePolicy ：关闭自适应的内存分配策略  （暂时用不到）
 * -Xmn:设置新生代的空间的大小。 （一般不设置）
 */
public class EdenSurvivorTest {
    public static void main(String[] args) {
        System.out.println("我只是来打个酱油~");
        try {
            Thread.sleep(1000000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

设置参数 : `-Xms600m -Xmx600m -XX:SurvivorRatio=8 -XX:NewRatio=3` 指定堆内存大小为 600M, 新老 比例为1:3

Eden:Survivor 为 8:1:1

但是通过 监视工具 发现,实际比例与设置的稍微有些出入(主要是 Eden区稍大一些)

这是因为jvm在 启动过程中,根据设置或者默认的比例,并结合实际运行环境, 进行自适应调整,

再使用指令`-XX:-UseAdaptiveSizePolicy` 关闭自适应 后观察,这时候就是非常标准的比例了

## 5. 对象分配过程和垃圾回收基本过程

### 5.1 新生代垃圾回收过程

为新对象分配内存是一件非常严谨和复杂的任务，JVM的设计者们不仅需要考虑内存如何分配、在哪里分配等问题，并且由于内存分配算法与内存回收算法密切相关，所以还需要考虑GC执行完内存回收后是否会在内存空间中产生内存碎片。

**对象分配过程**

**1、** new的对象先放伊甸园区此区有大小限制；

**2、** 当伊甸园的空间填满时，程序又需要创建对象，JVM的垃圾回收器将对伊甸园区进行垃圾回收（MinorGC），将伊甸园区中的不再被其他对象所引用的对象进行销毁再加载新的对象放到伊甸园区；

**3、** 然后将伊甸园中的剩余对象移动到幸存者0区；

**4、** 如果再次触发垃圾回收，此时上次幸存下来的放到幸存者0区的，如果没有回收，就会放到幸存者1区；

**5、** 如果再次经历垃圾回收，此时会重新放回幸存者0区，接着再去幸存者1区；

**6、** 啥时候能去养老区呢？可以设置次数默认是15次可以设置新生区进入养老区的年龄限制，设置JVM参数：**-XX:MaxTenuringThreshold**=N进行设置；

**7、** 在养老区，相对悠闲当养老区内存不足时，再次触发GC：MajorGC，进行养老区的内存清理；

**8、** 若养老区执行了MajorGC之后，发现依然无法进行对象的保存，就会产生OOM异常；

图解:

当新创建对象时,存放到Eden区中, 而当 Eden区内存不够时,触发 GC操作 ,一般被称为 YGC / Minor GC操作

这时将停止用户线程, 对 Eden区中的对象进行检查,将 已经成为垃圾,没有被使用的对象标记(如下图红色),并将还在 被使用的对象 拷贝到 存放在S0区 (如下图绿色), 并将这些对象年龄计数器加一,此时 GC 结束

当Eden区继续存放对象，当Eden区再次存满的时候，又会触发一个MinorGC操作， 同样将Eden区清理垃圾,并将仍在使用的 对象拷贝到 S1(Survivor To)区但是此时将多一个工作,检查 S0 区域对象, 同样进行清理垃圾, 并将仍在使用的对象拷贝到 S1区 ,年龄计数器加一,此时 S0 就空了出来,为下次的拷贝位置 ,此时 S1 就是下次GC 的 Survivor To 区

当我们不断重复上述过程,直到 有对象的年龄达到 15的时候, 将会在GC过程中 触发Promotion 晋升的操作，也就是将年轻代中的对象晋升到老年代中

**总结 :**

**1、** YGC的触发条件,为Eden区不够用,Survivor满不会触发(如果Survivor区满后,对象将直接晋升到老年代)；

**2、** 针对s0,s1:拷贝对象后,哪个空了哪个是Survivorto区,也就是下次GC的拷贝位置(**这样拷贝可以减少内存碎片,是内存更加整齐**)；

**3、** 垃圾回收频繁的在新生区收集,很少在养老区收集,几乎不在永久区/元空间收集,80%的对象在Eden区创建在Eden区就被回收；

### 5.2 标准过程外的特殊情况

除了上述的标准过程,如果出现其他意外的情况 该怎么办?

过程简图:

**1、****如果在拷贝过程中Survivor幸存区满了,放不下**；

则将放不下的对象直接晋升老年代,如果老年代 可以放,则进行分配,如果不能 进行老年代的垃圾回收 **Major GC**

如果回收完了还是放不下,则抛出 OOM错误

**1、****如果在创建对象时,直接Eden区就放不下**；

如果发现Eden 放不下时,先进行垃圾回收 YGC(没有超过Eden的最大内存) , 如果回收完了可以放下 则进行分配,如果仍然 放不下,则进行晋升老年代,如果老年代也放不下,老年代进行 **Major GC**, 能放下则分配,如果也放不下 则OOM 错误

代码演示

```java
/**
 * -Xms600m -Xmx600m
 */
public class HeapInstanceTest {
    byte[] buffer = new byte[new Random().nextInt(1024 * 200)];
    public static void main(String[] args) {
        ArrayList<HeapInstanceTest> list = new ArrayList<HeapInstanceTest>();
        while (true) {
            list.add(new HeapInstanceTest());
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
```

执行过程中,观察 新生代 Eden ,Survivor 和老年代的变化过程:

### 5.3 常用jvm调优工具

使用下面的工具 可以清楚的看到 jvm 中各种信息,前面我们大量使用了Visual VM ,再看看有其他哪些,后面会一一用到

**1、** JDK命令行；

**2、** Eclipse：MemoryAnalyzerTool；

**3、** Jconsole；

**4、** VisualVM（实时监控推荐~）；

**5、** Jprofiler；

**6、** JavaFlightRecorder（实时监控）；

**7、** GCViewer；

**8、** GCEasy；

### 5.4 Minor GC、Major GC、Full GC 基本认识

我们都知道，JVM的调优的一个环节，也就是垃圾收集，我们需要尽量的避免垃圾回收，因为在垃圾回收的过程中，容易出现STW（Stop the World）的问题，**而 Major GC 和 Full GC出现STW的时间，是Minor GC的10倍以上**

JVM在进行GC时，并非每次都对堆中三个内存区域( 新生代 老年代 方法区/元空间 )一起回收的，大部分时候回收的都是指新生代。针对Hotspot VM的实现，它里面的GC按照回收区域又分为两大种类型：一种是部分收集（Partial GC），一种是整堆收集（FullGC）

**1、** 部分收集(PartialGC)：不是完整收集整个Java堆的垃圾收集；

- **新生代收集**（Minor GC/Young GC）：只是新生代的垃圾收集
- **新生代收集**（Minor GC/Young GC）：只是新生代的垃圾收集
- **老年代收集**（Major GC/Old GC）：只是老年代的圾收集。 目前，只有CMS GC会有单独收集老年代的行为。注意，**很多时候Major GC会和Full GC混淆使用，需要具体分辨是老年代回收还是整堆回收**。
- **混合收集**（Mixed GC）：收集整个新生代以及部分老年代的垃圾收集。 目前，只有G1 GC会有这种行为
**2、** 整堆收集（FullGC）：收集整个java堆和方法区的垃圾收集；

**年轻代 GC（Minor GC）触发机制**

**1、** 当年轻代空间不足时，就会触发MinorGC，这里的年轻代满指的是Eden代满，Survivor满不会引发GC（每次MinorGC会清理年轻代的内存）；

**2、** 因为Java对象大多都具备朝生夕灭的特性，所以**MinorGC非常频繁**，一般回收速度也比较快这一定义既清晰又易于理解；

**3、** MinorGC会引发STW，暂停其它用户的线程，等垃圾回收结束，用户线程才恢复运行；

**老年代 GC（MajorGC/Full GC ）触发机制**

**1、** 指发生在老年代的GC，对象从老年代消失时，我们说“MajorGc”或“FullGC”发生了；

**2、** 出现了MajorGc，经常会伴随至少一次的MinorGC；

- 但非绝对的，在Parallel Scavenge收集器的收集策略里就有直接进行MajorGC的策略选择过程
- 也就是在老年代空间不足时，会先尝试触发Minor GC，如果之后空间还不足，则触发Major GC

**3、****MajorGC的速度一般会比MinorGC慢10倍以上**，STW的时间更长，如果MajorGC后，内存还不足，就报OOM了；

**Full GC 触发机制**

触发Full GC执行的情况有如下五种:

**1、** 调用System.gc()时，系统建议执行Fu11GC，但是不必然执行；

**2、** 老年代空间不足；

**3、** 方法区空间不足；

**4、****通过MinorGC后进入老年代的平均大小大于老年代的可用内存**；

**5、** 由Eden区、survivorspacee（FromSpace）区向survivorspace1（ToSpace）区复制时，对象大小大于ToSpace可用内存，则把该对象转存到老年代，且老年代的可用内存小于该对象大小；

说明：Full GC 是开发或调优中尽量要避免的。这样STW时间会短一些

### 5.5 GC 日志分析

使用jvm指令`-XX:+PrintGCDetails` 可以开启GC 日志的打印,每当GC工作时 都会将每个 区域的 内存情况打印出来

```java
/**
 * 测试MinorGC 、 MajorGC、FullGC
 * -Xms9m -Xmx9m -XX:+PrintGCDetails
 */
public class GCTest {
    public static void main(String[] args) {
        int i = 0;
        try {
            List<String> list = new ArrayList<>();
            String a = "atguigu.com";
            while (true) {
                list.add(a);
                a = a + a;
                i++;
            }
        } catch (Throwable t) {
            t.printStackTrace();
            System.out.println("遍历次数为：" + i);
        }
    }
}
```

设定参数`-Xms9m -Xmx9m -XX:+PrintGCDetails` 并运行

```java
[GC (Allocation Failure) [PSYoungGen: 2020K->510K(2560K)] 2020K->812K(9728K), 0.0021339 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
[GC (Allocation Failure) [PSYoungGen: 2550K->488K(2560K)] 2852K->2278K(9728K), 0.0005931 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
[GC (Allocation Failure) [PSYoungGen: 1949K->504K(2560K)] 3740K->3062K(9728K), 0.0005918 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
[Full GC (Ergonomics) [PSYoungGen: 1319K->0K(2560K)] [ParOldGen: 6782K->4864K(7168K)] 8102K->4864K(9728K), [Metaspace: 3452K->3452K(1056768K)], 0.0050464 secs] [Times: user=0.00 sys=0.00, real=0.01 secs] 
[GC (Allocation Failure) [PSYoungGen: 0K->0K(2560K)] 4864K->4864K(9728K), 0.0003452 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
[Full GC (Allocation Failure) [PSYoungGen: 0K->0K(2560K)] [ParOldGen: 4864K->4846K(7168K)] 4864K->4846K(9728K), [Metaspace: 3452K->3452K(1056768K)], 0.0061555 secs] [Times: user=0.00 sys=0.00, real=0.01 secs] 
遍历次数为：16
Heap
 PSYoungGen      total 2560K, used 134K [0x00000000ffd00000, 0x0000000100000000, 0x0000000100000000)
  eden space 2048K, 6% used [0x00000000ffd00000,0x00000000ffd219f0,0x00000000fff00000)
  from space 512K, 0% used [0x00000000fff80000,0x00000000fff80000,0x0000000100000000)
  to   space 512K, 0% used [0x00000000fff00000,0x00000000fff00000,0x00000000fff80000)
 ParOldGen       total 7168K, used 4846K [0x00000000ff600000, 0x00000000ffd00000, 0x00000000ffd00000)
  object space 7168K, 67% used [0x00000000ff600000,0x00000000ffabba00,0x00000000ffd00000)
 Metaspace       used 3498K, capacity 4496K, committed 4864K, reserved 1056768K
  class space    used 384K, capacity 388K, committed 512K, reserved 1048576K
java.lang.OutOfMemoryError: Java heap space
	at java.util.Arrays.copyOf(Arrays.java:3332)
	at java.lang.AbstractStringBuilder.ensureCapacityInternal(AbstractStringBuilder.java:124)
	at java.lang.AbstractStringBuilder.append(AbstractStringBuilder.java:448)
	at java.lang.StringBuilder.append(StringBuilder.java:136)
	at com.atguigu.java1.GCTest.main(GCTest.java:21)
Process finished with exit code 0
```

在OOM 之前，一定会触发一次 Full GC ，因为只有在老年代空间不足时候，才会爆出OOM异常

以第一行举例:`[GC (Allocation Failure) [PSYoungGen: 2020K->510K(2560K)] 2020K->812K(9728K), 0.0021339 secs] [Times: user=0.00 sys=0.00, real=0.00 secs]`

`[PSYoungGen: 2020K->510K(2560K)]`: 新生代垃圾回收前为 2020k, 回收完了后为510k,主要是survivor 区的内存,

最大内存是 2560k

`2020K->812K(9728K)`: 堆空间大小回收前为 2020k 回收完后为812k 最大为 9728k

Full GC 日志举例:`[Full GC (Ergonomics) [PSYoungGen: 1319K->0K(2560K)] [ParOldGen: 6782K->4864K(7168K)] 8102K->4864K(9728K), [Metaspace: 3452K->3452K(1056768K)], 0.0050464 secs] [Times: user=0.00 sys=0.00, real=0.01 secs]`

前面的PSYoungGen 新生代完全清空,

老年代清理`[ParOldGen: 6782K->4864K(7168K)]`

元空间清理`[Metaspace: 3452K->3452K(1056768K)]`

## 6. 堆空间分代思想, 内存分配策略 (小结)

### 6.1 分代思想

为什么要把Java堆分代？不分代就不能正常工作了吗？

经研究，不同对象的生命周期不同。70%-99%的对象是临时对象。

其实不分代完全可以，**分代的唯一理由就是优化GC性能** ,如果没有分代，那所有的对象都在一块，就如同把一个学校的人都关在一个教室。GC的时候要找到哪些对象没用，这样就会对堆的所有区域进行扫描。

而很多对象都是朝生夕死的，如果分代的话，把新创建的对象放到某一地方，当GC的时候先把这块存储“朝生夕死”对象的区域进行回收，这样就会腾出很大的空间出来。

**JDK7及之前堆空间划分**

**JDK8之后**

### 6.2 内存分配策略

**内存分配策略规则:**

**1、** 如果对象在Eden出生并经过第一次MinorGC后仍然存活，并且能被Survivor容纳的话，将被移动到Survivor空间中，并将对象年龄设为1；

**2、** 对象在Survivor区中每熬过一次MinorGC，年龄就增加1岁，当它的年龄增加到一定程度（默认为15岁，其实每个JVM、每个GC都有所不同）时，就会被晋升到老年代；

**3、** 对象晋升老年代的年龄阀值，可以通过选项**-XX:MaxTenuringThreshold**来设置；

**对象提升（Promotion）条件**

**1、** 优先分配到Eden：开发中比较长的字符串或者数组，会直接存在老年代，但是因为新创建的对象都是朝生夕死的，所以这个大对象可能也很快被回收，但是因为老年代触发MajorGC的次数比MinorGC要更少，因此可能回收起来就会比较慢,所以应该尽量避免；

**2、** 大对象直接分配到老年代：尽量避免程序中出现过多的大对象；

**3、** 长期存活的对象分配到老年代(年龄到达阈值)；

**4、** 动态对象年龄判断：如果Survivor区中相同年龄的所有对象大小的总和大于Survivor空间的一半，年龄大于或等于该年龄的对象可以直接进入老年代，无须等到MaxTenuringThreshold中要求的年龄；

**5、** 空间分配担保：-XX:HandlePromotionFailure，在Survivor区互相拷贝时,因为To区比较小，所以就需要将Survivor无法容纳的对象，存放到老年代中；

**代码演示, 大对象直接 进入老年代**

```java
/**
 * 测试：大对象直接进入老年代
 * -Xms60m -Xmx60m -XX:NewRatio=2 -XX:SurvivorRatio=8 -XX:+PrintGCDetails
 */
public class YoungOldAreaTest {
    public static void main(String[] args) {
        byte[] buffer = new byte[1024 * 1024 * 20];//20m
    }
}
```

根据jvm参数 的设置 Eden区分配的内存应为16M, 而创建的数组 超过了Eden的最大值,将直接放入老年代

如下日志,没有进行任何的GC, ParOldGen区直接 存入`used 20480K`

```java
Heap
 PSYoungGen      total 18432K, used 2637K [0x00000000fec00000, 0x0000000100000000, 0x0000000100000000)
  eden space 16384K, 16% used [0x00000000fec00000,0x00000000fee935c8,0x00000000ffc00000)
  from space 2048K, 0% used [0x00000000ffe00000,0x00000000ffe00000,0x0000000100000000)
  to   space 2048K, 0% used [0x00000000ffc00000,0x00000000ffc00000,0x00000000ffe00000)
 ParOldGen       total 40960K, used 20480K [0x00000000fc400000, 0x00000000fec00000, 0x00000000fec00000)
  object space 40960K, 50% used [0x00000000fc400000,0x00000000fd800010,0x00000000fec00000)
 Metaspace       used 3469K, capacity 4496K, committed 4864K, reserved 1056768K
  class space    used 381K, capacity 388K, committed 512K, reserved 1048576K
Process finished with exit code 0
```

## 7 线程私有堆内存:TLAB

### 7.1概述

在本文在开头,说到,栈区为线程私有,而堆区为线程公有.那么堆空间就都是共享的嘛?

答案是:不一定，因为还有TLAB这个概念，**在堆中划分出一块区域，为每个线程所独占** ,这块区域就为TLAB(Thread Local Allocation Buffer )区域,

**这个区域主要目的不是为了线程的共享数据的安全,而是为了在线程创建对象,从物理内存地址分配空间时,防止冲突而设计的,例如线程A 需要创建对象 ,线程B 也创建对象,如果没有TLAB,则他们访问的是同一块堆内存,那么很有可能申请到同一块内存,那么就需要锁的介入,消耗时间**

**为什么有TLAB？**

**1、** TLAB：ThreadLocalAllocationBuffer，也就是为每个线程单独分配了一个缓冲区；

**2、** 堆区是线程共享区域，任何线程都可以访问到堆区中的共享数据；

**3、** 由于对象实例的创建在JVM中非常频繁，因此在并发环境下从堆区中划分内存空间是线程不安全的；

**4、** 为避免多个线程操作同一地址，需要使用**加锁等机制**，进而影响分配速度；

**什么是 TLAB？**

**1、** 从内存模型而不是垃圾收集的角度，对Eden区域继续进行划分，JVM为每个线程分配了一个私有缓存区域，它包含在Eden空间内；

**2、** 多线程同时分配内存时，使用TLAB可以避免一系列的非线程安全问题，同时还能够提升内存分配的吞吐量，因此我们可以将这种内存分配方式称之为快速分配策略；

**3、** 据我所知所有OpenJDK衍生出来的JVM都提供了TLAB的设计；

内存结构图:

### 7.2 TLAB 分配过程

**1、** 尽管不是所有的对象实例都能够在TLAB中成功分配内存，但**JVM确实是将TLAB作为内存分配的首选**；

**2、** 在程序中，开发人员可以通过选项“**-XX:UseTLAB**”设置是否开启TLAB空间；

**3、** 默认情况下，TLAB空间的内存非常小，仅占有整个Eden空间的1%，当然我们可以通过选项“**-XX:TLABWasteTargetPercent**”设置TLAB空间所占用Eden空间的百分比大小；

**4、** 一旦对象在TLAB空间分配内存失败时，JVM就会尝试着通过**使用加锁机制确保数据操作的原子性**，从而直接在Eden空间中分配内存；

下面是线程在创建对象时,首选TLAB内存的流程图,在`Hotspot`jvm实现中,默认开启:

## 8. 堆空间常用参数设置总结

官网:[https://docs.oracle.com/javase/8/docs/technotes/tools/unix/java.html](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/java.html)

**常用参数:**

**1、****-XX:+PrintFlagsInitial**：查看所有的参数的默认初始值；

**2、****-XX:+PrintFlagsFinal**：查看所有的参数的最终值（jvm运行的当前值,用户自定义后的）；

**3、****-Xms：初始堆空间内存（默认为物理内存的1/64）；

4、****-Xmx**：最大堆空间内存（默认为物理内存的1/4）；

**5、****-Xmn**：设置新生代的大小（初始值及最大值）；

**6、****-XX:NewRatio**：配置新生代与老年代在堆结构的占比；

**7、****-XX:SurvivorRatio**：设置新生代中Eden和S0/S1空间的比例；

**8、****-XX:MaxTenuringThreshold**：设置新生代垃圾的最大年龄(晋升阈值)；

**9、****-XX:+PrintGCDetails**：输出详细的GC处理日志；

**10、****-XX:+PrintGC**或-verbose:gc：打印gc简要信息；

**11、****-XX:HandlePromotionFalilure**：是否设置空间分配担保；

关于`-XX:HandlePromotionFalilure` 指令的作用说明

**在进行 Minor GC之前，虚拟机会检查老年代最大可用的连续空间是否大于新生代所有对象的总空间。(作最坏的打算, 新生代在本次Minor GC 时 所有的对象都因为各种原因晋升到 老年代)**

- 如果大于，则此次Minor GC是安全的,进行 Minor GC
- 如果小于，则虚拟机会查看**-XX:HandlePromotionFailure**设置值是否允担保失败。
- 如果设为`true` 那么会继续检查**老年代最大可用连续空间是否大于历次晋升到老年代的对象的平均大小(即以前每次Minor GC 时 晋升到老年代的对象的平均大小)**。

如果大于，则尝试进行一次Minor GC，但这次Minor GC依然是有风险的；

如果小于，则进行一次Full GC。
- 如果HandlePromotionFailure=false，则进行一次Full GC。

版本迭代,JDK7及以后, 此参数设置失效,固定为true:

**1、** 在JDK6Update24(记为JDK7)之后，HandlePromotionFailure参数不会再影响到虚拟机的空间分配担保策略，观察openJDK中的源码变化，虽然源码中还定义了HandlePromotionFailure参数，但是在代码中已经不会再使用它；

**2、** JDK6Update24之后的规则变为**只要老年代的连续空间大于新生代对象总大小或者历次晋升的平均大小就会进行MinorGC**，否则将进行FullGC即HandlePromotionFailure=true；

## 9. 栈上分配与对象逃逸

### 9.1 逃逸分析

上回书说到, 这对象创建后,分配的区域在堆区,那么 堆区是分配对象的唯一选择么？

**在《深入理解Java虚拟机》中关于Java堆内存有这样一段描述：**

**1、** 随着JIT编译期的发展与逃逸分析技术逐渐成熟，**栈上分配、标量替换**优化技术将会导致一些微妙的变化，所有的对象都分配到堆上也渐渐变得不那么“绝对”了；

**2、** 在Java虚拟机中，对象是在Java堆中分配内存的，这是一个普遍的常识但是，有一种特殊情况，那就是如果经过逃逸分析（EscapeAnalysis）后发现，一个对象并没有逃逸出方法的话，那么就可能被优化成栈上分配这样就无需在堆上分配内存，也无须进行垃圾回收了这也是最常见的堆外存储技术；

**3、** 此外，前面提到的基于OpenJDK深度定制的TaoBaoVM，其中创新的GCIH（GCinvisibleheap）技术实现off-heap，将生命周期较长的Java对象从heap中移至heap外，并且GC不能管理GCIH内部的Java对象，以此达到降低GC的回收频率和提升GC的回收效率的目的；

**总结一句话,jvm将方法内部创建的对象,进行逃逸分析,符合条件的 则将对象创建对栈中,随着线程的结束,而随着栈的销毁而销毁,减轻GC的压力**

**逃逸分析手段:**

这是一种可以有效减少Java程序中同步负载和内存堆分配压力的跨函数全局数据流分析算法。

通过逃逸分析，Java Hotspot编译器能够分析出一个新的对象的使用范围从而决定是否要将这个对象分配到堆上。

逃逸分析的基本行为就是分析对象动态作用域 :

- **当一个对象在方法中被定义后，对象只在方法内部使用，则认为没有发生逃逸。**
- **当一个对象在方法中被定义后，它被外部方法所引用，则认为发生逃逸。例如作为调用参数传递到其他地方中。**

**代码:**

下面这段代码, 创建一个 V 对象, 并在方法结束时,将引用指向空,那么实际的对象将没有任何引用指向, 在方法结束时,就将成为垃圾,这种对象就成为 没有发生逃逸的对象, 可以分配到栈上,随着方法的结束而结束

```java
public void my_method() {
    V v = new V();
    // use v
    // ....
    v = null;
}
```

下面代码中的 StringBuffer sb 发生了逃逸, 返回到方法外部,有可能被使用

```java
public static StringBuffer createStringBuffer(String s1, String s2) {
    StringBuffer sb = new StringBuffer();
    sb.append(s1);
    sb.append(s2);
    return sb;
}
```

如果想要StringBuffer sb不发生逃逸，可以这样写, 那么 StringBuffer 对象本身就没有逃逸出本方法

```java
public static String createStringBuffer(String s1, String s2) {
    StringBuffer sb = new StringBuffer();
    sb.append(s1);
    sb.append(s2);
    return sb.toString();
}
```

更多的例子:

```java
/**
 * 逃逸分析
 *
 * 如何快速的判断是否发生了逃逸分析，大家就看new的对象实体是否有可能在方法外被调用。
 */
public class EscapeAnalysis {
    public EscapeAnalysis obj;
    /*
    方法返回EscapeAnalysis对象，发生逃逸
     */
    public EscapeAnalysis getInstance(){
        return obj == null? new EscapeAnalysis() : obj;
    }
    /*
    为成员属性赋值，发生逃逸
     */
    public void setObj(){
        this.obj = new EscapeAnalysis();
    }
    //思考：如果当前的obj引用声明为static的？仍然会发生逃逸。
    /*
    对象的作用域仅在当前方法中有效，没有发生逃逸
     */
    public void useEscapeAnalysis(){
        EscapeAnalysis e = new EscapeAnalysis();
    }
    /*
    引用成员变量的值，发生逃逸
     */
    public void useEscapeAnalysis1(){
        EscapeAnalysis e = getInstance();
        //getInstance().xxx()同样会发生逃逸
    }
}
```

**逃逸分析参数设置**

**1、****在JDK1.7版本之后，HotSpot中默认就已经开启了逃逸分析**；

**2、** 如果使用的是较早的版本，开发人员则可以通过：；

- 选项`-XX:+DoEscapeAnalysis`显式开启逃逸分析
- 通过选项`-XX:+PrintEscapeAnalysis`查看逃逸分析的筛选结果

**结论:开发中能使用局部变量的，就不要使用在方法外定义**。

### 9.2 代码优化

那么使用逃逸分析，编译器可以对代码做哪些优化呢?(下面所有的逃逸分析默认开启,是因为 window 64 jvm默认为server端, 如果不是需要手动开启`-server`)

- **栈上分配**：将堆分配转化为栈分配。如果一个对象在子程序中被分配，要使指向该对象的指针永远不会发生逃逸，对象可能是栈上分配的候选，而不是堆上分配
- **同步省略**：如果一个对象被发现只有一个线程被访问到，那么对于这个对象的操作可以不考虑同步。
- **分离对象或标量替换**：有的对象可能不需要作为一个连续的内存结构存在也可以被访问到，那么对象的部分（或全部）可以不存储在内存，而是存储在CPU寄存器中。

**1. 栈上分配:**

**1、** JIT编译器在编译期间根据逃逸分析的结果，发现如果一个对象并没有逃逸出方法的话，就可能被优化成栈上分配；

**2、** 分配完成后，继续在调用栈内执行，最后线程结束，栈空间被回收，局部变量对象也被回收这样就无须进行垃圾回收了；

**3、** 常见的栈上分配的场景：在逃逸分析中，已经说明了，分别是给成员变量赋值、方法返回值、实例引用传递；

代码演示:

```java
/**
 * 栈上分配测试
 * -Xmx256m -Xms256m -XX:-DoEscapeAnalysis -XX:+PrintGCDetails
 */
public class StackAllocation {
    public static void main(String[] args) {
        long start = System.currentTimeMillis();
        for (int i = 0; i < 10000000; i++) {
            alloc();
        }
        // 查看执行时间
        long end = System.currentTimeMillis();
        System.out.println("花费的时间为： " + (end - start) + " ms");
        // 为了方便查看堆内存中对象个数，线程sleep
        try {
            Thread.sleep(1000000);
        } catch (InterruptedException e1) {
            e1.printStackTrace();
        }
    }
    private static void alloc() {
        User user = new User();//未发生逃逸
    }
    static class User {
    }
}
```

**先测试为开启 逃逸情况**: jvm参数 `-Xmx256m -Xms256m -XX:-DoEscapeAnalysis -XX:+PrintGCDetails`

日志打印:发生了GC ,耗时46ms

```java
[GC (Allocation Failure) [PSYoungGen: 65536K->808K(76288K)] 65536K->816K(251392K), 0.0009467 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
[GC (Allocation Failure) [PSYoungGen: 66344K->872K(76288K)] 66352K->880K(251392K), 0.0006768 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
花费的时间为： 46 ms
```

再看一下堆内存情况: 堆内存分配了大量的该对象实例

再测试一下开启的情况: jvm指令`-Xmx256m -Xms256m -XX:+DoEscapeAnalysis -XX:+PrintGCDetails`

日志打印：并没有发生 GC ，耗时 3ms

```java
花费的时间为： 3 ms
```

再看一下堆内存分配的情况,要比没开启少的多的多,都分配到栈上并随之销毁了(这里还有一点的原因,个人猜测是因为 JIT在 一开始并未对代码进行缓存 并进行逃逸分析)

**2. 同步省略**

**1、** 线程同步的代价是相当高的，同步的后果是降低并发性和性能；

**2、** 在动态编译同步块的时候，**JIT编译器可以借助逃逸分析来判断同步块所使用的锁对象是否只能够被一个线程访问而没有被发布到其他线程**；

**3、** 如果没有，那么JIT编译器在编译这个同步块的时候就会取消对这部分代码的同步这样就能大大提高并发性和性能这个**取消同步的过程就叫同步省略，也叫锁消除**；

例如下面的代码, 锁对象为线程私有,根本起不到 同步的作用

```java
public void f() {
    Object hellis = new Object();
    synchronized(hellis) {
        System.out.println(hellis);
    }
}
```

代码中对hellis这个对象加锁，但是hellis对象的生命周期只在f()方法中，并不会被其他线程所访问到，所以在JIT编译阶段就会被优化掉(**字节码指令中仍然保留锁操作,只是在JIT 解释指令时会消除**)，优化成：

```java
public void f() {
    Object hellis = new Object();
	System.out.println(hellis);
}
```

**3. 标量替换**

**1、****标量（scalar）是指一个无法再分解成更小的数据的数据Java中的原始数据类型就是标量**；

**2、** 相对的，那些还可以分解的数据叫做聚合量（Aggregate），Java中的对象就是聚合量，因为他可以分解成其他聚合量和标量；

**3、** 在JIT阶段，如果经过逃逸分析，**发现一个对象不会被外界访问的话**，那么经过JIT优化，就会**把这个对象拆解成若干个局部变量来代替这个过程就是标量替换**那么本来需要创建的对象都不用创建了,直接将需要的参数使用局部变量使用；

代码举例:

```java
public static void main(String args[]) {
    alloc();
}
class Point {
    private int x;
    private int y;
}
private static void alloc() {
    Point point = new Point(1,2);
    System.out.println("point.x" + point.x + ";point.y" + point.y);
}
```

`Point`类中 有两个 标量x,y , 在方法alloc 中 , 我们new了一个对象,并初始化x,y 为 1,2, 但是 经过逃逸分析,new出来的这个类并没有逃逸出此方法, 因此该对象 并没有被方法外使用到, 并在本方法中,也仅仅只是 使用了 这个类的两个参数而已,所以 没有必要将对象在堆中分配出来,直接申明两个 局部变量 1, 2, 即可

优化:可以大大减少堆内存的占用。因为一旦不需要创建对象了，那么就不再需要分配堆内存了。标量替换为栈上分配提供了很好的基础。

```java
private static void alloc() {
    int x = 1;
    int y = 2;
    System.out.println("point.x = " + x + "; point.y=" + y);
}
```

**比较:**

```java
/**
 * 标量替换测试
 * -Xmx100m -Xms100m -XX:+DoEscapeAnalysis -XX:+PrintGC -XX:-EliminateAllocations
 */
public class ScalarReplace {
    public static class User {
        public int id;
        public String name;
    }
    public static void alloc() {
        User u = new User();//未发生逃逸
        u.id = 5;
        u.name = "www.atguigu.com";
    }
    public static void main(String[] args) {
        long start = System.currentTimeMillis();
        for (int i = 0; i < 10000000; i++) {
            alloc();
        }
        long end = System.currentTimeMillis();
        System.out.println("花费的时间为： " + (end - start) + " ms");
    }
}
```

先测试**未开启的 jvm参数**: -Xmx100m -Xms100m -XX:+DoEscapeAnalysis -XX:+PrintGC -XX:-EliminateAllocations ,开启逃逸分析,开启GC日志, 关闭标量替换

日志:有GC的发生,耗时 46ms

```java
[GC (Allocation Failure)  25600K->816K(98304K), 0.0009418 secs]
[GC (Allocation Failure)  26416K->792K(98304K), 0.0007337 secs]
[GC (Allocation Failure)  26392K->792K(98304K), 0.0006104 secs]
[GC (Allocation Failure)  26392K->856K(98304K), 0.0009474 secs]
[GC (Allocation Failure)  26456K->824K(98304K), 0.0007392 secs]
[GC (Allocation Failure)  26424K->808K(101376K), 0.0009449 secs]
[GC (Allocation Failure)  32552K->720K(101376K), 0.0010633 secs]
[GC (Allocation Failure)  32464K->720K(100352K), 0.0004493 secs]
花费的时间为： 46 ms
```

**开启标量替换**,jvm参数: `-Xmx100m -Xms100m -XX:+DoEscapeAnalysis -XX:+PrintGC -XX:+EliminateAllocations`

日志:为发生GC

```java
花费的时间为： 4 ms
```

### 9.3 逃逸分析的不足

**1、** 关于逃逸分析的论文在1999年就已经发表了，但直到JDK1.6才有实现，而且这项技术到如今也并不是十分成熟的；

**2、** 其根本原因就是无法保证逃逸分析的性能消耗一定能高于他的消耗虽然经过逃逸分析可以做标量替换、栈上分配、和锁消除但是逃逸分析自身也是需要进行一系列复杂的分析的，这其实也是一个相对耗时的过程一个极端的例子，就是经过逃逸分析之后，发现没有一个对象是不逃逸的那这个逃逸分析的过程就白白浪费掉了；

**3、** 虽然这项技术并不十分成熟，但是它也是即时编译器优化技术中一个十分重要的手段(**未来**)注意到有一些观点，认为通过逃逸分析，JVM会在栈上分配那些不会逃逸的对象，这在理论上是可行的，但是取决于JVM设计者的选择；

**4、****HotspotJVM中将逃逸分析放到JIT即时编译器中,**，因为收集到足够的运行数据JVM可以更好的判断对象是否发生了逃逸；

**5、** 目前很多书籍还是基于JDK7以前的版本，JDK已经发生了很大变化，字符串常量池和静态变量曾经都被分配在永久代上，而永久代已经被元数据区取代但是字符串常量池和静态变量并不是被转移到元数据区，而是直接在堆上分配，所以这一点同样符合前面一点的结论：对象实例都是分配在堆上；

**Hotspot 中,暂且没有实现栈上分配,上面的栈上分配演示,其实底层也都是 标量替换(即不创建对象,将对象分解,创建一些基本的变量在栈中),,所以暂且Hotspot 中 对象只可能出现在 堆中!!!!!!**

## 10 堆内存总结

**1、** 年轻代是对象的诞生、成长、消亡的区域，一个对象在这里产生、应用，最后被垃圾回收器收集、结束生命；

**2、** 老年代放置长生命周期的对象，通常都是从Survivor区域筛选拷贝过来的Java对象；

**3、** 当然，也有特殊情况，我们知道普通的对象可能会被分配在TLAB上；

**4、** 如果对象较大，无法分配在TLAB上，则JVM会试图直接分配在Eden其他位置上；

**5、** 如果对象太大，完全无法在新生代找到足够长的连续空闲空间，JVM就会直接分配到老年代；

**6、** 当GC只发生在年轻代中，回收年轻代对象的行为被称为MinorGC；

**7、** 当GC发生在老年代时则被称为MajorGC或者FullGC；

**8、** 一般的，MinorGC的发生频率要比MajorGC高很多，即老年代中垃圾回收发生的频率将大大低于年轻代；
