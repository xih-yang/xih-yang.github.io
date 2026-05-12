# 13、JVM 实战 - JVM之运行时数据区 - Minor GC、Major GC和Full GC
- 来源：https://ddkk.com/zhuanlan/java/jvm/1/13.html
- 分类：JVM 实战
- 分组：教程目录
### 一、Minor GC、Major GC和Full GC

JVM的垃圾收集并非同时对堆中三个区域(伊甸区、幸存区、老年代)进行收集，大部分时候都是回收年轻代，HotSpot虚拟机将垃圾收集分为部分收集(Partial GC)和整堆收集(Full GC)。

部分收集：

1、年轻代收集(Minor GC/Young GC): 回收年轻代区域。

2、老年代收集(Major GC/Old GC): 回收老年代区域，目前只有CMS垃圾收集器会单独收集老年代区域。

3、混合收集(Mixed GC):收集整个年轻代区域及部分老年代区域，目前只有G1收集器有。

整堆收集(Full GC)：回收整个Java堆区域及方法区。

### 二、GC的触发机制

#### 1、Minor GC触发机制

**当Eden区没有足够空间进行分配时，就会触发Minor GC，Minor GC会回收Eden区和Survivor区，同时会将Eden区和Survivor区存活的对象同时复制到另一块Survivor区，然后再清理掉Eden和已经用过的Survivor区。**Survivor区满并不会触发Minor GC,如果另一块Survivor区无法容纳Minor GC后存活的对象，这些对象将通过分配担保机制直接进入老年代。

S0区和S1区的角色发转换，Minor GC之后空的始终为S1区。即始终将Eden区和S0区存活的对象同时复制到S1区。

对象每次在S0和S1中交换一次，对象的年龄标记(Age)就会加1，默认情况下，当年龄标记达到15，对象就会进入老年代，这个阈值可通过-XX:MaxTenuringThreshold设置。

Minor GC触发频繁，回收速度快，但是Minor GC时，会暂停其他用户线程，也就是所谓的Stop World(STW)

总结，能够进入老年代的对象：

1、伊甸区无法分配的大对象。

2、Minor GC之后，Survivor区无法容纳的对象。

3、超过年龄标记阈值的对象。

#### 2、Major GC触发机制

Major GC是针对老年代的垃圾回收，在年轻代存活对象晋升老年代时，如果发现老年代没有足够的空间容纳，就会触发一次Minor GC，如果之后空间仍不足，就会进行Major GC，所以Major GC之前常常会有一次Minor GC（并非绝对，Parallel Scavenge收集器有单独回收老年代的策略而不进行Minor GC）。

Major GC回收时，其他暂停时间更长，速度也更慢，是Minor GC的十倍以上，所以JVM调优中也是需要尽量减少Major GC的频率。

Major GC之后，如果老年代的空间仍然不足以存放对象，就会抛出OMM。

#### 3、Full GC触发机制

Full GC的触发有三种情况：

1、调用System.gc()方法，调用此方法时，系统会建议进行Full GC，并非绝对发生。

2、方法区空间不足

3、老年代空间不足,年轻代的晋升对象所需内存大于老年代剩余内存。

Full GC回收范围包括年轻代、老年代及方法区，同样Full GC空间仍不足，就会OOM。

### 三、对象分配策略

IBM公司的研究中表明，年轻代中80%的对象都是朝生夕死的，这个也可以参考理解为什么伊甸区和幸存区的比例为什么是8:1:1，分代设计可以将年龄不同对象集中存放在不同的区域，提高GC的性能，同时也防止内存过于碎片化。不同年龄段对象分配策略如下：

- 对象优先分配在Eden区
- 大对象直接进入老年代
- 长期存活的对象存放在老年代
- 动态对象年龄判断，如果Survivor区年龄标识相同的对象内存总和大于Survivor的一半(指其中一块Survivor区，S0或S1)，如年龄标识为10。此时，年龄标识大于或等于10的对象将直接晋升老年代，无需等到年龄标识达到阈值(默认为15)。
- 空间分配担保：Minor GC之后，如果存活对象无法放在Survivor区，部分对象会进入老年代。

### 四、代码验证GC过程

```java
import java.util.ArrayList;
import java.util.List;
/**
 * @Description
 * @Author fsr
 * @date 2022/12/18
 * -Xms1024m
 * -Xmx1024m
 * Eden：256m
 * S0：42.5m
 * S1: 42.5m
 * OldG: 683m
 * 每次创建一个10m的数组，间隔1秒
 **/
public class GCDemo {
    public static void main(String[] args) throws InterruptedException {
        int count = 0;
        List<byte[]> list = new ArrayList<>();
        byte[] obj;
        while (true) {
            Thread.sleep(1000);
            // 每秒创建一个10m对象添加到list
            obj = new byte[1024 * 1024 * 10];
            list.add(obj);
            System.out.println(String.format("添加次数 -> %d", (++count)));
        }
    }
}
```

如上代码，设置JVM参数：-Xms1024m -Xmx1024m -XX:+PrintGCDetails，创建一个List对象，每间隔一秒，创建一个byte[]对象放入list，每一个byte[]对象10m，Eden有256m，所有按照如上设置，在添加次数每搁25的时候（考虑其他对象的创建），就会触发一次Minor GC，但是由于GC之后，所有的对象都无法被回收，而又因为Survivor区无法容纳全部对象，所以分配担保，大部分会进入老年代，最大堆空间是1024M，所以在100次左右时，老年代会满，就会触发Full GC，而之后依然没有空间可用，抛出OOM。通过安装了Visual GC插件的Jvav Visual VM工具可监控整个过程，也可以通过GC日志打印整个过程，动态图如下：
