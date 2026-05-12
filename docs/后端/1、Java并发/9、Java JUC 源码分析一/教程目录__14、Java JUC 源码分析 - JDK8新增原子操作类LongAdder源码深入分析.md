# 14、Java JUC 源码分析 - JDK8新增原子操作类LongAdder源码深入分析
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/14.html
- 分类：Java并发
- 分组：教程目录
## 1.1 初识LongAdder

在上一篇博客我着重介绍了我们的AtomicLong这个类，他是通过非阻塞的CAS提供了非阻塞的原子性操作，相比使用阻塞算法的同步关键字synchronize来说，它的性能已经是很好了。但是问题又出现了，我们在高并发情况下用AtomicLong这个类时，我们大量的线程回去竞争更新同一个原子变量，但是由于只有一个线程会成功，这样做就会造成大量的线程竞争失败后，会通过无限循环不断地进行自旋，而这样会白白的浪费CPU资源。所以我们的JDK开发组又开始寻找新的办法。

因此到了JDK8，新增了一个LongAdder类，用来弥补AtomicLong这个类带来的不足。既然AtomicLong的性能瓶颈是由于多线程同时竞争一个变量的更新而产生的，那么我们是不是可以把这样一个变量分成很多个，然后同时让很多线程去竞争多个变量，这样是不是解决绝了我们的性能问题，下面我们来看看这两者设计有什么不同吧，如图：

使用AtomicLong时，就是多个线程同时竞争同一个原子变量

如图，使用LongAdder时，是在内部维护多个Cell变量，每个Cell里面有一个初始值为0的long类型的变量，这样在同等并发量的情况下，争夺单个变量的更新操作的线程量就会减少，这就变相的减少了争夺共享资源的并发量。另外多个线程在争夺单个cell失败了以后，他并不是在当前的cell上一直自旋CAS重试，而是在尝试在其他cell上进行CAS，这个改变增加了当前线程重试CAS的成功性。最后我们在获取LongAdder的时候，是把cell变量的所有value累加后，再加上base返回。

LongAdder维护一个延迟初始化的原子性更新数组（默认情况下Cell数组是null）和一个基值变量base。由于我们的Cells占的内存相对较大，所以我们一开始并不会加载，用的时候才会创建，也就是惰性加载。

那么大家肯定会有疑问，这个base是拿来干什么的？当一开始判断Cell数组是null并且并发线程较少的情况下，我们所有的操作都是对base进行的，也就是需要一个基本的值，当线程不是那么多的时候修改这个值。我们的Cells是一个数组，他的大小为2的N次方，在初始化时Cell数组中的cell元素的个数为2，数组里面的变量实体是Cell类型。Cell类型其实就是一个AtomicLong的一个改进，也就是用来解决缓存征用的问题，也就是解决伪共享的问题。（伪共享不懂的，可以去看我之前的博客）

解决伪共享，想到的办法肯定就是字节填充了，但是对于大多数孤立的多个原子操作进行字节填充是浪费的，因为原子性操作都是无规律的分散在内存中，多个原子变量被放入一个缓存行的概率太小了。但是原子数组的内存却是连续的，所以数组内部的多个元素经常能够共享缓存行，因此，这里使用Contented注解对cell类进行字节填充，解决了伪共享，又提升了性能呢！

## 1.2 LongAdder源码分析

看完上面的简单介绍后，我觉得大家肯定会对源码感兴趣。而且心中会有很多疑惑，我这里就提六个问题，当我们把这六个问题整明白了，相信大家源码也看懂了。

### 1.2.1 LongAdder结构是怎么样的呢？

下面我们先来看看LongAdder的类图：

由图可知，LongAdder继承自Striped64这个类，然后我们来看看Striped64。Striped64内部维护着三个变量，而我们LongAdder内部是没有维护任何变量的，这就说明它的内部变量都是继承自Striped64的。LongAdder的真实值其实是base和Cell数组的所有value相加，这里base是一个基础值，默认为0。cellsBusy用来实现自旋，状态只有0和1。Cells是一个Cell的数组,也是最最核心的变量。

讲了这么多，我们来看看Cell的构造吧:

```java
 @sun.misc.Contended static final class Cell {
        volatile long value;
        Cell(long x) {
      value = x; }
        final boolean cas(long cmp, long val) {
            return UNSAFE.compareAndSwapLong(this, valueOffset, cmp, val);
        }
        // Unsafe mechanics
        private static final sun.misc.Unsafe UNSAFE;
        private static final long valueOffset;
        static {
            try {
                UNSAFE = sun.misc.Unsafe.getUnsafe();
                Class<?> ak = Cell.class;
                valueOffset = UNSAFE.objectFieldOffset
                    (ak.getDeclaredField("value"));
            } catch (Exception e) {
                throw new Error(e);
            }
        }
    }
```

