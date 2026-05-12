# 12、Java并发编程 - JUC阻塞队列（概念、生产者消费者模型）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/8/12.html
- 分类：Java并发
- 分组：教程目录
## 一、阻塞队列

## 1.1 概念

> 比如12306服务器并发支持10W，突然来30W请求肯定会冲垮服务器，所以用阻塞队列，把后20W请求放入队列，等服务器处理完一部分，在从队列里取一部分，限流削峰思想。放入队列可以放入内存中，也可以持久化，持久化的方式就是消息中间件。

概念：

- 在多线程领域：所谓阻塞，在某些情况下会挂起线程（即阻塞），⼀旦条件满⾜，被挂起的线程⼜会⾃动被唤醒。
- 阻塞队列 是⼀个队列，在数据结构中起的作⽤如下图：

- 当队列是空的，从队列中获取（Take）元素的操作将会被阻塞
- 当队列是满的，从队列中添加（Put）元素的操作将会被阻塞
- 试图从空的队列中获取元素的线程将会被阻塞，直到其他线程往空的队列插⼊新的元素
- 试图向已满的队列中添加新元素的线程将会被阻塞，直到其他线程从队列中移除⼀个或多个元素或者完全清空，使队列变得空闲起来后并后续新增

**好处**：阻塞队列不⽤⼿动控制什么时候该被阻塞，什么时候该被唤醒，简化了操作。

**体系**： Collection → Queue → BlockingQueue →七个阻塞队列实现类。

## 1.2 阻塞队列7个实现类

类名
作⽤

ArrayBlockingQueue
由数组结构构成的有界阻塞队列

PriorityBlockingQueue
⽀持优先级排序的⽆界阻塞队列

DelayQueue
使⽤优先级队列实现的延迟⽆界阻塞队列

LinkedBlockingQueue
由链表结构构成的有界（但默认值为Integer.MAX_VALUE）阻塞队列

LinkedBlockingDeque
由链表构成的双向阻塞队列

SynchronousQueue
不存储元素的阻塞队列，也即单个元素的队列

LinkedTransferQueue
由链表构成的⽆界阻塞队列

粗体标记的三个⽤得⽐较多，许多消息中间件底层就是⽤它们实现的。

> 需要注意的是 LinkedBlockingQueue 虽然是有界的，但有个巨坑，其默认⼤⼩是 Integer.MAX_VALUE ，⾼达21亿，⼀般情况下内存早爆了（在线程池的 ThreadPoolExecutor 有体现）。

## 1.3 API介绍：

⽅法类型
抛出异常
返回布尔
阻塞
超时

插⼊
add(E e)
offer(E e)
put(E e)
offer(E e,Time,TimeUnit)

取出
remove()
poll()
take()
poll(Time,TimeUnit)

队⾸
element()
peek()
⽆
⽆

- 抛出异常是指当队列满时，再次插⼊会抛出异常；
- 返回布尔是指当队列满时，再次插⼊会返回 false；
- 阻塞是指当队列满时，再次插⼊会被阻塞，直到队列取出⼀个元素，才能插⼊。
- 超时是指当⼀个时限过后，才会插⼊或者取出。API使⽤⻅BlockingQueueDemo。

效果演示：

