# 12、Java JUC 源码分析 - Random类和ThreadLocalRandom类原理剖析
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/12.html
- 分类：Java并发
- 分组：教程目录
## JAVA并发编程（十二）Random类和ThreadLocalRandom类原理剖析

ThreadLocalRandom类是JDK7在JUC包下新增的随机数生成器类。它弥补了Random类在多线程下的缺陷。那么我们来看看Random这个类为什么会被替代吧

## 1.1 Random类源码分析

我们在学习JAVA的时候，java.util.Random这个类是我们使用的比较广泛的随机数生成类了。而且java.lang.Math中的随机数生成使用的也是Random这个类，下面我们先了解一下Random吧。先来看一个简简单单的小例子，相信你一定会感兴趣的。

```java
public class RandomDemo {
    public static void main(String[] args) {
        Random random1 = new Random(100);
        System.out.println(random1.nextInt(100));
        Random random2 = new Random(100);
        System.out.println(random2.nextInt(100));
    }
}
```

你运行了之后就会惊奇发现，不论你怎么执行，两次运行的结果是一样的都是15。这是为什么呢？明明是随机的，但是为什么两次随机的都一样呢？而且还是同一个数字。

接下来我们就看看源码吧。源码中定义了一个最最重要的参数

```java
private final AtomicLong seed;
```

这个参数被称为种子，种子是拿来经过一系列算法，然后生成随机数的。

我们先来看看他的无参构造器，详细内容都在注释里面

```java
/**
 *这个是无参构造器，使用播种机生成的数值和当前时间进行异或运算，然后把计算到的这个数值
 *当做种子，传入有参构造器。
*/
public Random() {
        this(seedUniquifier() ^ System.nanoTime());
}
//这个方法翻译成中文叫播种机，也就是一个产生Long类型数值的方法
private static long seedUniquifier() {
    // L'Ecuyer, "Tables of Linear Congruential Generators of
    // Different Sizes and Good Lattice Structure", 1999
    //上面的英文注释我特地翻译了一下：L'Ecuyer，“不同尺寸和良好晶格结构的线性同余生成器表”，1999年
    //简单来说，下面的是一个线性同余算法，而且每次计算的值是一样的，因为下面定义了一个默认的值
    //根据那个默认值每次计算出来的值是一样的。
    for (;;) {
        long current = seedUniquifier.get();
        long next = current * 181783497276652981L;
        if (seedUniquifier.compareAndSet(current, next))
            return next;
    }
}
private static final AtomicLong seedUniquifier
    = new AtomicLong(8682522807148012L);
```

讲来讲去，也就是用一个默认的long数值传入有参构造器。那我们再来看看有参构造器

```java
    /**
     * Creates a new random number generator using a single {@code long} seed.
     * The seed is the initial value of the internal state of the pseudorandom
     * number generator which is maintained by method {@linknext}.
     *
     * <p>The invocation {@code new Random(seed)} is equivalent to:
     *  <pre> {@code
     * Random rnd = new Random();
     * rnd.setSeed(seed);}</pre>
     *
     * @param seed the initial seed
     * @see  setSeed(long)
     */
    public Random(long seed) {
        if (getClass() == Random.class)
            this.seed = new AtomicLong(initialScramble(seed));
        else {
            // subclass might have overriden setSeed
            this.seed = new AtomicLong();
            setSeed(seed);
        }
    }
    private static long initialScramble(long seed) {
        return (seed ^ multiplier) & mask;
    }
```

乍一看这个代码，不得了，注释都贼恐怖。但你仔细看一下，其实通过一系列的调用，有参构造方法根据传进来的形参计算出了相应的种子，然后设置一下而已。并没有什么大不了。

那我们在再来看看生成随机数的nextInt这个方法

```java
public int nextInt() {
        return next(32);
}
```

