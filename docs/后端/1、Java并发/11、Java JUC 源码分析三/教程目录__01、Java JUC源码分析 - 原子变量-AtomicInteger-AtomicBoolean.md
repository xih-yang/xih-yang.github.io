# 01、Java JUC源码分析 - 原子变量-AtomicInteger/AtomicBoolean
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/1.html
- 分类：Java并发
- 分组：教程目录
原子变量-AtomicInteger/AtomicBoolean/AtomicLong/AtomicReference

记录学习中的一些东西，防止以后遗忘，参考了很多别人的文章，感谢之！

多线程并发操作时，对普通变量++或--不具有原子性，每次读取的值都不一样，看代码：

```java
import java.util.concurrent.atomic.AtomicInteger;
public class Incr {
    public AtomicInteger a = new AtomicInteger(0);
    public int incrAtomic(){
        return a.getAndIncrement();
    }
    public int getAtomic(){
        return a.get();
    }
    public int b = 0;
    public int incrInt(){
        return b++;
    }
    public int getInt(){
        return b;
    }
}
```

```java
import java.util.concurrent.CountDownLatch;
public class MultiThread {
    private static Incr incr = new Incr();
    public static void main(String[] args) {  
        final CountDownLatch countDownLatch = new CountDownLatch(1);
        for (int i = 0; i < 100; i++) {  
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        countDownLatch.await();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    for (int j = 0; j < 100; j++) {
                        incr.incrAtomic();
                        incr.incrInt();
                    }
                }
            }).start();
        }  
        countDownLatch.countDown();
        try {  
            Thread.sleep(60000);  
        } catch (InterruptedException e) {  
            e.printStackTrace();  
        }  
        System.out.println("AtomicInteger.incr: "+incr.getAtomic());
        System.out.println("int.incr: " + incr.getInt());
    }  
}
```

100个线程，每个线程循环100次获取自增变量的值，运行结果显示，使用Atomic类型作为自增变量，最后的结果是1W，而使用普通变量，每次的结果都是不一样的。

查看AtomicInteger源码：

```java
//原子变量的cas都是通过unsafe来操作
private static final Unsafe unsafe = Unsafe.getUnsafe();
//保存value变量在内存中偏移量地址
private static final long valueOffset;
//实例化原子变量时获取偏移量地址
static {
  try {
    valueOffset = unsafe.objectFieldOffset
        (AtomicInteger.class.getDeclaredField("value"));
  } catch (Exception ex) { throw new Error(ex); }
}
//volatile类型变量，保证value的可见性，原子性通过unsafe的cas操作来保证
private volatile int value;
```

ps：

**1、** volatile只能保证变量的可见性，保证不了变量操作的原子性对volatile类型变量进行write操作，write前加storestore，write后加storeLoad内存屏障，把本地变量刷回主存，并且让其他处理器的cacheline失效，这样其他处理在read的时候发现cacheline失效就会去主存获取值，重新做缓存行填充单纯的对volatile类型变量的get/set操作没有问题，如果方法中get操作后有其他动作再进行set，会出问题，此时整体流程大概是4步：load->operation->store->storeLoad，多线程情况保证不了前3步不出问题，所以如果需要不如直接用普通变量，方法加锁来处理另外volatile也能防止指令重排；

有关内存屏障的详细说明请参考：http://ifeve.com/jmm-cookbook-mb/，来自于并发网翻译的Doug Lea的文章，very good。

**2、** Unsafe提供了一些native方法可以用来操作系统底层进行操作，cas的操作和AQS的park/unpark都使用到unsafe的一些方法，所以过一遍Unsafe的源码，源码地址：http://www.docjar.com/html/api/sun/misc/Unsafe.java.html：；

juc里面使用到unsafe的时候一般通过Unsafe unsafe = Unsafe.getUnsafe();获取，如果我们自己代码这样使用，会抛出SecurityException，看getUnsafe的源码：

```java
public static Unsafe getUnsafe() {
    Class cc = sun.reflect.Reflection.getCallerClass(2);
    if (cc.getClassLoader() != null)
        throw new SecurityException("Unsafe");
    return theUnsafe;
}
```

我们可以通过反射直接获取theUnsafe:

```java
Field f = Unsafe.class.getDeclaredField("theUnsafe"); 
f.setAccessible(true);  
Unsafe unsafe = (Unsafe) f.get(null);  
```

objectFieldOffset：非static变量的偏移

staticFieldOffset：static变量的偏移

getXXX：通过偏移量获取该实例的变量值

putXXX：通过偏移量直接设置该实例的变量值

putOrderedXXX：这个操作也是设置值，但是不会加storeLoad屏障

park、unpark：AQS里面的LockSupport会使用来挂起、解挂线程，这个和wait\notify不同，通过底层的一个变量（0、1）来处理

arrayBaseOffset：获取数组第一个元素的偏移

arrayIndexScale：获取数组的每次偏移的增量

ps了一堆，看下AtomicInteger中的重要方法：

```java
/**
直接设置volatile变量的值
*/
public final void set(int newValue) {
     value = newValue;
}
/**
putOrderedInt,去掉了storeLoad内存屏障,只保证最终设置成功，不保证多处理环境下，其他处理器read到最新的值
*/
 public final void lazySet(int newValue) {
     unsafe.putOrderedInt(this, valueOffset, newValue);
 }
/**
loop循环，不断重试，直到成功
*/
 public final int getAndSet(int newValue) {
     for (;;) {
         int current = get();
         if (compareAndSet(current, newValue))
             return current;
     }
 }
/**
Atomic中n多方法通过loop来调用这个方法，类似乐观锁，expect表示期望的值，update是更新的值
*/
public final boolean compareAndSet(int expect, int update) {
	return unsafe.compareAndSwapInt(this, valueOffset, expect, update);
}
/**
代码跟compareAndSet没什么区别，
注释里面May fail spuriously and does not provide ordering guarantees,会导致伪失败，不保证指令有序
*/
public final boolean weakCompareAndSet(int expect, int update) {
	return unsafe.compareAndSwapInt(this, valueOffset, expect, update);
}
```

AtomicLong比AtomicInteger多了个

```java
static final boolean VM_SUPPORTS_LONG_CAS = VMSupportsCS8();
```

记录底层是否支持long类型的cas操作，如果不支持会通过加锁实现cas，其他方法与AtomicInteger差不多。

AtomicBoolean也是用

```java
private volatile int value;
public AtomicBoolean(boolean initialValue) {
    value = initialValue ? 1 : 0;
}
```

每次操作时将传入的boolean类型转换为0,1，其他类同。

我们发现有基本类型int、long、boolean的原子操作，没有string类型，我们可以通过AtomicReference来实现string类型的原子操作，AtomicReference使用：

```java
AtomicReference<String> atomicString = new AtomicReference<String>("helloWorld");
```

AtomicReference内部持有一个对象的引用：

```java
private static final Unsafe unsafe = Unsafe.getUnsafe();
private static final long valueOffset;
static {
  try {
    valueOffset = unsafe.objectFieldOffset
        (AtomicReference.class.getDeclaredField("value"));
  } catch (Exception ex) { throw new Error(ex); }
}
private volatile V value;
```
