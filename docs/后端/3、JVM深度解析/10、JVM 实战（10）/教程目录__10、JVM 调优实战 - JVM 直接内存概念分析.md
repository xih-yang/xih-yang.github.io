# 10、JVM 调优实战 - JVM 直接内存概念分析
- 来源：https://ddkk.com/zhuanlan/java/jvm/10/10.html
- 分类：JVM 实战
- 分组：教程目录
今天分析JVM直接内存问题：首先什么是直接内存。

**1、直接内存（堆外内存）**

直接内存有一种叫法，堆外内存。 直接内存( 堆外内存 ) 指的是 Java 应用程序通过直接方式从操作系统中申请的内存。这个差别与之前的堆、栈、方法区，那些内存都是经过了虚拟化。所 以严格来说，这里是指直接内存。

**2、直接内存有哪些？**

使用了 Java 的 Unsafe 类，做了一些本地内存的操作；

Netty 的直接内存（ Direct Memory ），底层会调用操作系统的 malloc 函数；

JNI 或者 JNA 程序，直接操纵了本地内存，比如一些加密库；

JNI 是 Java Native Interface 的缩写，通过使用 Java 本地接口书写程序，可以确保代码在不同的平台上方便移植。

JNA（ Java Native Access ）提供一组 Java 工具类用于在运行期间动态访问系统本地库（ native library ：如 Window 的 dll ）而不需要编写任何 Native/JNI 代码。 开发人员只要在一个 java 接口中描述目标 native library 的函数与结构， JNA 将自动实现 Java 接口到 native function 的映射。 JNA 是建立在 JNI 技术基础之上的一个 Java 类库，它使您可以方便地使用 java 直接访问动态链接库中的函数。 原来使用 JNI ，你必须手工用 C 写一个动态链接库，在 C 语言中映射 Java 的数据类型。

JNA 中，它提供了一个动态的 C 语言编写的转发器，可以自动实现 Java 和 C 的数据类型映射，你不再需要编写 C 动态链接库。 也许这也意味着，使用 JNA 技术比使用 JNI 技术调用动态链接库会有些微的性能损失。但总体影响不大，因为 JNA 也避免了 JNI 的一些平台配置的开销。

**3、代码案例**

(1)、 Unsafe 类，-XX:MaxDirectMemorySize 参数的大小限制对这种是无效的

```java
import sun.misc.Unsafe;
import java.lang.reflect.Field;
/**
 * @author  
 * 参数无效：-XX:MaxDirectMemorySize=10m
 */
public class UnsafeDemo {
    public static final int _1MB = 1024 * 1024;
    public static void main(String[] args) throws Exception {
        Field field = Unsafe.class.getDeclaredField("theUnsafe");
        field.setAccessible(true);
        Unsafe unsafe = (Unsafe) field.get(null);
        long addr = unsafe.allocateMemory(100*_1MB);
    }
}
```

(2)、ByteBuffer 的这种方式，受到 MaxDirectMemorySize 参数的大小限制其实底层是

```java
import java.nio.ByteBuffer;
/**
 * @author 
 * VM Args：-XX:MaxDirectMemorySize=100m
 * 限制最大直接内存大小100m
 * -XX:MaxDirectMemorySize=128m
 * -Xmx128m
 * -Xmx135m -Xmn100m -XX:SurvivorRatio=8
 * -Xmx138m -Xmn100m -XX:SurvivorRatio=8
 */
public class ByteBufferDemo {
    static ByteBuffer bb;
    public static void main(String[] args) throws Exception {
        //直接分配128M的直接内存
        bb = ByteBuffer.allocateDirect(128*1024*1024);
    }
}
```

**4、为什么要使用直接内存**

直接内存，其实就是不受 JVM 控制的内存。相比于堆内存有几个优势：

**1、** 减少了垃圾回收的工作，因为垃圾回收会暂停其他的工作；

**2、** 加快了复制的速度因为堆内在flush到远程时，会先复制到直接内存（非堆内存），然后再发送，而堆外内存相当于省略掉了这个工作；

**3、** 可以在进程间共享，减少JVM间的对象复制，使得JVM的分割部署更容易实现；

**4、** 可以扩展至更大的内存空间比如超过1TB甚至比主存还大的空间；

**直接内存的另一面（负面）**

直接内存有很多好处，我们还是应该要了解它的缺点：

**1、** 堆外内存难以控制，如果内存泄漏，那么很难排查；

**2、** 堆外内存相对来说，不适合存储很复杂的对象一般简单的对象比较适合；

**5、直接内存案例和场景分析**

**内存泄漏案例**

