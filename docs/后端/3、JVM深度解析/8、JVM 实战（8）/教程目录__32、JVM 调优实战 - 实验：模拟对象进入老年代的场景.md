# 32、JVM 调优实战 - 实验：模拟对象进入老年代的场景
- 来源：https://ddkk.com/zhuanlan/java/jvm/8/32.html
- 分类：JVM 实战
- 分组：教程目录
## 1.动态年龄判定规则

对象进入老年代的4个常见的时机：

**1、** 躲过15次gc，达到15岁高龄之后进入老年代；

**2、** 动态年龄判定规则，如果Survivor区域内年龄1+年龄2+年龄3+年龄n的对象总和大于Survivor区的50%，此时年龄n以上的对象会进入老年代，不一定要达到15岁；

**3、** 如果一次YoungGC后存活对象太多无法放入Survivor区，此时直接进入老年代；

**4、** 大对象直接进入老年代；

**1、** 动态年龄判定规则进入老年代

首先模拟最常见的一种进入老年代的情况，如果Survivor区域内年龄1 + 年龄2 + 年龄3 + 年龄n 的对象总和大于 Survivor 区的 50%，此时年龄n以上的对象会进入老年代，也就是所谓的**动态年龄判定规则**。

> 示例程序的JVM参数：
>
> -XX:NewSize=10485760 -XX:MaxNewSize=10485760 -XX:InitialHeapSize=20971520 -XX:MaxHeapSize=20971520 -XX:SurvivorRatio=8 -XX:MaxTenuringThreshold=15 -XX:PretenureSizeThreshold=10485760 -XX:+UseParNewGC -XX:+UseConcMarkSweepGC -XX:+PrintGCDetails -XX:+PrintGCTimeStamps -Xloggc:gc.log

在这些参数里，新生代通过 “-XX:NewSize” 设置为10MB。然后其中Eden区是8MB，每个Survivor区是1MB，Java堆总大小是20MB，老年代是10MB，大对象必须超过10MB才会直接进入老年代。

通过“-XX:MaxTenuringThreshold=15” 设置了，只要对象年龄达到15岁才会直接进入老年代。内存分配如下图所示：

**2、** 动态年龄判定规则的示例代码

运行上述代码，通过gc日志来分析这部分代码执行过后jvm中的对象分配情况。

**3、** 示例代码运行后产生的 gc 日志

上述示例代码以及JVM参数配合起来运行，其会输出如下的GC日志。

> 0.108: [GC (Allocation Failure) 0.108: [ParNew: 7256K->680K(9216K), 0.0007600 secs] 7256K->680K(19456K), 0.0009665 secs] [Times: user=0.00 sys=0.00, real=0.00 secs]
>
> Heap
>
> par new generation total 9216K, used 2811K [0x00000000fec00000, 0x00000000ff600000, 0x00000000ff600000)
>
> eden space 8192K, 26% used [0x00000000fec00000, 0x00000000fee14930, 0x00000000ff400000)
>
> from space 1024K, 66% used [0x00000000ff500000, 0x00000000ff5aa348, 0x00000000ff600000)
>
> to space 1024K, 0% used [0x00000000ff400000, 0x00000000ff400000, 0x00000000ff500000)
>
> concurrent mark-sweep generation total 10240K, used 0K [0x00000000ff600000, 0x0000000100000000, 0x0000000100000000)
>
> Metaspace used 2651K, capacity 4486K, committed 4864K, reserved 1056768K
>
> class space used 286K, capacity 386K, committed 512K, reserved 1048576K

**4、** 触发Young GC

首先查看下述代码：

这里连续创建了3个2MB的数组，最后还把局部变量array1设置为了null，所以此时的内存如下图所示：

接着会执行这行代码： byte[] array2 = new byte[128 * 1024];。 此时会在 Eden 区创建一个 128KB的数组同时由 array2 变量来引用，如下图：

接着继续执行， byte[] array3 = new byte[2 * 1024 * 1024];.。

此时的程序希望在 Eden 区再次分配一个2MB的数组，显而易见，这是不可能的。

因为此时 Eden区里已经有3个2MB的数组和1个128KB的数组，大小都超过6MB了，Eden总共才8MB。

因此一定会触发一次Young GC。

**5、** GC日志分析

触发Young GC后，根据JVM参数配置会生成 gc2.log日志文件，以下进行分析：

> ParNew: 7256K->680K(9216K), 0.0007600 secs

这行日志说明了，在GC之前年轻代占用了 7256KB的内存，也就是大概6MB的数组 + 128KB的1个数组 + 几百KB的一些未知对象。

如下图：

接着看， 7256K->680K(9216K) ，一次Young GC过后，剩余的存活对象大概是715KB。结合前面对年轻代的分析，可知年轻代刚开始会有512KB左右的未知对象，此时再加上我们自己的128KB的数组，也就差不多就是700KB了。

