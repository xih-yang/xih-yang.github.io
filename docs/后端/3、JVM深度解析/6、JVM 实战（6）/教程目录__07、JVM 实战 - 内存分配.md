# 07、JVM 实战 - 内存分配
- 来源：https://ddkk.com/zhuanlan/java/jvm/6/7.html
- 分类：JVM 实战
- 分组：教程目录
堆内存划分为 新生代（Eden空间、Survivor空间）和 老年代（Tenured/Old 空间）。

### 1.对象优先在Eden分配

大多是情况下，对象在新生代Eden区中分配。当Eden区中没有足够空间进行分配时，虚拟机将发起一次Minor GC

-verbose:gc -XX:+PrintGCDetails -XX:+PrintGCTimeStamps 打印gc日志

-Xms20M -Xmx20M 指定堆内存

-Xmn10M 指定新生代内存

-XX:SurvivorRatio=8 指定Eden区与一个Survivor区的空间比例是8:1。

```java
private static final int _1MB = 1024 * 1024;
public static void main(String[] args) {
    byte[] allocation1 = new byte[2 * _1MB];
    byte[] allocation2 = new byte[2 * _1MB];
    byte[] allocation3 = new byte[2 * _1MB];
    byte[] allocation4 = new byte[4 * _1MB];
}
```

```java
[GC (Allocation Failure) [PSYoungGen: 6420K->1010K(9216K)] 6420K->3594K(19456K), 0.0157046 secs] [Times: user=0.00 sys=0.00, real=0.02 secs] 
Heap
 PSYoungGen      total 9216K, used 5427K [0x00000000ff600000, 0x0000000100000000, 0x0000000100000000)
  eden space 8192K, 53% used [0x00000000ff600000,0x00000000ffa50630,0x00000000ffe00000)
  from space 1024K, 98% used [0x00000000ffe00000,0x00000000ffefc888,0x00000000fff00000)
  to   space 1024K, 0% used [0x00000000fff00000,0x00000000fff00000,0x0000000100000000)
 ParOldGen       total 10240K, used 6680K [0x00000000fec00000, 0x00000000ff600000, 0x00000000ff600000)
  object space 10240K, 65% used [0x00000000fec00000,0x00000000ff286298,0x00000000ff600000)
 Metaspace       used 3305K, capacity 4500K, committed 4864K, reserved 1056768K
  class space    used 357K, capacity 388K, committed 512K, reserved 1048576K
```