这个就更加简单了，只调用了一个next方法，传入了一个32。就获得了我们的随机数，由此可见最最核心的，还是这个next方法。不急，接下来我们就来看看这个next方法有什么神奇

```java
 //输入的bits是位数，也就是多少位，上面的nextInt方法输入的是32位
protected int next(int bits) {
        //一个是老的种子，一个是新种子
        long oldseed, nextseed;
        AtomicLong seed = this.seed;
        do {
            oldseed = seed.get();
            //通过老的种子，计算出新的种子
            nextseed = (oldseed * multiplier + addend) & mask;
            //CAS一下，用新的种子更新老的种子
        } while (!seed.compareAndSet(oldseed, nextseed));
    	//将老的种子逻辑右移16位（我这里就拿nextInt举例了），然后转换成int返回
        return (int)(nextseed >>> (48 - bits));
 }
```

所以说，如果种子是固定的，那么无论你产生多少个Random实例，生成的随机数一定是相同的，那么对开头的例子是不是不再迷惑了。到这里是不是对Random这个类有一点点了解了呢！

## 1.2Random类的局限性

刚刚阅读源码我们可以知道Random的实例里面都会有一个种子，产生随机数其实就是使用一个特定的公式，用老的种子计算新的种子的过程，再把新的种子使用CAS更新到老的种子里面去。但是这样做会产生一个弊端。在多线程下面使用单个Random实例生成随机数，当多个线程同时计算随机数时，这个时候，就会有多个线程计算新的种子，然后多个线程就会竞争同一个原子变量的更新操作，由于原子变量的更新是CAS操作的，那么就只会有一个线程成功，所以就会造成大量的线程自旋重试（上一篇博客讲到了自旋锁，大家可以去看看），这样就会降低并发性能，所以这个时候要向大家介绍我们的ThreadLocalRandom类。

## 2.1初识ThreadLocalRandom类

为了弥补我们在多线程高并发情况下的Random的不足，我们在JUC包下面新增了ThreadLocalRandom这个类。下面先看看如何使用吧。

```java
public class ThreadLocalRandomDemo {
    public static void main(String[] args) {
        //先获得一个随机数生成器
        ThreadLocalRandom threadLocalRandom = ThreadLocalRandom.current();
        //输出10个随机数（0~5）
        for(int i = 0 ; i < 10 ; i++){
            System.out.println(threadLocalRandom.nextInt(5));
        }
    }
}
```

其实使用起来也很简单。通过ThreadLocalRandom.current()来获得一个随机数生成器，然后就跟Random类的使用差不多了。下面我们来分析一下ThreadLocalRandom的使用原理吧。从名字上看，跟我们的ThreadLocal比较像（不了解ThreadLocal的可以去看我之前的博客，是我这个系列的第六篇），ThreadLocal通过让每一个线程复制一份变量，使得每个县城都拿到一份这个变量的副本，然后对自己的副本进行操作，从而避免了对共享变量进行同步。实际上我们的ThreadLocalRandom也是这个原理，Random这个类的缺点就是多个线程会使用同一个种子变量，从而导致对原子变量更新的竞争。如图所示：

那么，如果我们每个线程都维护一个种子变量，则每个线程生成随机数时都根据自己老的种子计算新种子，并使新种子更新老种子，再根据新种子自己算随机数，就不会存在竞争问题了，这样将会大大提高并发性能。让我们来看看下面这幅图，你就会理解了：

## 2.2ThreadLocalRandom源码分析

看源码总是枯燥的，在看源码之前，我们先来看看他的类图：

从图中我们可以看出ThreadLocalRandom类继承了Random类并且重写了nextInt（）方法，但是我们在ThreadLocalRandom类中却并没有找到存放具体的种子，因为具体的种子其实是存放在我们具体调用线程的threadLocalRandomSeed里面的。我们的ThreadLocalRandom类其实和ThreadLocal很像，就是操作我们线程中的本地变量。当我们ThreadLocalRandom类调用current方法的时候，其实就是去初始化线程的threadLocalRandomSeed变量。

