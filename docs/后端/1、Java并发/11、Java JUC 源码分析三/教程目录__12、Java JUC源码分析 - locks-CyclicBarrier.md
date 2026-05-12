# 12、Java JUC源码分析 - locks-CyclicBarrier
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/12.html
- 分类：Java并发
- 分组：教程目录
CyclicBarrier字面意思是可循环栅栏，看javadoc的帮助A synchronization aid that allows a set of threads to all wait for each other to reach a common barrier point. CyclicBarriers are useful in programs involving a fixed sized party of threads that must occasionally wait for each other. The barrier is called cyclic because it can be re-used after the waiting threads are released.其功能应该是实现一个同步辅助类用于帮助相互等待一组线程到达一个共同的屏障点，对于固定大小的一组相互等待的线程很有用。在等待线程都release后可以重复使用。蹩脚的翻译，不过也能理解其功能了。举个栗子吧，一群小羊早上出圈，其他羊都在都在等待一只睡懒觉的小羊，等这只懒羊出起来后大家一起吃饭，然后去逛街：

```java
public class CyclicBarrierTest {
    final static CyclicBarrier barrier;
    static{
        barrier = new CyclicBarrier(5, new Runnable() {
            @Override
            public void run() {
               System.out.println("小羊们，吃饭了"); 
            }
        });
    }
    public static void main(String[] args) throws InterruptedException {
        for (int i = 0; i < 4; i++) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    System.out.println(Thread.currentThread() + "跑的快，所以等待在门口");
                    try {
                        barrier.await();
                    } catch (InterruptedException | BrokenBarrierException e) {
                        e.printStackTrace();
                    } finally{
                        System.out.println(Thread.currentThread() + "终于等到睡懒觉的羊了");
                    }
                }
            }).start();
        }
        new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println(Thread.currentThread() + "睡会懒觉先");
                try {
                    Thread.sleep(5000);
                    barrier.await();
                } catch (InterruptedException | BrokenBarrierException e) {
                    e.printStackTrace();
                }
                System.out.println(Thread.currentThread() + "一起走吧");
            }
        }).start();
    }
}
```

看下CyclicBarrier的源码，不是很多：