PSYoungGen 使用了Parallel收集器，关于JVM垃圾收集器漫谈，可以参考[《JVM 之5、 垃圾收集器》](https://blog.csdn.net/wuzhiwei549/article/details/80563924)。

分配allocation4对象的语句会发生一次MinorGC，给allocation4分配内存时，发现Eden已经被占用了6MB，剩余空间已不足分配all4所需的4MB内存，因此发生一次MinorGC。

GC期间，虚拟机又发现已有的3个2MB大小的对象全部无法放入Survivor空间(Survivor空间只有1MB大小)，所以只好通过分配担保机制提前分配到老年代去。

GC结束后，4MBallocation4对象顺利分配在Eden中，Survivor空闲，老年代被占用6MB。

### 2.大对象直接进入老年代

对于体积较大的对象，直接进入老年代区域而不是分配到新生代。

JVM参数**-XX:PretenureSizeThreshold**的意思就是将体积大于这个设置值的对象直接在老年代分配。 这样做是为了避免在Eden区及两个Survivor区之间发生大量的内存复制。

**PretenureSizeThreshold参数只对 Serial 和 ParNew两款收集器有效**。

```java
private static final int _1MB = 1024 * 1024;
public static void main(String[] args) {
    byte[] allocation = new byte[7 * _1MB];
}
```

```java
 PSYoungGen      total 9216K, used 4537K [0x00000000ff600000, 0x0000000100000000, 0x0000000100000000)
  eden space 8192K, 55% used [0x00000000ff600000,0x00000000ffa6e478,0x00000000ffe00000)
  from space 1024K, 0% used [0x00000000fff00000,0x00000000fff00000,0x0000000100000000)
  to   space 1024K, 0% used [0x00000000ffe00000,0x00000000ffe00000,0x00000000fff00000)
 ParOldGen       total 10240K, used 7168K [0x00000000fec00000, 0x00000000ff600000, 0x00000000ff600000)
  object space 10240K, 70% used [0x00000000fec00000,0x00000000ff300010,0x00000000ff600000)
 Metaspace       used 3326K, capacity 4500K, committed 4864K, reserved 1056768K
  class space    used 361K, capacity 388K, committed 512K, reserved 1048576K
```

### 3.长期存活的对象将进入老年代

既然虚拟机采用了分代收集的思想来管理内存，那么内存回收时就必须能识别哪些对象应放在新生代，哪些对象应放在老年代中。

为了做到这点，虚拟机给每个对象定义了一个对象年龄（Age）计数器。 如果对象在Eden出生并经过第一次Minor GC后仍然存活，并且能被Survivor容纳的话，将被移动到Survivor空间中，并且对象年龄设为1。

对象在Survivor区中每“熬过”一次Minor GC，年龄就增加1岁，当它的年龄增加到一定程度（默认为15岁），就将会被晋升到老年代中。

对象晋升老年代的年龄阈值，可以通过参数**-XX:MaxTenuringThreshold**设置。

### 4.对象年龄的动态判定

为了能更好地适应不同程序的内存状况，虚拟机并不是永远地要求对象的年龄必须达到了MaxTenuringThreshold才能晋升老年代。

如果在Survivor空间中相同年龄所有对象大小的总和大于Survivor空间的一半，年龄大于或等于该年龄的对象就可以直接进入老年代，无须等到MaxTenuringThreshold中要求的年龄。

###

### 5. 空间分配担保

在发生Minor GC之前，虚拟机会先检查老年代最大可用的连续空间是否大于新生代所有对象总空间，如果这个条件成立，那么Minor GC可以确保是安全的。

如果不成立，则虚拟机会查看 -XX:HandlePromotionFailure设置值是否允许担保失败。

如果允许，那么会继续检查老年代最大可用的连续空间是否大于历次晋升到老年代对象的平均大小，如果大于，将尝试着进行一次Minor GC，尽管这次Minor GC是有风险的；

如果小于，或者-XX:HandlePromotionFailure设置不允许冒险，那这时也要改为进行一次Full GC。

触发Full GC执行的情况：

**1、** System.gc();；

**2、** 老年代空间不足；

**3、** PermanetGeneration空间满；

**4、** CMSGC时出现promotionfailed和concurrentmodefailure（[《JVM之**5、** 垃圾收集器》][JVM_5]中提到）；

**5、** 统计得到的MinorGC晋升到老年代的平均大小大于旧生代的剩余空间；

### 6. 栈上分配与逃逸分析(Escape Analysis）

**1、** 什么是栈上分配？；

栈上分配主要是指在Java程序的执行过程中，在方法体中声明的变量以及创建的对象，将直接从该线程所使用的栈中分配空间。 一般而言，创建对象都是从堆中来分配的，这里是指在栈上来分配空间给新创建的对象。

**2、** 什么是逃逸？；

逃逸是指在某个方法之内创建的对象，除了在方法体之内被引用之外，还在方法体之外被其它变量引用到；这样带来的后果是在该方法执行完毕之后，该方法中创建的对象将无法被GC回收，由于其被其它变量引用。正常的方法调用中，方法体中创建的对象将在执行完毕之后，将回收其中创建的对象；故由于无法回收，即成为逃逸。

```java
public class StackAllocation {
    public StackAllocation obj;
    /**
     *  方法返回StackAllocation对象，发生逃逸
     * @return
     */
    public StackAllocation getInstance(){
        return  obj == null ? new StackAllocation() : obj;
    }
    /**
     * 为成员变量赋值，发生逃逸
     */
    public void setObj(){
        this.obj = new StackAllocation();
    }
    /**
     * 对象作用域在方法体内，没有发生逃逸
     */
    public void useStackAllocation(){
        StackAllocation stackAllocation = new StackAllocation();
    }
    /**
     * 引用成员变量，发生逃逸
     */
    public void useStackAllocationObj(){
        StackAllocation stackAllocation = getInstance();
    }
}
```

**3、** 逃逸分析；

在JDK 6之后支持对象的栈上分析和逃逸分析，在JDK 7中完全支持栈上分配对象。 其是否打开逃逸分析依赖于以下JVM的设置： **-XX:+DoEscapeAnalysis**

**4、** 栈上分配与逃逸分析的关系；

进行逃逸分析之后，产生的后果是所有的对象都将由栈上分配，而非从JVM内存模型中的堆来分配 。

**5、** 逃逸分析／栈上分配的优劣分析；

优势表现在以下两个方面：

**消除同步**。线程同步的代价是相当高的，同步的后果是降低并发性和性能。逃逸分析可以判断出某个对象是否始终只被一个线程访问，如果只被一个线程访问，那么对该对象的同步操作就可以转化成没有同步保护的操作，这样就能大大提高并发程度和性能。

**矢量替代**。逃逸分析方法如果发现对象的内存存储结构不需要连续进行的话，就可以将对象的部分甚至全部都保存在CPU寄存器内，这样能大大提高访问速度。

劣势： 栈上分配受限于栈的空间大小，一般自我迭代类的需求以及大的对象空间需求操作，将导致栈的内存溢出；故只适用于一定范围之内的内存范围请求。
