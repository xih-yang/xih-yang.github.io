# 14、JVM 实战 - 垃圾回收的相关概念
- 来源：https://ddkk.com/zhuanlan/java/jvm/3/14.html
- 分类：JVM 实战
- 分组：教程目录
## 1. System.gc() 的理解

在默认情况下，通过System.gc()者Runtime.getRuntime().gc()(**前者的底层就是后者**)的调用，会显式触发Full GC，同时对老年代和新生代进行回收，尝试释放被丢弃对象占用的内存。

然而System.gc()调用附带一个免责声明，无法保证对垃圾收集器的调用(不能确保立即生效)

JVM实现者可以通过System.gc() 调用来提醒JVM的GC行为。而一般情况下，垃圾回收应该是自动进行的，无须手动触发，否则就太过于麻烦了。

在一些特殊情况下，如我们正在编写一个性能基准，我们可以在运行之间调用System.gc()

**手动执行案例:**

```java
public class SystemGCTest {
    public static void main(String[] args) {
        new SystemGCTest();
        /*
            提醒jvm的垃圾回收器执行gc,但是不确定是否马上执行gc
            与Runtime.getRuntime().gc();的作用一样。
         */
        //System.gc();
        // 强制调用使用引用的对象的finalize()方法
        System.runFinalization();
    }
    @Override
    protected void finalize() throws Throwable {
        super.finalize();
        System.out.println("SystemGCTest 重写了finalize()");
    }
}
```

实际执行过程中,finalize 方法不一定执行,程序就结束了,说明 gc的调用是不固定的,

但是如果调用`System.runFinalization()` 则必定执行

> 代码演示不可达对象回收行为

```java
public class LocalVarGC {
    public void localvarGC1() {
        byte[] buffer = new byte[10 * 1024 * 1024];//10MB
        System.gc();
    }
    public void localvarGC2() {
        byte[] buffer = new byte[10 * 1024 * 1024];
        buffer = null;
        System.gc();
    }
    public void localvarGC3() {
        {
            byte[] buffer = new byte[10 * 1024 * 1024];
        }
        System.gc();
    }
    public void localvarGC4() {
        {
            byte[] buffer = new byte[10 * 1024 * 1024];
        }
        int value = 10;
        System.gc();
    }
    public void localvarGC5() {
        localvarGC1();
        System.gc();
    }
    public static void main(String[] args) {
        LocalVarGC local = new LocalVarGC();
        // TODO
        local.localvarGC1();
    }
}
```

通过main 方法 依次执行 main方法, 并开启jvm GC 日志的打印: `-XX:+PrintGCDetails`,分析五个方法的行为

- localvarGC1 方法, byte数组没有回收
- localvarGC2 方法, byte数组没有被引用了,被回收
- localvarGC3 方法, 在本方法内,局部变量表索引为1 的位置仍然引用,所以不回收
- localvarGC4 方法, int value = 10; 替换 局部变量表索引为1的位置,所以 byte数组回收
- localvarGC5 方法, 调用 第一个方法,第一个方法内的局部变量表已经销毁,所以byte数组回收

## 2. 内存溢出分析

**概念:**

**1、** 内存溢出相对于内存泄漏来说，尽管更容易被理解，但是同样的，内存溢出也是引发程序崩溃的罪魁祸首之一；

**2、** 由于GC一直在发展，所以一般情况下，除非应用程序占用的内存增长速度非常快(吃着炫迈造对象)，造成垃圾回收已经跟不上内存消耗的速度，否则不太容易出现OOM的情况；

**3、** 大多数情况下，GC会进行各种年龄段的垃圾回收，实在不行了就放大招，来一次独占式的FullGC操作，这时候会回收大量的内存，供应用程序继续使用；

**4、** Javadoc中对OutofMemoryError的解释是，没有空闲内存，并且垃圾收集器也无法提供更多内存；

**内存溢出（OOM）原因分析** :

Java虚拟机的堆内存设置不够。

比如：可能存在内存泄漏问题；也很有可能就是堆的大小不合理，比如我们要处理比较可观的数据量，但是没有显式指定JVM堆大小或者指定数值偏小。

我们可以通过参数-Xms 、-Xmx来调整。

**代码中创建了大量大对象，并且长时间不能被垃圾收集器收集**（存在被引用）

