# 14、Java并发编程：ConcurrentModificationException
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/14.html
- 分类：Java并发
- 分组：教程目录
在多线程程序的编写中，经常能遇到ConcurrentModificationException这个异常，这个异常的意思是指出现了并发修改的情况，为了降低对程序的性能的影响，Java开发者将捕获的这种错误以“善意”的方式进行提醒。这种异常一般在对容器的元素遍历的过程中出现了对容器的写操作（包括增加、修改和删除操作）时出现。仔细阅读源码就知道，使用迭代器遍历元素时由一个计数器，这个计数器就是为“快速失败”机制设计的。

那么，问题来了，“快速失败”（fail-fast）又是什么鬼？就是在迭代过程中对出现并发修改的情况时抛出异常。这个异常就是ConcurrentModificationException异常。既然会出现这种异常自然得想办法解决这种异常。因为是并发修改导致出现的这种异常，并发修改的一个最大的问题就是没有使用同步，试想如果对需要遍历的容器进行加锁，那么并发执行的线程将只有一个线程能获得锁，这样就避免了并发修改出现的“快速失败”。但是这么解决仍然不够完美，因为在容器规模比较大或者在单个元素执行的时间过长的时候，那么这些线程将长时间等待。那么，在线程竞争激烈的时候很有可能出现死锁，即使不出现死锁或者饥饿等情况，长时间的加锁对系统的性能造成很大影响。在类似淘宝这样的高并发的网站这样设计将是一个灾难。

OK，本着talk is important，show me the code as well（楼主认为沟通也是一项很重要的技能，故不是很认可之前的talk is cheap，show me the code，因为talk并不cheap）的原则，先来看看ConcurrentModificationException异常发生的一个例子：

```java
package com.ddkk.patchwork.concurrency.r0408;
import java.util.HashSet;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-8.
 */
public class HiddenUnSafeIterator {
    private final Set<Integer> set = new HashSet<>();
    public synchronized void add(Integer i){set.add(i);}
    public synchronized void remove(Integer i){set.remove(i);}
    public void addTenThings(){
        Random random = new Random();
        for (int i = 0; i < 10; i++)
            add(random.nextInt(100));
        System.out.println("DEBUG: added ten elements to " + set);
    }
    public static void main(String[] args){
        final HiddenUnSafeIterator hi = new HiddenUnSafeIterator();
        ExecutorService threadPool = Executors.newFixedThreadPool(5);
        for (int i = 0; i < 15; i++){
            threadPool.execute(new Runnable() {
                @Override
                public void run() {
                    hi.addTenThings();
                }
            });
        }
    }
}
```

运行该程序没果然不出意料出现了ConcurrentModificationException异常。你会发现在add(Integer i)方法上添加了synchronized进行同步啊，结果应当不会出现这个异常啊，对不对？从抛出的异常知道这样分析是错误的，主要在于执行`System.out.println("DEBUG: added ten elements to " + set);`这个操作的时候，实际上在输出`set`时，调用了AbstractCollection的toString方法，对容器的元素进行迭代，但是最本质的原因在于迭代的过程中没有获取HiddenUnSafeIterator的锁，因为加在add方法上的synchronized获取的锁就是HiddenUnSafeIterator对象的对象级别锁。这样，虽然表面上是同步的，但是在迭代过程并没有实际获得锁。这就是这个程序抛出ConcurrentModificationException异常的本质原因。

现在，已经知道上面的程序抛出ConcurrentModificationException异常的本质原因是没有获得HiddenUnSafeIterator的对象锁。那么只要设计程序，使得对Set容器进行迭代时能够获取对象锁就可以了，在jdk中，默认为我们提供了具有同步功能的synchronizedSet方法。下面就是实现一个安全版本的迭代器，代码修改如下：

```java
package com.ddkk.patchwork.concurrency.r0408;
import java.util.Collections;
import java.util.HashSet;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-8.
 */
public class SafeInterator {
    //修改的地方在这里
    private final Set<Integer> set = Collections.synchronizedSet(new HashSet<Integer>());
    //取消了synchronized
    public void add(Integer i){set.add(i);}
    public void remove(Integer i){set.remove(i);}
    public void addTenThings(){
        Random random = new Random();
        for (int i = 0; i < 10; i++)
            add(random.nextInt(100));
        System.out.println("DEBUG: added ten elements to " + set);
    }
    public static void main(String[] args){
        final SafeInterator hi = new SafeInterator();
        ExecutorService threadPool = Executors.newFixedThreadPool(5);
        for (int i = 0; i < 25; i++){
            threadPool.execute(new Runnable() {
                @Override
                public void run() {
                    hi.addTenThings();
                }
            });
        }
    }
}
```

运行该程序没有出现ConcurrentModificationException异常，说明我们之前对异常的分析是正确的。这段代码解决ConcurrentModificationException异常的主要原因就在于在迭代容器的时候获得了SafeInterator的对象锁。

上面的程序虽然使用了同步解决了ConcurrentModificationException异常问题，但是试想在读远大于写的场景下，对每个都需要加锁是不是很影响性能，有没有可以不用加锁的方案呢？答案是就是“克隆”。将容器的副本封闭在线程内部，这样在迭代时就不用考虑并发修改的问题，因为单线程不存在这个问题。具体内容将在我的另一篇文章中阐述。