```java
public class BlockingQueueDemo {
    public static void main(String[] args) throws InterruptedException {
        BlockingQueue<String> blockingQueue = new ArrayBlockingQueue<String>(3);
        //addAndRemove(blockingQueue);
        //offerAndPoll(blockingQueue);
        //putAndTake(blockingQueue);
        outOfTime(blockingQueue);
    }
    private static void outOfTime(BlockingQueue<String> blockingQueue) throws InterruptedException {
        System.out.println(blockingQueue.offer("a",2L, TimeUnit.SECONDS));
        System.out.println(blockingQueue.offer("a",2L, TimeUnit.SECONDS));
        System.out.println(blockingQueue.offer("a",2L, TimeUnit.SECONDS));
        System.out.println(blockingQueue.offer("a",2L, TimeUnit.SECONDS));//队列满了，当前线程会阻塞，直到添加成功或者超过指定的延迟时间返回false
    }
    private static void putAndTake(BlockingQueue<String> blockingQueue) throws InterruptedException {
        blockingQueue.put("a");
        blockingQueue.put("b");
        blockingQueue.put("c");
        //blockingQueue.put("d");//不注释，队列满了，当前线程会阻塞，直到有容量添加成功
        System.out.println(blockingQueue.take());
        System.out.println(blockingQueue.take());
        System.out.println(blockingQueue.take());
        System.out.println(blockingQueue.take());//取不到元素，当前线程会阻塞，直到队列有元素获取成功
    }
    private static void offerAndPoll(BlockingQueue<String> blockingQueue) {
        System.out.println(blockingQueue.offer("a"));
        System.out.println(blockingQueue.offer("b"));
        System.out.println(blockingQueue.offer("c"));
        System.out.println(blockingQueue.offer("e"));//offer添加，如果容量满了直接返回false
        System.out.println(blockingQueue.peek());//peek直接查看队首元素，但不取出队列，取不到直接返回null
        System.out.println(blockingQueue.poll());
        System.out.println(blockingQueue.poll());
        System.out.println(blockingQueue.poll());
        System.out.println(blockingQueue.poll());//poll取元素，如果取不到直接返回null
    }
    private static void addAndRemove(BlockingQueue<String> blockingQueue) {
        System.out.println(blockingQueue.add("a"));
        System.out.println(blockingQueue.add("b"));
        System.out.println(blockingQueue.add("c"));
        //System.out.println(blockingQueue.add("e"));//阻塞队列容量为3，add插入第四个会抛异常
        System.out.println(blockingQueue.element());//element直接查看队首元素，但不取出队列，取不到抛异常
        System.out.println(blockingQueue.remove());
        System.out.println(blockingQueue.remove());
        System.out.println(blockingQueue.remove());
        System.out.println(blockingQueue.remove());//remove也是同理，取不到也会抛异常
    }
}
```

## 二、⽣产者消费者模型

## 2.1 Synchronized实现线程通信

传统模式使⽤ `Synchronized` 来进⾏线程的同步操作

```java
class Aircondition{
    private int number = 0;
    //老版写法
    public synchronized void increment() throws Exception{
        //1.判断
        if (number != 0){
            this.wait();
        }
        //2.干活
        number++;
        System.out.println(Thread.currentThread().getName()+"\t"+number);
        //3通知
        this.notifyAll();
    }
    public synchronized void decrement() throws Exception{
        //1.判断
        if (number == 0){
            this.wait();
        }
        //2.干活
        number--;
        System.out.println(Thread.currentThread().getName()+"\t"+number);
        //3通知
        this.notifyAll();
    }
}
/**
 * 题目：现在两个线程，可以操作初始值为零的一个变量，
 * 实现一个线程对该变量加1，一个线程对该变量-1，
 * 实现交替，来10轮，变量初始值为0.
 *      1.高内聚低耦合前提下，线程操作资源类
 *      2.判断/干活/通知
 *      3.防止虚假唤醒(判断只能用while，不能用if)
 * 
 * 知识小总结：多线程编程套路+while判断+新版写法
 */
public class ProdConsumerDemo {
    public static void main(String[] args) {
        Aircondition aircondition = new Aircondition();
        new Thread(()->{
            for (int i = 1; i <= 10; i++) {
                try {
                    aircondition.increment();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        },"A").start();
        new Thread(()->{
            for (int i = 1; i <= 10; i++) {
                try {
                    aircondition.decrement();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        },"B").start();
    }
}
```

## 2.2 虚假唤醒问题演示和解决

上面只有一个消费者，一个生产者，现在分别在加一个消费者、生产者：

```java
public class ProdConsumerDemo {
    public static void main(String[] args) {
        Aircondition aircondition = new Aircondition();
        new Thread(()->{
            for (int i = 1; i <= 10; i++) {
                try {
                    aircondition.increment();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        },"A").start();
        new Thread(()->{
            for (int i = 1; i <= 10; i++) {
                try {
                    aircondition.increment();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        },"A-2").start();
        new Thread(()->{
            for (int i = 1; i <= 10; i++) {
                try {
                    aircondition.decrement();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        },"B").start();
        new Thread(()->{
            for (int i = 1; i <= 10; i++) {
                try {
                    aircondition.decrement();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        },"B-2").start();
    }
}
```

看到出现了2，3，if改成while即可解决

```java
class Aircondition{
    private int number = 0;
    //老版写法
    public synchronized void increment() throws Exception{
        //1.判断
        while (number != 0){
     //if改成while即可解决
            this.wait();
        }
        //2.干活
        number++;
        System.out.println(Thread.currentThread().getName()+"\t"+number);
        //3通知
        this.notifyAll();
    }
    public synchronized void decrement() throws Exception{
        //1.判断
        while (number == 0){
     //if改成while即可解决
            this.wait();
        }
        //2.干活
        number--;
        System.out.println(Thread.currentThread().getName()+"\t"+number);
        //3通知
        this.notifyAll();
    }
}
```