```java
public class CyclicBarrier {
    /**
    每次对barrier的使用代表了一个generation
    我的理解是你每次正常使用或reset就是一次new generation，
    如果有异常broker就会设置成true
     */
    private static class Generation {
        boolean broken = false;
    }
    /** 屏障的保护锁 */
    private final ReentrantLock lock = new ReentrantLock();
    /** 打开屏障前的等待条件 */
    private final Condition trip = lock.newCondition();
    /** 参入线程数 */
    private final int parties;
    /* 这个是屏障开放时执行的命令，可以通过构造传入，这个是在最后一个await到达时执行 */
    private final Runnable barrierCommand;
    /** The current generation */
    private Generation generation = new Generation();
    /** 用来递减计算屏障前等待线程  */
    private int count;
    /** 持有锁的线程屏障正常打开或reset使用调用，唤醒所有上一次屏障前等待的线程，然后重置count，产生新的generation */
    private void nextGeneration() {
        // signal completion of last generation
        trip.signalAll();
        // set up next generation
        count = parties;
        generation = new Generation();
    }
    /** 由持有锁的线程调用，设置generation的broker为true，并唤醒屏障前等待线程     */
    private void breakBarrier() {
        generation.broken = true;
        count = parties;
        trip.signalAll();
    }
    /** await和响应超时的await最后都是调用这个  */
    private int dowait(boolean timed, long nanos)
        throws InterruptedException, BrokenBarrierException,
               TimeoutException {
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
        	//获取当前的generation
            final Generation g = generation;
			//为true表示屏障被打破就抛异常
            if (g.broken)
                throw new BrokenBarrierException();
			//如果线程被中断打破屏障，唤醒屏障前的其他等待线程，抛出异常
            if (Thread.interrupted()) {
                breakBarrier();
                throw new InterruptedException();
            }
			//下面这段是递减计算最后一个线程到达		
           int index = --count;
           if (index == 0) {  // tripped
               boolean ranAction = false;
               try {
					//如果构造传入了所有线程到达屏障时需执行的命令就执行下               		
                   final Runnable command = barrierCommand;
                   if (command != null)
                       command.run();
                   ranAction = true;
                   //唤醒屏障前其他等待线程，重置count和new generation
                   nextGeneration();
                   return 0;
               } finally {
                   if (!ranAction)
                       breakBarrier();
               }
           }
            // loop直到屏障开放、打破、中断、超时
            for (;;) {
                try {
                	//这个看调用的是await还是响应超时的await决定condition怎么调用
                    if (!timed)
                        trip.await();
                    else if (nanos > 0L)
                        nanos = trip.awaitNanos(nanos);
                } catch (InterruptedException ie) {
                	//如果await的线程被中断，检查下generation
                    if (g == generation && ! g.broken) {
                    	//处于当前generation并且屏障没有被打破，那就打破屏障
                        breakBarrier();
                        throw ie;
                    } else {
                        // We're about to finish waiting even if we had not
                        // been interrupted, so this interrupt is deemed to
                        // "belong" to subsequent execution.
                        //如果没被中断，我是要完成等待的，所以这次中断被算作下次执行的中断
                        //我是没明白这个意思,本来想一个场景写个demo的，但是想不出合适的，留待以后学习吧
                        Thread.currentThread().interrupt();
                    }
                }
				//屏障被打破
                if (g.broken)
                    throw new BrokenBarrierException();
				//说明屏障打开，直接返回index索引
                if (g != generation)
                    return index;
				//超时，打破屏障，返回超时异常
                if (timed && nanos <= 0L) {
                    breakBarrier();
                    throw new TimeoutException();
                }
            }
        } finally {
            lock.unlock();
        }
    }
    /** 构造函数，传入参入线程数跟屏障打开时执行的命令  */
    public CyclicBarrier(int parties, Runnable barrierAction) {
        if (parties <= 0) throw new IllegalArgumentException();
        this.parties = parties;
        this.count = parties;
        this.barrierCommand = barrierAction;
    }
    public CyclicBarrier(int parties) {
        this(parties, null);
    }
    public int getParties() {
        return parties;
    }
    /** 所有参入者调用await前在屏障前等待   */
    public int await() throws InterruptedException, BrokenBarrierException {
        try {
            return dowait(false, 0L);
        } catch (TimeoutException toe) {
            throw new Error(toe); // cannot happen;
        }
    }
    /** 响应超时的等待 */
    public int await(long timeout, TimeUnit unit)
        throws InterruptedException,
               BrokenBarrierException,
               TimeoutException {
        return dowait(true, unit.toNanos(timeout));
    }
    /** 屏障是否被打破    */
    public boolean isBroken() {
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
            return generation.broken;
        } finally {
            lock.unlock();
        }
    }
    /** 首先唤醒屏障前所有等待线程设置generation的broker为true，
    然后初始化屏障，看javadoc这个方法会导致所有等待线程抛出异常，要小心使用
     */
    public void reset() {
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
            breakBarrier();   // break the current generation
            nextGeneration(); // start a new generation
        } finally {
            lock.unlock();
        }
    }
    /** 返回屏障前等待的线程   */
    public int getNumberWaiting() {
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
            return parties - count;
        } finally {
            lock.unlock();
        }
    }
}
```

大致流程为：

**1、** 构造传入线程数，也可以附带传入屏障命令；

**2、** 所有线程调用await或响应超时的await方法，2个方法最终调用dowait方法；

**3、** dowait方法内流程：；

1)先lock获取锁，然后判断屏障是否打破，如有抛屏障打破异常，线程是否中断，中断就打破屏障，然后跑中断异常

2)递减参入线程数count的值，如果是最后一次线程，就看是否有配置命令，有就执行，正常执行就调用nextGeneration，唤醒屏障前其他等待线程，然后初始化count值和new Generation；如果屏障命令执行异常就打破屏障，将Generation的broker标识为true，唤醒等待线程；

3)递减的时候不是最后一个线程，那就loop，看之前的调用是否响应超时，调用condition的await；

4)loop循环直到屏障被打破/正常打开/等待线程被中断/await等待超时，然后分别对这几种情况做处理；

**4、** 最后unlock；

与CountDownLatch比较：CountDownLatch只能用一次，而CyclicBarrier正常结束后调用nextGeneration初始化可以重复使用，而且可以在最后一个线程到达时执行屏障命令。还有一点就是之前说过CountDownLatch是容许一个或一组线程等待另一个或另一组线程完成，而CyclicBarrier是一组线程相互等待，体会下区分。

疑问：

**1、** dowait里面loop时候被中断里面的else，没想到什么场景demo，难道是最后一个线程代用nextGeneration的唤醒其他屏障前的其他等待线程，正巧这个时候有个线程被中断了？太tmd巧了吧；

**2、** 对于CyclicBarrier的reset方法，会造成其他等待线程的broker异常，然后百度了reset，呵呵，没找到可用资料，去stackoverflow上查了下，基本上都建议都是正常情况下不要使用，除非你想打破屏障，好吧；
