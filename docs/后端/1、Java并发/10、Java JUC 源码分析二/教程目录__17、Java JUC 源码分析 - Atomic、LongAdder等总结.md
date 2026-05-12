# 17、Java JUC 源码分析 - Atomic、LongAdder等总结
- 来源：https://ddkk.com/zhuanlan/java/concurrency/10/17.html
- 分类：Java并发
- 分组：教程目录
## 一、前言

前面的我们花费了大量的篇幅对JUC中的扛把子，ReentrantLock、Semaphore、CountDownLatch、CyclicBarrier等的源码实现进行了深入的分析，其实包括本文介绍的Atomic，作为普通开发人员在日常开发过程中可能很少会直接使用到这些工具类，它们更多的是应用在第三方框架工具包中，我们要做的是通过源码分析理解其设计理念，培养并发编程的思维，在需要的场景能够想起来这么一个工具能够解决遇到的问题。

## 二、AtomicInteger

我们先举一个简单的例子，代码很简单，通过线程池创建10个线程，每个线程会使total变量自增300，总共增加3000，通过CountDownLatch控制。

```java
public class Test {
    private static int total = 0;
    public static void main(String[] args) throws Exception {
        ExecutorService es = Executors.newCachedThreadPool();
        final CountDownLatch cdl = new CountDownLatch(3000);
        for (int i = 0; i < 10; i++) {
            es.execute(() -> {
                for (int j = 0; j < 300; j++) {
                    total++;
                    cdl.countDown();
                }
            });
        }
        cdl.await();
        es.shutdown();
        System.out.println(total);
    }
}
```

其中的问题我们前面已经详细分析过了，这里只做一下简单提及。虽然10个线程中每个线程都对total变量做了300次自增操作，一共3000次自增。但是多线程更新共享变量total可能会出现一个情况：

