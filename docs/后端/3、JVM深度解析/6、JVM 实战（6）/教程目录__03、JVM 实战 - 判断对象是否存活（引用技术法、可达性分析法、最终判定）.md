# 03、JVM 实战 - 判断对象是否存活（引用技术法、可达性分析法、最终判定）
- 来源：https://ddkk.com/zhuanlan/java/jvm/6/3.html
- 分类：JVM 实战
- 分组：教程目录
堆中几乎存放着Java世界中所有的对象实例，垃圾收集器在对堆回收之前，第一件事情就是要确定这些对象哪些还“存活”着，哪些对象已经“死去”(即不可能再被任何途径使用的对象)

## 1、引用计数算法(Reference Counting)

很多教科书判断对象是否存活的算法是这样的：给对象中添加一个引用计数器，每当有一个地方引用它时，计数器值加1；当引用失效时，计数器减1；任何时刻计数器都为0的对象就是不可能再被使用的。

引用计数算法的实现简单，判断效率也很高，在大部分情况下它都是一个不错的算法。但是Java语言中没有选用引用计数算法来管理内存，其中最主要的一个原因是它很难解决对象之间相互循环引用的问题。

例如：

在testGC()方法中，对象objA和objB都有字段instance，赋值令objA.instance=objB及objB.instance=objA，除此之外这两个对象再无任何引用，实际上这两个对象都已经不能再被访问，但是它们因为相互引用着对象方，异常它们的引用计数都不为0，于是引用计数算法无法通知GC收集器回收它们。

打印GC详细信息：

```java
-XX:+PrintGCDetails
```

```java
/**
 * 执行后，objA和objB会不会被GC呢？
 */
public class ReferenceCountingGC {
    public Object instance = null;
    /**
     * 这个成员属性的唯一意义就是占点内存，以便能在GC日志中看清楚是否被回收过
     */
    private byte[] bigSize = new byte[2 * 1024 * 1024];
    public static void main(String[] args) {
        ReferenceCountingGC objA = new ReferenceCountingGC();
        ReferenceCountingGC objB = new ReferenceCountingGC();
        objA.instance = objB;
        objB.instance = objA;
        objA = null;
        objB = null;
        //假设在这行发生了GC，objA和ojbB是否被回收
        System.gc();
        //1.8采用Parallel GC
    }
}
```

[GC (Allocation Failure) [DefNew: 3707K->512K(4928K), 0.0041893 secs] 3707K->1214K(15872K), 0.0042359 secs] [Times: user=0.02 sys=0.00, real=0.00 secs]

[Full GC (System.gc()) [Tenured: 702K->1216K(10944K), 0.0039473 secs] 5529K->1216K(15872K), [Metaspace: 2223K->2223K(4480K)], 0.0039998 secs] [Times: user=0.00 sys=0.00, real=0.00 secs]

Heap

defnew generation total 4992K, used 45K [0x04600000, 0x04b60000, 0x09b50000)

eden space 4480K, 1% used [0x04600000, 0x04612f10, 0x04a60000)

from space 512K, 0% used [0x04a60000, 0x04a60000, 0x04ae0000)

tospace 512K, 0% used [0x04ae0000, 0x04ae0000, 0x04b60000)

tenured generation total 10944K, used 1216K [0x09b50000, 0x0a600000, 0x14600000)

thespace 10944K, 11% used [0x09b50000, 0x09c80108, 0x09c80200, 0x0a600000)

Metaspace used 2228K, capacity 2280K, committed 2368K, reserved 4480K

在运行结果中可以看到GC日志中包含" 3707K-> 512K"，老年代从 3707K(大约3.5M，其实就是objA与objB)变为了 512K，意味着虚拟并没有因为这两个对象相互引用就不回收它们，这也证明虚拟并不是通过通过引用计数算法来判断对象是否存活的。大家可以看到对象进入了老年代，但是大家都知道，对象刚创建的时候是分配在新生代中的，要进入老年代默认年龄要到了new objA才行，但这里objA与objB却进入了老年代。这是因为Java堆区会动态增长，刚开始时堆区较小，对象进入老年代还有一规则，当Survior空间中同一代的对象大小之和超过Survior空间的一半时，对象将直接进行老年代。

## 2、可达性分析算法(GC Roots Analysis)：主流用这个判断