阅读上面的源码应该很简单吧，Cell是Striped64静态内部类，而且他的构造也是十分简单的。他的内部也只是维护了一个volatile的一个long类型变量value，这里使用volatile是因为线程操作value变量没有使用锁，我们为了保证内存的可见性，所以这里将它声明为volatile。这个类的cas方法，保证了当前线程更新时，value值的原子性。@sun.misc.Contended这个注解是为解决伪共享的问题，加上注解后会进行字节填充。

### 1.2.2 当前线程访问的是Cells数组里面的哪一个元素呢？

在解决这个问题之前啊，我们先来看看LongAdder的一些简单的方法。初步认识一下这个LongAdder。

先来看看他的sum方法:

```java
public long sum() {
    Cell[] as = cells; Cell a;
    long sum = base;
    if (as != null) {
        for (int i = 0; i < as.length; ++i) {
            if ((a = as[i]) != null)
                sum += a.value;
        }
    }
    return sum;
}
```

sum方法很简单，就是返回当前LongAdder的值，内部操作就是累加Cell数组每个元素的value和base。但是这个方法由于没有对Cell数组加锁，也就是说在计算总和的时候，如果别的线程对Cell数组扩容，或者修改元素的值，那么我们得到的值并不是非常精确，所以这个方法我们不用他来计算当前LongAdder的值。

再来看看他的reset方法：

```java
public void reset() {
    Cell[] as = cells; Cell a;
    base = 0L;
    if (as != null) {
        for (int i = 0; i < as.length; ++i) {
            if ((a = as[i]) != null)
                a.value = 0L;
        }
    }
}
```

这个方法为重置操作，也就是回复最初的状态，把base的值设置为0，如果Cells数组有元素(不为null)，那么把元素的值设置为0。

我们再来看看sumThenReset方法

```java
public long sumThenReset() {
    Cell[] as = cells; Cell a;
    long sum = base;
    base = 0L;
    if (as != null) {
        for (int i = 0; i < as.length; ++i) {
            if ((a = as[i]) != null) {
                sum += a.value;
                a.value = 0L;
            }
        }
    }
    return sum;
}
```

这个方法其实就是刚才那两个方法的合体，也就是先计算LongAdder的值然后就进行重置。但是多线程的情况下就会发生问题，因为这个方法并没有做什么并发控制。

讲完了上面一些简单的方法，接下来我们来看看add方法，这个方法是解决我们这个问题的关键：

```java
public void add(long x) {
    Cell[] as; long b, v; int m; Cell a;
    //首先先判断一下cells是否为空，如果为空们就会执行||后面的操作
    //也就是对基础变量base进行cas操作加+x
    if ((as = cells) != null || !casBase(b = base, b + x)) {
        boolean uncontended = true;
        //如果cells不是空，或者casBase操作失败执行下面代码
        //由于下面代码把变量赋值，条件判断糅杂再一起，很不好看我们来逐个条件分析
        //这里判断一下cells不为空，并且cells的大小不能小于1
        if (as == null || (m = as.length - 1) < 0 ||
            //其实接下来的两个条件是确定线程应该访问cells数组里面那个cell的
            //这个getProbe方法，获得的是当前线程的threadLocalRandomProbe这个变量
            //然后与我们的cells数组的最大下标做&运算，得到的下标，然后得到下标所对应的cell元素赋给a
            (a = as[getProbe() & m]) == null ||
            //然后对a进行cas操作，对a的value进行+x的操作
            //得到的结果可以看出这个变量有没有人竞争
            //uncontended为true，说明执行成功，没有人竞争
            //uncontender为false，说明执行失败，有人竞争
            !(uncontended = a.cas(v = a.value, v + x)))
            //如果上面的条件全部为false，说明add成功
            //那么问题又来了下面这个方法是拿来干什么的呢？是
            //其实下面这个方法是cells被初始化，和被扩容的地方
            longAccumulate(x, null, uncontended);
    }
}
final boolean casBase(long cmp, long val) {
    return UNSAFE.compareAndSwapLong(this, BASE, cmp, val);
}
```

看完上面的源码，是不是感叹代码的艺术呢？相信大家还是会有疑惑，就是这个longAccumulate()方法，接下来我会着重分析这个方法。

### 1.2.3 Cells数组如何初始化，如何扩容，以及如何解决冲突？

