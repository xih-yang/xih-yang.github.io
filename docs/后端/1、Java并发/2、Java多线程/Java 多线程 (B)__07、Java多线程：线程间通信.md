# 07、Java多线程：线程间通信
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/21.html
- 分类：Java并发
- 分组：Java 多线程 (B)
## 6.1 等待/通知机制

概念：A线程在运行时需要某个地址中的值，但是该地址还没有值，所以A等待。当B线程往该地址处写入了值后，B线程通知A线程，于是A线程继续执行。上面这样的一个过程就是等待/通知机制。

实现：

Object类中的wait()方法，可以使执行当前代码的线程等待，暂停执行。直到接到通知或被中断为止。注意：wait()方法只能在同步代码块中由锁对象调用，且调用wait()方法后，当前线程会释放锁。

Object类的notify()方法可以唤醒处于等待的线程，该方法也必须在同步代码块中由锁对象调用。如果有多个等待的线程，notify()只能唤醒其中一个，具体唤醒哪一个是不知道的。被notify()的线程需要重新去竞争锁才能被执行。

没有使用锁对象就调用wait()/notify()方法会产生异常：IllegalMonitorStateException。

wait()代码实例：

```java
package wait;
public class Test01 {
    public static void main(String[] args) throws InterruptedException {
        String test = "abc";
        String another = "def";
        System.out.println("同步代码块前的代码");
        synchronized (test) {
            try {
                System.out.println("wait前的代码");
//                another.wait();  只有被锁住的对象才能调用wait()方法
                test.wait();
                System.out.println("wait后的代码");
            } catch (IllegalMonitorStateException e) {
                e.printStackTrace();
            }
        }
        System.out.println("同步代码块后的代码");
    }
}
```

wait()/notify()代码示例：

```java
package wait;
/**
 * 需要通过notify唤醒线程
 */
public class Test02 {
    public static void main(String[] args) {
        String str = "wa";
        Thread thread1 = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (str) {
                    System.out.println("线程1开始等待");
                    try {
                        str.wait();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    System.out.println("线程1被唤醒并执行结束了");
                }
            }
        }, "Thread1");
        Thread thread2 = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (str) {
                    System.out.println("线程2唤醒线程1");
                    str.notify();
                }
            }
        }, "Thread2");
        thread1.start();
        thread2.start();
    }
}
```

执行了notify()的线程并不会立即释放锁，而是执行完同步代码块的所有代码后才会释放锁

interrupt()方法会中断wait()：

当线程调用wait()处于等待状态时，调用线程对象的interrupt()方法会中断线程的等待状态，产生InterruptedException异常。

```java
package wait;
import java.util.concurrent.TimeUnit;
/**
 * interrupt()会中断线程的wait状态
 */
public class Test04 {
    public static void main(String[] args) throws InterruptedException {
        SubThread subThread = new SubThread();
        subThread.start();
        TimeUnit.SECONDS.sleep(1);
        subThread.interrupt();
    }
    private static final Object lock = new Object();
    static class SubThread extends Thread {
        @Override
        public void run() {
            synchronized (lock) {
                System.out.println("subThread wait");
                try {
                    lock.wait();
                } catch (InterruptedException e) {
                    System.out.println("wait等待被中断了");
                }
                System.out.println("subThread end wait");
            }
        }
    }
}
```

notify()和notifyAll()的区别：

notify()只能唤醒一个线程，如果有多个线程处于等待状态，那么只能会有一个会被唤醒。notifyAll()可以唤醒所有等待的线程。

wait(long)的使用：

如果在指定时间内没有被唤醒，那么线程会自动唤醒。

```java
package wait;
public class Test06 {
    public static void main(String[] args) {
        SubThread subThread = new SubThread();
        subThread.start();
    }
    static final Object lock = new Object();
    static class SubThread extends Thread{
        @Override
        public void run() {
            synchronized (lock) {
                try {
                    System.out.println("开始等待");
                    lock.wait(5000);
                    System.out.println("等待结束");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```

## 6.2 生产者-消费者模式

在Java中，负责生产数据的是生产者，负责使用数据的是消费者。没有数据时，消费者等待；数据满时，生产者等待。

```java
package producerdata;
public class ValueOP {
    private String value = "";
    //定义方法修改value字段的值
    public void setValue() throws InterruptedException {
        //如果value不是空串
        synchronized (this) {
            while(!value.equalsIgnoreCase("")) {
                this.wait();
            }
            //是空串
            value = System.currentTimeMillis() + "";
            System.out.println("setValue设置的值是：" + value);
            this.notify();
        }
    }
    //定义方法读取字段值
    public String getValue() throws InterruptedException {
        synchronized (this) {
            while(value.equalsIgnoreCase("")) {
                this.wait();
            }
            //不是空串，读取值
            System.out.println("value的值是：" + value);
            value = "";
            this.notify();
        }
        return value;
    }
}
```

假设只有一个生产者和消费者：那么生产者和消费者将按顺序执行。

如果有多个生产者和消费者，那么可能出现假死现象：

**1、** 一个消费者唤醒了一个生产者，但是在这个生产者拿到锁之前，另一个消费者抢先拿到了锁；

**2、** 三个生产者全部等待，某个消费者唤醒的不是生产者，而是另一个消费者；

解决上述假死现象的方法是：将notify()改成notifyAll()，保证消费者唤醒了生产者，生产者唤醒了消费者。

操作栈：

