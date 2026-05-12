# 10、Java JUC源码分析 - locks-CountDownLatch
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/10.html
- 分类：Java并发
- 分组：教程目录
上一次学习了ReetrantLock，是对AQS独占模式的，这次学习CountDownLatch，是共享模式api的实现。人生不死，学无止境。先看个demo吧：

```java
import java.util.concurrent.CountDownLatch;
public class CountDownLatchTest {
    private static CountDownLatch count1 = new CountDownLatch(1);
    private static CountDownLatch count2 = new CountDownLatch(10);
    public static void main(String[] args){
        // boss
        for (int i = 0; i < 1; i++) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        count2.await();
                        System.out.println("boss说开会");
                        Thread.sleep(3000);
                        count1.countDown();
                        System.out.println("boss说散会");
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }).start();
        }
        //一堆干活小弟
        for (int i = 0; i < 10; i++) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        count2.countDown();
                        System.out.println(Thread.currentThread() + "进入会议室");
                        count1.await();
                        System.out.println(Thread.currentThread()+ "离开会议室");
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }).start();
        }
    }
}
```

boss等待所有干活小弟进入会议室开会，小弟等待boss说散会才敢走人。CountDownLatch的功能就是这个，一个或一组线程等待另一个或一组完成才能运行，内部static对AQS2个共享api实现。共享API的2个方法：

```java
protected int tryAcquireShared(int arg) {
    throw new UnsupportedOperationException();
}
protected boolean tryReleaseShared(int arg) {
    throw new UnsupportedOperationException();
}
```

AQS共享模式的处理流程大致是：

Acquire：

if(tryAcquireShared<0)

加入队列

release：

if(tryReleaseShared)

将队列所有节点unpark(独占模式是release一个)

看下CountDownLatch的内部类实现：

```java
private static final class Sync extends AbstractQueuedSynchronizer {
    private static final long serialVersionUID = 4982264981922014374L;
	//state为count数量
    Sync(int count) {
        setState(count);
    }
    int getCount() {
        return getState();
    }
	//acquire检查state值
    protected int tryAcquireShared(int acquires) {
        return (getState() == 0) ? 1 : -1;
    }
	//cas设置state值
    protected boolean tryReleaseShared(int releases) {
        // Decrement count; signal when transition to zero
        for (;;) {
            int c = getState();
            if (c == 0)
                return false;
            int nextc = c-1;
            if (compareAndSetState(c, nextc))
                return nextc == 0;
        }
    }
}	
```

CountDownLatch的实现：

```java
public CountDownLatch(int count) {
    if (count < 0) throw new IllegalArgumentException("count < 0");
    this.sync = new Sync(count);
}
public void await() throws InterruptedException {
    sync.acquireSharedInterruptibly(1);
}
public boolean await(long timeout, TimeUnit unit)
    throws InterruptedException {
    return sync.tryAcquireSharedNanos(1, unit.toNanos(timeout));
}
public void countDown() {
    sync.releaseShared(1);
}
public long getCount() {
    return sync.getCount();
}
```

CountDownLatch的代码还是比较简单的，构造函数传入count数量，内部类sync设置state值，响应中断的await用来acquire，检查state的值，不会0就加入AQS的同步等待队列，当有线程countDown时递减state值，一直到有线程递减到state值为0时，唤醒AQS等待队列所有线程。
