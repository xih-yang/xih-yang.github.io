# 26、JVM 实战 - JVM监控及诊断工具-GUI篇
- 来源：https://ddkk.com/zhuanlan/java/jvm/7/26.html
- 分类：JVM 实战
- 分组：教程目录
### 1、工具概述

使用上一张命令行工具或组合能帮您获取目标Java应用性能相关的基础信息，但他们存在下列局限：

- **1、** 无法获取方法级别的分析数据，如方法间的调用关系、各方法的调用次数和调用时间（这对定位应用性能瓶颈至关重要）。
- **2、** 要求用户登录到目标Java应用所在的宿主机上，使用起来不方便。
- **3、** 分析数据通过终端输出，结果展示不够直观。

为此，JDK提供了一些内存泄露的分析工具，如 jconsole，jvisualvm等，用于辅助开发人员定位问题，但是这些工具很多时候并不足以满足快速定位的需求。所以这里我们介绍的工具相对多一些、丰富一些。

**图形化综合诊断工具**

- **JDK自带的工具**
- jconsole：JDK自带的可视化监视工具。查看Java应用程序的运行概况、监控堆信息、永久代（元空间）使用情况、类加载情况等。

位置：jdk\bin\jconsole.exe
- Visual VM：Visual VM是一个工具，它提供了一个可视化界面，用于查看Java虚拟机上运行的基于Java技术的应用程序的详细信息。

位置：jdk\bin\jvisualvm.exe，也可以单独安装
- JMC：Java Mission Control，内置Java Flight Recorder。能够以极低的性能开销收集Java虚拟机的性能数据。
- **第三方工具**
- MAT：MAT（Memory Analyzer Tool）是基于Eclipse的内存分析工具，是一个快速、功能丰富的Java heap分析工具，它可以帮助我们查找内存泄露和减少内存消耗。

Eclipse的插件形式，也可以单独安装
- JProfiler：商业软件，需要付费，功能强大。

可以单独安装，然后集成到IDEA中
- Arthas：Alibaba开源的Java诊断工具。深受开发者喜爱。
- Btrace：Java运行时追踪工具。可以在不停机的情况下，跟踪执行的方法调用、构造函数和系统内存等信息。

### 2、jConsole

#### 2.1、基本概述

