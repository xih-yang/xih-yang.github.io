# 04、Java JUC源码分析 - 原子变量-AtomicStampedReference
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/4.html
- 分类：Java并发
- 分组：教程目录
原子变量-AtomicStampedReference/AtomicMarkableReference

之前讲过的AtomicInteger等CAS操作会产生ABA问题，什么是ABA？wiki官方解释https://en.wikipedia.org/wiki/ABA_problem，简单讲就是多线程环境，2次读写中一个线程修改A->B，然后又B->A，另一个线程看到的值未改变，又继续修改成自己的期望值。如果我们不关心中间状态的变化，只关心最终结果，就无所谓ABA问题。看代码：

```java
import java.util.concurrent.atomic.AtomicReference;
public class ABATest {
    static  AtomicReference<Integer> atomicReference = new AtomicReference<Integer>(1);
    public static void main(String[] args) throws InterruptedException {
       new Thread(new Runnable() {
                @Override
                public void run() {
                    System.out.println(Thread.currentThread()+ "-" + atomicReference.compareAndSet(1, 2));
                    System.out.println(Thread.currentThread()+ "-" + atomicReference.compareAndSet(2, 1));
                }
            }).start();
        new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println(Thread.currentThread()+ "-" + atomicReference.compareAndSet(1, 2));
            }
        }).start();
        Thread.currentThread().sleep(3000);
        System.out.println(atomicReference.get());
    }
}
```

一个线程将1->2->1，另一个线程看到期望值还是1，就将其改成最终值2，如果不关心第一个线程所做的中间状态的变更，也就不用关心ABA问题。 这是一个不是"问题"的问题。

看下AtomicStampedReference是怎么解决这个问题的：

```java
/**
通过static pair保存一个引用和计数器
*/
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
/**
 * 通过传入的初始化引用和计数器来构造函数一个pair
 *
 * @param initialRef 初始化用用
 * @param initialStamp 初始化计数器或者叫时间戳
 */
public AtomicStampedReference(V initialRef, int initialStamp) {
    pair = Pair.of(initialRef, initialStamp);
}
```

AtomicStampedReference通过一个pair来保存初始化引用和计数器，以后每次原子操作时，都需要比较引用和计数器是否都正确。

举个通俗点的例子，你倒了一杯水放桌子上，干了点别的事，然后同事把你水喝了又给你重新倒了一杯水，你回来看水还在，拿起来就喝，如果你不管水中间被人喝过，只关心水还在，这就是ABA问题。如果你是一个讲卫生讲文明的小伙子，不但关心水在不在，还要在你离开的时候水被人动过没有，因为你是程序员，所以就想起了放了张纸在旁边，写上初始值0，别人喝水前麻烦先做个累加才能喝水。这就是AtomicStampedReference的解决方案。

看下AtomicStampedReference的方法：

```java
public boolean compareAndSet(V   expectedReference,
                             V   newReference,
                             int expectedStamp,
                             int newStamp) {
    Pair<V> current = pair;
    //每次操作前不但比较引用值还比较计数器，底层还是unsafe那些方法
    return
        expectedReference == current.reference &&
        expectedStamp == current.stamp &&
        ((newReference == current.reference &&
          newStamp == current.stamp) ||
         casPair(current, Pair.of(newReference, newStamp)));
}
private boolean casPair(Pair<V> cmp, Pair<V> val) {
    return UNSAFE.compareAndSwapObject(this, pairOffset, cmp, val);
}
```

当然还提供了获取计数器和引用值的方法

```java
public V getReference() {
    return pair.reference;
}
public int getStamp() {
    return pair.stamp;
}
```

其他方法都差不多，看个简单使用的demo：

```java
import java.util.concurrent.atomic.AtomicStampedReference;
public class AtomicStampedReferenceTest {
    static AtomicStampedReference<Integer> atomicStampedReference = new AtomicStampedReference<Integer>(0, 0);
    public static void main(String[] args) throws InterruptedException {
        final int stamp = atomicStampedReference.getStamp();
        final Integer reference = atomicStampedReference.getReference();
        Thread t1 = new Thread(new Runnable() {
            @Override
            public void run() {
                    System.out.println(Thread.currentThread() + "-" + reference + "-" + stamp + "-"
                            + atomicStampedReference.compareAndSet(reference, reference + 10, stamp, stamp + 1));
            }
        });
        Thread t2 = new Thread(new Runnable() {
            @Override
            public void run() {
                    Integer reference = atomicStampedReference.getReference();
                    System.out.println(Thread.currentThread() + "-" + reference + "-" + stamp + "-"
                            + atomicStampedReference.compareAndSet(reference, reference + 10, stamp, stamp + 1));
            }
        });
        t1.start();
        t2.start();
        t1.join();
        t2.join();
        System.out.println(atomicStampedReference.getReference());
        System.out.println(atomicStampedReference.getStamp());
    }
}
```

AtomicMarkableReference跟AtomicStampedReference差不多， AtomicStampedReference是使用pair的int stamp作为计数器使用，AtomicMarkableReference的pair使用的是boolean mark。

还是那个水的例子，AtomicStampedReference可能关心的是动过几次，AtomicMarkableReference关心的是有没有被人动过，方法都比较简单。
