# 07、调优实战 - GC日志分析2(老年代GC)
- 来源：https://ddkk.com/zhuanlan/java/jvm/9/7.html
- 分类：JVM 实战
- 分组：教程目录
## 1. 老年代GC

JVM参数：

```java
-Xmx20m -Xms20m -Xmn10m -XX:SurvivorRatio=8  -XX:MaxTenuringThreshold=15 -XX:PretenureSizeThreshold=3m 
-XX:+UseParNewGC -XX:+UseConcMarkSweepGC -XX:+PrintGCDetails -XX:+PrintGCTimeStamps -Xloggc:log/demo5.log
```

示例代码：

```java
public class Demo5 {
	public static void main(String[] args) {
		byte[] array1 = new byte[4 * 1024 * 1024];
		array1 = null;
		byte[] array2 = new byte[2 * 1024 * 1024];
		byte[] array3 = new byte[2 * 1024 * 1024];
		byte[] array4 = new byte[2 * 1024 * 1024];
		byte[] array5 = new byte[2 * 1024 * 1024];
	}
}
```

## 1.1 代码执行流程

**JVM参数：**

Xmx20m -Xms20m -Xmn10m -XX:SurvivorRatio=8：新生代10M，按比例Eden区8M，老年代10M；

-XX:PretenureSizeThreshold=3m，手动设置了大对象阈值为3M；

首先创建array1指向的4M的byte数组对象，它大于了大对象阈值，所以会直接进入老年代；

且把array1指向了null，即在老年代的这个4M对象是垃圾对象；

然后连续创建 array2、array3、array4指向的2M的byte数组对象，它们都一直被引用，且小于大对象阈值，所以它们都在新生代中；

在继续创建array5指向的2M对象的时候，由于Eden区大小为8M，此时放不下这个2M对象了，就会发生一次新生代GC（Young GC）；

在发生这次GC的时候，array2、array3、array4的一共6M对象都是存活的，Survivor区肯定是放不下它们的，所以它们会**通过分配担保原则进入老年代**；

在进入老年代的时候，此时老年代已经有了4M的对象；老年代大小为10M，可以放入array2，array3的4M对象，继续放入array4的2M对象时，老年代不够了，所以需要进行一次老年代GC来回收老年代，才能继续放入array4的2M对象；

## 1.2 GC日志分析

```java
Java HotSpot(TM) 64-Bit Server VM (25.181-b13) for linux-amd64 JRE (1.8.0_181-b13), built on Jul  7 2018 00:56:38 by "java_re" with gcc 4.3.0 20080428 (Red Hat 4.3.0-8)
Memory: 4k page, physical 1863076k(236872k free), swap 2097148k(2097148k free)
CommandLine flags: -XX:InitialHeapSize=20971520 -XX:MaxHeapSize=20971520 -XX:MaxNewSize=10485760 -XX:MaxTenuringThreshold=15 -XX:NewSize=10485760 -XX:OldPLABSize=16 -XX:PretenureSizeThreshold=3145728 -XX:+PrintGC -XX:+PrintGCDetails -XX:+PrintGCTimeStamps -XX:SurvivorRatio=8 -XX:+UseCompressedClassPointers -XX:+UseCompressedOops -XX:+UseConcMarkSweepGC -XX:+UseParNewGC
0.041: [GC (Allocation Failure) 0.041: [ParNew (promotion failed): 6651K->6916K(9216K), 0.0016042 secs]0.043: [CMS: 8194K->6405K(10240K), 0.0015712 secs] 10747K->6405K(19456K), [Metaspace: 2467K->2467K(1056768K)], 0.0032299 secs] [Times: user=0.00 sys=0.00, real=0.00 secs]
Heap
 par new generation   total 9216K, used 2212K [0x00000000fec00000, 0x00000000ff600000, 0x00000000ff600000)
  eden space 8192K,  27% used [0x00000000fec00000, 0x00000000fee290e0, 0x00000000ff400000)
  from space 1024K,   0% used [0x00000000ff500000, 0x00000000ff500000, 0x00000000ff600000)
  to   space 1024K,   0% used [0x00000000ff400000, 0x00000000ff400000, 0x00000000ff500000)
 concurrent mark-sweep generation total 10240K, used 6405K [0x00000000ff600000, 0x0000000100000000, 0x0000000100000000)
 Metaspace       used 2474K, capacity 4486K, committed 4864K, reserved 1056768K
  class space    used 267K, capacity 386K, committed 512K, reserved 1048576K
```

