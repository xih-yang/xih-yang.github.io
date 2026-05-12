# 21、JVM 调优实战 - 每日请求上亿的电商系统，老年代的垃圾回收参数该如何优化？
- 来源：https://ddkk.com/zhuanlan/java/jvm/8/21.html
- 分类：JVM 实战
- 分组：教程目录
## 1. 年轻代JVM优化回顾

在每日百万日活以及上亿请求量的电商系统的案例中，在大促期间的瞬时高峰下单场景下，JVM优化分析后，得出在大促高峰期，每秒每台机器会有300个下单请求。

进而推测出每秒钟会使用60MB的内存，根据这个背景推算出了一台4核8G的机器上，应该如何合理的给JVM各个区域分配内存。

进而可以保证每隔20多秒一次新生代GC后的100MB左右的存活对象，会进入200MB的Survivor区域内，一般不会因为Survivor塞不下或者是动态年龄判定规则让对象进入老年代中。

同时还根据 Minor GC的频率，合理降低了大龄对象进入老年代的年龄，尽快让一些长期存活的对象赶紧进入老年代，不要停留在新生代。如下图：

此时的JVM参数如下：

> “-Xms3072M -Xmx3072M -Xmn2048M -Xss1M -XX:PermSize=256M -XX:MaxPermSize=256M -XX:SurvivorRatio=8 -XX:MaxTenuringThreshold=5 -XX:PertenureSizeThreshold=1M -XX:+UseParNewGC -XX:+UseConcMarkSweepGC”

## 2. 在案例背景下什么时候对象会进入老年代？

第一种情况，就是 “-XX:MaxTenuringThreshold=5” 这个参数会让在一两分钟内存连续躲过5次Minor GC的对象迅速进入老年代中。

这种对象一般就是一些 @Service、@Controller之类的注解标注的系统业务逻辑组件，这种对象实例一般全局就有一个实例就可以了，要一直使用的。

所以一般会长期被GC Roots引用，但这种对象一般不多，一个系统大概就几十MB这种对象。

所以此时类似这样的长期存活的对象就会进入老年代中，如下图：

第二种情况是，按照JVM 的参数，如果分配一个超过1MB的大对象，比如一个大数组或大List之类的，就会直接进入老年代。

但这种大对象在案例里是没有的，可以忽略不记。

第三种情况就是，Minor GC过后可能存活的对象超过200MB放不下Survivor了，或者是一下子占到超过Survivor的50%，此时会有一些对象进入老年代中。

前面对新生代的JVM参数进行优化过，避免了这种情况，经过测算，这种概率应该是很低的。

## 3. 大促期间多久会触发一次Full GC？

Full GC的触发条件目前有以下4中：

**1、** 没有打开 “-XX:HandlePromotionFailure” 选项，结果老年代可用内存最多也就1G，新生代对象总大小最多可以有1.8G

这就会导致每次 Minort GC前一检查，都发现 “老年代可用内存”  “-Xms3072M -Xmx3072M -Xmn2048M -Xss1M -XX:PermSize=256M -XX:MaxPermSize=256M -XX:SurvivorRatio=8 -XX:MaxTenuringThreshold=5 -XX:PertenureSizeThreshold=1M -XX:+UseParNewGC -XX:+UseConcMarkSweepGC -XX:CMSInitiatingOccupancyFaction=92”

## 5. CMS垃圾回收之后进行内存碎片整理的频率应该多高？

在CMS完成Full GC之后，一般需要执行内存碎片的整理，可以设置多少次Full GC之后执行一次内存碎片整理。

但这里没必要修改这些参数，因为在大促高峰期，Full GC可能也就1小时执行一次，然后大促高峰期过去后，由于订单的锐减，可能几个小时才会有一次Full GC。

这里就保持默认的设置，每次Full GC之后都执行一次内存碎片整理就可以，JVM参数如下：

> “-Xms3072M -Xmx3072M -Xmn2048M -Xss1M -XX:PermSize=256M -XX:MaxPermSize=256M -XX:SurvivorRatio=8 -XX:MaxTenuringThreshold=5 -XX:PertenureSizeThreshold=1M -XX:+UseParNewGC -XX:+UseConcMarkSweepGC -XX:CMSInitiatingOccupancyFaction=92 -XX:+UseCMSCompactAtFullCollection -XX:CMSFullGCsBeforeCompaction=0”

Full GC优化的前提是Minor GC的优化，Minor GC优化的前提是合理分配内存空间，合理分配内存空间的前提是对系统运行期间的内存使用模型进行预估。