对于老版本的Oracle JDK，因为永久代的大小是有限的，并且JVM对永久代垃圾回收（如，常量池回收、卸载不再需要的类型）非常不积极，所以当我们不断添加新类型的时候，永久代出现OutOfMemoryError也非常多见 . 尤其是在运行时存在大量动态类型生成的场合；类似intern字符串缓存占用太多空间，也会导致OOM问题。对应的异常信息，会标记出来和永久代相关：“java.lang.OutOfMemoryError:PermGen space"。

随着元数据区的引入，方法区内存已经不再那么窘迫，所以相应的OOM有所改观，出现OOM，异常信息则变成了：“java.lang.OutofMemoryError:Metaspace"。直接内存不足，也会导致OOM。

> 注意

在抛出OutofMemoryError之前，几乎一定 垃圾收集器会被触发，尽其所能去清理出空间。 在java.nio.Bits.reserveMemory()方法中，我们能清楚的看到，System.gc()会被调用，以清理空间。

当然，也不是在任何情况下垃圾收集器都会被触发的 . 比如，我们去分配一个超大对象，类似一个超大数组超过堆的最大值，JVM可以判断出垃圾收集并不能解决这个问题，所以直接抛出OutofMemoryError。

**总结:** 出现OOM的情况是因为内存空间在垃圾回收完后还是内存不足, 另外一个就是需要的内存直接超过了 最大堆空间

## 3. 内存泄漏分析

**1、** 也称作“存储渗漏”**严格来说，**只有对象不会再被程序用到了，但是GC又不能回收他们的情况，才叫内存泄漏；

**2、** 但实际情况很多时候一些不太好的实践（或疏忽）会导致对象的生命周期变得很长甚至导致OOM，**也可以叫做宽泛意义上的“内存泄漏”**；

**3、** 尽管内存泄漏并不会立刻引起程序崩溃，但是一旦发生内存泄漏，程序中的可用内存就会被逐步蚕食，直至耗尽所有内存，最终出现OutofMemory异常，导致程序崩溃；

**4、** 注意，这里的存储空间并不是指物理内存，而是指虚拟内存大小，这个虚拟内存大小取决于磁盘交换区设定的大小；

**官方的例子:**

在右边的图中, 很明显,有一堆对象并没有被引用了,但是 可能因为一些设计疏忽,导致仍然有一条引用链,导致大批的对象不能被回收

**实际开发中常见的例子:**

单例模式

- 单例的生命周期和应用程序是一样长的，所以在单例程序中，如果持有对外部对象的引用的话，那么这个外部对象是不能被回收的，可能会导致内存泄漏的产生。

一些提供close()的资源未关闭导致内存泄漏

- 数据库连接 dataSourse.getConnection()，网络连接socket和io连接必须手动close，否则是不能被回收的。

## 4. Stop The World 事件

直译为"停止全世界'',对于jvm来说也确实如此

**1、** Stop-the-World，简称STW，指的是GC事件发生过程中，会产生应用程序的停顿停顿产生时**整个应用程序线程**都会被暂停，没有任何响应，有点像卡死的感觉，这个停顿称为STW；

**2、** 可达性分析算法中枚举根节点（GCRoots）会导致所有Java执行线程停顿，为什么需要停顿所有Java执行线程呢？；

- 分析工作必须在一个能确保一致性的快照中进行
- 一致性指整个分析期间整个执行系统看起来像被冻结在某个时间点上
- 如果出现分析过程中对象引用关系还在不断变化，则分析结果的准确性无法保证
**3、** 被STW中断的应用程序线程会在完成GC之后恢复，频繁中断会让用户感觉像是网速不快造成电影卡带一样，所以我们需要减少STW的发生；

> 注意事项

**1、** STW事件和采用哪款GC无关，所有的GC都有这个事件；

**2、** 哪怕是G1也不能完全避免Stop-the-world情况发生，只能说垃圾回收器越来越优秀，回收效率越来越高，尽可能地缩短了暂停时间；

**3、** STW是JVM在后台自动发起和自动完成的在用户不可见的情况下，把用户正常的工作线程全部停掉；

**4、** 开发中不要用System.gc()，这会导致Stop-the-World的发生；

> 代码体验STW

