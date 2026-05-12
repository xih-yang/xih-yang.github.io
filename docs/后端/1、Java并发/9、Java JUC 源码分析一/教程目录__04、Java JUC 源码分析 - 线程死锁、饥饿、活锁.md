# 04、Java JUC 源码分析 - 线程死锁、饥饿、活锁
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/4.html
- 分类：Java并发
- 分组：教程目录
## 线程死锁

## 什么是线程死锁呢？

死锁是指两个或两个以上的线程在执行过程中，因争夺资源而造成的互相等待的情况，并且在无外力作用的情况下，这些线程会一直相互的等待，而无法继续等待下去。

死锁应该是最糟糕的一种情况了（当然，其他几种情况也好不到哪里去），如下图显示了一个死锁的发生：

A、B、C、D四辆小车都在这种情况下都无法继续行驶了。他们彼此之间相互占用了其他车辆的车道，如果大家都不愿意释放自己的车道，那么这个状况将永远持续下去，谁都不可能通过，死锁是一个很严重的并且应该避免和实时小心的问题。

## 为什么会线程死锁呢？

学过操作系统的朋友应该都知道，死锁产生必需须具备的四个条件：

- **互斥条件**：是指线程对已经获得的资源进行排他性使用。换而言之，该资源同时只能由一个线程占用。如果此时还有其他的线程请求该资源，那么请求者必须等待，直至占有该资源的线程释放该资源。
- **请求并持有**条件：这个很好理解，一个线程已经持有了至少一个资源，但是又提出了新的资源请求，而新的资源又被其他线程占用，所以当前线程会被阻塞，但是被阻塞的线程又不释放已经占用资源。
- **不可剥夺**条件：指的是线程获取到的资源在自己使用完之前不能被其他的线程抢夺，只能在自己使用完毕之后才能释放。
- **环路等待**条件：指在发生线程死锁时，必然存在一个线程-资源的环形链。也就是线程集合{T0,T1,T2,T3……Tn}中的线程T0正在等待已被T1占用的资源，T1在等待已被T2占用的资源，……Tn正在等待已被T0占用的资源。

接下来举一个实际的死锁例子·：

```java
public class DeadLockTest {
    private static Object resourceA = new Object();
    private static Object resourceB = new Object();
    public static void main(String[] args) {
        //创建并启动线程1
        new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (resourceA){
                    System.out.println(Thread.currentThread()+"get ResourceA");
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    System.out.println(Thread.currentThread()+" wait get ResourceB");
                    synchronized (resourceB){
                        System.out.println(Thread.currentThread()+"get ResourceA");
                    }
                }
            }
        }).start();
	    //创建并启动线程2
        new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (resourceB){
                    System.out.println(Thread.currentThread()+"get ResourceB");
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    System.out.println(Thread.currentThread()+" wait get ResourceA");
                    synchronized (resourceA){
                        System.out.println(Thread.currentThread()+"get ResourceA");
                    }
                }
            }
        }).start();
    }
}
```

代码相对简单，这里不做过多阐述。

下面是执行结果：

从执行结果来看，两个线程相互占用对方的资源，且不愿意释放，那么两个线程就会无休止地等待下去。

## 如何避免线程死锁？

要想避免线程死锁，至少要破坏一个构成线程死锁的条件。学过操作系统的都知道，目前只有请求并持有和环路等待是可以被破坏的。

我这里提供一种简单易理解的方法。通过资源的有序性申请来避免死锁，那么问题来了，什么是资源的有序性申请？

我们将刚才的线程死锁的例子的代码稍微改进一下，执行效果就会完全不一样，而且还避免了死锁。请看下面的代码：

```java
public class DeadLockTest {
    private static Object resourceA = new Object();
    private static Object resourceB = new Object();
    public static void main(String[] args) {
        //创建并启动线程1
        new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (resourceA){
                    System.out.println(Thread.currentThread()+"get ResourceA");
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    System.out.println(Thread.currentThread()+" wait get ResourceB");
                    synchronized (resourceB){
                        System.out.println(Thread.currentThread()+"get ResourceA");
                    }
                }
            }
        }).start();
        //创建并启动线程2
        new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (resourceA){
                    System.out.println(Thread.currentThread()+"get ResourceA");
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    System.out.println(Thread.currentThread()+" wait get ResourceB");
                    synchronized (resourceB){
                        System.out.println(Thread.currentThread()+"get ResourceA");
                    }
                }
            }
        }).start();
    }
}
```

再来看执行结果：

如上代码，线程2和线程1获取资源的顺序一致时，就不会发生死锁。其实资源的有序性分配就是指，假如线程1和线程2都需要资源1，2，3，，，n时，对资源进行排序，线程1和线程2只有获得了n-1时才能获得n。

## 什么是饥饿呢？

饥饿是指某一个或者多个线程因为种种原因无法获得所要的资源，导致一直无法执行。比如它的优先级可能太低，而高优先级的线程不断抢占它需要的资源，导致低优先级线程无法工作。在自然界中，母鸡给雏鸟喂食很容易出现这种情况：由于雏鸟很多，食物有限，雏鸟之间的事务竞争可能非常厉害，经常抢不到事务的雏鸟有可能被饿死。线程的饥饿非常类似这种情况。此外，某一个线程一直占着关键资源不放，导致其他需要这个资源的线程无法正常执行，这种情况也是饥饿的一种。于死锁想必，饥饿还是有可能在未来一段时间内解决的（比如，高优先级的线程已经完成任务，不再疯狂执行）。

## 什么是活锁呢？

活锁是一种非常有趣的情况。不知道大家是否遇到过这么一种场景，当你要做电梯下楼时，电梯到了，门开了，这是你正准备出去。但很不巧的是，门外一个人当着你的去路，他想进来。于是，你很礼貌地靠左走，礼让对方。同时，对方也非常礼貌的靠右走，希望礼让你。结果，你们俩就又撞上了。于是乎，你们都意识到了问题，希望尽快避让对方，你立即向右边走，同时，他立即向左边走。结果，又撞上了！不过介于人类的智慧，我相信这个动作重复两三次后，你应该可以顺利解决这个问题。因为这个时候，大家都会本能地对视，进行交流，保证这种情况不再发生。但如果这种情况发生在两个线程之间可能就不那么幸运了。如果线程智力不够。且都秉承着“谦让”的原则，主动将资源释放给他人使用，那么久会导致资源不断地在两个线程间跳动，而没有一个线程可以同时拿到所有资源正常执行。这种情况就是活锁。