- [ParNew (promotion failed): 6651K->6916K(9216K), 0.0016042 secs]：
- promotion failed：担保失败；执行新生代GC时，Survivor区放不下存活对象；就需要老年代进行分配担保，但是在进入老年代时，老年代也放不下存活对象，就发生了担保失败；
- 6651K->6916K：所以不能回收已经分配的6M对象；（还多出了一些元数据对象）
- [CMS: 8194K->6405K(10240K), 0.0015712 secs]：
- CMS管理的老年代发生的GC（Full GC）；
- 老年代最开始已经放入了 array1的4M大对象；在分配担保时，继续放入 array2、array3的4M，再继续放入 array4的2M时，放不下了，所以发生GC；
- 8194K->6405K：

8194K：array1(4M) + array2(2M) + array3(2M) ≈ 8194K;
- 6405K：在执行Full GC时，array1是垃圾对象所以会被回收，在回收之后空出的空间，就可以放入 array4的2M对象了，所以GC之后老年代还剩 array2(2M) + array3(2M) + array4(2M) ≈ 6405K;

**程序运行结束时：**

par new generation total 9216K, used 2212K:

新创建的 array5 的2M对象进入了新生代；

from space 1024K, 0% used：

没有对象进入到Survivor区，所以Survivor区是空的；

concurrent mark-sweep generation total 10240K, used 6405K：

老年代的对象也就是上面的GC之后老年代存活的 6405K的对象；

## 2. 老年代GC进阶

JVM参数跟上面相同；

示例代码：

```java
public class Demo5V1 {
	public static void main(String[] args) {
		// 第一阶段
		byte[] array1 = new byte[4 * 1024 * 1024];
		array1 = null;
		byte[] array2 = new byte[2 * 1024 * 1024];
		byte[] array3 = new byte[2 * 1024 * 1024];
		byte[] array4 = new byte[2 * 1024 * 1024];
		byte[] array5 = new byte[2 * 1024 * 1024];
		// 第二阶段
		array5 = new byte[2 * 1024 * 1024];
		array5 = new byte[2 * 1024 * 1024];
		array5 = null;
		array2 = null;
		array3 = null;
		array4 = null;
		byte[] array6 = new byte[2 * 1024 * 1024];
	}
}
```

## 2.1 代码执行流程

第一阶段的执行流程跟Demo5相同，就是在创建 array5对象的时候，新生代的Eden区不够了，需要执行新生代GC；

在执行新生代GC的时候，Survivor区放不下，需要老年代进行分配担保，但是老年代也放不下了，所以需要执行老年代GC；

在第一阶段完成之后，新生代中应该有array5指向的2M对象，老年代中应该有 array2、array3、array4 指向的共6M对象；

在第二阶段，继续创建2个2M的对象，且把array5指向了null；也就是说这个时候，新生代中的6M对象都是垃圾对象；

再把array2、array3、array4 全部指向null，即老年代中的6M对象也都成为了垃圾对象；

再继续创建一个 array6指向的2M对象时，新生代Eden区放不下了，需要发生一次新生代GC；

## 2.2 GC日志分析

