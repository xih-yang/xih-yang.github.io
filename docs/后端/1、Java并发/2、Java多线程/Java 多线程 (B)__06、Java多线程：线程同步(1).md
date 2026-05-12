# 06、Java多线程：线程同步(1)
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/20.html
- 分类：Java并发
- 分组：Java 多线程 (B)
## 5.4 CAS

CAS（Compare And Swap），是由硬件实现的。

CAS可以将read-modify-write这类的操作转换为原子操作。

i++包括三个操作：读取i的值、i+1、将新的值保存到内存。

CAS的原理：在把值写到内存中时，会再次读取该地址的值，如果发现主存中的值与一开始读取到的值不同，则放弃写入（即撤销本次操作）；否则就更新进去。

使用CAS实现一个线程安全的计数器：

```java
package cas;
public class CASTest {
    public static void main(String[] args) {
        CASCounter casCounter = new CASCounter();
        for(int i = 0; i < 1000; i++) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    System.out.println(Thread.currentThread().getName() + ": " + casCounter.increment());
                }
            }, "Thread" + i).start();
        }
    }
}
class CASCounter{
    private long value;
    private boolean compareAndSwap(long expectedValue, long oldValue, long newValue) {
        if(expectedValue == oldValue) {
            value = newValue;
            return true;
        } else return false;
    }
    public long increment() {
        long oldValue = value;
        long newValue;
        do {
            newValue = value + 1;
        } while (compareAndSwap(value, oldValue, newValue));
        return value;
    }
}
```

CAS的ABA问题：

CAS实现原子性的背后有一个假设：如果共享变量的当前值与期望值相同，就假设共享变量没有被更改过。

但事实可能不是如此：x初始值位0，A将x修改为10，B将x又修改为0，此刻能否认为x没有被更改过呢？这就是CAS的ABA问题。

如果实际业务需要避免ABA问题，那么我们可以引入一个变量表示版本号，或者称修订号。每进行一次修改，修订号增加1。如果遇到当前版本号与期望版本号不一致，则获取新的版本号并继续修改。此时的过程是这样的。[A, 0] -> [B, 1] -> [C, 2]

## 5.5 原子变量类

原子变量类是基于CAS实现的。当我们对共享变量进行reda-modify-write的更新操作时，通过原子变量类可以保障操作的原子性和可见性。

read-modify-write操作指的是：对于此次操作，变量的新值依赖于变量的旧值。而不是像那种赋值操作。

前面提到过，volatile只能保障可见性，不能保障原子性。而原子变量类的内部使用的是volatile修饰的变量，并且使用CAS保障了原子性。有时将原子变量类看成是增强的volatile变量。

分组
                                                                原子变量类

基础数据型
                                        AtomicInteger、AtomicLong、AtomicBoolean

数组
                        AtomicIntegerArray、AtomicLongArray、AtomicReferenceArray

字段更新器
        AtomicIntegerFieldUpdater、AtomicLongFieldUpdater、AtomicReferenceFieldUpdater

引用型
                        AtomicReference、AtomicStampedReference、AtomicMarkableReference

AtomicLong：

```java
package atomics.atomicLong;
import java.util.concurrent.atomic.AtomicLong;
//我们想要让整个计算过程只使用这一个计算器，所以这里我们将其设计成单例
public class Indicator {
    //将构造方法私有化
    private Indicator(){}
    //创建一个静态的实例类
    private static Indicator instance = new Indicator();
    //返回上面的那个实例类
    public static Indicator getInstance() {
        return instance;
    }
    //记录请求数
    private AtomicLong requestNum = new AtomicLong(0);
    //记录成功数
    private AtomicLong successNum = new AtomicLong(0);
    //记录失败数
    private AtomicLong failureNum = new AtomicLong(0);
    //请求数增加
    public void requestProcess() {
        requestNum.incrementAndGet();
    }
    //成功数增加
    public void requestProcessSuccess() {
        successNum.incrementAndGet();
    }
    //失败数增加
    public void requestProcessFailure() {
        failureNum.incrementAndGet();
    }
    //获取请求数
    public Long getRequestNum() {
        return requestNum.get();
    }
    //获取成功数
    public Long getRequestSuccessNum() {
        return successNum.get();
    }
    //获取失败数
    public Long getRequestFailureNum() {
        return failureNum.get();
    }
}
```

atomicArray：

