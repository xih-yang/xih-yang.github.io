# 17、Java集合：Queue总结
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/17.html
- 分类：Java并发
- 分组：教程目录
## BlockingQueue

**1、** BlockingQueue相比Queue多了两个阻塞操作：put、take；

**2、** 不允许使用NUL元素；

**3、** 主要用于生产者-使用者队列；

**4、** BlockingQueue利用ReentrantLock实现线程安全、利用Condition实现阻塞；

**5、** 所有队列实现BlockingQueue，故都拥有以上特性；

BlockingQueue 方法以四种形式出现。

## ArrayBlockingQueue

**1、** 一个由数组结构组成的有界阻塞队列；

**2、** 队列按FIFO（先进先出）原则对元素进行排序；

**3、** 容量构造实例时指定，不允许扩容；

## LinkedBlockingQueue

**1、** 一个由链表结构组成的有界阻塞队列；

**2、** 队列按FIFO（先进先出）排序元素；

**3、** 容量固定，默认值Integer.MAX_VALUE，不允许扩容；

**4、** 链接队列的吞吐量通常要高于基于数组的队列，但是在大多数并发应用程序中，其可预知的性能要低；

**5、** 利用两个锁ReentrantLock(takeLock、putLock)、两个Condition(notEmpty、notFull)进行读写分离，提高效率，利用Node构成链表式队列；

## DelayQueue

**1、** 一个使用优先级队列实现的无界阻塞队列；

**2、** 具有延迟功能；

**3、** 基于PriorityQueue；

**4、** 虽说无界，但PriorityQueue是数组结构形式存储，故最大为Integer.MAX_VALUE；

## PriorityBlockingQueue

**1、** 一个支持优先级排序的无界阻塞队列；

**2、** 同样基于PriorityQueue；

**3、** 无界的说法也同上；

## PriorityQueue

**1、** 一个基于优先级堆的无界优先级队列；

**2、** 非同步；

**3、** 优先级队列不允许使用null元素；

**4、** 元素以数组结构形式存储，故最大值为Integer.MAX_VALUE；