```java
Java HotSpot(TM) 64-Bit Server VM (25.181-b13) for linux-amd64 JRE (1.8.0_181-b13), built on Jul  7 2018 00:56:38 by "java_re" with gcc 4.3.0 20080428 (Red Hat 4.3.0-8)
Memory: 4k page, physical 1863076k(236824k free), swap 2097148k(2097148k free)
CommandLine flags: -XX:InitialHeapSize=20971520 -XX:MaxHeapSize=20971520 -XX:MaxNewSize=10485760 -XX:MaxTenuringThreshold=15 -XX:NewSize=10485760 -XX:OldPLABSize=16 -XX:PretenureSizeThreshold=3145728 -XX:+PrintGC -XX:+PrintGCDetails -XX:+PrintGCTimeStamps -XX:SurvivorRatio=8 -XX:+UseCompressedClassPointers -XX:+UseCompressedOops -XX:+UseConcMarkSweepGC -XX:+UseParNewGC
0.040: [GC (Allocation Failure) 0.040: [ParNew (promotion failed): 6651K->6916K(9216K), 0.0013411 secs]0.041: [CMS: 8194K->6405K(10240K), 0.0013729 secs] 10747K->6405K(19456K), [Metaspace: 2467K->2467K(1056768K)], 0.0027686 secs] [Times: user=0.00 sys=0.00, real=0.01 secs]
0.043: [GC (Allocation Failure) 0.043: [ParNew: 6307K->6307K(9216K), 0.0000065 secs]0.043: [CMS: 6405K->261K(10240K), 0.0006652 secs] 12713K->261K(19456K), [Metaspace: 2468K->2468K(1056768K)], 0.0006916 secs] [Times: user=0.00 sys=0.00, real=0.00 secs]
Heap
 par new generation   total 9216K, used 2212K [0x00000000fec00000, 0x00000000ff600000, 0x00000000ff600000)
  eden space 8192K,  27% used [0x00000000fec00000, 0x00000000fee290e0, 0x00000000ff400000)
  from space 1024K,   0% used [0x00000000ff500000, 0x00000000ff500000, 0x00000000ff600000)
  to   space 1024K,   0% used [0x00000000ff400000, 0x00000000ff400000, 0x00000000ff500000)
 concurrent mark-sweep generation total 10240K, used 261K [0x00000000ff600000, 0x0000000100000000, 0x0000000100000000)
 Metaspace       used 2475K, capacity 4486K, committed 4864K, reserved 1056768K
  class space    used 267K, capacity 386K, committed 512K, reserved 1048576K
```

- [GC (Allocation Failure) 0.040: [ParNew (promotion failed): 6651K->6916K(9216K), 0.0013411 secs]

**0、** 041:[CMS:8194K->6405K(10240K),0.0013729secs]10747K->6405K(19456K)：；
- 第一阶段的GC日志跟前面Demo5的相同，也就是老年代分配担保失败，然后进行老年代GC，指向了老年代GC之后，老年代中还剩了 array2、array3、array4 指向的共6M对象；
- 来继续看第5行；
- [ParNew: 6307K->6307K(9216K), 0.0000065 secs]：

按理说在发生第二次新生代GC时，是能够成功的，但是为什么这里新生代的对象没有减少呢？

在发生此次GC时，老年代中已经有了6M的对象了，还剩余 4M的空闲内存；由于分配担保规则（参考内存分代部分）：

```plaintext
 *  老年代的空闲内存(4M)不够新生代的所有对象大小(6M)；
 *  且空闲内存(4M)小于了历次平均晋升到老年代的对象大小(6M)；
 *  所以此时需要先再执行一次老年代GC（Full GC），所以新生代的对象大小没有改变；
```

[CMS: 6405K->261K(10240K), 0.0006652 secs]：

- CMS管理的老年代执行的GC；
- 6405K->261K：由于代码中把 array2、array3、array4全部置为null，所以它们都是垃圾对象了，在GC时会被回收，回收之后剩余了200多K的元数据对象；
- 12713K->261K(19456K)：

12713K：在执行老年代GC之前，整个堆空间的占用：第一次GC后老年代中的6405K + 新生成的3个2M的对象 6307K；

261K：在执行老年代GC之后，整个堆空间的占用；

但是这里好像有点疑惑，新生代中不是还有 6M的垃圾对象吗？

其实这里就说明了，**老年代执行的是 Full GC，Full GC执行的时候，不止回收老年代，还会回收新生代和元数据空间**；所以这里把新生代的垃圾对象一起回收了；

**程序运行结束时**

par new generation total 9216K, used 2212K：

新生代中还有新创建的 array6指向的2M对象；

from space 1024K, 0% used/to space 1024K, 0% used：

没有对象到过survivor区，所以survivor区是空的；

concurrent mark-sweep generation total 10240K, used 261K：

老年代经过回收之后，还剩下 261K的元数据对象；