## 2.3 Condition 实现线程通信

新模式使⽤ `Lock` 来进⾏操作，需要⼿动加锁、解锁。Condition之前介绍过，直接看DEMO：

```java
/**
 * 新版本代码
 */
class Aircondition{
    private int number = 0;
    private Lock lock = new ReentrantLock();
    private Condition condition = lock.newCondition();
    public void increment() throws Exception{
        //获取锁
        lock.lock();
        try{
            //1.判断
            while (number != 0){
                //this.wait();
                condition.await();
            }
            //2.干活
            number++;
            System.out.println(Thread.currentThread().getName()+"\t"+number);
            //3通知
            //this.notifyAll();
            condition.signalAll();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            //释放锁
            lock.unlock();
        }
    }
    public void decrement() throws Exception{
        //获取锁
        lock.lock();
        //释放锁
        try{
            //1.判断
            while (number == 0){
                //this.wait();
                condition.await();
            }
            //2.干活
            number--;
            System.out.println(Thread.currentThread().getName()+"\t"+number);
            //3通知
            //this.notifyAll();
            condition.signalAll();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            //释放锁
            lock.unlock();
        }
    }
}
/**
 * 题目：现在两个线程，可以操作初始值为零的一个变量，
 * 实现一个线程对该变量加1，一个线程对该变量-1，
 * 实现交替，来10轮，变量初始值为0.
 *      1.高内聚低耦合前提下，线程操作资源类
 *      2.判断/干活/通知
 *      3.防止虚假唤醒(判断只能用while，不能用if)
 * 知识小总结：多线程编程套路+while判断+新版写法
 */
public class ProdConsumerDemo {
    public static void main(String[] args) {
        Aircondition aircondition = new Aircondition();
        new Thread(()->{
            for (int i = 1; i <= 10; i++) {
                try {
                    aircondition.increment();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        },"A").start();
        new Thread(()->{
            for (int i = 1; i <= 10; i++) {
                try {
                    aircondition.increment();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        },"A-2").start();
        new Thread(()->{
            for (int i = 1; i <= 10; i++) {
                try {
                    aircondition.decrement();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        },"B").start();
        new Thread(()->{
            for (int i = 1; i <= 10; i++) {
                try {
                    aircondition.decrement();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        },"B-2").start();
    }
}
```

效果一样，不截图了。

## 2.4 Condition实现精准通知顺序访问

之前在Condition那章节演示过一个更复杂的阿里面试题，下面这个相对来更简单，直接看Demo：

```java
class ShareData{
    private int number = 1;//标识位，代表需要唤醒的线程 A:1,B:2,C:3
    private Lock lock = new ReentrantLock();
    private Condition c1 = lock.newCondition();
    private Condition c2 = lock.newCondition();
    private Condition c3 = lock.newCondition();
    public void printc1(){
        lock.lock();
        try {
            //1.判断
            while (number != 1){
                c1.await();
            }
            //2.干活
            for (int i = 1; i <= 5; i++) {
                System.out.println(Thread.currentThread().getName()+"\t"+i);
            }
            //3.通知
            number = 2;
            //通知第2个
            c2.signal();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }
    public void printc2(){
        lock.lock();
        try {
            //1.判断
            while (number != 2){
                c2.await();
            }
            //2.干活
            for (int i = 1; i <= 10; i++) {
                System.out.println(Thread.currentThread().getName()+"\t"+i);
            }
            //3.通知
            number = 3;
            //如何通知第3个
            c3.signal();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }
    public void printc3(){
        lock.lock();
        try {
            //1.判断
            while (number != 3){
                c3.await();
            }
            //2.干活
            for (int i = 1; i <= 15; i++) {
                System.out.println(Thread.currentThread().getName()+"\t"+i);
            }
            //3.通知
            number = 1;
            //如何通知第1个
            c1.signal();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }
}
/**
 * 备注：多线程之间按顺序调用，实现A->B->C
 * 三个线程启动，要求如下：
 * A打印5次，B打印10次，C打印15次
 * 接着
 * A打印5次，B打印10次，C打印15次
 * 来10轮
 *      1.高内聚低耦合前提下，线程操作资源类
 *      2.判断/干活/通知
 *      3.多线程交互中，防止虚假唤醒(判断只能用while，不能用if)
 *      4.标志位
 */
public class ConditionDemo {
    public static void main(String[] args) {
        ShareData shareData = new ShareData();
        new Thread(()->{
            for (int i = 1; i <= 10; i++) {
                shareData.printc1();
            }
        },"A").start();
        new Thread(()->{
            for (int i = 1; i <= 10; i++) {
                shareData.printc2();
            }
        },"B").start();
        new Thread(()->{
            for (int i = 1; i <= 10; i++) {
                shareData.printc3();
            }
        },"C").start();
    }
}
```