```java
package producerstack;
import java.util.List;
import java.util.ArrayList;
public class MyStack {
    private List<Integer> list = new ArrayList<>();
    private static final int MAX_SIZE = 2;
    //定义方法模拟入栈
    public synchronized void push(int value) throws InterruptedException {
        //当栈中的数据已满，等待
        while(list.size() >= MAX_SIZE) {
            System.out.println(Thread.currentThread().getName() + " begin wait...");
            this.wait();
        }
        list.add(value);
        this.notifyAll();
        System.out.println(Thread.currentThread().getName() + "添加了数据：" + value);
    }
    //定义方法模拟出栈
    public synchronized void pop() throws InterruptedException {
        //当栈中的数据为空，等待
        while(list.size() == 0) {
            System.out.println(Thread.currentThread().getName() + " begin wait...");
            this.wait();
        }
        this.notifyAll();
        System.out.println(Thread.currentThread().getName() + "拿到了数据：" + list.remove(0));
    }
}
```

## 6.3 通过管道实现线程间通信

Java.io包的PipeStream管道流用于在线程之间传递数据，一个线程通过管道输出数据，另一个线程从管道中输入数据。相关类包括PipedInputStream、PipedOutputStream、PipedReader和PipedWriter。

```java
package pipeStream;
import java.io.IOException;
import java.io.PipedInputStream;
import java.io.PipedOutputStream;
import java.nio.charset.StandardCharsets;
/**
 * 使用PipedInputStream和PipedOutputStream在线程间传递字节流
 */
public class Test {
    public static void main(String[] args) throws IOException {
        //定义管道字节流
        PipedInputStream in = new PipedInputStream();
        PipedOutputStream out = new PipedOutputStream();
        //建立管道之间的关系
        in.connect(out);
        //创建两个线程，分别往管道里写数据，和读数据
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    writeData(out);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }, "Thread1").start();
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    readData(in);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }, "Thread2").start();
    }
    //向管道流中写入数据
    public static void writeData(PipedOutputStream out) throws IOException {
        //分别把0～100的数据写入管道
        try {
            for(int i = 0; i <= 10000; i++) {
                out.write(("" + i).getBytes(StandardCharsets.UTF_8));  //把字节数组写入到输出管道流中
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            out.close();
        }
    }
    //从管道流中读取数据
    public static void readData(PipedInputStream in) throws IOException {
        int count = 0;
        byte[] bytes = new byte[1024];
        int len = 0;
        try {
            while((len = in.read(bytes)) != -1) {
                System.out.println(new String(bytes, 0, len));
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            in.close();
        }
    }
}
```

## 6.4 ThreadLocal

除了控制资源的访问外，还可以通过增加资源来保证线程安全。ThreadLocal主要解决为每个线程绑定自己的值的问题。

在以下这个代码示例中我们发现，如果多个线程共用一个SimpleDateFormat对象的话，实际运行下来会出现问题。但是通过ThreadLocal，我们为每个线程分别创建了一个SimpleDateFormat，就不会出现什么问题了。

```java
package threadlocal;
import sun.java2d.pipe.SpanShapeRenderer;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
/**
 * 在多线程环境中，将字符串转换为日期对象。发现多个线程使用同一个SimpleDateFormat对象产生了线程安全问题，有的线程报了错误
 */
public class Test2 {
    //定义SimpleDataFoemat对象，可以将字符串转换为日期
    //发现多个线程使用同一个SimpleDateFormat对象，会产生线程安全问题
//    private static SimpleDateFormat sdf = new SimpleDateFormat("yyyy年MM月dd日 HH:mm:ss");
    //使用ThreadLocal，为每个线程创建一个SimpleDateFormat
    static ThreadLocal<SimpleDateFormat> threadLocal = new ThreadLocal<>();
    //定义Runnable接口的实现类
    static class ParseDate implements Runnable {
        private int i = 0;
        public ParseDate(int i) {
            this.i = i;
        }
        @Override
        public void run() {
            String text = "2068年11月22日 08:22:" + i % 60;   //构建日期字符串
            try {
                if(threadLocal.get() == null) {
                    SimpleDateFormat sdf = new SimpleDateFormat("yyyy年MM月dd日 HH:mm:ss");
                    threadLocal.set(sdf);
                }
                SimpleDateFormat sdf = threadLocal.get();
                Date date = sdf.parse(text);
                System.out.println(i + "--" + date);
            } catch (ParseException e) {
                e.printStackTrace();
            }
        }
    }
    public static void main(String[] args) {
        //创建100个线程
        for(int i = 0; i < 100; i++) {
            new Thread(new ParseDate(i)).start();
        }
    }
}
```

ThreadLocal指定初始值：

定义ThreadLocal的子类，在子类中重写initialValue()方法指定初始值

```java
package threadlocal;
import java.util.Date;
import java.util.concurrent.TimeUnit;
/**
 *
 * ThreadLocal初始值
 */
public class Test3 {
    static class SubThreadLocal extends ThreadLocal<Date> {
        @Override
        protected Date initialValue() {
            return new Date();
        }
    }
   //定义ThreadLocal对象
    static ThreadLocal<Date> threadLocal = new SubThreadLocal();
    //定义线程类
    static class SubThread extends Thread {
        @Override
        public void run() {
            for(int i = 0; i < 10; i++) {
                //第一次调用threadLocal的get方法，会返回null
                System.out.println("----" + Thread.currentThread().getName() + " value = " + threadLocal.get());
                if(threadLocal.get() == null) {
                    System.out.println("-------");
                    threadLocal.set(new Date());
                }
                try {
                    TimeUnit.SECONDS.sleep(1);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
    }
    public static void main(String[] args) throws InterruptedException {
        SubThread t1 = new SubThread();
        t1.start();
        TimeUnit.SECONDS.sleep(1);
        SubThread t2 = new SubThread();
        t2.start();
    }
}
```
