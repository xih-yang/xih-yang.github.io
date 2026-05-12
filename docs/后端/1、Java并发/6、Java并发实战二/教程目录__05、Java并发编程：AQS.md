# 05、Java并发编程：AQS
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/5.html
- 分类：Java并发
- 分组：教程目录
AQS是队列同步器的简称，简单来说这个东西是JUC框架工具包和构建锁的基础，它使用一个int成员变量表示同步状态，通过内置的FIFO队列完成资源获取线程的排队工作。深刻理解AQS对后面常用的并发工具也掌握得更深刻。

首先说说AQS和锁的区别吧：锁的底层是使用AQS实现的。锁是面向使用者的，锁定义了使用者与锁交互的接口，隐藏了具体的实现细节；AQS是面向锁的实现者的，它屏蔽了一些复杂的同步状态的管理，简化了锁的实现方式。总结一下：AQS和锁关注的使用者不同。

AQS的使用方式是继承，子类通过实现AQS的三个抽象方法：getState()、setState(int newState)和compareAndSetState(int expect,int update)。compareAndSetState方法也简称为CAS，如果传入的状态与expect相同，那么就把传入的状态设为update，这个操作的原子的。

下面的代码演示了自定义同步组件，它的功能是在同一个时刻只能允许一个线程占有资源

```java
package com.ddkk.concurrency;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.AbstractQueuedSynchronizer;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-3.
 */
public class Mutex implements Lock {
    /**
     * 静态内部类，自定义同步器
     */
    private static class Sync extends AbstractQueuedSynchronizer {
        /**
         * 是否占用锁
         * @return
         */
        @Override
        protected boolean isHeldExclusively() {
            return getState() == 1;
        }
        /**
         * 当状态为0的时候获取锁
         * @param arg
         * @return
         */
        @Override
        protected boolean tryAcquire(int arg) {
            if (compareAndSetState(0, 1)) {
                setExclusiveOwnerThread(Thread.currentThread());
                return true;
            }
            return false;
        }
        /**
         * 释放锁，将状态设为0
         * @param arg
         * @return
         */
        @Override
        protected boolean tryRelease(int arg) {
            if (getState() == 0) throw new IllegalMonitorStateException();
            setExclusiveOwnerThread(null);
            setState(0);
            return true;
        }
        /**
         * @return Condition，每个Condition都包含了一个Condition队列
         */
        Condition newCondition() {
            return new ConditionObject();
        }
    }
    /**
     * 直接代理给Sync对象即可
     */
    private final Sync sync = new Sync();
    public void lock() {
        sync.acquire(1);
    }
    public void lockInterruptibly() throws InterruptedException {
        sync.acquireInterruptibly(1);
    }
    public boolean tryLock() {
        return sync.tryAcquire(1);
    }
    public boolean tryLock(long time, TimeUnit unit) throws InterruptedException {
        return sync.tryAcquireSharedNanos(1, unit.toNanos(time));
    }
    public void unlock() {
        sync.release(1);
    }
    public Condition newCondition() {
        return sync.newCondition();
    }
}
```

程序中使用了静态内部类，该内部类继承了AQS并实现了独占获取锁和释放锁。用户使用这个自定义同步组件的时候，只会使用提供的公共方法，外界是无法直到内部实现细节的。

那么，在AQS内部是如何实现线程同步的呢？经过阅读源码，总结以下几点：

**1、** AQS内部依赖一个同步队列——一个FIFO的双向队列完成同步状态（这里的同步状态可以理解为锁）的管理；

**2、** 如果当前线程获取同步状态失败时，同步队列会将当前线程的信息构造成一个节点并将其加入同步队列的尾部，同时会阻塞当前线程；

**3、** 如果线程成功获取到同步状态，那么会把该线程的信息以及等待状态构造成一个节点，并在队列中设置该节点为头节点；

**4、** 获取同步状态失败的线程在被加入到队列尾节点的时候需要保证原子性，因为可能存在多个线程都获取失败的情况；而设置头节点则不需要保证原子性，因为只会由一个线程能够成功获取到同步状态；

**5、** 头节点的线程在释放同步状态之后，将会唤醒其后继节点，后继节点被唤醒后会检查自己的前驱节点是否是头节点；

**6、** 如果检查到自己的前驱节点是头节点，那么线程会采用自旋的方式获取同步状态；
