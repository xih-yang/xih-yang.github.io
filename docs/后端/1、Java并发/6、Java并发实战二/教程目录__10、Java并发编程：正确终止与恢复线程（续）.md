# 10、Java并发编程：正确终止与恢复线程（续）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/10.html
- 分类：Java并发
- 分组：教程目录
**重新认识中断**

之前在[正确终止与恢复线程](/zhuanlan/java/concurrency/6/7.html)一文中介绍了使用Thread类的interrupt方法和使用标志位实现线程的终止。由于之前只是简单介绍了jdk默认中断方法的问题，对线程的中断机制没有深入介绍。为了正确终止线程，深刻理解线程中断的本质是很有必要的。Java没有提供可抢占的安全的中断机制，但是Java提供了线程协作机制（之前说的interrupt方法和标志位本质上都属于线程之间协作的手段），但是提供了中断机制，中断机制允许一个线程终止另一个线程的当前工作，所以需要在程序设计的时候考虑到中断的位置和时机。

回到之前使用volatile类型的标志位来终止线程的例子，在代码中调用cancel方法来取消i的自增请求，如果Runner线程在下次执行，或者正要执行下一次自增请求时判断on的时是否变为了false，如果是则终止执行。

根据运行结果，Runner的计数任务最终会被取消，然后退出。在Runner线程最终取消执行之前，会有一定的时间，如果在在这个时间内，调用此方法的任务调用了一个会阻塞的方法，比如BlockingQueue的put方法，那么可能该任务一直违法检测到on的值变为false，因而Runner线程不会终止。

**一个例子**

比如下面的代码就说明了这一点：

```java
package com.ddkk.patchwork.concurrency.r0411;
import java.math.BigInteger;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-11.
 */
public class BrokenShutdownThread extends Thread {
    //是否继续运行的标志
    private static volatile boolean on = true;
    //阻塞队列
    private final BlockingQueue<BigInteger> queue;
    public BrokenShutdownThread(BlockingQueue<BigInteger> queue) {
        this.queue = queue;
    }
    public void run() {
        try {
            BigInteger p = BigInteger.ONE;
            while (on) {
                //生产者一次可以放40个数
                for (int i = 0; i < 40; i++){
                    queue.put(p = p.nextProbablePrime());
                    System.out.println(Thread.currentThread().getName() + ": put value " + p);
                }
            }
        } catch (InterruptedException e) {}
    }
    public void cancel() {
        on = false;
    }
    /**
     * 消费者线程
     */
    static class Consumer extends Thread{
        //阻塞队列
        private final BlockingQueue<BigInteger> queue;
        public Consumer(BlockingQueue<BigInteger> queue) {
            this.queue = queue;
        }
        @Override
        public void run() {
            try {
                while (on) {
                    //消费者一次只能消费1个数
                    System.out.println(Thread.currentThread().getName() + ": get value " + queue.take());
                }
                System.out.println("work done!");
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
    public static void main(String[] args) throws InterruptedException {
        BlockingQueue<BigInteger> queue = new LinkedBlockingQueue<>(5);
        BrokenShutdownThread producer = new BrokenShutdownThread(queue);
        //启动计数线程
        producer.start();
        TimeUnit.SECONDS.sleep(1);
        new Consumer(queue).start();
        TimeUnit.SECONDS.sleep(1);
        producer.cancel();
    }
}
```

运行上面的程序，发现虽然控制台输出了`work done!`的信息，但是程序仍然没有停止，仔细分析就会发现生产者的速度（40个数/次）远大于消费者的速度（1个数/次），造成队列被填满，put方法被阻塞。虽然在运行一秒后调用cancel方法将volatile变量on设为了false，但是由于生产者线程的put方法被阻塞，所以无法从阻塞的put方法中恢复，自然程序就无法终止了。

**重新认识中断**

每个线程都有一个boolean类型的中断状态。当中断线程时，中断状态被设为true。通过Thread的三个方法可以进行不同的中断操作：

```java
public void interrupt() {
    ...}
public static boolean interrupted() {
    ...}
public boolean isInterrupted() {
    ...}
```

执行interrupt方法能够中断线程，interrupted可以清除线程的中断状态，isInterrupted方法可以返回当前线程的中断状态。