## 2.5 Synchronized和Lock的区别

`synchronized` 关键字和 `java.util.concurrent.locks.Lock` 都能加锁，两者有什么区别呢？

- **原始构成**： sync 是JVM层⾯的，底层通过 monitorenter 和 monitorexit 来实现的。 Lock 是JDK API层⾯的。（ sync ⼀个enter会有两个exit，⼀个是正常退出，⼀个是异常退出）
- **使⽤⽅法**： sync 不需要⼿动释放锁，⽽ Lock 需要⼿动释放。
- **是否可中断**： sync 不可中断，除⾮抛出异常或者正常运⾏完成。 Lock 是可中断的，通过调⽤ interrupt() ⽅法。
- **是否为公平锁**： sync 只能是⾮公平锁，⽽ Lock 既能是公平锁，⼜能是⾮公平锁。
- **绑定多个条件**： sync 不能，只能随机唤醒。⽽ Lock 可以通过 Condition 来绑定多个条件，精确唤醒。

## 2.6 阻塞队列实现⽣产者消费者模型

为什么需要BlockingQueue？

好处是我们不需要关⼼什么时候需要阻塞线程，什么时候需要唤醒线程，因为这⼀切BlockingQueue都给你⼀⼿包办好了，使⽤阻塞队列 后就不需要⼿动加锁了。

在Concurrent包发布以前，在多线程环境下，我们每个程序员都必须去⾃⼰控制这些细节，尤其还要兼顾效率和线程安全，⽽这会给我们的程序带来不⼩的复杂度。

```java
public class ProdConsBlockQueueDemo {
    public static void main(String[] args) {
        MyResource myResource = new MyResource(new ArrayBlockingQueue<>(2));
        new Thread(() -> {
            System.out.println(Thread.currentThread().getName() + "\t生产线程启动");
            try {
                myResource.myProd();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }, "prod").start();
        new Thread(() -> {
            System.out.println(Thread.currentThread().getName() + "\t生产线程启动");
            try {
                myResource.myProd();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }, "prod-2").start();
        new Thread(() -> {
            System.out.println(Thread.currentThread().getName() + "\t消费线程启动");
            try {
                myResource.myCons();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }, "cons").start();
        new Thread(() -> {
            System.out.println(Thread.currentThread().getName() + "\t消费线程启动");
            try {
                myResource.myCons();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }, "cons-2").start();
        try {
            TimeUnit.SECONDS.sleep(5);
        } catch (Exception e) {
            e.printStackTrace();
        }
        System.out.println("5秒钟后，叫停");
        myResource.stop();
    }
}
class MyResource {
    private volatile boolean FLAG = true; //默认开启，进行生产+消费
    private AtomicInteger atomicInteger = new AtomicInteger();
    private BlockingQueue<String> blockingQueue = null;
    public MyResource(BlockingQueue<String> blockingQueue) {
        this.blockingQueue = blockingQueue;
        System.out.println(blockingQueue.getClass().getName());
    }
    public void myProd() throws Exception {
        String data = null;
        boolean retValue;
        while (FLAG) {
            data = atomicInteger.incrementAndGet() + "";//++i
            retValue = blockingQueue.offer(data, 2L, TimeUnit.SECONDS);
            if (retValue) {
                System.out.println(Thread.currentThread().getName() + "\t" + "插入队列" + data + "成功");
            } else {
                System.out.println(Thread.currentThread().getName() + "\t" + "插入队列" + data + "失败");
            }
            TimeUnit.SECONDS.sleep(1);
        }
        System.out.println(Thread.currentThread().getName() + "\t老板叫停了，FLAG已更新为false，停止生产");
    }
    public void myCons() throws Exception {
        String res;
        while (FLAG) {
            res = blockingQueue.poll(2L, TimeUnit.SECONDS);
            if (null == res || "".equals(res)) {
                // FLAG = false;
                System.out.println(Thread.currentThread().getName() + "\t超过2秒钟没有消费，退出消费");
                return;
            }
            System.out.println(Thread.currentThread().getName() + "\t\t消费队列" + res + "成功");
        }
    }
    public void stop() {
        this.FLAG = false;
    }
}
```