接着看GC日志分析：

> ar new generation total 9216K, used 2811K [0x00000000fec00000, 0x00000000ff600000, 0x00000000ff600000)
>
> eden space 8192K, 26% used [0x00000000fec00000, 0x00000000fee14930, 0x00000000ff400000)
>
> from space 1024K, 66% used [0x00000000ff500000, 0x00000000ff5aa348, 0x00000000ff600000)
>
> to space 1024K, 0% used [0x00000000ff400000, 0x00000000ff400000, 0x00000000ff500000)
>
> concurrent mark-sweep generation total 10240K, used 0K [0x00000000ff600000, 0x0000000100000000, 0x0000000100000000)

从上面的日志可以清晰看出，此时From Survivor区域被占据了 69%的内存，大概就是700KB左右，这就是一次Young GC后存活下来的对象，他们都进入 From Survivor区了。

同时Eden区域内被占据了26%的空间，大概就是2MB左右，这就是 byte[] array3 = new byte[2 * 1024 * 1024]；，这行代码在 gc 过后分配在 Eden区域内的数组。

这里明确一点，现在 Survivor From 区里的那 700KB 的对象，是1岁。

它熬过一次gc，年龄就会增长1岁。而此时 Survivor区域总大小是 1MB，此时 Survivor 区域中的存活对象已经有700KB了，绝对超过了50%。

**6、** 完整示例代码

完整的示例代码，如上图所示。该代码可以出发出来第二次Young GC，然后看看Survivor区域内的动态年龄判定规则能否生效。

先看下面几行代码：

这几行代码运行过后，实际上会接着分配 2个 2MB的数组，然后再分配一个 128KB的数组，最后是让 array3变量指向 null，如下图所示：

此时接着会运行下面的代码： byte[] array4 = new byte[2 * 1024 * 1024];。

这个时候， Eden 区如果要再次放一个2MB数组下去，是放不下去的了，所以会再触发一次Young GC。

> 0.109: [GC (Allocation Failure) 0.109: [ParNew: 7256K->690K(9216K), 0.0007646 secs] 7256K->690K(19456K), 0.0009165 secs] [Times: user=0.00 sys=0.00, real=0.00 secs]
>
> 0.110: [GC (Allocation Failure) 0.110: [ParNew: 6995K->0K(9216K), 0.0022551 secs] 6995K->677K(19456K), 0.0023194 secs] [Times: user=0.00 sys=0.00, real=0.00 secs]
>
> Heap
>
> par new generation total 9216K, used 2212K [0x00000000fec00000, 0x00000000ff600000, 0x00000000ff600000)
>
> eden space 8192K, 27% used [0x00000000fec00000, 0x00000000fee290e0, 0x00000000ff400000)
>
> from space 1024K, 0% used [0x00000000ff400000, 0x00000000ff400000, 0x00000000ff500000)
>
> to space 1024K, 0% used [0x00000000ff500000, 0x00000000ff500000, 0x00000000ff600000)
>
> concurrent mark-sweep generation total 10240K, used 677K [0x00000000ff600000, 0x0000000100000000, 0x0000000100000000)
>
> Metaspace used 2651K, capacity 4486K, committed 4864K, reserved 1056768K
>
> class space used 286K, capacity 386K, committed 512K, reserved 1048576K

**7、** 分析最终的GC日志

首先第一次GC的日志如下：