当线程调用会阻塞的方法，比如wait()、sleep()等方法时，线程会检查自己的中断状态，并且在发生中断时提前返回。这些阻塞的方法响应中断的操作是**清除中断状态，抛出InterruptedException**。抛出InterruptedException的作用是表示线程由于中断需要提前结束。调用interrupt方法执行中断的本质是**调用interrupt方法并不会立即停止目标线程正在执行的工作，只是传递了请求中断的消息。然后线程会在下一个时刻中断自己**。当收到中断请求时抛出InterruptedException，让线程有选择中断策略的自由。一般而言，调用代码需要对抛出的InterruptedException进行额外的处理，直接屏蔽该异常是不正确的（也就是直接调用printStackTrace()方法）。屏蔽中断异常的后果是调用栈的上层无法对中断请求做出响应。

**对上面代码的修正**

根据以上的分析只需要对代码做如下的修改就能正确终止线程：

```java
public void run() {
        try {
            BigInteger p = BigInteger.ONE;
            while (on && !Thread.currentThread().isInterrupted()) {
                //生产者一次可以放40个数
                for (int i = 0; i < 40; i++){
                    queue.put(p = p.nextProbablePrime());
                    System.out.println(Thread.currentThread().getName() + ": put value " + p);
                }
            }
        } catch (InterruptedException e) {
            //让线程退出
            return;
        }
    }
    public void cancel() {
        on = false;
        interrupt();
    }
static class Consumer extends Thread{
        //阻塞队列
        private final BlockingQueue<BigInteger> queue;
        public Consumer(BlockingQueue<BigInteger> queue) {
            this.queue = queue;
        }
        @Override
        public void run() {
            try {
                while (on && !Thread.currentThread().isInterrupted()) {
                    //消费者一次只能消费1个数System.out.println(Thread.currentThread().getName() + ": get value " + queue.take());
                }
                System.out.println("work done!");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
```

而其他代码保持不变，再次运行以上的程序，发现能够正确终止了。主要就是使用中断机制完成了线程之间的协作，从而达到正确终止线程的目的。

实际上在调用可阻塞的方法时抛出的InterruptedException是为了让调用者能够注意到中断信息，使得调用者可以就中断做出自己的操作。往往在将中断信息传给调用者之前需要执行其他操作，如果在线程中使用中断机制完成线程之间的协作，那么就应该调用`Thread.currentThread().intrrupt()恢复当前线程的中断状态`，这样当前线程就能够继续其他操作了。正常情况下，都需要对中断进行响应，除非自己实现了中断所应该进行的操作。

为了取消线程的执行，除了之前的方法，还可以使用Future.get(Long time,TimeUnit unit)的带超时限制的方法取消线程的执行，如果没有在指定的时间内完成任务，那么可以在代码中直接调用Future.cancel()方法取消任务的执行。取消任务的时候有两种情况：一是任务在指定的时间完成了，这个时候调用取消操作没有什么影响；二是任务没有在指定的时间完成，那么调用cancel方法后任务将被中断。

伪代码如下：

```java
Future task = threadPool.submit(runnable);
try{
}catch(TimeOutException e){
    //会取消任务的执行
}catch(ExecutionException e){
    //如果在任务中抛出了执行异常，则重新抛出该异常
    throw(new Throwable(e.getCause()));
}finally{
    //true表示正在执行的任务能够接收中断，如果在执行则线程能被中断
    //如果为false，则表示若任务还没有启动则不要启动该任务
    task.cancel(true);
}
```

**实现线程取消的完整例子**

这里以日志服务作为例子，业务场景是这样的：前台会有多个生产者调用日志服务输出程序的日志，生产者将需要输出的日志信息放入一个队列中，后台服务器有一个消费者线程，负责从队列中取出日志信息并输出（目的地可能不同）。显然这是一个典型的生产者-消费者问题，不过这里出现了多个生产者，但是只有一个消费者。显然如果生产者的速度远远大于消费者的处理速度的话，很可能造成阻塞，不过这点已经再上面的分析中得到了解决。现在需要实现的是，提供可靠的关闭日志服务的方法，在前台调用服务接口可以正确停止日志服务，而不会出现任何问题。

实现代码如下：

