# 15、调优实战 - 定位 堆外内存 OOM
- 来源：https://ddkk.com/zhuanlan/java/jvm/9/15.html
- 分类：JVM 实战
- 分组：教程目录
## 1. ByteBuffer 堆外内存介绍

在介绍OOM那篇文章中，对堆外内存进行了介绍，就直接把它复制过来；

ByteBuffer和DirectByteBuffer：

- ByteBuffer：字节缓冲区，它有两种实现：
- HeapByteBuffer：使用jvm堆内存的字节缓冲区；（对应 ByteBuffer源码中的 allocate()方法）
- DirectByteBuffer：使用堆外内存，不受jvm堆大小限制；（对应 ByteBuffer源码中的allocateDirect()方法）
- DirectByteBuffer：ByteBuffer对于使用堆外内存的实现，堆外内存直接使用unsafe方法请求堆外内存空间，读写数据；
- 源码：

```java
public abstract class ByteBuffer extends Buffer implements Comparable<ByteBuffer> {
   // ... 省略
   public static ByteBuffer allocateDirect(int capacity) {
       return new DirectByteBuffer(capacity);
   }
   // ... 省略
}
```

DirectByteBuffer与堆外内存的关系：

- 我们使用allocateDirect()方法生成的DirectByteBuffer对象，本身是存储在jvm堆中的，但是会在堆外内存中划分一块内存区域与这个对象关联起来；
- 在YGC或者FGC 回收 DirectByteBuffer对象的时候，会通过虚引用（对虚引用不了解的可以查看前面的文章）来释放它关联的堆外内存空间（由Cleaner类实现）；
- Java NIO 在每次分配堆外内存会进行判断，如果堆外内存空间不足时，使用 System.gc() 尝试释放内存，再次进行判断；

堆外内存空间大小设置：

- jvm参数指定堆外内存大小：-XX:MaxDirectMemorySize=512m;
- 但是如果没有手动指定时，用我们前面介绍的获取jvm参数的默认值命令：java -XX:+PrintFlagsFinal -version | grep MaxDirectMemorySize获取到的大小为0；

其实它这里是使用了VM类中代码来指定的大小：

```java
public class VM {
    private static long directMemory = 64 * 1024 * 1024;
    public static long maxDirectMemory() {
        return directMemory;
    }
}
```

也就是说堆外内存默认大小为64M；如果指定了jvm参数，就使用指定的大小值；

## 2. ByteBuffer 堆外内存申请、释放（源码分析）

## 2.1 堆外内存申请

```java
ByteBuffer byteBuffer = ByteBuffer.allocateDirect(1 * 1024 * 1024);
```

```java
public static ByteBuffer allocateDirect(int capacity) {
    return new DirectByteBuffer(capacity);
}
```

在使用ByteBuffer的静态方法allocateDirect()申请内存时，会使用 DirectByteBuffer类的构造方法创建一个DirectByteBuffer对象：

```java
DirectByteBuffer(int cap) {
    super(-1, 0, cap, cap);
    boolean pa = VM.isDirectMemoryPageAligned();
    int ps = Bits.pageSize();
    long size = Math.max(1L, (long)cap + (pa ? ps : 0));
    // 判断是否有足够的空间可供申请
    // size：根据是否按页对齐，得到的真实需要申请的内存大小
    // cap：用户指定需要的内存大小(<=size)
    Bits.reserveMemory(size, cap);
    long base = 0;
    try {
        // 调用 UNsafe方法申请内存
        base = unsafe.allocateMemory(size);
    } catch (OutOfMemoryError x) {
        // 申请失败，释放内存
        Bits.unreserveMemory(size, cap);
        throw x;
    }
    // 初始化内存空间为0
    unsafe.setMemory(base, size, (byte) 0);
    if (pa && (base % ps != 0)) {
        // Round up to page boundary
        address = base + ps - (base & (ps - 1));
    } else {
        address = base;
    }
    // 使用 Cleaner机制注册内存回收处理函数
    cleaner = Cleaner.create(this, new Deallocator(base, size, cap));
    att = null;
}
```

