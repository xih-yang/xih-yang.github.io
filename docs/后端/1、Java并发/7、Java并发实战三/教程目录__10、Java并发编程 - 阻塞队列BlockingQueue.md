# 10、Java并发编程 - 阻塞队列BlockingQueue
- 来源：https://ddkk.com/zhuanlan/java/concurrency/7/10.html
- 分类：Java并发
- 分组：教程目录
## 10、阻塞队列:BlockingQueue

### 10.1. 阻塞队列概念

队列：排队 特性：先进先出 FIFO

阻塞：必须要阻塞、不得不阻塞，原理如下：

### 10.2. 接口架构图

jdk官方文档如下：

阻塞队列：与List、Set类似，都是继承Collection.

### 10.3.ArrayBlockingQueue API 的使用

1、ArrayBlockingQueue 是一个有限的blocking queue，由数组支持。

2、这个队列排列元素FIFO（先进先出）。

3、队列的*头部*是队列中最长时间的元素。队列的*尾部*是队列中最短时间的元素。

4、新元素插入队列的尾部，队列检索操作获取队列头部的元素。

5、这是一个经典的“有界缓冲区”，其中固定大小的数组保存由生产者插入的元素并由消费者提取。

6、队列的固定大小创建后，容量无法更改。

ArrayBlockingQueue 以插入方法、移除方法、检查队首三个方法为单元，形成了四组API，分别是抛出异常组、返回特殊值组、超时退出组、一直阻塞组，如下：

方法
抛出异常
返回特殊值
超时退出
一直阻塞

插入（存）
add
offer
offer(e, timeout, unit)
put ()

移除（取）
remove
poll
poll(timeout, unit)
take()

检查队首
element
peek
-
-

为什么要搞这么多？任何一个方法存在，就一定有对应的业务场景。

#### 第一组：抛出异常

```java
package com.interview.concurrent.blockingqueue;
import java.util.concurrent.ArrayBlockingQueue;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:LArrayBlockingQueue API 测试
 * @date 2023/2/23 17:33
 */
public class ArrayBlockingQueueDemo {
    public static void main(String[] args) {
        //创建大小为3的阻塞队列
        ArrayBlockingQueue arrayBlockingQueue = new ArrayBlockingQueue(3);
        //1、抛出异常API
        queueApiException(arrayBlockingQueue);
    }
    public static void queueApiException(ArrayBlockingQueue arrayBlockingQueue){
        arrayBlockingQueue.add("a");
        arrayBlockingQueue.add("b");
        arrayBlockingQueue.add("c");
        //arrayBlockingQueue.add("d"); //java.lang.IllegalStateException: Queue full
        System.out.println(arrayBlockingQueue.remove());
        System.out.println(arrayBlockingQueue.remove());
        System.out.println(arrayBlockingQueue.remove());
        //System.out.println(arrayBlockingQueue.remove());//java.util.NoSuchElementException
        arrayBlockingQueue.element(); //java.util.NoSuchElementException
    }
}
```

#### 第二组：没有异常

```java
 public static void queueApiNotException(ArrayBlockingQueue arrayBlockingQueue){
        System.out.println(arrayBlockingQueue.offer("a"));
        System.out.println(arrayBlockingQueue.offer("b"));
        System.out.println(arrayBlockingQueue.offer("c"));
        System.out.println(arrayBlockingQueue.offer("d")); //false 我们通常不希望代码报错！这时候就使用offer
        System.out.println(arrayBlockingQueue.poll());
        System.out.println(arrayBlockingQueue.poll());
        System.out.println(arrayBlockingQueue.poll());
        System.out.println(arrayBlockingQueue.poll());//null
        System.out.println(arrayBlockingQueue.peek()); //null
    }
```

#### 第三组：超时就退出

```java
/**
     *  @description:设置等待时间，超时就退出
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/23 17:54
     */
    public static void queueApiTimeOutExit(ArrayBlockingQueue arrayBlockingQueue) throws InterruptedException {
        System.out.println(arrayBlockingQueue.offer("a"));
        System.out.println(arrayBlockingQueue.offer("b"));
        System.out.println(arrayBlockingQueue.offer("c"));
        // 超过3秒就不等待了，返回false
        System.out.println(arrayBlockingQueue.offer("d",3,TimeUnit.SECONDS));
        System.out.println(arrayBlockingQueue.poll());
        System.out.println(arrayBlockingQueue.poll());
        System.out.println(arrayBlockingQueue.poll());
        System.out.println(arrayBlockingQueue.poll(3,TimeUnit.SECONDS));//返回null
    }
```

#### 第四组：一直阻塞

```java
 /**
     *  @description:一直等待
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/23 17:54
     */
    public static void queueApiWaitingAlone(ArrayBlockingQueue arrayBlockingQueue) {
        try {
            arrayBlockingQueue.put("a");
            arrayBlockingQueue.put("b");
            arrayBlockingQueue.put("c");
            //一直等待
            //arrayBlockingQueue.put("d");
            System.out.println(arrayBlockingQueue.take());
            System.out.println(arrayBlockingQueue.take());
            System.out.println(arrayBlockingQueue.take());
            //一直等待
            System.out.println(arrayBlockingQueue.take());//阻塞等待拿出元素
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
```

### 10.4. SynchronousQueue 同步队列

> SynchronousQueue 同步队列

SynchronousQueue 不存储元素，队列是空的。

每一个put 操作。必须等待一个take。否则无法继续添加元素！可以将SynchronousQueue理解为只有一个数据大小的ArrayBlockingQueue当中的一直阻塞put和take。

```java
package com.interview.concurrent.blockingqueue;
import java.util.Arrays;
import java.util.concurrent.SynchronousQueue;
import java.util.concurrent.TimeUnit;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:同步队列SynchronousQueue
 * 1、不存储元素，队列是空的
 * 2、每一个 put 操作。必须等待一个take。否则无法继续添加元素！
 * 3、可以将SynchronousQueue理解为只有一个数据大小的ArrayBlockingQueue当中的一直阻塞put和take。
 * @date 2023/2/23 18:11
 */
public class SynchronousQueueDemo {
    public static void main(String[] args) {
        SynchronousQueue synchronousQueue = new SynchronousQueue();
        //添加元素线程
        new Thread(() -> {
            try {
                synchronousQueue.put("1");
                System.out.println(Thread.currentThread().getName() + ":put 1");
                synchronousQueue.put("2");
                System.out.println(Thread.currentThread().getName() + ":put 2");
                synchronousQueue.put("3");
                System.out.println(Thread.currentThread().getName() + ":put 3");
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        },"put element").start();
        //读取元素线程
        new Thread(() -> {
            try {
                TimeUnit.SECONDS.sleep(3);
                System.out.println(Thread.currentThread().getName()+synchronousQueue.take());
                TimeUnit.SECONDS.sleep(3);
                System.out.println(Thread.currentThread().getName()+synchronousQueue.take());
                TimeUnit.SECONDS.sleep(3);
                System.out.println(Thread.currentThread().getName()+synchronousQueue.take());
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        },"get element").start();
    }
}
```