```java
package atomics.atomicIntegerArray;
import java.util.concurrent.atomic.AtomicIntegerArray;
public class Test {
    public static void main(String[] args) {
        //1、创建一个具有指定长度的原子数组
        AtomicIntegerArray atomicIntegerArray = new AtomicIntegerArray(10);
        System.out.println(atomicIntegerArray);
        //2、返回指定位置的元素
        System.out.println(atomicIntegerArray.get(0));
        System.out.println(atomicIntegerArray.get(1));
        //3、设置指定位置元素的值
        atomicIntegerArray.set(0, 1);
        System.out.println(atomicIntegerArray.getAndSet(0, 2));  //先获取旧值，再获取新值
        //4、修改某个数组元素的值
        System.out.println(atomicIntegerArray.addAndGet(0, 5));  //先修改，再返回
        System.out.println(atomicIntegerArray.getAndAdd(0, 6));  //先返回，再修改
        //5、CAS操作
        atomicIntegerArray.compareAndSet(0, 13, 222);  //如果0位置的值是22，就修改为222
        System.out.println(atomicIntegerArray.get(0));
        //6、自增/自减
        System.out.println(atomicIntegerArray.incrementAndGet(0));  //先增再获得
        System.out.println(atomicIntegerArray.getAndIncrement(0));  //先获得再增
        System.out.println(atomicIntegerArray.decrementAndGet(0));  //先减再获得
        System.out.println(atomicIntegerArray.getAndDecrement(0));  //先获得再减
    }
}
```

AtomicIntegerFieldUpdater：字段更新器

AtomicIntegerFieldUpdater可以对原子整数字段进行更新，要求：

- 字段必须使用volatile修饰，是其在线程间可见。
- 只能是实例变量，不能是静态变量，也不能用final修饰

```java
package atomics.atomicIntegerField;
import java.util.concurrent.atomic.AtomicIntegerFieldUpdater;
public class SubThread extends Thread{
    //要更新的user对象
    private User user;
    //创建更新器，对user对象的age字段进行更新
    private AtomicIntegerFieldUpdater<User> updater = AtomicIntegerFieldUpdater.newUpdater(User.class, "age");
    public SubThread(User user) {
        this.user = user;
    }
    @Override
    public void run() {
        //在子线程中对user对象的age自增10次
        for(int i = 0; i < 10; i++) {
            updater.incrementAndGet(user);
        }
    }
}
```

AtomicReference：原子引用对象

```java
package atomics.atomicReference;
import java.util.concurrent.atomic.AtomicReference;
public class Test01 {
    //创建一个reference对象
    static AtomicReference<String> atomicReference = new AtomicReference<>("abc");
    public static void main(String[] args) {
        for(int i = 0; i < 100; i++) {
            int temp = i;
            new Thread(new Runnable() {
                @Override
                public void run() {
                    atomicReference.set(atomicReference.get() + temp);
                    System.out.println(atomicReference.get());
                }
            }).start();
        }
    }
}
```

AtomicStampedReference：解决CAS中的ABA问题

```java
package atomics.atomicStampedReference;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicStampedReference;
/**
 * AtomicStampedReference原子类可以用来解决CAS中的ABA问题
 * AtomicStampedReference原子类中有一个整数标记值stamp，每次执行CAS操作时，会比较它的版本。
 */
public class Test01 {
    private static AtomicStampedReference<String> atomicStampedReference = new AtomicStampedReference<>("abc", 0);
    public static void main(String[] args) throws InterruptedException {
        Thread t1 = new Thread(new Runnable() {
            @Override
            public void run() {
                atomicStampedReference.compareAndSet("abc", "def", atomicStampedReference.getStamp(),
                        atomicStampedReference.getStamp()+1);
                System.out.println(Thread.currentThread().getName() + ": " + atomicStampedReference.getReference());
                atomicStampedReference.compareAndSet("def", "abc", atomicStampedReference.getStamp(),
                        atomicStampedReference.getStamp()+1);
            }
        });
        Thread t2 = new Thread(new Runnable() {
            @Override
            public void run() {
                int stamp = atomicStampedReference.getStamp();
                try {
                    TimeUnit.SECONDS.sleep(1);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(atomicStampedReference.compareAndSet("abc", "ggg", stamp,
                        atomicStampedReference.getStamp()+1));
            }
        });
        t1.start();
        t2.start();
        t1.join();
        t2.join();
        System.out.println(atomicStampedReference.getReference());
    }
}
```