在使用构造方法申请内存时，首先要判断是否有足够的内存空间可供申请，如果有空间可以申请，则更新对应的变量；如果不够需要先调用GC，如果还不够则抛出OOM；

```java
static void reserveMemory(long size, int cap) {
    if (!memoryLimitSet && VM.isBooted()) {
        // 获取最大可以申请的对外内存大小，默认值是64MB
        // 可通过jvm参数-XX:MaxDirectMemorySize=<size>设置这个大小
        maxMemory = VM.maxDirectMemory();
        memoryLimitSet = true;
    }
    // optimist!
    // 尝试去预订空间，如果空间足够，则直接返回true
    if (tryReserveMemory(size, cap)) {
        return;
    }
    final JavaLangRefAccess jlra = SharedSecrets.getJavaLangRefAccess();
    // retry while helping enqueue pending Reference objects
    // which includes executing pending Cleaner(s) which includes
    // Cleaner(s) that free direct buffer memory
    // 可能 Cleaner会释放空间，进行重试，继续尝试预订空间
    while (jlra.tryHandlePendingReference()) {
        if (tryReserveMemory(size, cap)) {
            return;
        }
    }
    // trigger VM's Reference processing
    // 还不够的话，在这里调用 GC，进行一次空间回收，释放指向了堆外内存的引用
    System.gc();
    // a retry loop with exponential back-off delays
    // (this gives VM some time to do it's job)
    // 通过一个带sleep的延时循环来继续尝试预订空间，预订成功则返回；
    // 如果超过 MAX_SLEEPS 次数还未成功，直接抛出 "Direct buffer memory" 异常
    boolean interrupted = false;
    try {
        long sleepTime = 1;
        int sleeps = 0;
        while (true) {
            if (tryReserveMemory(size, cap)) {
                return;
            }
            if (sleeps >= MAX_SLEEPS) {
                break;
            }
            if (!jlra.tryHandlePendingReference()) {
                try {
                    Thread.sleep(sleepTime);
                    sleepTime <<= 1;
                    sleeps++;
                } catch (InterruptedException e) {
                    interrupted = true;
                }
            }
        }
        // no luck
        // 几次重试预订都还不够的话，抛出 OOM
        throw new OutOfMemoryError("Direct buffer memory");
    } finally {
        if (interrupted) {
            // don't swallow interrupts
            Thread.currentThread().interrupt();
        }
    }
}
```

在执行完这个方法之后，也就是有空间可以申请了，就开始申请空间：

```java
try {
    base = unsafe.allocateMemory(size);
} catch (OutOfMemoryError x) {
    Bits.unreserveMemory(size, cap);
    throw x;
}
```

allocateMemory()这个方法是通过unsafe通过JNI调用C的malloc来申请内存的；

## 2.2 堆外内存释放

在上面申请完堆外内存之后，注册了一个 Cleaner的内存回收对象：

```java
cleaner = Cleaner.create(this, new Deallocator(base, size, cap));
```

这里是因为 DirectByteBuffer对象本身在堆内，会被jvm的GC正常回收掉；但是跟DirectByteBuffer关联的堆外内存区域就不会被GC回收掉了，所以需要一个机制，来在DirectByteBuffer被回收时，同时回收掉它在堆外申请的内存；

对于一个对象在被回收时，如果需要做一些额外的工作，java提供了两个特性来实现：

- 在finalize()方法中实现一些在对象被回收前的自定义操作（Java官方不推荐）；
- 通过虚引用来处理对象被回收后的自定义操作（存在虚引用的对象被GC回收时会收到一个系统通知）；

在堆外内存的释放这里，java采用的是虚引用的方法；并且提供了一个 Cleaner 类来简化这些操作，Cleaner是 PhantomReference的子类，可以在 PhantomReference被加入 ReferenceQueue队列的时候，触发对应的Runnable回调方法；

```java
new Deallocator(base, size, cap);
```