```java
package com.ddkk.patchwork.concurrency.r0411;
import java.io.PrintWriter;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-11.
 */
public class LoggerService {
    // 存放日志消息的阻塞队列
    private final BlockingQueue<String> logQueue;
    // 打印日志的消费者线程
    private final LoggerThread loggerThread;
    // 打印日志的打印器
    private PrintWriter writer;
    // 日志服务是否关闭的标志
    private boolean isShutdown;
    // 执行log方法的调用者的计数器
    private int reservations;
    public LoggerService(PrintWriter writer) {
        this.logQueue = new LinkedBlockingQueue<>(5);
        this.loggerThread = new LoggerThread(writer);
    }
    /**
     * 启动日志服务
     */
    public void start() {
        loggerThread.start();
    }
    /**
     * 记录日志
     *
     * @param msg
     * @throws InterruptedException
     */
    public void recordLog(String msg) throws InterruptedException {
        // 有条件保持对日志的添加
        // 并且在接收到关闭请求时停止往队列中填入日志
        synchronized (this) {
            if (isShutdown) throw new IllegalStateException("LoggerService is shutdown!");
            ++reservations;
        }
        // 由生产者将消息放入队列
        // 这里不放入synchronized块是因为put方法有阻塞的作用
        logQueue.put(msg);
    }
    /**
     * 停止日志服务
     */
    public void stop() {
        // 以原子方式检查关闭请求
        synchronized (this) {
            isShutdown = true;
        }
        // 让消费者线程停止从队列取日志
        loggerThread.interrupt();
    }
    /**
     * 消费者线程
     */
    private class LoggerThread extends Thread {
        private PrintWriter writer;
        public LoggerThread(PrintWriter writer) {
            this.writer = writer;
        }
        @Override
        public void run() {
            try {
                while (true) {
                    try {
                        // 持有的锁与之前的相同
                        // 如果接收到应用程序的关闭请求并且没有生产者线程继续往队列填入日志
                        // 那么就结束循环，消费者线程终止
                        synchronized (LoggerService.this) {
                            if (isShutdown && reservations == 0) break;
                        }
                        // 从队列获取生产者的日志
                        String msg = logQueue.take();
                        // 每输出一条日志就减少一个线程
                        synchronized (LoggerService.this) {
                            --reservations;
                        }
                        writer.println("Read: " + msg);
                    } catch (InterruptedException e) {
                        //恢复中断状态
                        Thread.currentThread().interrupt();
                    }
                }
            } finally {
              writer.close();
            }
        }
    }
    /**
     * 生产者线程
     */
    private static class LoggerWriter implements Runnable {
        private LoggerService service;
        private final DateFormat format = new SimpleDateFormat("HH:mm:ss");
        public LoggerWriter(LoggerService service) {
            this.service = service;
        }
        @Override
        public void run() {
            try {
                String msg = "time is " + format.format(new Date());
                System.out.println("Write: " + msg);
                service.recordLog(msg);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
    public static void main(String[] args) throws InterruptedException {
        LoggerService service = new LoggerService(new PrintWriter(System.out));
        //创建多个生产者线程负责创建日志
        for (int i = 0; i < 5; i++) {
            new Thread(new LoggerWriter(service)).start();
            TimeUnit.SECONDS.sleep(1);
        }
        //启动日志服务
        service.start();
        //休眠10秒
        TimeUnit.SECONDS.sleep(10);
        //关闭日志服务
        service.stop();
    }
}
```

**小结**

**1、** Java没有提供抢占式安全终止线程的机制，但是使用线程的中断机制可以很好实现线程的终止；

**2、** 除了标志位使用FutureTask和Executor框架也能实现线程的终止，这里主要使用的是FutureTask的cancel方法；

**3、** 除非在程序中自己实现中断策略，不然不要对中断异常进行屏蔽；

**4、** 抛出InterruptedException的目的可以使得上层调用者可以接收中断信息，并对中断做出自己的操作；

**5、** 如果需要在将中断信息传递给上层调用者之前做其他的操作，需要调用`Thread.currentThread().interrupt()`恢复当前线程的中断状态；

**6、** 如果使用线程池执行任务，那么可以时使用其shutdown方法或者shutdownNow方法完成线程的终止；