在主流的商用程序语言中(Java和C#)，都是使用可达性分析算法判断对象是否存活的。这个算法的基本思路就是通过一系列名为"GC Roots"的对象作为起始点，从这些节点开始向下搜索，搜索所走过的路径称为引用链(Reference Chain)，当一个对象到GC Roots没有任何引用链相连时，则证明此对象是不可用的，下图对象object5, object6, object7虽然有互相判断，但它们到GC Roots是不可达的，所以它们将会判定为是可回收对象。

在Java语言里，可作为GC Roots对象的包括如下几种：

a.虚拟机栈(栈桢中的本地变量表)中的引用的对象

b.方法区中的类静态属性引用的对象

c.方法区中的常量引用的对象

d.本地方法栈中JNI的引用的对象

## 3、finalize()方法最终判定对象是否存活

即使在可达性分析算法中不可达的对象，也并非是“非死不可”的，这时候它们暂时处于“缓刑”阶段，要真正宣告一个对象死亡，至少要经历再次标记过程。

标记的前提是对象在进行可达性分析后发现没有与GC Roots相连接的引用链。

1).第一次标记并进行一次筛选。

筛选的条件是此对象是否有必要执行finalize()方法。

当对象没有覆盖finalize方法，或者finzlize方法已经被虚拟机调用过，虚拟机将这两种情况都视为“没有必要执行”，对象被回收。

2).第二次标记

如果这个对象被判定为有必要执行finalize（）方法，那么这个对象将会被放置在一个名为：F-Queue的队列之中，并在稍后由一条虚拟机自动建立的、低优先级的Finalizer线程去执行。这里所谓的“执行”是指虚拟机会触发这个方法，但并不承诺会等待它运行结束。这样做的原因是，如果一个对象finalize（）方法中执行缓慢，或者发生死循环（更极端的情况），将很可能会导致F-Queue队列中的其他对象永久处于等待状态，甚至导致整个内存回收系统崩溃。

Finalize（）方法是对象脱逃死亡命运的最后一次机会，稍后GC将对F-Queue中的对象进行第二次小规模标记，如果对象要在finalize（）中成功拯救自己----只要重新与引用链上的任何的一个对象建立关联即可，譬如把自己赋值给某个类变量或对象的成员变量，那在第二次标记时它将移除出“即将回收”的集合。如果对象这时候还没逃脱，那基本上它就真的被回收了。

流程图如下：

```java
/**
 * 此代码演示了两点
 * 1、对象可以在被GC时自我拯救
 * 2、这种自救的机会只有一次，因为一个对象的finalize()方法最多只能被系统自动调用一次。
 */
public class FinalizeEscapeGC {
    public static FinalizeEscapeGC SAVE_HOOK = null;
    public void isAlive() {
        System.out.println("yes, I am still alive");
    }
    protected void finalize() throws Throwable {
        super.finalize();
        System.out.println("finalize method executed!");
        FinalizeEscapeGC.SAVE_HOOK = this;
    }
    public static void main(String[] args) throws InterruptedException {
        SAVE_HOOK = new FinalizeEscapeGC();
        //对象第一次成功拯救自己
        SAVE_HOOK = null;
        System.gc();
        //因为finalize方法优先级很低，所有暂停0.5秒以等待它
        Thread.sleep(500);
        if (SAVE_HOOK != null) {
            SAVE_HOOK.isAlive();
        } else {
            System.out.println("no ,I am dead QAQ!");
        }
        //-----------------------
        //以上代码与上面的完全相同,但这次自救却失败了！！！
        SAVE_HOOK = null;
        System.gc();
        //因为finalize方法优先级很低，所有暂停0.5秒以等待它
        Thread.sleep(500);
        if (SAVE_HOOK != null) {
            SAVE_HOOK.isAlive();
        } else {
            System.out.println("no ,I am dead QAQ!");
        }
    }
}
```

```java
finalize method executed!
yes, I am still alive
no ,I am dead QAQ!
```

从结果可以看出，SAVE_HOOK对象的finalize()方法确实被GC收集器触发过，并且在被收集前成功逃脱了。

注意：任何一个对象的finalize()方法都只会被系统自动调用一次，如果对象面临下一次回收，它的finalize()方法不会被再次执行，因此第二段代码的自救行动失败了。 并且建议大家尽量避免使用它