这里的Deallocator就是一个实现了 Runnable接口的类：

```java
private static class Deallocator implements Runnable {
    private static Unsafe unsafe = Unsafe.getUnsafe();
    private long address;
    private long size;
    private int capacity;
    private Deallocator(long address, long size, int capacity) {
        assert (address != 0);
        this.address = address;
        this.size = size;
        this.capacity = capacity;
    }
    public void run() {
        if (address == 0) {
            // Paranoia
            return;
        }
        unsafe.freeMemory(address);
        address = 0;
        Bits.unreserveMemory(size, capacity);
    }
}
```

可以看到，它重写的 run()方法里面去调用了unsafe方法释放了内存并重置了统计变量；

所以，DirectByteBuffer 就是使用 Cleaner机制，把它自身当做一个虚引用对象来创建了一个 PhantomReference；所以当它本身被GC时，会添加到引用队列中；

然后通过对这个引用队列的监测，来调用它里面的对象的实现了 Runnable接口的Deallocator类的 run()方法，来实现堆外内存的释放。

## 3. 什么情况会发生 堆外内存 OOM

通过上面的介绍，我们知道了堆外内存的分配和回收的具体实现，那什么情况下会发生堆外内存不够，甚至OOM呢？

**1、** 如果系统瞬时承受了大量的并发请求，创建了大量的DirectByteBuffer，并且处理又慢，没法及时被GC掉，自然堆外内存不会被释放，然后就导致堆外内存溢出了；

**2、** 由于系统的jvm内存区域划分不够合理，在发生了Eden区的YGC之后，Survivor区放不下存活的对象，这些存活对象就会进入老年代；

- 然而正常来说老年代会很久发生一次FGC，也就是说，进入了老年代的 DirectByteBuffer 对象很久都不会被回收，自然堆外内存不会被释放，然后就导致堆外内存溢出了；
**3、** 对于第2种情况，其实jvm已经考虑到了；所以它才在申请内存不够时，会代码调用一次System.gc()来手动触发GC；
- 但是，如果你使用了 `-XX:+DisableExplicitGC`参数，来关闭了显示GC呢；
- 所以，如果使用了 `-XX:+DisableExplicitGC`参数来关闭了显示GC，发生第2种情况的时候，就会导致 堆外内存溢出了；

## 4. 模拟 堆外内存 OOM

## 4.1 模拟1

```java
/**
 *
 * 直接内存溢出
 *
 * jvm options：
 * -XX:MaxDirectMemorySize=100m -verbose:gc -XX:+PrintGCDetails
 */
public class DirectByteBufferOomDemo {
	public static void main(String[] args) {
		int count = 0;
		List<ByteBuffer> list = new ArrayList<>();
		while (true) {
			ByteBuffer byteBuffer = ByteBuffer.allocateDirect(1 * 1024 * 1024);
			list.add(byteBuffer);
			System.out.println("当前创建了 " + (++count) + "M 的对象");
		}
	}
}
```

代码很简单，就在一个死循环里面一直申请大小为1M的 DirectByteBuffer 对象，然后加入list，也就是有一个list一直持有它的引用，不会被GC掉；

然后使用了 `-XX:MaxDirectMemorySize=100m`指定堆外内存最大值为 100M，所以应该在申请快到100M的时候，发生堆外内存OOM；

看看执行情况：

可以看到，这里生成了100M对象，并且继续生成的时候，堆外内存区域不够了，然后是先去执行 System.gc()；

但是由于对象被引用持有没法被GC掉，所以就发生了 `java.lang.OutOfMemoryError: Direct buffer memory`；

## 4.2 模拟2

```java
/**
 *
 * 直接内存溢出
 *
 * jvm options：
 * -XX:MaxDirectMemorySize=100m -verbose:gc -XX:+PrintGCDetails
 */
 */
public class DirectByteBufferOomDemo {
	public static void main(String[] args) {
		int count = 0;
		// List<ByteBuffer> list = new ArrayList<>();
		while (true) {
			ByteBuffer byteBuffer = ByteBuffer.allocateDirect(1 * 1024 * 1024);
			// list.add(byteBuffer);
			System.out.println("当前创建了 " + (++count) + "M 的对象");
		}
	}
}
```