- 从Java5开始，是JDK中自带的java监控和管理控制台。
- 用于对JVM中内存、线程和类等的监控，是一个基于JMX（java management extensions）的GUI性能监控工具。
- [官方教程](https://docs.oracle.com/javase/7/docs/technotes/guides/management/jconsole.html)

#### 2.2、启动

两种方式：

- jdk/bin下，双击jconsole.exe即可
- 在cmd命令行中输入 jconsole

#### 2.3、三种连接方式

- Local

使用 jConsole连接一个正在本地系统运行的JVM，并且执行程序和运行 jConsole的需要是同一个用户。jConsole使用文件系统的授权通过RMI连接器连接到平台的MBean服务器上。这种从本地连接的监控能力只有Sun的JDK具有。

- Remote

使用下面的URL通过RMI连接器连接到一个JMX代理：service:jmx:rmi:///jndi/rmi://hostName:portNum/jmsrmi。jConsole为建立连接，需要在环境变量中设置mx.remote.credentials来指定用户名和密码，从而进行授权。

- Advanced

使用一个特殊的URL链接JMX代理。一般情况使用自己定制的连接器而不是RMI提供的连接器来连接JMX代理，或者是一个使用JDK1.4的实现了JMX和JMX Remote的应用。

#### 2.4、主要作用

- 监控内存、监控线程、监控死锁、类加载与虚拟机信息

演示：

### 3、Visual VM

#### 3.1、基本概述

- Visual VM是一个功能强大的多合一故障诊断和性能监控的可视化工具。
- 它集成了多个JDK命令行工具，使用Visual VM可用于显示虚拟机进程及进程的配置和环境信息（jps，jinfo），监视应用程序的CPU、GC、堆、方法区及线程的信息（jstat、jstack），可以取代 jConsole。

#### 3.2、插件的安装

- Visual VM的一大特点是支持插件扩展，并且插件安装非常方便。我们既可以通过离线下载文件*.nbm，然后再Plugin对话框的已下载页面下，添加已下载的插件。也可以在可用插件页面下，在线安装插件。**（这里建议安装上：VisualGC）**

#### 3.3、连接方式

#### 3.4、主要功能

**1、** 生成/读取堆内存快照

**2、** 查看JVM参数和系统属性

**3、** 查看运行中的虚拟机进程

**4、** 生成/读取线程快照

**5、** 程序资源的实时监控

**6、** 其他功能：JMX代理连接、远程环境监控、CPU分析和内存分析

**概览**

**生成和查看堆dump文件**

然后在快照上右键即可将快照（.hprof文件）保存到磁盘：

通过选择：文件---->装入，可以导入刚才保存的 .hprof文件：

**生成和查看线程dump文件**

类似于堆dump文件，通过VisualVM可以检测到程序是否死锁，有如下测试程序：

**CPU抽样和内存抽样**

### 4、eclipse MAT

#### 4.1、基本概述

- MAT（Memory Analyzer Tool）工具是一款功能强大的Java堆内存分析工具。可以用于查找内存泄露以及查看内存消耗情况。
- MAT是基于Eclipse开发的，不仅可以单独使用，还可以作为插件的形式嵌入在Eclipse中使用。是一款免费的性能分析工具，使用起来非常方便。
- [下载地址](https://www.eclipse.org/mat/downloads.php)，下载之后解压可以直接使用，不用安装。

#### 4.2、获取堆dump文件

**dump文件内容**

MAT可以分析heap dump文件。进行内存分析时，只要获得了反应当前设备内存映像的 hprof文件，通过MAT打开就可以直观的看到当前的内存信息。

一般来说，这些内存信息包含：

- 所有的对象信息，包括对象实例、成员变量、存储于栈中的基本数据类型值和存储于堆中的其他对象的引用值。
- 所有的类信息，包括classloader、类名称、父类、静态变量等。
- GCRoot到所有的这些对象的引用路径
- 线程信息，包括线程的调用栈以及此线程的线程局部变量（TLS）

**两点说明**

- 说明1：MAT不是一个万能工具，它并不能处理所有类型的堆转储文件。但是比较主流的厂家和格式，例如Sun，HP，SAP所采用的HPROF二进制堆转储文件，以及IBM的PHD堆转储文件等都能被很好的解析。
- 说明2：MAT最吸引人的还是能够快速地为开发人员生成内存泄露报表，方便定位问题和分析问题。虽然MAT有如此强大的功能，但是内存分析也没有简单到一键完成的程度，很多内存问题还是需要我们从MAT展现给我们的信息中通过经验和直觉来判断才能发现。

**如何获取dump文件**

- 方法一：通过前一章介绍的jmap工具生成，可以生成任意一个java进程的dump文件；
- 方法二：通过配置JVM参数生成。
- **1、** 选项-XX:+HeapDumpOnOutOfMemoryError或-XX:+HeapDumpBeforeFullGC
- **2、** 选项-XX:HeapDumpPath所代表的含义就是当程序出现OutofMemory时，将会在相应的目录下生成一份dump文件。如果不指定选项-XX:HeapDumpPath则在当前目录下生成dump文件。
- 方法三：使用 VisualVM可以导出堆dump文件
- 方法四：使用MAT既可以打开一个已有的快照，也可以通过MAT直接从活动 Java程序中导出堆快照。该功能将借助 jps列出当前正在运行的Java进程，以供选择并获取快照。

#### 4.3、分析堆dump文件

- 在MAT中导入刚才生成的.hprof文件，默认勾选第一项，生成**内存泄露报表**，点击Finish即可

显示如下：

**分析dump文件：**

- **histogram：** 展示了各个类的实例数目以及这些实例的Shallow heap或Retainedheap的总和

查看对象被谁引用，可以进行如下操作：

- **thread overview：** 查看系统中的 Java线程、查看局部变量的信息。获取对象相互引用关系

- **深堆与浅堆**

**浅堆：**

- 浅堆（Shallow Heap）是指一个对象所消耗的内存。在32位系统中，一个对象引用会占据4个字节，一个int类型会占据4个字节，long型变量占据8个字节。根据堆快照格式不同，对象的大小可能会向8字节进行对齐。
- 以String为例：2个int值共占8个字节，对象引用占用4字节，对象头占8字节，合计20字节，向8字节对齐，故占24字节。（jdk7中）

int
hash32
0

int
hash
0

ref
value
hello

这24字节为String对象的浅堆大小。它与String的value实际取值无关，无论字符串长度如何，**浅堆大小始终是24字节**。

**深堆：**

- **保留集（Retained Set）：**

对象A的保留集指当对象A被垃圾回收后，可以被释放的所有对象集合（包括对象A本身），即对象A的保留集可以被认为是**只能通过**对象A被直接或者间接访问到的所有对象的集合。通俗的说，就是指仅被对象A所持有的对象的集合。

- **深堆（Retained Heap）：**

深堆是指对象的保留集中所有的对象的浅堆大小之和。

注意：浅堆是指对象本身占用的内存，不包括其内部引用对象的大小。一个对象的深堆指只能通过该对象访问到的（直接或者间接）所有对象的浅堆之和，即对象被回收后，可以释放的真实空间。

**补充：对象的实际大小**

- 另外一个常用的概念是对象的实际大小。这里，对象的实际大小定义为一个对象所能触及的所有对象的浅堆大小之和，也就是通常意义上我们所说的对象的大小。与深堆相比，似乎这个在日常开发中更为直观和被人接收，但实际上，这个概念和垃圾回收无关。
- 下图显示了一个简单的对象引用关系图。那么对象A的浅堆大小只是A本身，不包含C和D，而A的实际大小为A、C、D三者之和。而A的深堆大小为A和D之和，这是因为由于对象C还可以通过对象B访问到，因此不再对象A的深堆范围内。

- 通过案例分析深堆和浅堆的大小

下面以Lily为例分析深堆的大小是如何计算出来的

**支配树：** 支配树的概念来自于图论。

MAT提供了一个称为支配树（Dominator Tree）的对象图。支配树体现了对象实例间的支配关系。在对象引用图中，所有指向对象B的路径都经过对象A，则认为对象A支配对象B。**如果对象A是离对象B最近的一个支配对象，则认为对象A为对象B的直接支配者。**支配树是基于对象间的引用图所建立的，它有以下基本性质：

- 对象A的子树（所有被对象A支配的对象的集合）表示对象A的保留集（retained set），即深堆。
- 如果对象A支配对象B，那么对象A的直接支配者也支配对象B。
- 支配树的边与对象引用图的边不直接对应。

在MAT中，单击工具栏上的对象支配按钮，可以打开对象支配树视图。

下图显示了对象支配树的部分视图。该截图显示部分学生Lily的history队列的直接支配对象。即当Lily对象被回收，也会一并回收的所有对象。显然能被3或者5整除的网页不会出现在该列表中，因为他们同时被另外两名学生对象所引用。

#### 补充1：再谈内存泄露

> 内存泄露的理解与分类

- **何为内存泄露（memory leak）**

可达性分析算法来判断对象是否是不再使用的对象，本质上是判断一个对象是否还被引用。那么对于这种情况，由于代码的实现不同就会出现很多内存泄露问题（让JVM误认为此对象还在引用中，无法回收，造成内存泄露）。

- **内存泄露（memory leak）的理解**

**严格来说，只有对象不会再被程序用到了，但是GC用不能回收它们的情况，才叫内存泄露。**

但实际情况很多时候一些不太好的实践（或疏忽）会导致对象的生命周期变得很长甚至导致OOM，也可以叫做**宽泛意义上的“内存泄露”。**

对象X引用对象Y，X的生命周期比Y的生命周期长；

那么当Y生命周期结束的时候，X依然引用着Y，这时候，垃圾回收是不会回收对象Y的；

如果对象X还引用着生命周期比较短的A、B、C，对象A又引用着对象a、b、c，这样就可能造成大量无用的对象不能被回收，进而占据了内存资源，造成内存泄露，直至内存溢出。

**内存泄露与内存溢出的关系：**

- 内存泄露（memory leak）：申请了内存用完了不释放

比如一共1024MB的内存，分配了512MB的内存一致不回收，那么可用的内存只有512MB了，仿佛泄露了一部分；通俗一点讲的话，内存泄露就是【占着茅坑不拉shi】。

- 内存溢出（out of memory）：申请内存时，没有足够的内存可以使用

通俗一点讲，一个厕所就三个坑，有两个占着茅坑不走的（内存泄露），剩下最后一个坑，厕所表示接待压力很大，这时候一下子来了两个人，坑位（内存）就不够了，内存泄露变成内存溢出了。

可见，内存泄露和内存溢出的关系：**内存泄露的增多，最终导致内存溢出。**

**泄露的分类：**

- 经常发生：发生内存泄露的代码会被多次执行，每次执行，泄露一块内存；
- 偶然发生：在某些特定情况下才会发生；
- 一次性：内存泄露的方法只会被执行一次；
- 隐式泄露：一直占着内存不释放，知道执行结束；严格的说这个不算内存泄露，因为最终释放掉了，但是如果执行时间特别长，也可能导致内存耗尽。

### 5、Java中内存泄露的8种情况

**1、****静态集合类**；

静态集合类，如HashMap、LinkedList等等。如果这些容器为静态的，那么他们的生命周期与JVM程序一直，则容器中的对象在程序结束之前不会被释放，从而造成内存泄露。简单而言，长生命周期的对象持有短生命周期对象的引用，尽管短生命周期的对象不再被使用，但是因为长生命周期对象持有它的引用而导致不能被回收。

```java
public class MemeoryLeak {
    static List list = new ArrayList<>();
    public void oomTest() {
        Object obj = new Object();  // 局部变量
        list.add(obj);
    }
}
```

**2、****单例模式**；

单例模式，和静态集合导致内存泄露的原因类似，因为单例的静态特性，它的生命周期和JVM的生命周期一样长，所以如果单例对象如果持有外部对象的引用，那么这个外部对象也不会被回收，那么就会造成内存泄露。
**3、****内部类持有外部类**；

内部持有外部类，如果一个外部类的实例对象的方法返回了一个内部类的实例对象。这个内部类对象被长期引用了，即使那个外部类实例不再被使用，但是由于内部类持有外部类的实例对象，这个外部类对象将不会被垃圾回收，这也造成内存泄露。
**4、****各种连接，如数据库连接、网络连接和IO连接等**；

在对数据库进行操作的过程中，首先需要建立数据库的链接，当不再使用时，需要调用close方法来释放与数据库的连接。只有连接被关闭后，垃圾回收器才会回收对应的对象。否则，**如果在访问数据库的过程中，对Connection、Statement或ResultSet不显性地关闭，将会造成大量对象无法被回收，从而引起内存泄露。**

```java
public static void main(String[] args) {
    try {
        Connection conn = null;
        Class.forName("com.mysql.jdbc.Driver");
        conn = DriverManager.getConnection("url", "", "");
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("...");
    } catch (Exception e) {
         // 异常日志
    } finally {
        // 1.关闭结果集
        // 2.关闭声明的对象
        // 3.关闭连接
    }
}
```

**5、****变量不合理的作用域**；

一般而言，一个变量的定义的作用范围大于其使用范围，很有可能造成内存泄露。另一方面没有及时地把对象设置为null，很有可能导致内存泄露的发生。

```java
public class UsingRandom {
    private String msg;
    public void receiveMsg() {
        readFromNet();  // 从网络上接收数据保存到msg中
        saveDB();  // 把msg保存到数据库中
    }
}
```

如上面这个伪代码，通过readReomNet方法把接收的消息保存在变量msg中，然后调用saveDB方法把msg的内容保存到数据库中，此时msg已经就没有用了，由于msg的生命周期与对象的生命周期相同，此时msg还不能被回收，因此造成了内存泄露。

实际上这个msg变量可以放在receiveMsg方法内部，当方法使用完，那么msg的生命周期也就结束，此时就可以回收了。还有另一种方法，**在使用完msg后，把msg设置为null，这样垃圾回收也会回收msg的内存空间。**
**6、****改变哈希值**；

当一个对象被存储进HashSet集合以后，就不能修改这个对象中那些参与计算的哈希值字段了。否则，对象修改后的哈希值与最初存储进HashSet集合中的哈希值就不同了，在这种情况下，即使contains方法使用该对象的当前引用作为参数去HashSet集合中检索对象，也将返回找不到对象结果，这也会导致无法从HashSet集合中单独删除当前对象，造成内存泄露。

这也是String为什么被设置为了不可变类型，我们可以放心地把String存入HashSet，或者把String当做HashMap的key值。**当我们想把自己自定义的类保存到散列表的时候，需要保证对象的hashCode不可变。**
**7、****缓存泄露**；

内存泄露的另一个常见来源是缓存，一旦你把对象放入到缓存中，他就容易遗忘。比如：之前项目在一次上线的时候，应用启动奇慢直到夯死，就是因为代码中会加载一个表中的数据到缓存（内存）中，测试环境只有几百条数据，但是生产环境有几百万的数据。

对于此问题，可以使用WeakHashMap代表缓存，此种Map的特点是，当除了自己有对key的引用外，此key没有其他引用，那么此map会自动丢弃此值。

上面图示主要演示了WeakHashMap如何自动释放缓存对象，当init函数执行完成后，局部变量字符串引用obejct1，obejct2，obejct3，obejct4都会消失，此时只有静态map中保存了对字符串对象的引用，可以看到，调用gc之后，HashMap没有被回收，而WeakHashMap里面的缓存被回收了。
**8、****监听器和回调**；

内存泄露的另一个常见来源是监听器和其他回调，如果客户端在你实现的API中注册回调，却没有显式的取消，那么就会聚集。需要确保回调立即被当做垃圾回收的最佳方法是只保存它的弱引用，例如将它们保存成为WeakHashMap中的键。

> 内存泄露案例分析

**案例代码：**

```java
public class Stack {
    private Object[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;
    public Stack() {
        elements = new Object[DEFAULT_INITIAL_CAPACITY];
    }
    public void push(Object e) {
       // 入栈
        ensureCapacity();
        elements[size++] = e;
    }
    // 存在内存泄漏
    public Object pop() {
       // 出栈
        if (size == 0) throw new EmptyStackException();
        return elements[--size];
    }
    private void ensureCapacity() {
        if (elements.length == size) elements = Arrays.copyOf(elements, 2 * size + 1);
    }
}
```

**分析：**

假设这个栈一直增长，增长后如下图所示：

当进行pop操作时，由于引用未进行置空，gc是不会释放的，如下图所示：

从上图可以看出，如果栈先增长，后收缩，那么从栈中弹出的对象将不会被当做垃圾被回收，即使程序不再使用栈中的这些对象，我们也不会回收，因为栈中仍然保存这些对象的引用，俗称**引用过期**，这个内存泄露很隐蔽。

**解决办法：**

将pop()这个函数该如如下函数即可：

```java
public Object pop() {
    if (size == 0) throw new EmptyStackException();
    Object result = elements[--size];
    elements[size] = null;
    return result;
}
```

### 6、JProfiler

#### 6.1、基本概述

**介绍**

在运行Java的时候有时候想测试运行时占用内存情况，这时候就需要使用测试工具查看了。在eclipse里面有Eclipse Memory Analyer tool（MAT）插件可以测试，而在IDEA中也有这么一个插件，就是JProfiler。

JProfiler是由ej-technologies公司开发的一款Java应用性能诊断工具。功能强大，但是收费。

**特点**

- 使用方便、界面操作友好（简单为强大）
- 对被分析的应用影响小（提供模板）
- CPU，Thread，Memory分析功能尤其强大
- 支持对jdbc，noSql，jsp，servlet，socket等进行分析
- 支持多种模式（离线，在线）的分析
- 支持监控本地、远程的JVM
- 跨平台，拥有多种操作系统的安装版本

> 数据采集方式

- 刚打开JProfiler时，会弹出四个选项，如下：

我们选择第二项可以打开当前正在运行的Java程序，之后会弹出一个窗口，让选择数据采集方式，选择默认后点击OK即可。

JProfiler数据采集方式分为两种：Sampling（样本采集）和Instrumentation（重构模式）

Instrumentation：这是JProfiler全功能模式。在class加载之前，JProfiler把相关功能代码写入到需要分析的class的bytecode中，对正在运行的jvm有一定的影响。

- 优点：功能强大。在此设置中，调用堆栈信息是准确的。
- 缺点：若要分析的class较多，则对应的性能影响比较大，CPU开销可能很高（取决于Filter的控制）。因此使用此模式一般配合Filter使用，只对特定的类或包进行分析。

Sampling：类似于样本统计，每隔一定时间（5ms）将每个线程栈中方法的信息统计出来。

- 优点：对CPU的开销非常低，对应用影响小（即使你不配置任何Filter）
- 缺点：一些数据/特性不能提供（例如：方法的调用次数、执行时间）

注：JProfilter本身没有指出数据的采集类型，这里的采集类型是针对方法调用的采集类型。因为JProfiler的绝大数核心功能都依赖方法调用采集的数据，所以可以直接认为是JProfiler的数据采集类型。

> 遥感检测Telemetries

> 内存视图Live Memory

class/class instance的相关信息。例如对象的个数，大小，对象创建的方法执行栈，对象创建的热点。

- All Objects ----> 所有对象

显示所有加载的类的列表和在堆上分配的实例数。只有Java 1.5（JVMTI）才会显示此图。

- Record Objects ----> 记录对象

查看特定时间段对象的分配，并记录分配的调用堆栈。

- Allocation Call Tree ----> 分配访问树

显示一颗请求树或者方法、类、包或对已选择类有待注释的分配信息的J2EE组件。

- Allocation Hot Spots ----> 分配热点

显示一个列表，包括方法、类、包或已分配已选类的J2EE组件。你可以标注当前值并且显示差异值。对于每个热点都可以显示它的跟踪记录树。

- Class Tracker ----> 类追踪器

类跟踪视图可以包含任意数量的图标，显示选定的类和包的实例和时间。

> 堆遍历heap walker

> cpu视图 cpu views

> 线程视图threads

> 监视器&锁 Monitors&locks

### 7、Arthas

#### 7.1、基本概述

前面两款工具也有缺点，都必须在服务端项目进程中配置相关监控参数。然后工具通过远程连接到项目进程，获取相关数据。这样就带来一些不便，比如线上环境的网络是隔离的，本地的监控工具根本连不上线上环境。并且类似于Jprofiler这样的商业工具，是需要付费的。

那么有没有一款工具不需要远程连接，也不需要配置监控参数，同时提供了丰富的性能监控数据呢？

这就是下面要介绍的一款**阿里巴巴开源的性能分析神器Arthas（阿尔萨斯）**

官方使用文档：[网址](https://arthas.aliyun.com/zh-cn)

#### 7.2、相关诊断命令

[命令帮助网址](https://arthas.gitee.io/advanced-use.html)

> 基础指令

```java
help    	# 查看帮助命令信息
cat    		# 打印文件内容，和linux里的 cat 命令类似
echo		# 打印参数，和linux里的 echo 命令类似
grep 		# 匹配查找，和linux里的 grep 命令类似
tee			# 复制标准输入到标准输出和指定文件，和linux里的 tee 命令类似
pwd			# 返回当前的工作目录，，和linux里的 pwd 命令类似
cls			# 清空当前屏幕区域
session		# 查看当前会话的信息
reset		# 重置增强类，将被Arthas增强过的类全部还原，Arthas服务端关闭时会重置所有增强过的类
version		# 输出当前目标Java进程所加载的Arthas版本号
history		# 打印历史命令
quit		# 退出当前Arthas客户端，其他Arthas客户端不受影响
stop		# 关闭Arthas服务端，所有Arthas客户端不受影响
keymap		# Arthas快捷键列表及自定义快捷键
```

> jvm相关

```java
dashboard——当前系统的实时数据面板
thread——查看当前 JVM 的线程堆栈信息
jvm——查看当前 JVM 的信息
sysprop——查看和修改JVM的系统属性
sysenv——查看JVM的环境变量
vmoption——查看和修改JVM里诊断相关的option
perfcounter——查看当前 JVM 的Perf Counter信息
logger——查看和修改logger
getstatic——查看类的静态属性
ognl——执行ognl表达式
mbean——查看 Mbean 的信息
heapdump——dump java heap, 类似jmap命令的heap dump功能
```

> class/classloader相关

```java
sc——查看JVM已加载的类信息
sm——查看已加载类的方法信息
jad——反编译指定已加载类的源码
mc——内存编译器，内存编译.java文件为.class文件
retransform——加载外部的.class文件，retransform到JVM里
redefine——加载外部的.class文件，redefine到JVM里
dump——dump 已加载类的 byte code 到特定目录
classloader——查看classloader的继承树，urls，类加载信息，使用classloader去getResource
```

> monitor/watch/trace相关

请注意，这些命令，都通过字节码增强技术来实现的，会在指定类的方法中插入一些切面来实现数据统计和观测，因此在线上、预发使用时，请尽量明确需要观测的类、方法以及条件，诊断结束要执行 `stop` 或将增强过的类执行 `reset` 命令。

```java
monitor——方法执行监控
watch——方法执行数据观测
trace——方法内部调用路径，并输出方法路径上的每个节点上耗时
stack——输出当前方法被调用的调用路径
tt——方法执行数据的时空隧道，记录下指定方法每次调用的入参和返回信息，并能对这些不同的时间下调用进行观测
```

### 8、Java Mission Control

#### 8.1、概述

- Java Mission Control（简称JMC），Java官方提供的性能强劲的工具。是一个用于对Java应用程序进行管理、监视、概要分析和故障排除的工具套件。
- 它包含一个GUI客户端，以及众多用来收集Java虚拟机性能数据的插件，如JMX Console（能够访问用来存放虚拟机各个子系统运行数据的MXBeans），以及虚拟机内置的高效profiling工具Java Flight Recorder（JFR）。
- JMC的另一个优点就是：采用取样，而不是传统的代码置入技术，对应用性能的影响非常非常小，完全可以开着JMC来做压测（唯一影响可能是full gc多了）。

#### 8.2、功能：实时监控JVM运行时的状态

### 9、其他工具