```java
public class StopTheWorldDemo {
    public static class WorkThread extends Thread {
        List<byte[]> list = new ArrayList<byte[]>();
        public void run() {
            try {
                while (true) {
                    for(int i = 0;i < 1000;i++){
                        byte[] buffer = new byte[1024];
                        list.add(buffer);
                    }
                    if(list.size() > 10000){
                        list.clear();
                        System.gc();//会触发full gc，进而会出现STW事件
                    }
                }
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }
    public static class PrintThread extends Thread {
        public final long startTime = System.currentTimeMillis();
        public void run() {
            try {
                while (true) {
                    // 每秒打印时间信息
                    long t = System.currentTimeMillis() - startTime;
                    System.out.println(t / 1000 + "." + t % 1000);
                    Thread.sleep(1000);
                }
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }
    public static void main(String[] args) {
        WorkThread w = new WorkThread();
        PrintThread p = new PrintThread();
        //w.start();
        p.start();
    }
}
```

上面的代码中 , 一个线程在GC ,一个在打印时间间隔

- 关闭 GC 方法, 执行 打印时间间隔方法, 比较规则的时隔一秒打印一次

```java
0.0
1.0
2.1
3.1
4.2
5.2
6.3
7.4
8.4
```

- 关闭 GC 方法, 执行 打印时间间隔方法, 受到STW的影响, 打印时间不再规则

```java
0.1
1.2
2.4
3.5
4.6
5.6
6.10
7.11
8.14
9.15
10.15
```

## 5. 垃圾回收的并行 与 并发

首先要了解 一个程序对于 CPU 的并行与并发 ,可以参考这篇博客:

[https://www.cnblogs.com/xjwhaha/p/13882100.html#_label0](https://www.cnblogs.com/xjwhaha/p/13882100.html#_label0)

> 垃圾回收的并行与串行

**第一组方式: 用户线程和垃圾回收线程完全隔离**

并行（Parallel）：指多条垃圾收集线程并行工作，但此时用户线程仍处于等待状态。

- 如ParNew、Parallel Scavenge、Parallel Old

串行（Serial）

- 相较于并行的概念，单线程执行。
- 如果内存不够，则程序暂停，启动JVM垃圾回收器进行垃圾回收（单线程）

**第二组概念: 垃圾回收线程和用户线程的并发执行**

**1、** 并发（Concurrent）：指用户线程与垃圾收集线程同时执行，垃圾回收线程在执行时不会停顿用户程序的运行(**这里的同时执行也可能是并发执行,相互切换,STW是无论如何都逃不掉的**)；

**2、** 比如用户程序在继续运行，而垃圾收集程序线程运行于另一个CPU上；

**3、** 典型垃圾回收器：CMS、G1；

## 6. 安全点与安全区域

> 安全点

前面说到,如果要GC,jvm 就需要 枚举GC Roots, 就需要保证jvm中每个对象的一致性,所以就需要停止所有的 用户线程, 程序执行时并非在所有地方都能停顿下来开始GC，只有在特定的位置才能停顿下来开始GC，这些位置称为“安全点（Safepoint）”。

**1、** SafePoint的选择很重要，如果太少可能导致GC线程等待的时间太长，如果太多将导致GC线程和用户线程切换太频繁,可能导致运行时的性能问题；

**2、** 大部分指令的执行时间都非常短暂，所以JVM通常会根据“是否具有让程序长时间执行的特征”为标准及找一些需要长时间执行的地方作为安全点,如方法调用、循环跳转和异常跳转等；

**那么当需要GC 时,线程如何中断呢,共有两种方式**

**1、** 抢先式中断：（**目前没有虚拟机采用了**）首先中断所有线程如果还有线程不在安全点，就恢复线程，让线程跑到安全点；

**2、** 主动式中断：当需要GC时,设置一个中断标志，各个线程运行到SafePoint的时候主动轮询这个标志，如果中断标志为真，则将自己进行中断挂起；

> 安全区域

jvm中 还有一些被系统层面挂起,无法响应GC 的中断请求, 例如 sleep转态,blocked状态等,JVM也不太可能等待线程被唤醒。 这时就需要安全区域 (SafeRegin ) 来解决

安全区域是指在一段代码片段中，对象的引用关系不会发生变化，在这个区域中的任何位置开始GC都是安全的。我们也可以把Safe Region看做是被扩展了的Safepoint。由点扩展到面

**工作流程:**

当线程运行到Safe Region的代码时 , 标识自己 已经进入Safe Region , 如果这段时间内发生GC，JVM会忽略标识为Safe Region状态的线程 , 那么只要保证sleep 或 blocked 的线程是在这一片区域的就ok了

当线程被唤醒时,虽然GC可能正在运行,但是本身在安全区域,所以也是安全的, 如果继续运行到即将离开Safe Region时，会检查JVM是否已经完成GC，如果完成了，则继续运行，否则该线程也将等待直到收到可以安全离开Safe Region的信号为止；

## 7. 引用分类

在平时的业务开发过程中, 引用似乎没有分类, 但是其实在 JDK1.2 的时候,Java对引用的概念进行了扩充，将引用分为 四种类型 `Object obj = new Object()` , 这是平时使用的方式,这也叫强引用

- 强引用（Strong Reference）
- 软引用（Soft Reference）
- 弱引用（Weak Reference）
- 虚引用（Phantom Reference）

这4种引用强度依次逐渐减弱。除强引用外，其他3种引用均可以在java.lang.ref包中找到它们的身影。如下图，显示了这3种引用类型对应的类，开发人员可以在应用程序中直接使用它们。

> 四种引用类型的具体说明

Reference子类中只有终结器引用(FinalReference)是包内可见的，其他3种引用类型均为public，可以在应用程序中直接使用

**1、** 强引用（StrongReference）：最传统的“引用”的定义，是指在程序代码之中普遍存在的引用赋值，即类似“objectobj=newObject()”这种引用关系无论任何情况下，只要强引用关系还存在，垃圾收集器就永远不会回收掉被引用的对象(死都不回收)；

**2、** 软引用（SoftReference）：在系统将要发生内存溢出之前，将会把这些对象列入回收范围之中进行第二次回收如果这次回收后还没有足够的内存，才会抛出内存溢出异常(内存不够才回收)；

**3、** 弱引用（WeakReference）：被弱引用关联的对象只能生存到下一次垃圾收集之前当垃圾收集器工作时，无论内存空间是否足够，都会回收掉被弱引用关联的对象(遇到就回收)；

**4、** 虚引用（PhantomReference）：一个对象是否有虚引用的存在，完全不会对其生存时间构成影响，也无法通过虚引用来获得一个对象的实例为一个对象设置虚引用关联的唯一目的就是能在这个对象被收集器回收时收到一个系统通知；

### 7.1 强引用

**1、** 在Java程序中，最常见的引用类型是强引用（普通系统99%以上都是强引用），也就是我们最常见的普通对象引用，也是默认的引用类型；

**2、** 当在Java语言中使用new操作符创建一个新的对象，并将其赋值给一个变量的时候，这个变量就成为指向该对象的一个强引用；

**3、** 只要强引用的对象是可触及的，垃圾收集器就永远不会回收掉被引用的对象；

**4、** 对于一个普通的对象，如果没有其他的引用关系，只要超过了引用的作用域或者显式地将相应引用赋值为null，就是可以当做垃圾被收集了，当然具体回收时机还是要看垃圾收集策略；

**5、** 相对的，软引用、弱引用和虚引用的对象是:软可触及、弱可触及和虚不可触及的，在一定条件下，都是可以被回收的所以，强引用是造成Java内存泄漏的主要原因之一；

**总结**

**1、** 强引用可以直接访问目标对象；

**2、** 强引用所指向的对象在任何时候都不会被系统回收，虚拟机宁愿抛出OOM异常，也不会回收强引用所指向对象；

**3、** 强引用可能导致内存泄漏；

### 7.2 软引用

**1、** 软引用是用来描述一些还有用，但非必需的对象只被软引用关联着的对象，在系统将要发生内存溢出异常前，会把这些对象列进回收范围之中进行第二次回收(**第一次回收一般在正常的GC,如果发现还是内存不够,则将清理软引用对象**)，如果这次回收还没有足够的内存，才会抛出内存溢出异常；

**2、** 软引用通常用来实现内存敏感的缓存比如：高速缓存就有用到软引用如果还有空闲内存，就可以暂时保留缓存，当内存不足时清理掉，这样就保证了使用缓存的同时，不会耗尽内存(Mybatis的缓存底层中就用到)；

**3、** 垃圾回收器在某个时刻决定回收软可达的对象的时候，会清理软引用，并可选地把引用存放到一个引用队列（ReferenceQueue）；

**4、** 类似弱引用，只不过Java虚拟机会尽量让软引用的存活时间长一些，迫不得已才清理；

**一句话概括：当内存足够时，不会回收软引用可达的对象。内存不够时，会回收软引用的可达对象**

在JDK1.2版之后提供了SoftReference类来实现软引用 ,看下面的代码:

```java
public class SoftReferenceTest {
    public static class User {
        public int id;
        public String name;
        public User(int id, String name) {
            this.id = id;
            this.name = name;
        }
        @Override
        public String toString() {
            return "[id=" + id + ", name=" + name + "] ";
        }
    }
    public static void main(String[] args) {
        //创建对象，建立软引用  userSoftRef -强-> new SoftReference -弱-> u1
        User u1 = new User(1, "songhk");
        SoftReference<User> userSoftRef = new SoftReference<User>(u1);
        u1 = null;//取消强引用
        //从软引用中重新获得强引用对象
        System.out.println(userSoftRef.get());
        /*
            垃圾回收之后获得软引用中的对象
            由于堆空间内存足够，所有不会回收软引用的可达对象。
         */
        System.gc();
        System.out.println("After GC:");
        System.out.println(userSoftRef.get());
        try {
            //让系统认为内存资源紧张、不够
            byte[] b = new byte[1024 * 1024 * 7];
        } catch (Throwable e) {
            e.printStackTrace();
        } finally {
            /*
                再次从软引用中获取数据
                在内存不够，报OOM之前，垃圾回收器会回收软引用的可达对象。
             */
            System.out.println(userSoftRef.get());//
        }
    }
}
```

设置jvm参数 : `-Xms10m -Xmx10m` 执行代码, 报错信息:

```java
[id=1, name=songhk] 
After GC:
[id=1, name=songhk] 
java.lang.OutOfMemoryError: Java heap space
	at com.atguigu.java1.SoftReferenceTest.main(SoftReferenceTest.java:51)
null
```

根据上面的日志就可以发现,当把User对象 的强引用取消,保持弱引用时,第一次GC 因为 空间足够,并没有回收,并且将之打印,

但是在后面的分配一个大型的数组时,因为发现 需要的空间不足, GC 将回收 若引用, 就将User 对象回收,打印null

### 7.3 弱引用

**1、** 弱引用也是用来描述那些非必需对象，只被弱引用关联的对象只能生存到下一次垃圾收集发生为止在系统GC时，只要发现弱引用，不管系统堆空间使用是否充足，都会回收掉只被弱引用关联的对象；

**2、** 但是，由于垃圾回收器的线程通常优先级很低，因此，并不一定能很快地发现持有弱引用的对象在这种情况下，弱引用对象可以存在较长的时间可以当做缓存使用；

**3、** 弱引用和软引用一样，在构造弱引用时，也可以指定一个引用队列，当弱引用对象被回收时，就会加入指定的引用队列，通过这个队列可以跟踪对象的回收情况；

**4、** 软引用、弱引用都非常适合来保存那些可有可无的缓存数据如果这么做，当系统内存不足时，这些缓存数据会被回收，不会导致内存溢出而当内存资源充足时，这些缓存数据又可以存在相当长的时间，从而起到加速系统的作用；

**5、** 弱引用对象与软引用对象的最大不同就在于，当GC在进行回收时，需要通过算法检查是否回收软引用对象，而对于弱引用对象，GC只需无脑进行回收弱引用对象更容易、更快被GC回收；

**在JDK1.2版之后提供了WeakReference类来实现弱引用**

在JDK 中,有一个集合类`WeakHashMap`,其底层 存放数据的 `Entry` 继承 `WeakReference`,从而放入其中的数据在垃圾回收时,将会被 清除, 可以当做缓存使用

```java
private static class Entry<K,V> extends WeakReference<Object> implements Map.Entry<K,V> 
```

**代码举例弱引用:**

```java
public class WeakReferenceTest {
    public static class User {
        public User(int id, String name) {
            this.id = id;
            this.name = name;
        }
        public int id;
        public String name;
        @Override
        public String toString() {
            return "[id=" + id + ", name=" + name + "] ";
        }
    }
    public static void main(String[] args) {
        //构造了弱引用
        WeakReference<User> userWeakRef = new WeakReference<User>(new User(1, "songhk"));
        //从弱引用中重新获取对象
        System.out.println(userWeakRef.get());
        System.gc();
        // 不管当前内存空间足够与否，都会回收它的内存
        System.out.println("After GC:");
        // 重新尝试从弱引用中获取对象
        System.out.println(userWeakRef.get());
    }
}
```

执行代码,打印日志:

```java
[id=1, name=songhk] 
After GC:
null
```

可以发现, 当调用GC 时,即使 内存足够, 弱引用的对象也将被回收

### 7.4 虚引用

**1、** 也称为“幽灵引用”或者“幻影引用”，是所有引用类型中最弱的一个；

**2、** 一个对象是否有虚引用的存在，完全不会决定对象的生命周期如果一个对象仅持有虚引用，那么它和没有引用几乎是一样的，随时都可能被垃圾回收器回收；

**3、** 它不能单独使用，也无法通过虚引用来获取被引用的对象当试图通过虚引用的get()方法取得对象时，总是null，即通过虚引用无法获取到我们的数据；

**4、** 为一个对象设置虚引用关联的唯一目的在于跟踪垃圾回收过程比如：能在这个对象被收集器回收时收到一个系统通知；

**5、** 虚引用必须和引用队列一起使用虚引用在创建时必须提供一个引用队列作为参数当垃圾回收器准备回收一个对象时，如果发现它还有虚引用，就会在回收对象后，将这个虚引用加入引用队列，以通知应用程序对象的回收情况；

**6、** 由于虚引用可以跟踪对象的回收时间，因此，也可以将一些资源释放操作放置在虚引用中执行和记录；

**在JDK1.2版之后提供了PhantomReference类来实现虚引用。**

```java
// 声明强引用
Object obj = new Object();
// 声明引用队列
ReferenceQueue phantomQueue = new ReferenceQueue();
// 声明虚引用（还需要传入引用队列）
PhantomReference<Object> sf = new PhantomReference<>(obj, phantomQueue);
obj = null; 
System.out.println(sf.get())
```

上面的打印语句中,打印的为null,因为虚引用,无法被获取

**代码举例其作用:**

```java
public class PhantomReferenceTest {
    public static PhantomReferenceTest obj;//当前类对象的声明
    static ReferenceQueue<PhantomReferenceTest> phantomQueue = null;//引用队列
    public static class CheckRefQueue extends Thread {
        @Override
        public void run() {
            while (true) {
                if (phantomQueue != null) {
                    PhantomReference<PhantomReferenceTest> objt = null;
                    try {
                        objt = (PhantomReference<PhantomReferenceTest>) phantomQueue.remove();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    if (objt != null) {
                        System.out.println("追踪垃圾回收过程：PhantomReferenceTest实例被GC了");
                    }
                }
            }
        }
    }
    public static void main(String[] args) {
        Thread t = new CheckRefQueue();
        t.setDaemon(true);//设置为守护线程：当程序中没有非守护线程时，守护线程也就执行结束。
        t.start();
        phantomQueue = new ReferenceQueue<PhantomReferenceTest>();
        obj = new PhantomReferenceTest();
        //构造了 PhantomReferenceTest 对象的虚引用，并指定了引用队列
        PhantomReference<PhantomReferenceTest> phantomRef = new PhantomReference<PhantomReferenceTest>(obj, phantomQueue);
        //将强引用去除
        obj = null;
        System.gc();
    }
}
```

执行程序 ,当虚引用被回收时, 监控线程可以捕捉到并打印日志 `追踪垃圾回收过程：PhantomReferenceTest实例被GC了`

### 7.5 终结器引用

在前面的章节中,说到,当GC 发现 不可达的对象重写了 finalize() 方法,并且没有执行过时,会将此对象放入队列,由一个专门的线程去执行, 当判断无法复活时,才将对象回收.

而终结器引用,它就是用于实现对象的finalize() 方法，所以称为终结器引用

无需手动编码，其内部配合引用队列使用

在GC时，终结器引用入队。由Finalizer线程通过终结器引用找到被引用对象调用它的finalize()方法，第二次GC时才回收被引用的对象