调用ThreadLocalRandom的nextInt方法，其实就是获取该线程的threadLocalRandomSeed变量，并且用这个变量去计算新的种子，然后再把计算到的新的种子更新回该线程的threadLocalRandomSeed变量，然后再根据threadLocalRandomSeed变量计算随机数。听上去是不是很简单。

接下来我们来看一段简单的代码，也是ThreadLocalRandom逻辑的主要实现：

```java
// Unsafe mechanics
private static final sun.misc.Unsafe UNSAFE;
private static final long SEED;
private static final long PROBE;
private static final long SECONDARY;
static {
    try {
        //先获取Unsafe实例，这里可以通过getUnsafe获取
        UNSAFE = sun.misc.Unsafe.getUnsafe();
        Class<?> tk = Thread.class;
        //这一步其实是获取Thread类里面threadLocalRandomSeed的偏移量
        SEED = UNSAFE.objectFieldOffset
            (tk.getDeclaredField("threadLocalRandomSeed"));
        //这一步其实是获取Thread类里面threadLocalRandomProbe的偏移量
        PROBE = UNSAFE.objectFieldOffset
            (tk.getDeclaredField("threadLocalRandomProbe"));
        //这一步其实是获取Thread类里面threadLocalRandomSecondarySeed的偏移量
        SECONDARY = UNSAFE.objectFieldOffset
            (tk.getDeclaredField("threadLocalRandomSecondarySeed"));
    } catch (Exception e) {
        throw new Error(e);
    }
}
```

上面使用Unsafe类获取Thread类里面属性的偏移量，是为了在其他主要方法里面能够通过Unsafe获取到他们的值。那么我们就来看看那些地方用到了他们吧！

接下来我们先看看current（）方法

```java
//单例模式，创建该类的实例
static final ThreadLocalRandom instance = new ThreadLocalRandom();
public static ThreadLocalRandom current() {
        //判断有没有被初始化
    	if (UNSAFE.getInt(Thread.currentThread(), PROBE) == 0)
           	//等于0，说明该线程第一次调用调用本方法
            //那么我们初始化线程本地变量
            localInit();
        //然后返回已经创建好的实例，这里的这个实例是个静态的
    	//所以所有线程拿到的都是同一个实例
    	return instance;
 }
//使用Unsafe类初始化当前线程probe和seed这两个变量
static final void localInit() {
        int p = probeGenerator.addAndGet(PROBE_INCREMENT);
        int probe = (p == 0) ? 1 : p; // skip 0
        long seed = mix64(seeder.getAndAdd(SEEDER_INCREMENT));
        Thread t = Thread.currentThread();
        UNSAFE.putLong(t, SEED, seed);
        UNSAFE.putInt(t, PROBE, probe);
}
```

其实该方法就是先判断一下，当前线程的本地probe这个变量有没有初始化，如果没有，就初始化seed和probe变量，然后返回ThreadLocalRandom的实例。

最后也是我们最最关心的nextInt（）方法：

```java
 public int nextInt() {
        return mix32(nextSeed());
 }
```

我们发现，好像跟Random类里面的没什么太大区别，那么我没接着再看看nextSeed()方法

```java
final long nextSeed() {
        Thread t; long r; // read and update per-thread seed
        UNSAFE.putLong(t = Thread.currentThread(), SEED,
                       r = UNSAFE.getLong(t, SEED) + GAMMA);
        return r;
}
```

如上代码，首先使用r = UNSAFE.getLong(t, SEED) 获取当前线程中的threadLocalRandomSeed变量的值，然后在种子的基础上累加GAMMA值作为新的种子，而后使用Unsafe的putLong方法把新种子放入当前线程的threadLocalRandomSeed变量中。

**至此，ThreadLocalRandom类源码就分析到这里，喜欢的话记得关注+点赞啊！**
