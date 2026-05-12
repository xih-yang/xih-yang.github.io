# 13、JVM 实战 - 堆
- 来源：https://ddkk.com/zhuanlan/java/jvm/11/13.html
- 分类：JVM 实战
- 分组：教程目录
一个进程对应着一个jvm实例，一个jvm实例中就有一个运行时数据区，一个运行时数据区就有一个堆，一个进程有多个线程，多个线程共享堆和方法区，每个线程对应着一份程序计数器、本地方法栈和虚拟机栈。

## 堆的概述

一个JVM实例只存在一个堆内存，堆也是Java内存管理的核心区域。Java堆区在JVM启动的时候即被创建，其空间大小也就确定了。是JVM管理的最大一块内存空间。其堆内存的大小是可以调节的。

可通过：-Xms10m -Xmx10m 两个参数设定 -Xms设置初始堆大小，-Xmx设置最大堆大小，后接大小 。[填参数的地方](https://blog.csdn.net/munangs/article/details/121967835)

堆可以处于物理上不连续的内存空间中，但在逻辑上它应该被视为连续的。

所有的线程共享Java堆，在这里还可以划分线程私有的缓冲区(Thread Local Al location Buffer， TLAB) 。如果多个线程共享堆，堆就变成了共享数据，就会存在线程安全问题，并发性就变差，故为了解决并发性差的问题，在堆内存中分出一块区域，再划分成多块，每个线程分一块，每一小块就变成了线程独有的，这一小块就称为TLAB，并发性就相应提高了。

堆的描述是:所有的对象实例以及数组都应当在运行时分配在堆上。也就是“几乎”所有的对象实例都在这里分配内存。从实际使用角度看的。数组和对象可能永远不会存储在栈上，因为栈帧中保存引用，这个引用指向对象或者数组在堆中的位置。

在方法结束后，堆中的对象不会马上被移除，仅仅在垃圾收集的时候才会被移除。

堆，是GC ( Garbage Collection，垃圾收集器）执行垃圾回收的重点区域，gc只存在堆中和方法区。

```java
public class SimpleHeap {
    private int id;
    public SimpleHeap(int id) {
        this.id = id;
    }
    public void show() {
        System.out.println("My ID is" + id);
    }
    public static void main(String[] args) {
        SimpleHeap sl = new SimpleHeap(1);
        SimpleHeap s2 = new SimpleHeap(2);
        int[] arr = new int[10];
        Object[] arr1 = new Object[10];
    }
}
```

java栈中放的是s1、s2的引用地址值

## 堆的内存细分

同义词：

加入参数

-XX:+PrintGCDetails [填参数的地方](https://blog.csdn.net/munangs/article/details/121967835)执行程序后在控制台可以看到堆空间的细节

## 堆大小设置

Java堆区用于存储Java对象实例，那么堆的大小在JVM启动时就已经设定好了，大家可以通过选项"-Xmx”和”-Xms"来进行设置。[填参数的地方](https://blog.csdn.net/munangs/article/details/121967835)

“-Xms"用于表示堆区的起始内存，等价于-XX: InitialHeapSize

“-Xmx"则用于表示堆区的最大内存，等价于-XX : MaxHeapSize

一旦堆区中的内存大小超过“-Xmx"所指定的最大内存时，将会抛出OutOfMemoryError异常。

通常会将-Xms 和-Xmx两个参数配置相同的值，其目的是为了能够在java垃圾回收机制清理完堆区后不需要重新分隔计算堆区的大小，从而提高性能。

默认情况下，初始内存大小:物理电脑内存大小/ 64，最大内存大小:物理电脑内存大小/ 4

```java
1.设置堆空间大小的参数
-Xms用来设置堆空间(年轻代+老年代)的初始内存大小
	-X是jvm的运行参数
	ms是memory start
-Xmx用来设置堆空间(年轻代+老年代)的最大内存大小
2.默认堆空间的大小
	初始内存大小:物理电脑内存大小/ 64 
	最大内存大小: 物理电脑内存大小/ 4
3.手动设置: -Xms600m   -Xmx600m
	开发中建议将初始堆内存和最大的堆内存设置成相同的值。避免在GC之后，调整堆内存的大小给系统造成额外的压力
4.查看设置的参数:
	方式一: jps  查看进程id / 后输入  jstat -gc 进程id
	方式二: -XX:+PrintGCDetails
```

方式一查看的结果

方式二查看的结果

查看自己默认的堆内存

```java
public class HeapSpaceInitial {
	public static void main(String[] args) {
        //返回Java虚拟机中的堆内存总量
        long initialMemory = Runtime.getRuntime().totalMemory() / 1024 / 1024;
        //返回Java虚拟机试图使用的最大堆内存量
        long maxMemory = Runtime.getRuntime().maxMemory() / 1024 / 1024;
        System.out.println("-Xms :" + initialMemory + "M");
        System.out.println("-Xmx :" + maxMemory + "M");
        System.out.println("系统内存大小为:" + initialMemory * 64.0 / 1024 + "G");
        System.out.println("系统内存大小为:" + maxMemory * 4.0 / 1024 + "G");
	}
}
```

当堆中存放的数据超过了堆空间会报OutOfMemory

## 年轻代和老年代

存储在JVM中的Java对象可以被划分为两类:

➢一类是生命周期较短的瞬时对象，这类对象的创建和消亡都非常迅速

➢另外一类对象的生命周期却非常长，在某些极端的情况下还能够与JVM的生命周期保持一致。

Java堆区进一步细分的话， 可以划分为年轻代(YoungGen)和老年代(OldGen)其中年轻代又可以划分为Eden空间、Survivor0空间和Survivor1空间(有时也叫做from区、to区)。

配置新生代与老年代在堆结构的占比。[填参数的地方](https://blog.csdn.net/munangs/article/details/121967835)

➢默认-XX:NewRatio=2，表示新生代占1，老年代占2，新生代占整个堆的1/3

➢可以修改-XX:NewRatio=4，表示新生代占1，老年代占4，新生代占整个堆的1/5

在HotSpot中， Eden空间和另外两个Survivor空间缺省所占的比例是8:1:1

当然开发人员可以通过选项“-XX:SurvivorRatio”调整这个空间比例。比如-XX:SurvivorRatio=8 几乎所有的Java对象都是在Eden区被new出来的。绝大部分的Java对象的销毁都在新生代进行了。

➢IBM公司的专门研究表明，新生代中80号 的对象都是“朝生夕死”的。可以使用选项" -Xmn"设置新生代最大内存大小

➢这个参数一般使用默认值就可以了。

-Xms600m -Xmx600m

-XX:NewRatio: 设置新生代 与老年代的比例。默认值是2.

-XX:SurvivorRatio: 设置新生代中Eden区与Survivor区的比例。默认值是8

-XX:-UseAdaptivesizePolicy: 关闭自适应的内存分配策略(一般用不到)

-Xmn: 设置新生代的空间的大小。( 一般不设置)

## 对象分配过程

为新对象分配内存是一件非常严谨和复杂的任务，JVM的设计者们不仅需要考虑内存如何分配、在哪里分配等问题，并且由于内存分配算法与内存回收算法密切相关，所以还需要考虑GC执行完内存回收后是否会在内存空间中产生内存碎片。

**1、** new的对象先放伊甸园区此区有大小限制；

**2、** 当伊甸园的空间填满时，程序又需要创建对象，JVM的垃圾回收器将对伊甸园区进行垃圾回收(MinorGC)，将伊甸园区中的不再被其他对象所引用的对象进行销毁再加载新的对象放到伊甸园区；

**3、** 然后将伊甸园中的剩余对象移动到幸存者0区；

**4、** 如果再次触发垃圾回收，此时上次幸存下来的放到幸存者0区的，如果没有回收，就会放到幸存者1区；

**5、** 如果再次经历垃圾回收，此时会重新放回幸存者0区，接着再去幸存者1区；

**6、** 啥时候能去养老区呢?可以设置次数默认是15次可以设置参数:-XX:MaxTenuringThreshold=__进行设置；

总结:

针对幸存者s0,s1区的总结:复制之后有交换，谁空谁是to.

关于垃圾回收:频繁在新生区收集，很少在养老区收集，几乎不在永久区/元空间收集。

## Minor GC、Major GC、Full GC

```java
JVM在进行GC时，并非每次都对上面三个内存区域一起回收的，大部分时候回收的都是指新生代。
针对HotSpotVM的实现，它里面的GC按照回收区域又分为两大种类型:一种是部分收集(Partial GC) ，一种是整堆收集(Full GC)
 部分收集:
	不是完整收集整个Java堆的垃圾收集。其中又分为:
   		- 新生代收集(Minor GC / Young GC) :只是新生代的垃圾收集。
		- 老年代收集(Major GC / Old GC) :只是老年代的垃圾收集。
	目前，只有CMS GC会有单独收集老年代的行为。
	注意，很多时候Major GC会和Full GC混淆使用， 需要具体分辨是老年代回收还是整堆回收。
   		- 混合收集(Mixed GC):收集整个新生代以及部分老年代的垃圾收集。
	目前，只有G1 GC会有这种行为
 整堆收集(Full GC):
	收集整个java堆和方法区的垃圾收集。
```

最简单的分代式GC策略的触发条件：

**1、** 年轻代GC(MinorGC)触发机制:；

1、当年轻代空间不足时， 就会触发Minor GC， 这里的年轻代满指的是Eden代满，Survivor满不会引发GC。(每次 Minor GC会清理年轻代的内存。)

2、因为Java对象大多都具备朝生夕灭的特性，所以MinorGC非常频繁，一般回收速度也比较快。这一定义既清晰又易于理解。

3、Minor GC会引发STW，暂停其它用户的线程，等垃圾回收结束，用户线程才恢复运行。

**2、** 老年代GC(MajorGC/FullGC)触发机制

1、指发生在老年代的GC，对象从老年代消失时，我们说“Major GC"或“Full GC”发生了。

2、出现了Major GC，经常会伴随至少一 次的Minor GC (但非绝对的，在Parallel Scavenge收集器的收集策略里就有直接进行Major GC的策略选择过程)。也就是在老年代空间不足时，会先尝试触发Minor GC。如果之后空间还不足，则触发Major GC

3、Major GC的速度一般会比Minor GC慢10倍以上，STW的时间更长。

4、如果Major GC后，内存还不足，就报OOM了。

5、Major GC的速度一般会比Minor GC慢10倍以上。

**3、** FullGC触发机制

触发Full GC执行的情况有如下五种:

1、调用System.gc()时，系统建议执行Full GC，但是不必然执行;

2、老年代空间不足;

3、方法区空间不足;

4、通过Minor GC后进入老年代的平均大小大于老年代的可用内存;

5、由Eden区、survivor space0 (From Space) 区向survivor space1 (To Space) 区复制时，对象大小大于To Space可用内存，则把该对象转存到老年代，且老年代的可用内存小于该对象大小;

说明:Full Gc是开发或调优中尽量要避免的。这样暂时时间会短一些。

## 堆空间分代思想

把Java堆分代是因为，不同对象的生命周期不同。70%-99%的对象是临时对象。

- 新生代:有Eden、两块大小相同的Survivor （又称为from / to， s0 / s1）构成，to总为空。
- 老年代:存放新生代中经历多次GC仍然存活的对象。

不分代也能正常工作，分代的唯一理由就是优化Gc性能。如果没有分代，那所有的对象都在一块，就如同把一个学校的人都关在一个教室。GC的时候要找到哪些对象没用,这样就会对堆的所有区域进行扫描。而很多对象都是朝生夕死的，如果分代的话，把新创建的对象放到某一地方， 当GC的时候先把这块存储“朝生夕死”对象的区域进行回收，这样就会腾出很大的空间出来。

## 内存分配策略（对象提升(Promotion)规则）

如果对象在Eden出生并经过第一次Minor GC后仍然存活，并且能被Survivor容纳的话，将被移动到Survivor 空间中，并将对象年龄设为1。对象在Survivor 区中每熬过一次MinorGC ， 年龄就增加1岁，当它的年龄增加到一定程度（默认为15岁，其实每个JVM、每个GC都有所不同）时，就会被晋升到老年代中。

对象晋升老年代的年龄阈值，可以通过选项 -XX:MaxTenuringThreshold 来设置。

针对不同年龄段的对象分配原则如下所示:

```java
1.优先分配到Eden
2.大对象直接分配到老年代
	- 尽量避免程序中出现过多的大对象
3.长期存活的对象分配到老年代
4.动态对象年龄判断
	- 如果Survivor 区中相同年龄的所有对象大小的总和大于Survivor空间的一半，年龄大于或等于该年龄的对象可以直接进入老年代，无须等到
MaxTenur ingThreshold中要求的年龄。
5.空间分配担保：
	-Survivor 相对比较小，Survivor 中无法容纳的对象就放在Eden区，老年代进行空间分配担保，前提得老年代剩余空间够去容纳对象
	-XX:HandlePromotionFailure  会返回true 或 false
```

## 为对象分配内存: TLAB

为什么有TLAB ( Thread Local Allocation Buffer ) ?

堆区是线程共享区域，任何线程都可以访问到堆区中的共享数据。

由于对象实例的创建在JVM中非常频繁，因此在并发环境下从堆区中划分内存空间是线程不安全的。

为避免多个线程操作同一地址，需要使用加锁等机制，进而影响分配速度。

什么是TLAB?

从内存模 型而不是垃圾收集的角度，对Eden区域继续进行划分，JVM为每个线程分配了一个私有缓存区域，它包含在Eden空间内。

多线程同时分配内存时，使用TLAB可以避免一系列的非线程安全问题，同时还能够提升内存分配的吞吐量，因此我们可以将这种内存分配方式称之为快速分配策略。

据我所知所有OpenJDK衍生 出来的JVM都提供 了TLAB的设计。

TLAB的再说明:

尽管不是所有的对象实例都能够在TLAB中成功分配内存，但JVM确实是将TLAB作为内存分配的首选。

在程序中，开发人员可以通过选项 “ -XX :UseTLAB ” 设置是否开启TLAB空间。测试- XX:UseTLAB参数是否开启的情况:默认情况是开启的。

默认情况下，TLAB空间的内存非常小，仅占有整个Eden空间的1号，当然我们可以通过选项 ” -XX:TLABWasteTargetPercent “ 设置TLAB空间所占用Eden空间的百分比大小。

一旦对象在TLAB空间分配内存失败时，JVM就会尝试着通过使用加锁机制确保数据操作的原子性，从而直接在Eden空间中分配内存。

## 堆空间的参数设置

[官网参数描述](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/java.html)

```java
 -XX:+PrintFlagsInitial : 查看所有的参数的默认初始值
 -XX:+PrintFlagsFinal : 查看所有的参数的最终值(可能会存在修改，不再是初始值)
	具体查看某个参数的指令: jps: 查看当前运行中的进程
						   jinfo -flag SurvivorRatio进程id
 -Xms: 初始堆空间内存 (默认为物理内存的1/64)
 -Xmx: 最大堆空间内存(默认为物理内存的1/4)
 -Xmn: 设置新生代的大小。(初始值及 最大值)
 -XX:NewRatio: 配置新生代与老年代在堆结构的占比
 -XX:SurvivorRatio: 设置新生代中Eden和S0/S1空间的比例
 -XX:MaxTenuringThreshold: 设置新生代垃圾的最大年龄
 -XX:+PrintGCDetails:输出详细的GC处理日志
 打印gc简要信息:
	① -XX:+PrintGC
	② -verbose:gc
 -XX:HandlePromotionFailure: 是否设置空间分配担保
```

在发生Minor Gc之前，虚拟机会检查老年代最大可用的连续空间是否大于新生代所有对象的总空间。

- 如果大于，则此次Minor GC是安全的
- 如果小于，则虚拟机会查看-XX: HandlePromotionFailure设置值是否允许担保失败。
- 如果HandlePromotionFailure=true， 那么会继续检查老年代最大可用连续空间是否大于历次晋升到老年代的对象的平均大小。

如果大于，则尝试进行一次Minor GC， 但这次Minor GC依然是有风险的:
- 如果小于，则改为进行一次Full GC。

如果HandlePromotionFailure=false，则改为进行一次Full GC。

在JDK6 Update24之后，HandlePromotionFailure参数不会再影响到虚拟机的空间分配担保策略，观察0penJDK中的源码变化，虽然源码中还定义了HandlePromotionFailure参数，但是在代码中已经不会再使用它。JDK6 Update24之后的规则变为只要老年代的连续空间大于新生代对象总大小或者历次晋升的平均大小就会进行Minor GC，否则将进行Full GC。

## 堆是分配对象存储的唯一选择吗?

堆是分配对象存储的唯一选择吗?

在《深入理解Java虚拟机》中关于Java堆内存有这样一段描述:

随着JIT编译期的发展与逃逸分析技术逐渐成熟，栈上分配、标量替换优化技术将会导致一些微妙的变化，所有的对象都分配到堆上也渐渐变得不那么“绝对”了。在Java虚拟机中，对象是在Java堆中分配内存的，这是一个普遍的常识。但是，有一种特殊情况，那就是如果经过逃逸分析(Escape Analysis)后发现， 一个对象并没有逃逸出方法的话，那么就可能被优化成栈上分配。这样就无需在堆上分配内存，也无须

进行垃圾回收了。这也是最常见的堆外存储技术。

此外，前面提到的基于openJDK深度定制的TaoBaoVM，其中创新的GCIH (GC invisible heap) 技术实现off-heap，将生命周期较长的Java对象从heap中移至heap外，并且Gc不能管理GCIH内部的Java对象，以此达到降低Gc的回收频率和提升GC的回收效率的目的。

逃逸分析:

- 如何将堆上的对象分配到栈，需要使用逃逸分析手段。
- 这是一种可以有效减少Java程序中同步负载和内存堆分配压力的跨函数全局数据流分析算法。
- 通过逃逸分析，Java Hotspot编 译器能够分析出一个新的对象的引用的使用范围从而决定是否要将这个对象分配到堆上。
- 逃逸分析的基本行为就是分析对象动态作用域:
- 当一个对象在方法中被定义后，对象只在方法内部使用，则认为没有发生逃逸。
- 当一个对象在方法中被定义后，它被外部方法所引用， 则认为发生逃逸。例如作为调用参数传递到其他地方中。

```java
public void my_method(){
	V v = new V();
	//use v
	//.......
	v = null;
}
```

没有发生逃逸的对象，则可以分配到栈上，随着方法执行的结束，栈空间就被移除。

发生逃逸：

```java
public static StringBuffer createStringBuffer(String s1, String s2){
	StringBuffer sb = new StringBuffer();
	sb.append (s1);
	sb.append (s2);
	return sb;
}
```

未发生逃逸：

```java
public static String createStringBuffer(String s1, String s2) {
	StringBuffer sb = new StringBuffer() ;
	sb.append(s1) ;
	sb.append(s2) ;
	return sb.toString() ;
}
```

```java
/**
* 逃逸分析
*
* 如何快速的判断是否发生了逃逸分析，大家就看new的对象实体是否有可能在方法外被调用。
*/
public class EscapeAnalysis{
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
	//如果当前的obj引用声明为static的,仍然会发生逃逸。
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
		EscapeAnalysis F = getInstance();
		//getInstance(). xxx()同样会发生逃逸
	}
}
```

参数设置:

在JDK 7版本之后，HotSpot中默认就已经开启了逃逸分析。

- 选项 “ -XX: +DoEscapeAnalysis " 显式开启逃逸分析
- 通过选项 “ -XX: +PrintEscapeAnalysis " 查看逃逸分析的筛选结果。

开发中能使用局部变量的，就不要使用在方法外定义。

逃逸分析,代码优化

使用逃逸分析，编译器可以对代码做如下优化:

一、栈上分配。将堆分配转化为栈分配。如果一个对象在子程序中被分配，要使指向该对象的指针永远不会逃逸，对象可能是栈分配的候选，而不是堆分配。

二、同步省略。如果一个对象被发现只能从一个线程被访问到，那么对于这个对象的操作可以不考虑同步。

三、分离对象或标量替换。有的对象可能不需要作为一个连续的内存结构存在也可以被访问到，那么对象的部分(或全部)可以不存储在内存，而是存储在CPU寄存器中。

代码优化之栈上分配:

JIT编译器在编译期间根据逃逸分析的结果，发现如果一个对象并没有逃逸出方法的话，就可能被优化成栈上分配。分配完成后，继续在调用栈内执行，最后线程结束，栈空间被回收，局部变量对象也被回收。这样就无须进行垃圾回收了。

常见的栈上分配的场景:

➢在逃逸分析中，已经说明了。分别是给成员变量赋值、方法返回值、实例引用传递。

代码优化之同步省略:

线程同步的代价是相当高的，同步的后果是降低并发性和性能。在动态编译同步块的时候，JIT编译器可以借助逃逸分析来判断同步块所

使用的锁对象是否只能够被一个线程访问而没有被发布到其他线程。如果没有，那么JIT编译器在编译这个同步块的时候就会取消对这部分代码的同步。这样就能大大提高并发性和性能。这个取消同步的过程就叫同步省略，也叫锁消除。

代码中对hollis这个对象进行加锁，但是hollis对 象的生命周期只在 f() 方法中，并不会被其他线程所访问到，所以在JIT编译阶段就会被优化掉。优化成:

代码优化之分离对象或标量替换:

标量(Scalar)是指一个无法再分解成更小的数据的数据。Java中的原始数据类型就是标量。

相对的，那些还可以分解的数据叫做聚合量(Aggregate)，Java中的对象就是聚合量，因为他可以分解成其他聚合量和标量。

在JIT阶段，如果经过逃逸分析，发现一个对象不会被外界访问的话，那么经过JIT优化，就会把这个对象拆解成若千个其中包含的若干个成员变量来代替。这个过程就是标量替换。

以上代码，经过标量替换后，就会变成:

可以看到，Point这个聚合量经过逃逸分析后，发现他并没有逃逸，就被替换成两个聚合量了。那么标量替换有什么好处呢?就是可以大大减少堆内存的占用。因为一旦不需要创建对象了，那么就不再需要分配堆内存了。

标量替换为栈上分配提供了很好的基础。

标量替换参数设置:

参数-XX:+EliminateAllocations: 开启了标量替换(默认打开)，允许将对象打散分配在栈上。

```java
public class ScalarReplace {
	public static class User {
		public int id;
		public string name;
	}
	public static void alloc() {
		user u = new User();
		u.id = 5;
		u.name = " WwW. atguigu. com" ;
	}
	public static void main(String[] args) {
		long start = System.currentTimeMillis();
		for (int i = 0; i < 10000000; i++) {
			alloc();
		}
		long end = System.currentTimeMillis();
		System.out.println("花费的时间为:" + (end - start) + " ms");
	}
}
```

上述代码在主函数中进行了1亿次alloc。 调用进行对象创建，由于User对象实例需要占据约16字节的空间，因此累计分配空间达到将近1.5GB。如果堆空间小于这个值，就必然会发生GC。使用如下参数运行，上述代码:

这里使用参数如下:

```java
参数 -server: 启动Server模式， 因为在Server模式下， 才可以启用逃逸分析。
参数 -XX:+DoEscapeAnalysis: 启用逃逸分析
参数 -Xmx10m: 指定了堆空间最大为10MB
参数 -XX: +PrintGC: 将打印GC日志。
参数 -XX: +EliminateAllocations: 开启了标量替换(默认打开)，允许将对象打散分配在栈上，比 如对象拥有id和name两个字段，那么这两个字段将会被视为两个独立的局部变量进行分配。
```

关于逃逸分析的论文在1999年就已经发表了，但直到JDK 1.6才有实现，而且这项技术到如今也并不是十分成熟的。

其根本原因就是无法保证逃逸分析的性能消耗一定能高于他的消耗。虽然经过逃逸分析可以做标量替换、栈上分配、和锁消除。但是逃逸分析自身也是需要进行一系列复杂的分析的，这其实也是一个相对耗时的过程。

一个极端的例子，就是经过逃逸分析之后，发现没有一个对象是不逃逸的。那这个逃逸分析的过程就白白浪费掉了。

虽然这项技术并不十分成熟，但是它也是即时编译器优化技术中一个十分重要的手段。注意到有一些观点，认为通过逃逸分析，JVM会在栈上分配那些不会逃逸的对象，这在理论上是可行的，但是取决于JVM设计者的选择。据我所知，Oracle HotspotJVM中并未这么做，这一点在逃逸分析相关的文档里已经说明，所以可以明确所有的对象实例都是创建在堆上。

目前很多书籍还是基于JDK 7以前的版本，JDK已经发生了很大变化，intern字符串的缓存和静态变量曾经都被分配在永久代上，而永久代已经被元数据区取代。但是，intern字符串缓存和静态变量并不是被转移到元数据区，而是直接在堆上分配，所以这一点同样符合前面一点的结论:对象实例都是分配在堆上。

总结：

年轻代是对象的诞生、成长、消亡的区域，一个对象在这里产生、应用，最后被垃圾回收器收集、结束生命。

老年代放置长生命周期的对象，通常都是从Survivor区域筛选拷贝过来的Java对象。当然，也有特殊情况，我们知道普通的对象会被分配在TLAB上;如果对象较大，JVM会试图直接分配在Eden其他位置上;如果对象太大，完全无法在新生代找到足够长的连续空闲空间，JVM就会直接分配到老年代。

当GC只发生在年轻代中，回收年轻代对象的行为被称为MinorGC。当GC发生在老年代时则被称为Major GC或者Full GC。一般的，Minor GC的发生频率要比Major GC高很多，即老年代中垃圾回收发生的频率将大大低于年轻代。