工作中经常会使用 Java 的 Zip 函数进行压缩和解压，这种操作在一些对传输性能较高的的场景经常会用到。

程序将会申请 1kb 的随机字符串，然后不停解压。为了避免让操作系统陷入假死状态，我们每次都会判断操作系统内存使用率，在达到 60% 的时候， 我们将挂起程序（不在解压，只不断的让线程休眠） 通过访问 8888 端口，将会把内存阈值提高到 85% 。

**6、** linux环境运行：；

使用以下命令把程序跑起来：

java -cp ref-jvm3.jar -XX:+PrintGC -Xmx1G -Xmn1G -XX:+AlwaysPreTouch -XX:MaxMetaspaceSize=10M -XX:MaxDirectMemorySize=10Mex15.LeakProblem

**7、** 参数解释：；

分别使用 Xmx 、 MaxMetaspaceSize 、 MaxDirectMemorySize 这三个参数限制了堆、元空间、直接内存的大小。

AlwaysPreTouch 这个参数，在 JVM 启动的时候，就把它所有的内存在操作系统分配了，默认情况下，此选项是禁用的，并且所有页面都在 JVM 堆空间填 充时提交。我们为了减少内存动态分配的影响，把这个值设置为 True 。

这个程序很快就打印一下显示，这个证明操作系统内存使用率，达到了 60% 。

**8、** 通过top命令查看，确实有一个进程占用了很高的内存，；

**VIRT****：****virtual memory usage****虚拟内存**

（1）、 进程 “ 需要的 ” 虚拟内存大小，包括进程使用的库、代码、数据等

（2）、假如进程申请 100m 的内存，但实际只使用了 10m ，那么它会增长 100m ，而不是实际的使用量

**RES****：****resident memory usage****常驻内存** 达到了 1.5G

如果申请 100m 的内存，实际使用 10m ，它只增长 10m ，与 VIRT 相反

**9、常规排查方式**

按照之前的排查方式，如果碰到内存占用过高，我们使用 top 命令来跟踪，然后使用 jmap –heap 来显示

**10、** 我们发现这个3468的java进程，占据的堆空间是比较小的，合计数远远小于top命令看到的1.5G；

我们怀疑是不是虚拟机栈占用过高。于是使用 jstack 命令来看下线程

**11、** 发现也就那么10来个左右的线程，这块占用的空间肯定也不多；

jmap -histo 3468 | head -20 显示占用内存最多的对象

**12、** 发现这个才20多M，没有达到1.5G发现不了，我们前面学过MAT，我们把内存dump下来，放到MAT中进行分析；

发现没什么问题？堆空间也好，其他空间也好，这些都没有说的那么大的内存 1.5G 左右。

**13、使用工具排查**

这种情况应该是发生了直接内存泄漏。 如果要跟踪本地内存的使用情况，一般需要使用 NMT

**NMT**

NativeMemoryTracking ，是用来追踪 Native 内存的使用情况。通过在启动参数上加入 -XX:NativeMemoryTracking=detail 就可以启用。使用 jcmd （ jdk 自

带）命令，就可查看内存分配。

Native Memory Tracking (NMT) 是 Hotspot VM 用来分析 VM 内部内存使用情况的一个功能。我们可以利用 jcmd （ jdk 自带）这个工具来访问 NMT 的数据。

NMT 必须先通过 VM 启动参数中打开，不过要注意的是，打开 NMT 会带来 5%-10% 的性能损耗。

在服务器上重新运行程序：

java

-cp

ref-jvm3.jar

-XX:+PrintGC

-Xmx1G

-Xmn1G

-XX:+AlwaysPreTouch

-XX:MaxMetaspaceSize=10M

-XX:MaxDirectMemorySize=10M

-XX:NativeMemoryTracking=detail ex15.LeakProblem

**14、** jcmd$pidVM.native_memorysummary；

可惜的是，这个工具并一样很烂，看到我们这种泄漏的场景。下面这点小小的空间，是不能和 1~2GB 的内存占用相比的。

**15、** 其实问题排查到这里，很明显了，这块的问题排查超出了一般java程序员的范畴了（说白了就是你做到这点就OK了，继续排查就是在干操作系统和其他的语言相关的问题排查了），如果你有时间，有兴趣，我推荐你使用perf这个工具，这个工具安装很容易，但是容易遇到操作系统内核一些功能没支持，也分析不了，这里我就不多去花时间去分析Perf安装：yuminstallperf；

到此直接内存的概念和示例就分析完了，大家一定要自己模拟测试几次。下篇我们实战分析直接内存的内存泄漏问题！