> 0.109: [GC (Allocation Failure) 0.109: [ParNew: 7256K->690K(9216K), 0.0007646 secs]

这个过程前面分析过了。

接着第二次GC的日志如下：

> 0.110: [GC (Allocation Failure) 0.110: [ParNew: 6995K->0K(9216K), 0.0022551 secs]

第二次触发Young GC，就是上述代码执行的时候，此时发现ParNew: 6995K->0K(9216K)。

这行日志表明，这次GC过后，年轻代直接就没有对象了，也就是说没有任何存活对象。但，这不是绝对的。

在前面的年轻代中，是有500多KB的未知对象存在的。

具体分析一下，由于Eden区里有3个2MB的数组和1个128KB的数组，在第二次Young GC时，是会被回收掉的。

这是会发现Survivor区域中的对象都是存活的，而且总大小超过50%了，而且年龄都是1岁。

此时根据动态年龄判定规则： 年龄1 + 年龄2 + 年龄n 的对象总大小超过了 Survivor区域的 50%，年龄n 以上的对象进入老年代。

当然这里的对象都是年龄1的，所以直接全部进入老年代了。如下图：

如下列日志可以确认这一点：

> concurrent mark-sweep generation total 10240K, used 677K [0x00000000ff600000, 0x0000000100000000, 0x0000000100000000)

CMS管理的老年代，此时使用空间刚好是 700KB，证明此时Survivor里的对象触发了动态年龄判定规则，虽然没有达到15岁，但是全部进入老年代了。

包括array2变量一直引用的 128KB的数组。

然后array4 变量引用的那个 2MB的数组，此时就会分配到 Eden区域中，如下所示：

此时再下面的日志：

> eden space 8192K, 27% used [0x00000000fec00000, 0x00000000fee290e0, 0x00000000ff400000)

这里说明 Eden 区当前就是有一个2MB的数组。

然后再看下面的日志：

> from space 1024K, 0% used [0x00000000ff400000, 0x00000000ff400000, 0x00000000ff500000)
>
> to space 1024K, 0% used [0x00000000ff500000, 0x00000000ff500000, 0x00000000ff600000)

两个Survivor区域都是空的，因为之前存活的700KB的对象都进入老年代了，所以现在Survivor里都是空的了。

## 2.对象在Young GC过后因为放不下Survivor区域进入老年代

**1、** 示例代码

```java
    public static void main(String[] args){
		byte[] array1 = new byte[2 * 1024 * 1024];
		array1 = new byte[2 * 1024 * 1024];
		array1 = new byte[2 * 1024 * 1024];
		byte[] array2 = new byte[128 * 1024];
		array2 = null;
		byte[] array3 = new byte[2 * 1024 * 1024];
	}
```

**2、** GC日志

这里使用JVM参数配置和动态判定规则的一致。打印的GC日志如下：

> 0.106: [GC (Allocation Failure) 0.106: [ParNew: 7256K->576K(9216K), 0.0014945 secs] 7256K->2626K(19456K), 0.0016708 secs] [Times: user=0.00 sys=0.00, real=0.00 secs]
>
> Heap
>
> par new generation total 9216K, used 2707K [0x00000000fec00000, 0x00000000ff600000, 0x00000000ff600000)
>
> eden space 8192K, 26% used [0x00000000fec00000, 0x00000000fee14930, 0x00000000ff400000)
>
> from space 1024K, 56% used [0x00000000ff500000, 0x00000000ff590338, 0x00000000ff600000)
>
> to space 1024K, 0% used [0x00000000ff400000, 0x00000000ff400000, 0x00000000ff500000)
>
> concurrent mark-sweep generation total 10240K, used 2050K [0x00000000ff600000, 0x0000000100000000, 0x0000000100000000)
>
> Metaspace used 2651K, capacity 4486K, committed 4864K, reserved 1056768K
>
> class space used 286K, capacity 386K, committed 512K, reserved 1048576K

**3、** 分析GC日志

分析如下代码：

```java
        byte[] array1 = new byte[2 * 1024 * 1024];
		array1 = new byte[2 * 1024 * 1024];
		array1 = new byte[2 * 1024 * 1024];
		byte[] array2 = new byte[128 * 1024];
		array2 = null;
```

上面的代码中，首先分配了3个2MB的数组，然后最后让 array1变量指向了第三个2MB数组。

接着创建了一个128KB的数组，但最后让 array2指向了null，同时我们一直都知道的，Eden区里会有500KB左右的未知对象。

如下图所示：

接着会执行如下代码： byte[] array3 = new byte[2 * 1024 * 1024];。此时想要在 Eden 里再创建一个2MB的数组，肯定会触发一次Young GC。

**4、** 初步分析GC日志

> [ParNew: 7256K->576K(9216K), 0.0014945 secs]

这里说明在第一次GC过后，年轻代就剩下了500多KB的对象。

结合图示，可以知道，在第一次GC的时候，会回收掉图中的2个2MB的数组和1个128KB的数组，然后留下一个2MB的数组和1个未知的500KB的对象。

如下图所示：

这剩下的2MB的数组和500KB的未知对象并不能全放入 From Survivor区。因为Survivor区仅仅只有1MB。

并且也不是一定要把所有存活对象全部放入老年代的。

> eden space 8192K, 26% used [0x00000000fec00000, 0x00000000fee14930, 0x00000000ff400000)

上面的GC日志中，首先Eden区内一定放入了一个新的2MB的数组，也就是刚才最后想要分配的那个数组，由array3变量引用，如下图：

再看下面的日志：

> from space 1024K, 56% used [0x00000000ff500000, 0x00000000ff590338, 0x00000000ff600000)

此时From Survivor 中有约 573KB的对象，其实就是那 500多KB的位置对象。

所以这里并不是让2MB的数组和500KB的未知对象都进入老年代，而是把500KB的位置对象放入From Survivor区中。

接着看如下日志：

> concurrent mark-sweep generation total 10240K, used 2050K [0x00000000ff600000, 0x0000000100000000, 0x0000000100000000)

此时老年代里有2MB的数组，也就是说，Young GC过后，发现存活下来的对象有2MB的数组和500KB的未知对象。

此时把500KB的未知对象放入Survivor 中，然后2MB的数组直接放入老年代，如下图：

总结，Young GC过后存活对象放不下Survivor区域，部分对象会留在Survivor中，有部分对象会进入老年代。
