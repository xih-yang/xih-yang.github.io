# 20、Java并发编程：阻塞队列
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/20.html
- 分类：Java并发
- 分组：教程目录
阻塞队列（BlockingQueue）是一个支持两个附加操作的队列。这两个附加操作支持阻塞地插入和移除方法。支持阻塞插入的方法是指当队列满时会阻塞插入元素的线程，直到队列不满；支持阻塞移除的方法是指当队列为空时获取元素的线程无法继续获取元素直到队列不空。

可以发现阻塞队列非常适合消费者和生产者场景下进行使用，生产者生产数据就是向阻塞队列中插入元素，消费者消费数据就是从阻塞队列中移除元素。

Java提供了阻塞队列支持如下方法：

**插入方法**：add(e)（添加失败会抛出异常）、offer(e)（添加失败返回特殊值）、put(e)（添加失败会一直阻塞）

**移除方法**：remove(e)（移除失败会抛出异常）、poll(e)（移除失败会返回特殊值）、take(e)（移除失败会一直阻塞）

> 在Java中提供了无界队列，这种情况下队列不可能出现满的情况（除非发生内存溢出），所以使用put和take方法永远不会被阻塞，offer返回的永远是true。

在Java中提供了7种阻塞队列，使用较多有四种：ArrayBlockingQueue、LinkedBlockingQueue、PriorityBlockingQueue和DelayQueue。ArrayBlockingQueue是一个由数组结构组成的有界阻塞队列，LinkedBlockingQueue是一个由链表结构组成的有界阻塞队列，PriorityBlockingQueue是一个支持优先级排序的无界阻塞队列，DelayQueue是一个使用优先级队列实现的支持延时获取元素的无界阻塞队列。DelayQueue适用于缓存系统的设计以及定时任务调度等场景。

那么阻塞队列是如何实现线程的同步的呢？**使用通知模式实现**。

通知模式是指当生产者往满的队列添加元素的时候会阻塞生产者，当消费者消费了一个队列中的元素后，会通知生产者当前队列已经不满了，这时生产者可以继续往队列中添加元素。就ArrayBlockingQueue而言，是使用Condition条件变量实现通知模式的。

```java
public ArrayBlockingQueue(int capacity, boolean fair) {
        //省略部分代码
        notEmpty = lock.newCondition();
        notFull =  lock.newCondition();
    }
//添加元素的方法
public void put(E e) throws InterruptedException {
        checkNotNull(e);
        final ReentrantLock lock = this.lock;
        lock.lockInterruptibly();
        try {
            while (count == items.length)
                notFull.await();
            //如果队列不满就入队
            enqueue(e);
        } finally {
            lock.unlock();
        }
    }
 //入队的方法
 private void enqueue(E x) {
        final Object[] items = this.items;
        items[putIndex] = x;
        if (++putIndex == items.length)
            putIndex = 0;
        count++;
        notEmpty.signal();
    }
 //移除元素的方法
 public E take() throws InterruptedException {
        final ReentrantLock lock = this.lock;
        lock.lockInterruptibly();
        try {
            while (count == 0)
                notEmpty.await();
            return dequeue();
        } finally {
            lock.unlock();
        }
    }
 //出队的方法
 private E dequeue() {
        final Object[] items = this.items;
        @SuppressWarnings("unchecked")
        E x = (E) items[takeIndex];
        items[takeIndex] = null;
        if (++takeIndex == items.length)
            takeIndex = 0;
        count--;
        if (itrs != null)
            itrs.elementDequeued();
        notFull.signal();
        return x;
    }
```

从源码可以看出，阻塞队列的实现仍然是使用了经典的等待/通知模式实现的。使用阻塞队列的好处在于使用者不用关心什么时候等待，什么时候进行通知，什么时候添加元素什么时候取元素都由使用者实现，让使用者可以更多关注业务的实现。那么对于上一篇文章提到的生产者消费者模式，如何使用阻塞队列实现呢？

下面代码演示了使用阻塞队列实现生产者消费者模式：

```java
package com.ddkk.concurrency;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-4.
 */
public class ProducerConsumerModeWithBlockQueueTest {
    static class Info{
        //内容
        private String content;
        public Info(String content) {
            this.content = content;
        }
        public String getContent() {
            return content;
        }
        public void setContent(String content) {
            this.content = content;
        }
        @Override
        public String toString() {
            return this.getContent();
        }
    }
    static class Producer implements Runnable{
        private final BlockingQueue<Info> blockingQueue;
        public Producer(BlockingQueue<Info> blockingQueue) {
            this.blockingQueue = blockingQueue;
        }
        public void run() {
            boolean flag = true;
            for (int i = 0; i < 5; i++){
                if (flag){
                    try {
                        blockingQueue.put(new Info("contentA"));
                        System.out.println("[生产者]：contentA");
                        TimeUnit.SECONDS.sleep(1);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    flag = false;
                }else {
                    try {
                        blockingQueue.put(new Info("contentB"));
                        System.out.println("[生产者]：contentB");
                        TimeUnit.SECONDS.sleep(1);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    flag = true;
                }
            }
        }
    }
    static class Consumer implements Runnable{
        private final BlockingQueue<Info> blockingQueue;
        public Consumer(BlockingQueue<Info> blockingQueue) {
            this.blockingQueue = blockingQueue;
        }
        public void run() {
            while (true){
                try {
                    System.out.println("[消费者]：" + blockingQueue.take());
                    TimeUnit.SECONDS.sleep(1);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
    }
    public static void main(String[] args){
        BlockingQueue<Info> blockingQueue = new LinkedBlockingQueue<Info>();
        new Thread(new Producer(blockingQueue)).start();
        new Thread(new Consumer(blockingQueue)).start();
    }
}
```

可以发现，相比之前使用等待/通知模式实现的生产者消费者模式，使用阻塞队列实现的代码更加简洁，Info类无需添加任何同步方法，程序的可扩展性提高了提高，耦合度也降低了。