total的初始值为n，A线程和B线程分别将total从主内存拷贝到各自的本地工作内存，做了自增操作，在各自的工作内存中的total值都为n+1，之后又各自将工作内存中的值更新到主内存，这时主内存中的total最新值成了n+1，但是理想的结果应该是n+2才对。这个就是Java内存模型中的一个典型的线程安全问题，具体的体现就是缓存一致性，关于Java内存模型可以回顾[这篇博文](https://blog.csdn.net/huangzhilin2015/article/details/88947930)。

所以我们如果多次运行上面程序的话，输出结果看起来并不满意：

```java
2998
2996
3000
2995
2999
3000
```

当然，我们要解决这个问题很简单，实现多个线程对total变量的互斥访问即可，比如使用synchronized关键字：

```java
public class Test {
    private static int total = 0;
    public static void main(String[] args) throws Exception {
        ExecutorService es = Executors.newCachedThreadPool();
        final CountDownLatch cdl = new CountDownLatch(3000);
        for (int i = 0; i < 10; i++) {
            es.execute(() -> {
                synchronized (Test.class) {
                    for (int j = 0; j < 300; j++) {
                        total++;
                        cdl.countDown();
                    }
                }
            });
        }
        cdl.await();
        es.shutdown();
        System.out.println(total);
    }
}
```

上述代码中，我们使用synchronized关键字实现了多线程对total变量的互斥访问。同时只会有一个线程对total操作，操作完成后将total同步回主存，然后另一个线程再来处理，这样自然也就避免了问题。但是使用synchronized的话，代价有点大，在synchronized分析的时候已经详细说明了。但是由于total++操作需要依赖自身值，所以volatile并不能解决我们的问题。volatile只能保证每次获取的值是最新的，但还是可能会使用过期的值进行iadd操作，所以它并不适合变量更新依赖自身值的情况。这个时候我们可以引出我们的AtomicInteger了，我们将int类型的total，更换为AtomicInteger类型：

```java
public class Test {
    private static AtomicInteger total = new AtomicInteger(0);
    public static void main(String[] args) throws Exception {
        ExecutorService es = Executors.newCachedThreadPool();
        final CountDownLatch cdl = new CountDownLatch(3000);
        for (int i = 0; i < 10; i++) {
            es.execute(() -> {
                for (int j = 0; j < 300; j++) {
                    total.getAndIncrement();
                    cdl.countDown();
                }
            });
        }
        cdl.await();
        es.shutdown();
        System.out.println(total.get());
    }
}
```

对应前面的total++操作，我们这里使用的getAndIncrement方法进行变量的自增操作，然后通过get方法获取其值，多次运行该代码会发现输出结果都符合预期，这里就不贴结果了。我们这里主要探究AtomicInteger是如何上述问题的。

## 2.1 AtomicInteger--getAndIncrement源码分析

先进入getAndIncrement方法的内部，看其实现：

```java
public final int getAndIncrement() {
        return unsafe.getAndAddInt(this, valueOffset, 1);
    }
```

我们看到，方法中调用的unsafe.getAndAddInt方法，我们来看一下该方法：

```java
public final int getAndAddInt(Object var1, long var2, int var4) {
        int var5;
        do {
            var5 = this.getIntVolatile(var1, var2);
        } while(!this.compareAndSwapInt(var1, var2, var5, var5 + var4));
        return var5;
    }
```

该方法体中是一个do-while循环，用到了getIntVolatile和compareAndSwapInt方法，他们都是native方法，不是由Java实现的：

```java
public native Object getObjectVolatile(Object var1, long var2);
public final native boolean compareAndSwapInt(Object var1, long var2, int var4, int var5);
```

关于native方法，特别是compareAndSwapInt方法，已经在[Java深入JVM源码核心探秘Unsafe(含JNI完整使用流程)](https://blog.csdn.net/huangzhilin2015/article/details/101158137)进行了深入的分析，这里就不进行详细说明了。我们主要关注其do-while循环的逻辑。

首先我们明确getAndAddInt方法的三个入参：var1、var2、var4。

**var1**：表示我们操作的对象，在我们的例子中表示AtomicInteger类型的total变量；

**var2**：表示我们修改的字段(value)在该对象中的偏移(offset)，即外部传入的valueOffset。valueOffset是这样获取的：

```java
private volatile int value;
private static final long valueOffset;
    static {
        try {
            valueOffset = unsafe.objectFieldOffset
                (AtomicInteger.class.getDeclaredField("value"));
        } catch (Exception ex) { throw new Error(ex); }
    }
```

可以看到，该参数在AtomicInteger类中是一个final的静态变量，其不需要每次都重新计算，所以在static代码块中通过调用unsafe.objectFieldOffset方法获取赋值，关于对象类存布局和offset的概念可以参考[Java对象内存布局概述](https://blog.csdn.net/huangzhilin2015/article/details/101177223)。而这里我们也需要注意，value字段是被volatile修饰的。

**var4**：表示我们要对value变量增加的值，这里是1。

明确三个入参之后，我们再来看方法体。

首先调用this.getIntVolatile(var1, var2);，该方法会获取total对象valueOffset偏移处的值，也就是value的当前值，该值是内存中的实际值，不会是工作内存缓存，获取之后赋值给var5。

然后将var1、var2、var5、var5+var4作为入参传入compareAndSwapInt方法，该方法在[这里](https://blog.csdn.net/huangzhilin2015/article/details/101158137)进行了深入的分析，它会将total变量的value属性内存中的当前值和var5进行比较，如果相等，则使用var5+var4作为新值赋值，更新成功，最后返回true；如果不相等，那么不会执行更新，返回false。

如果更新成功的话，则跳出do-while循环，返回var5，这时返回的var5是旧值；如果更新失败，则重新获取value的最新值，赋值到var5变量，再次执行上述流程，这样一直循环，直到更新成功。

看了getAndAddInt方法的源码之后，我们再来分析一下，为何多线程调用getAndIncrement方法对total变量进行自增不会有线程安全问题。

我们知道，普通变量多线程场景下自增会出现问题的主要原因是：一个线程在回写值的时候并不知道其它线程已经对该值进行了更新，所以可能会出现值覆盖的情况，直观感受就是一些线程的更新操作没有生效。

现在引入循环CAS之后，每个线程在每次回写值的时候就不会直接进行覆盖了，而是会先从内存中获取变量的当前值，然后和本地内存中的值进行比较，如果不相等，那么就说明有其它的线程对其进行了更新，那么本线程会放弃本次回写，然后将最新值更新到本地内存，再次执行上述操作，一直循环，直到CAS回写成功。

由于线程每次回写前的比较操作，所以避免了会覆盖其它线程劳动成果的问题。而失败循环尝试则会保证当前线程的更新一定会反馈到主存，最终保证结果正确。循环CAS也就是Atomic的核心了，也是这里无锁化的核心思想，当然，其对处理器时间的消耗也比较明显，特别是在高并发下CAS总是不能成功的情况。

对于基础类型，除了AtomicInteger还有AtomicLong、AtomicBoolean等，原理都一样，而在底层，CAS是通过处理器提供的CMPXCHG指令完成的，这在前文分析过，这里就不再赘述了~

## 三、AtomicReference

AtomicReference可以以CAS的方式更新一个引用类型，原理是将对象赋值给AtomicReference的value字段，并且在静态代码块中计算value的偏移量，最后还是通过unsafe对该偏移量进行操作，原理和AtomicInteger等基本一致

```java
public class AtomicReference<V> implements java.io.Serializable {
    private static final long valueOffset;
    static {
        try {
            valueOffset = unsafe.objectFieldOffset
                (AtomicReference.class.getDeclaredField("value"));
        } catch (Exception ex) { throw new Error(ex); }
    }
    private volatile V value;
}
```

## 四、AtomicReferenceFieldUpdater

如果我们想通过CAS更新对象里的字段，那么可以使用AtomicReferenceFieldUpdater，但是要求字段被**public volatile**修饰，并且字段必须是**引用类型**，用法如下：

```java
Student student = new Student();
student.setName("bob");
AtomicReferenceFieldUpdater updater = AtomicReferenceFieldUpdater.newUpdater(student.getClass(), String.class, "name");
updater.compareAndSet(student, "bob", "alice");
```

AtomicReferenceFieldUpdater本身是一个抽象类，其内部定义了一个实现类**AtomicReferenceFieldUpdaterImpl**，newUpdater方法创建的就是AtomicReferenceFieldUpdaterImpl的实例对象：

```java
public static <U,W> AtomicReferenceFieldUpdater<U,W> newUpdater(Class<U> tclass,
                                                                Class<W> vclass,
                                                                String fieldName) {
    return new AtomicReferenceFieldUpdaterImpl<U,W>
        (tclass, vclass, fieldName, Reflection.getCallerClass());
}
```

对应字段的offset在AtomicReferenceFieldUpdaterImpl的构造函数中通过unsafe获取，最终调用的CAS方法是compareAndSwapObject。

## 五、AtomicIntegerFieldUpdater

AtomicIntegerFieldUpdater和AtomicReferenceFieldUpdater类似，不过AtomicIntegerFieldUpdater用于更新对象的int类型，使用方式也是通过静态方法newUpdater创建一个内部的实现类AtomicIntegerFieldUpdaterImpl，同样要求对应字段被public volatile修饰，注意这里的字段必须是int，而不能是Integer。

```java
AtomicIntegerFieldUpdater u= AtomicIntegerFieldUpdater.newUpdater(Student.class,"age");
u.compareAndSet(student,18,20);
```

也就是说AtomicIntegerFieldUpdater用于更新基础int字段；AtomicReferenceFieldUpdater用于更新引用类型，如果要更新int字段，那么需要是包装类Integer。对应的还有一个AtomicLongFieldUpdater，原理一样。

## 六、AtomicIntegerArray

AtomicIntegerArray用于更新整型数组里的元素，可以CAS更新指定下标的元素，要求需要是基础int数组。但是要注意，通过AtomicIntegerArray更新数组，是克隆的一个数组，而**不会修改原数组的值**，用法如下：

```java
int[] array = new int[]{1,2,3};
AtomicIntegerArray aia = new AtomicIntegerArray(array);
aia.compareAndSet(1,2,5);
System.out.println(array[1]);//原数组元素不变
System.out.println(aia.get(1));;
//输出2 5
```

来看看构造函数，通过clone方法克隆了一个数组：

```java
public AtomicIntegerArray(int[] array) {
    // Visibility guaranteed by final field guarantees
    this.array = array.clone();
}
```

由于是数组，更新下标指定元素的时候要根据下标计算该元素的offset，这里来看看compareAndSet方法：

```java
public final boolean compareAndSet(int i, int expect, int update) {
    return compareAndSetRaw(checkedByteOffset(i), expect, update);
}
```

首先通过**checkByteOffset**方法确定下标i对应的offset：

```java
private static final int base = unsafe.arrayBaseOffset(int[].class);   
 static {
    int scale = unsafe.arrayIndexScale(int[].class);
    if ((scale & (scale - 1)) != 0)
        throw new Error("data type scale not a power of two");
    shift = 31 - Integer.numberOfLeadingZeros(scale);
}
private long checkedByteOffset(int i) {
    if (i < 0 || i >= array.length)
        throw new IndexOutOfBoundsException("index " + i);
    return byteOffset(i);
}
private static long byteOffset(int i) {
    return ((long) i << shift) + base;
}
```

这里要注意，**scale**是int数组的基础增量大小，也就是每个元素占用的字节数（int 4个字节）；**base**是该数组的起始地址。那么有了元素大小和起始地址，给定一个下标**i**，可以根据以下公式计算出对应元素的地址：

> base + i * scale

但是这里用了另一种方式，首先计算出scale左边连续0的数量，然后用31减去这个数量得到一个**shift**，如果是int数组，那么scale为4，shift=31-29=2；如果是long数组，那么scale为8，shift=31-28=3，当然这里要求scale必须是2的n次幂。得到shift之后，根据下标i来计算offset就成了：

> ((long) i << shift) + base

可以看到如果是int数组，那么shift=2，i*4和i<<2结果一样；如果是long数组，那么shift=3，i*8和i<<3结果一样，但是明显位运算比乘法运算效率更高，这也是将效率压榨到极致的表现。

其它同样类型的对应还有AtomicLongArray(AtomicReferenceArray)，其和AtomicIntegerArray类似，操作的是基础long类型(引用类型)的数组，同样会克隆一份，不会修改原数组。

## 七、LongAdder和Striped64

LongAdder是JDK1.8新增的一个工具类，考虑到AtomicLong使用CAS更新value值在高并发下会有大量的线程CAS失败，从而导致自旋，消耗CPU资源。LongAdder的思想是将一个value打散成多个**Cell数组**，每个Cell维护一个value，当存在多线程并发操作的时候，将线程映射到一个Cell上进行操作，每个Cell内的value值还是使用CAS更新，就这样将竞争分散到多个Cell中。同时，如果没有出现多线程竞争，那么直接操作提供的一个base字段，换句话说就是先通过CAS修改base字段，如果CAS失败，那么转去修改Cell。最后获取值的时候，即使把base和所有cell相加。假设CAS修改base失败，那么可能是下面这样：

Cell并不是一开始就创建的，而是出现竞争，也就是CAS操作base失败的时候才会创建(lazy)，初始创建大小为2，每次扩容成原大小的2倍，扩容直到大小为CPU可用的**逻辑内核数量**（通过Runtime获取）即停止。同时，Cell数组初始化、数组元素初始化、扩容等时候需要做同步处理，而同步处理的操作不是加锁，而是对int类型的**cellsBusy**字段做CAS操作，cellsBusy有0和1两个值，CAS就是尝试将0修改为1，如果修改成功，那么可以执行逻辑，之后会将其设置回0，这个类似于ReentrantLock利用state字段的加锁逻辑。

LongAdder继承自**Striped64**，前面提到的Cell是Striped64的一个静态内部类，base、Cell数组、cellsBusy等都定义在Striped64类中，这里还需要注意一个点，就是Cell类上的@sun.misc.Contended注解：

```java
@sun.misc.Contended static final class Cell {}
```

## 7.1 伪共享

这里涉及到一个缓存伪共享的问题，站在CPU的角度，其操作缓存是以**缓存行**为单位的，缓存行是2的整数幂个字节大小，通常为64个字节。一个long类型才占8个字节，所以多个变量可能同时存在于一个缓存行中，如果多个线程修改位于同一个缓存行中的不同变量，就可能导致缓存伪共享的问题。

更具体的说就是假设变量a和b位于同一个缓存行，线程x运行于核心1，线程y运行于核心2，如果线程x要修改a变量，线程y要修改b变量，根据MESI协议，线程x和y分别读取了a和b变量，由于他们位于同一缓存行，那么缓存行处于共享（Share）状态，现在线程x要修改a变量，会将y线程所在内核缓存行设置为无效（Invalid）状态，导致变量b被刷新，相应的线程y修改变量b也会导致变量a被刷新，这就相互影响了性能，称之为**伪共享。**

早期解决伪共享的方案就是添加字节填充的方式，也就是填充long类型的字段，从而保证不同的变量处于不同的缓存行，在JDK8以后的版本中提供了一个@sun.misc.Contended注解，加上这个注解的类会被自动补齐缓存行，而不用手动增加占位字段，此注解需要在JVM启动时设置 -XX:-RestrictContended参数才会生效。所以此处Cell类的Contended注解就是为了解决缓存伪共享的问题，但是要注意通过补齐填充解决伪共享，就不可避免的浪费了缓存空间，虽然这写空间非常宝贵，也就是一种空间换时间的思路，如何取舍就见仁见智了。

类似于LongAdder的还有DoubleAdder。

## 八、ABA

CAS存在一个ABA问题，即CAS是通过期望值与当前值的比对进行更新的，但是如果值从A更改为B，又更新会A，那么再来以A作为期望值来进行CAS会成功，但是值中途已经被改过。ABA问题在很多情况下其实是没有问题的，但是一旦变更状态涉及到逻辑影响，那么就需要避免，Java为我们提供了两个工具来处理ABA问题，分别是AtomicMarkableReference和AtomicStampedReference。

## 8.1 AtomicMarkableReference

要解决ABA问题就是要找到一个方式能够判断A曾经变化过，其实很简单，只需要加一个布尔类型的标识，通过判断标识是否变更过来判断A是否被改变过。AtomicMarkableReference就是这样处理的，在它内内部通过一个静态内部类**Pair**来包装对象和布尔类型的mark，每次更新对象的时候，都会将其包装成一个Pair对象。

```java
public class AtomicMarkableReference<V> {
    private static class Pair<T> {
        final T reference;
        final boolean mark;
        private Pair(T reference, boolean mark) {
            this.reference = reference;
            this.mark = mark;
        }
        static <T> Pair<T> of(T reference, boolean mark) {
            return new Pair<T>(reference, mark);
        }
    }
    private volatile Pair<V> pair;
    public boolean compareAndSet(V       expectedReference,
                                 V       newReference,
                                 boolean expectedMark,
                                 boolean newMark) {
        Pair<V> current = pair;
        return
            expectedReference == current.reference &&
            expectedMark == current.mark &&
            ((newReference == current.reference &&
              newMark == current.mark) ||
             casPair(current, Pair.of(newReference, newMark)));
    }
    public boolean isMarked() {
        return pair.mark;
    }
}
```

CAS不再是单纯的判断对象是否相同，而是增加了mark标识的判断。

## 8.2 AtomicStampedReference

上面提到的AtomicMarkableReference已经能够解决ABA的问题，但是布尔类型的mark要么是false要么是true，我们只能通过它判断对象是否被修改过，如果想知道对象被修改过多少次的话就没有办法，不过我们可以使用AtomicStampedReference。AtomicStampedReference的结构和AtomicMarkableReference类似，在内部通过静态内部类**Pair**包装对象，但是这里的标识不再是布尔类型的mark，而是int类型的版本号stamp，每次修改通过对这个stamp做递增，我们可以就能得知变更次数。

```java
public class AtomicStampedReference<V> {
    private static class Pair<T> {
        final T reference;
        final int stamp;
        private Pair(T reference, int stamp) {
            this.reference = reference;
            this.stamp = stamp;
        }
        static <T> Pair<T> of(T reference, int stamp) {
            return new Pair<T>(reference, stamp);
        }
    }
    private volatile Pair<V> pair;
    public boolean compareAndSet(V   expectedReference,
                                 V   newReference,
                                 int expectedStamp,
                                 int newStamp) {
        Pair<V> current = pair;
        return
            expectedReference == current.reference &&
            expectedStamp == current.stamp &&
            ((newReference == current.reference &&
              newStamp == current.stamp) ||
             casPair(current, Pair.of(newReference, newStamp)));
    }
}
```

## 九、总结

根据atomic包中提供的工具类用途大致可以分为以下几类：

- AtomicInteger、AtomicLong、AtomicBoolean、AtomicReference：基础的CAS操作工具类，适用不同的类型
- AtomicReferenceFieldUpdater、AtomicIntegerFieldUpdater、AtomicLongFieldUpdater：CAS修改对象的某个字段，适用不同的字段类型
- AtomicIntegerArrayUpdater、AtomicLongArrayUpdater、AtomicReferenceArrayUpdater：用更新数组中指定下标的元素，克隆一份数组，不会修改原数组
- LongAdder、DoubleAdder：以base为基础，将数据分散到多个最多CPU核心数的Cell，每个操作线程被路由到具体的Cell进行CAS，提高在高并发场景下的性能
- AtomicStampedReference、AtomicMarkableReference：为了解决ABA问题引出的带版本号和布尔标识的工具
