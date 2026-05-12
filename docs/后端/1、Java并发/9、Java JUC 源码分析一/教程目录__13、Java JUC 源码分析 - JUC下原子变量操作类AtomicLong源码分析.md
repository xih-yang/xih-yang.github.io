# 13、Java JUC 源码分析 - JUC下原子变量操作类AtomicLong源码分析
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/13.html
- 分类：Java并发
- 分组：教程目录
## 1.1 什么是原子变量操作类？

要想理解这个概念，我们先来理解一下什么是原子操作和原子变量。

原子操作是指不会被线程调度机制打断的操作；原子操作一旦开始，就一直运行到结束，中间不会切换到任何别的进程。

原子变量是原子操作的基本单位。而我们原子变量操作类，提供了很多方法供我们操作原子变量

JUC这个包给我们提供了一系列的原子变量操作类，这些类都是使用非阻塞算法CAS实现的，相比用锁实现原子性操作这在性能上有很大的提升。由于原子变量操作类他们内部的原理都是一样的，所以我就不一一讲述了，只挑一个最简单的AtomicLong这个类，其他的都大同小异。

## 1.2 AtomicLong源码分析

我们知道JUC并发包中含有AtomicInteger、AtomicLong和AtomicBoolean等原子性操作类，他们的内部原理都是相似，这里我着重介绍AtomicLong这个类。

话不多说，先看源码(Talk is cheap , show me the code)，这里的源码我简化了一下。

```java
public class AtomicLong extends Number implements java.io.Serializable {
    private static final long serialVersionUID = 1927816293512124184L;
 	//获取Unsafe实例（因为之后要做一些底层操作）
    private static final Unsafe unsafe = Unsafe.getUnsafe();
    //如果之前有看过我CAS的那一篇博客，对这个应该不陌生
    //这个是存放value的偏移量
    private static final long valueOffset;
    //判断一下JVM是否支持Long类型的无锁CAS
    static final boolean VM_SUPPORTS_LONG_CAS = VMSupportsCS8();
    private static native boolean VMSupportsCS8();
    static {
        try {
            //获取value在AtomicLong这个的偏移量
            valueOffset = unsafe.objectFieldOffset
                (AtomicLong.class.getDeclaredField("value"));
        } catch (Exception ex) {
      throw new Error(ex); }
    }
	//实际value变量
    private volatile long value;
    //有参构造器，初始化value的值
    public AtomicLong(long initialValue) {
        value = initialValue;
    }
    public AtomicLong() {
    }
}
```

看了上面代码以后，我觉得你应该会有两个问题，为什么value被声明为volatile，为什么这个类可以直接这样Unsafe.getUnsafe();获得Unsafe实例。

咱们一个一个来解答，value被声明为volatile的原因是：为了在多线程下保证内存可见性，value是具体存放计数的变量。他希望每一个线程都可见。可以使用getUnsafe()直接获得的原因是：是因为这个类是在rt.jar包下，所以他是用的BootStrap类加载器加载的。

### 1.2.1递增递减操作

那么接下来我们来看看递增或者递减操作的源码把：

```java
//调用Unsafe的方法，原子性设置value的值+1，并返回递增后的值
public final long incrementAndGet() {
     return unsafe.getAndAddLong(this, valueOffset, 1L) + 1L;
 }
//调用Unsafe的方法，原子性设置value的值-1，并返回递减后的值
public final long decrementAndGet() {
    return unsafe.getAndAddLong(this, valueOffset, -1L) - 1L;
}
//调用Unsafe的方法，原子性设置value的值+1，并返回原始的值
public final long getAndIncrement() {
    return unsafe.getAndAddLong(this, valueOffset, 1L);
}
//调用Unsafe的方法，原子性设置value的值-1，并返回原始的值
public final long getAndDecrement() {
    return unsafe.getAndAddLong(this, valueOffset, -1L);
}
```

上面代码的getAndAddLong(this,valueOffset,-1L)这个方法，在也就是获得value，然后-1，只不过保证了原子性。

从上面的源码可以看出，AtomicLong保证原子性还是使用的Unsafe类的CAS方法，尤其可见Unsafe的重要性。

上面的源码是jdk8的源码，而jdk7的getAndIncrement()方法有不同了

```java
public final long getAndIncrement(){
    while(true){
        long current = get();
        long next = current + 1;
        if(compareAndSet(current , next)){
            return current;
        }
    }
}
```

如上代码，每个线程先是拿到变量的当前值(由于value是volatile变量，所以这里拿到的是最新的值)，然后再线程本地内存中对其进行+1操作，而后使用CAS操作修改变量的值，如果设置失效，则循环设置，直到设置成功。

那为什么jdk7的代码里面有这个循环，而jdk8没有呢？因为jdk8使用Unsafe类来进行设置，这个循环工作被放到了Unsafe类的getAndAddLong方法里面,因为考虑到其他的方法也会用到，干脆集成到Unsafe里面

```java
public final long getAndAddLong(Object var1, long var2, long var4) {
    long var6;
    do {
        var6 = this.getLongVolatile(var1, var2);
    } while(!this.compareAndSwapLong(var1, var2, var6, var6 + var4));
    return var6;
}
```

### 1.2.2 boolean comapreAndSet(long expect , long update)方法

```java
 public final boolean weakCompareAndSet(long expect, long update) {
     return unsafe.compareAndSwapLong(this, valueOffset, expect, update);
 }
```

由上代码我们还是可以知道，这个方法内部调用的还是Unsafe的compareAndSwapLong，如果原子变量中的value值等于expect，则使用update的值更新value并返回true，否则返回false。

### 1.2.3 简单应用实例

下面是一个多线程使用AtomicLong类的例子，可以帮助你更快理解。

```java
public class AtomicLongDemo {
    private static AtomicLong atomicLong = new AtomicLong();
    private static Integer[] arrayOne = new Integer[]{
     0,1,2,3,0,5,6,7,0,9};
    private static Integer[] arrayTwo = new Integer[]{
     10,51,21,30,40,0,67,75,0,49};
    public static void main(String[] args) throws InterruptedException {
        //线程one统计arrayOne里面的0的数量
        Thread threadOne = new Thread(new Runnable() {
            @Override
            public void run() {
               int size = arrayOne.length;
               for(int i = 0 ; i < size ; ++i){
                   if(arrayOne[i].intValue() == 0){
                       atomicLong.incrementAndGet();
                   }
               }
            }
        });
        //线程two统计arrayOne里面的0的数量
        Thread threadTwo = new Thread(new Runnable() {
            @Override
            public void run() {
                int size = arrayTwo.length;
                for(int i = 0 ; i < size ; ++i){
                    if(arrayTwo[i].intValue() == 0){
                        atomicLong.incrementAndGet();
                    }
                }
            }
        });
        //启动线程
        threadOne.start();
        threadTwo.start();
        //等待线程执行完毕
        threadOne.join();
        threadTwo.join();
        System.out.println("count 0:"+atomicLong.get());
    }
}
```

**喜欢的话记得点个赞**
