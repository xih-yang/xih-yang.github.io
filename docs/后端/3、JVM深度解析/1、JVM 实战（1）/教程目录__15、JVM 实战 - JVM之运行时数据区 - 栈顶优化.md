# 15、JVM 实战 - JVM之运行时数据区 - 栈顶优化
- 来源：https://ddkk.com/zhuanlan/java/jvm/1/15.html
- 分类：JVM 实战
- 分组：教程目录
### 一、逃逸分析

逃逸分析是目前JVM前沿的优化分析技术，基本原理是分析对象的动态作用域，如果对象只能在方法内部被访问到，说明对象没有发生逃逸，反之，说明对象发生逃逸。如果一个方法内部定义的对象被外部方法引用，如作为方法调用参数或者方法返回，就说明发生了方法逃逸。如果被其他线程访问到，说明发生了线程逃逸。如下代码，obj1,obj2,obj3都发生了逃逸，而obj4没有发生逃逸。

```java
public class EscapeAnalysisDemo {
    Object obj1;
    public void visit() {
        obj1 = new Object(); // 逃逸
        Object obj2 = new Object(); // 逃逸
        Object obj3 = new Object(); // 逃逸
        Object obj4 = new Object();
        String.valueOf(obj2);
        new Thread(() -> {
            System.out.println(obj3);
        }).start();
    }
}
```

HotSpot虚拟机默认开启逃逸分析，可以通过-XX:+DoEscapeAnalysis参数设置，

### 二、代码优化

根据逃逸分析，JVM会对象实例采取优化：

#### 1、栈上分配

将堆中对象分配转为栈上分配，对象实例会随着方法执行结束而销毁，不用进行GC，节省资源开销，栈上分配支持方法逃逸，无法支持线程逃逸。

#### 2、标量替换

若一个数据不能被分解成更小的数据表示了，如int、short、reference等，就被称为标量，相对的，如果一个数据能被分解就称为聚合量，如Java对象。一个对象通过逃逸分析如果不发生逃逸，在Java程序执行的时候，就不会创建对象，而是创建若干成员变量表示，拆分之后，成员变量可实现栈上分配和读写之外，还能为后一步优化创建条件。标量替换逃逸程序不能超出方法范围，标量替换可通过参数-XX:+EliminateAllocations设置

#### 3、同步消除

如果逃逸分析能确定一个变量不发生逃逸，此时，变量是线程安全的，相关的线程同步措施将会被消除掉。

### 三、对象分配内存策略

根据目前分配对象的策略，可以发现对象分配有栈上分配、TLAB分配、Eden区分配和老年代分配，如图，在开启逃逸分析和TLAB之后，对象会优先栈上分配和TLAB分配，如果两者都不能成功分配内存，就会到Java堆中分配内存，通俗的讲，TLAB也是Eden的区域，在Java堆中，对象内存优先在Eden区分配。

如果满足老年代分配条件，则对象直接在老年代分配，如大对象，大对象（指需要大量连续内存的Java对象，如超长字符串，超长数组）直接进入老年代，因为当对象很大时，为了有足够的空间分配给大对象，在新生代就很容易触发GC，GC时，大对象的复制和Eden区与Survivor区、两个Survivor区之间的复制会带来高额内存开销，对象直接进入老年代可以避免这种问题，-XX: PretenureSizeThreshold参数可以设置触发阈值，当对象大于该值，会进入老年代，该值没有单位。

### 四、代码验证

#### 1、逃逸分析

如下代码；设置JVM参数：-Xms64m -Xmx64m -XX:+PrintGC -XX:-DoEscapeAnalysis -XX:-EliminateAllocations，首先关闭逃逸分析和标量替换，此时，Pointer对象都会在Java堆中分配，由于堆只有64m，Eden区只有21m左右，所以会频繁触发GC并打印GC日志，所以耗时会更长，当开启逃逸分析以后，将会栈上分配，代码会如注释中优化，并且不会触发GC，耗时更短。

```java
public class EscapeAnalysisDemo {
    public static void main(String[] args) {
        long start = System.currentTimeMillis();
        for (int i = 0; i < 10000000; i++) {
            allocation();
        }
        System.out.println(String.format("耗时：%d ms", System.currentTimeMillis() - start));
    }
    public static void allocation() {
        // pointer未发生逃逸，同步操作会被消除
        synchronized (EscapeAnalysisDemo.class) {
            Pointer pointer = new Pointer();
        }
    }
    public static class Pointer {
        // 会标量替换，对象拆分成员变量
        int x = 1;
        int y = 2;
    }
}
```

执行结果：

```java
[GC (Allocation Failure)  16384K->768K(62976K), 0.0009711 secs]
[GC (Allocation Failure)  17152K->816K(62976K), 0.0006978 secs]
[GC (Allocation Failure)  17200K->784K(62976K), 0.0005584 secs]
[GC (Allocation Failure)  17168K->752K(62976K), 0.0005481 secs]
[GC (Allocation Failure)  17136K->784K(62976K), 0.0008749 secs]
[GC (Allocation Failure)  17168K->736K(64512K), 0.0008245 secs]
[GC (Allocation Failure)  20192K->672K(64512K), 0.0006088 secs]
[GC (Allocation Failure)  20128K->672K(63488K), 0.0004090 secs]
[GC (Allocation Failure)  19104K->672K(64000K), 0.0004984 secs]
[GC (Allocation Failure)  19104K->672K(64000K), 0.0005061 secs]
[GC (Allocation Failure)  19104K->672K(64000K), 0.0005664 secs]
[GC (Allocation Failure)  19104K->672K(64000K), 0.0003976 secs]
[GC (Allocation Failure)  19104K->672K(64000K), 0.0009005 secs]
耗时：109 ms
Process finished with exit code 0
```

```java
耗时：78 ms
Process finished with exit code 0
```

#### 2、内存分配策略

如下代码；设置JVM参数：-Xms64m -Xmx64m -XX:+PrintGC -XX:PretenureSizeThreshold=2097152，PretenureSizeThreshold没有单位默认字节，2097152是2M，所以大于等于2M的对象会进入老年代。所以执行之后，老年代会有占用5M内存。

```java
public class HeapAllocationDemo {
    public static void main(String[] args) throws InterruptedException {
        byte[] b1 = new byte[1024 * 1024 * 1]; // Eden区
        byte[] b2 = new byte[1024 * 1024 * 2]; //2M对象 OldG区
        byte[] b3 = new byte[1024 * 1024 * 3]; //3M对象 OldG区
        Thread.sleep(1000000);
    }
}
```