跟模拟1不同是，注释掉list的代码，让申请的 DirectByteBuffer对象没有引用指向，也就是会成为垃圾对象；

在申请堆外内存不足时，DirectByteBuffer中手动调用 System.gc()的时候，会回收掉它们，所以这里不应该发生堆外内存OOM；

看看执行情况：

可以看到，每生成100M对象的时候，执行 System.gc()；

由于对象是垃圾对象可以被回收，在GC之后就又可以继续生成，所以并没有发生 `java.lang.OutOfMemoryError: Direct buffer memory`；

## 4.3 模拟3

```java
/**
 *
 * 直接内存溢出
 *
 * jvm options：
 * -XX:MaxDirectMemorySize=100m -verbose:gc -XX:+PrintGCDetails -XX:+DisableExplicitGC
 */
public class DirectByteBufferOomDemo {
	public static void main(String[] args) {
		int count = 0;
		// List<ByteBuffer> list = new ArrayList<>();
		while (true) {
			ByteBuffer byteBuffer = ByteBuffer.allocateDirect(1 * 1024 * 1024);
			// list.add(byteBuffer);
			System.out.println("当前创建了 " + (++count) + "M 的对象");
		}
	}
}
```

跟模拟2不同的是，添加了jvm参数 `-XX:+DisableExplicitGC`，这个参数禁止代码中的显示 System.gc()操作；

所以在堆外内存满的时候，执行System.gc()无效，不能回收掉已经是垃圾对象了的DirectByteBuffer对象，也就不能释放掉堆外内存，应该会发生堆外内存OOM；

看看执行情况：

可以看到，在生成了100M对象的时候，发生了 `java.lang.OutOfMemoryError: Direct buffer memory`；

## 5. 堆外内存 OOM 的定位及解决

同样，遇到系统崩溃的时候，首先还是登陆服务器查看系统日志，这个时候会看到 `java.lang.OutOfMemoryError: Direct buffer memory`这样的报错，也就知道了这是堆外内存的OOM；

在发生堆外内存OOM的时候，即使你配置了dump开关，它也不会在系统发生崩溃时生成dump日志（这个很明显，堆外内存都没有在堆中，肯定不会给你生成堆栈的dump日志）；

但是这个报错的下方，会携带上 **真正引发堆外内存OOM 的具体类和方法及里面的代码行数**；

这样你就能知道，是你在代码中手动生成堆外内存导致的，还是一些框架（比如jetty、netty等都会）里面生成堆外内存导致的；

- 如果是你在代码手动生成堆外内存导致的，那你就需要去仔细检查你的代码是否有问题，是否生成了太多的 DirectByteBuffer并且不能被回收；
- 如果你的代码没有这种问题，或者是框架里面引发的问题，那就得从GC去考虑了：
- 首先查看是否配置了 `-XX:+DisableExplicitGC`这个限制；

如果配置了就得放开这个限制，让 DirectByteBuffer中的System.gc()生效；
- 但是这个时候，就得注意你自己的代码中，尽量不要有 System.gc()的执行，否则可能会引发频繁的 FGC；
- 如果是配置了这个参数的话，那去掉这个配置基本就解决这个问题了；

如果不是，那就有点复杂了；需要使用我们前面介绍到的 jstat工具，去判断jvm内存区域大小分配是否有问题；

- 比如，上面提到的那种情况，DirectByteBuffer对象进入了老年代，迟迟不能被回收，就没法释放堆外内存空间，然后导致了堆外内存OOM；
- 当检查到是这类问题时，就需要调整jvm参数来合理分配各区域内存大小了；做到能够让DirectByteBuffer对象被及时回收释放堆外内存空间；
- 具体的查看jvm内存划分是否合理的方式就不再次在这里进行介绍了，可以参考前面的文章；
