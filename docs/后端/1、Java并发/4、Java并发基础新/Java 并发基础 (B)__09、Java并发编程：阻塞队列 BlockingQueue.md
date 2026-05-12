# 09、Java并发编程：阻塞队列 BlockingQueue
- 来源：https://ddkk.com/zhuanlan/java/concurrency/4/29.html
- 分类：Java并发
- 分组：Java 并发基础 (B)
## 8.1 什么是阻塞队列

阻塞队列（BlockingQueue）是一个支持两个附加操作的队列。这两个附加的操作是：在队列为空时，获取元素的线程会等待队列变为非空。当队列满时，存储元素的线程会等待队列可用。

阻塞队列常用于生产者和消费者的场景，生产者是往队列里添加元素的线程，消费者是从队列里拿元素的线程。阻塞队列就是生产者存放元素的容器，而消费者也只从容器里拿元素。

我们不用关心什么时候需要阻塞线程，什么时候需要释放线程，因为这些都会被阻塞队列自动完成。

## 8.2 阻塞队列的分类

**1、** ArrayBlockingQueue；

基于数组的阻塞队列实现，在ArrayBlockingQueue内部，维护了一个定长数组，以便缓存队列中的数据对象。

这是一个常用的阻塞队列，除了维护一个定长数组外，还维护了两个整型常量，分别标识队列的头部和尾部在数组中的位置。

由数组组成的有界阻塞队列。

**2、** LinkedBlockingQueue；

基于链表的阻塞队列实现，在LinkedBlockingQueue中，维护了一个链表，如果没有指定链表长度，则默认为Integer.MAX_VALUE。

由链表组成的有界阻塞队列。

**3、** DelayQueue；

在DelayQueue中，只有指定的延时时间到了，才能从队列中获取元素。DelayQueue是一个没有大小限制的队列，所以生产者可以一直往里添加元素，而消费者在队列为空的情况下，会发生阻塞。

使用优先级队列实现的延迟无界阻塞队列。

**4、** SynchronousQueue；

是一个无缓冲的等待队列，在某次添加元素后必须等待其他线程取走后才能继续添加；可以认为SynchronousQueue是一个缓存值为1的阻塞队列，只存储单个元素。

## 8.3 阻塞队列核心方法

## 8.4 代码演示

```java
package queue;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.TimeUnit;
public class BlockingQueueDemo {
    public static void main(String[] args) throws InterruptedException {
        //创建阻塞队列
        BlockingQueue<String> blockingQueue = new ArrayBlockingQueue<>(3);
//        //第一组
//        System.out.println(blockingQueue.add("chen"));
//        System.out.println(blockingQueue.add("xin"));
//        System.out.println(blockingQueue.add("123"));
//        System.out.println(blockingQueue.element());
//        //添加不进去时就报异常
//        //System.out.println(blockingQueue.add("12"));
//
//        System.out.println(blockingQueue.remove());
//        System.out.println(blockingQueue.remove());
//        System.out.println(blockingQueue.remove());
//        //没有元素可删时，就报异常
//        System.out.println(blockingQueue.remove());
//        //第二组
//        System.out.println(blockingQueue.offer("haha"));
//        System.out.println(blockingQueue.offer("heihei"));
//        System.out.println(blockingQueue.offer("yeye"));
//        System.out.println(blockingQueue.offer("dsfa"));  //插入不进去，返回false
//
//        System.out.println(blockingQueue.poll());
//        System.out.println(blockingQueue.poll());
//        System.out.println(blockingQueue.poll());
//        System.out.println(blockingQueue.poll());  //没有值可以出来了，就返回null
//        //第三组
//        blockingQueue.put("adf");
//        blockingQueue.put("asd");
//        blockingQueue.put("qwe");
        blockingQueue.put("sdfa");  //运行到这里就阻塞了
//
//        blockingQueue.take();
//        blockingQueue.take();
//        blockingQueue.take();
//        blockingQueue.take();  //到这里也阻塞了
        //第四组
        System.out.println(blockingQueue.offer("a"));
        System.out.println(blockingQueue.offer("b"));
        System.out.println(blockingQueue.offer("c", 3L, TimeUnit.SECONDS));
        System.out.println(blockingQueue.offer("d", 3L, TimeUnit.SECONDS));  //队列满时会阻塞一段时间，poll用法类似
    }
}
```