在上面的代码里我们提到了一个longAccumulate方法，没错这个方法就是cells被初始化，和被扩容的地方。话不多说，马上分析源码（自己觉得很详细）请耐心看完：

```java
final void longAccumulate(long x, LongBinaryOperator fn,
                          boolean wasUncontended) {
    int h;
    //这里面一大段只是为了初始化h，这个h的值是当前线程的threadLocalRandomProbe
    //之前有讲过这个h使用来决定，使用cells数组里面哪个元素的
    if ((h = getProbe()) == 0) {
        ThreadLocalRandom.current(); 
        h = getProbe();
        //设置竞争标志，true没竞争，false竞争
        wasUncontended = true;
    }
    //标示是否有冲突
    boolean collide = false;                
    for (;;) {
        Cell[] as; Cell a; int n; long v;
        //如果cells不为空，且长度大于0，进行下一步
        if ((as = cells) != null && (n = as.length) > 0) {
            //如果当前线程在cells选中的一个cell，还是空的，则进行接下来的操作
            if ((a = as[(n - 1) & h]) == null) {
                //判断是否可以对cells进行操作
                //cellsBusy的中文意思就是：cells是否忙碌
                //0为不忙碌，1为忙碌
                if (cellsBusy == 0) {
                    //不忙碌，就创建一个Cell对象，然后把X的值赋给他
                    Cell r = new Cell(x);  
                    //获取自旋锁，casCellsBusy方法就是把cellsBusy原子性+1
                    //也就是让其他线程知道，当前cells忙碌
                    if (cellsBusy == 0 && casCellsBusy()) {
                        //是否已经创建好了cell对象，且放到cells数组里，false还未创建，true已经创建好了
                        boolean created = false;
                       //try块里面的代码，其实就是创建一个cell对象，然后放到当前选中的位置
                       //然后改变标志位created，意为已经创建好了cell对象，且放到cells数组里相应的位置
                        try {
                            Cell[] rs; int m, j;
                            if ((rs = cells) != null &&
                                (m = rs.length) > 0 &&
                                rs[j = (m - 1) & h] == null) {
                                rs[j] = r;
                                created = true;
                            }
                        } finally {
                            //最后释放自旋锁
                            cellsBusy = 0;
                        }
                        //如果创建好了，结束循环
                        if (created)
                            break;
                        //没有就继续尝试
                        continue;           
                    }
                }
                collide = false;
            }
            //cas已经失败，重置并进入循环
            else if (!wasUncontended)       
                wasUncontended = true; 
            //这个fn，我们之前传进来null，这个是用来做特殊情况处理
            //fn为空，就进行cas操作，更新被选中元素的value
            else if (a.cas(v = a.value, ((fn == null) ? v + x :
                                         fn.applyAsLong(v, x))))
                break;
            //NCPU：代码实现是
            //NCPU=Runtime.getRuntime().availableProcessors()
            //也就是当前可用的CPU数量
            //如果当前cells的大小超过了NCPU，且cells被修改了，重置冲突标志位
            else if (n >= NCPU || cells != as)
                collide = false; 
            //如果上面全部处理失败，肯定有冲突，将冲突标志位设置为true
            else if (!collide)
                collide = true;
            //如果当前cells的长度大于NCPU，且冲突，那么我们开始扩容
            //获得cells的自旋锁，然后try块里面扩容
            else if (cellsBusy == 0 && casCellsBusy()) {
                try {
                    //先判断cells有没有被修改，然后开始扩容
                    if (cells == as) {
                        Cell[] rs = new Cell[n << 1];
                        for (int i = 0; i < n; ++i)
                            rs[i] = as[i];
                        cells = rs;
                    }
                } finally {
                    //释放自旋锁
                    cellsBusy = 0;
                }
                //重置冲突标志位
                collide = false;
                //继续循环
                continue;                  
            }
            //为了能够找到一个空闲的cell元素，重新生成随机数，重新hash
            h = advanceProbe(h);
        }
        //获得cells的自旋锁，且判断一下cells没被修改
        else if (cellsBusy == 0 && cells == as && casCellsBusy()) {
            //开始初始化
            boolean init = false;
            try {
                //如果没有被修改，则进行初始化
                if (cells == as) {
                    Cell[] rs = new Cell[2];
                    rs[h & 1] = new Cell(x);
                    cells = rs;
                    init = true;
                }
            } finally {
                //释放自旋锁
                cellsBusy = 0;
            }
            //初始化结束
            if (init)
                break;
        }
        else if (casBase(v = base, ((fn == null) ? v + x :
                                    fn.applyAsLong(v, x))))
            // 结束循环，重新使用base
            break;                          
    }
}
```
