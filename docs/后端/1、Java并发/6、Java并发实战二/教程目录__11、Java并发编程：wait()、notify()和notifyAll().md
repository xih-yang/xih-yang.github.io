# 11、Java并发编程：wait()、notify()和notifyAll()
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/11.html
- 分类：Java并发
- 分组：教程目录
一个线程修改一个对象的值，而另一个线程则感知到了变化，然后进行相应的操作，这就是wait()、notify()和notifyAll()方法的本质。具体体现到方法上则是这样的：一个线程A调用了对象obj的wait方法进入到等待状态，而另一个线程调用了对象obj的notify()或者notifyAll()方法，线程A收到通知后从对象obj的wait方法返回，继续执行后面的操作。

可以看到以上两个线程通过对象obj进行操作，而wait和notify/notifyAll的关系就像开关信号一样，用来完成等待方和通知方之间的交互工作。

下面的代码演示了这个过程：分别创建一个等待线程和一个通知线程，前者检查flag的值是否为false，如果符合要求就进行后续的操作，否则在lock上等待。后者在睡眠一段时间后对lock进行通知，等待线程这样就可以从wait方法返回了

```java
package com.ddkk.concurrency;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-2.
 */
public class WaitNotifyThread {
    //条件是否满足的标志
    private static boolean flag = true;
    //对象的监视器锁
    private static Object lock = new Object();
    //日期格式化器
    private static DateFormat format = new SimpleDateFormat("HH:mm:ss");
    public static void main(String[] args){
        Thread waitThread = new Thread(new WaitThread(),"WaitThread");
        waitThread.start();
        SleepUtil.second(1);
        Thread notifyThread = new Thread(new NotifyThread(),"NotifyThread");
        notifyThread.start();
    }
    /**
     * 等待线程
     */
    private static class WaitThread implements Runnable{
        public void run() {
            //加锁，持有对象的监视器锁
            synchronized (lock){
                //只有成功获取对象的监视器才能进入这里
                //当条件不满足的时候，继续wait，直到某个线程执行了通知
                //并且释放了lock的监视器（简单来说就是锁）才能从wait
                //方法返回
                while (flag){
                    try {
                        System.out.println(Thread.currentThread().getName() + " flag is true,waiting at "
                                + format.format(new Date()));
                        lock.wait();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
                //条件满足，继续工作
                System.out.println(Thread.currentThread().getName() + " flag is false,running at "
                        + format.format(new Date()));
            }
        }
    }
    /**
     * 通知线程
     */
    private static class NotifyThread implements Runnable{
        public void run() {
            synchronized (lock){
                //获取lock锁，然后执行通知，通知的时候不会释放lock锁
                //只有当前线程退出了lock后，waitThread才有可能从wait返回
                System.out.println(Thread.currentThread().getName() + " holds lock. Notify waitThread at "
                        + format.format(new Date()));
                lock.notifyAll();
                flag = false;
                SleepUtil.second(5);
            }
            //再次加锁
            synchronized (lock){
                System.out.println(Thread.currentThread().getName() + " holds lock again. NotifyThread will sleep at "
                        + format.format(new Date()));
                SleepUtil.second(5);
            }
        }
    }
}
```

以上代码的输出结果为：

其实使用wait、notify/notifyAll很简单，但是仍然需要注意以下几点：

**1、****使用wait()、notify()和notifyAll()时需要首先对调用对象加锁**；

**2、****调用wait()方法后，线程状态会从RUNNING变为WAITING，并将当线程加入到lock对象的等待队列中**；

**3、****调用notify()或者notifyAll()方法后，等待在lock对象的等待队列的线程不会马上从wait()方法返回，必须要等到调用notify()或者notifyAll()方法的线程将lock锁释放，等待线程才有机会从等待队列返回这里只是有机会，因为锁释放后，等待线程会出现竞争，只有竞争到该锁的线程才会从wait()方法返回，其他的线程只能继续等待**；

**4、****notify()方法将等待队列中的一个线程移到lock对象的同步队列，notifyAll()方法则是将等待队列中所有线程移到lock对象的同步队列，被移动的线程的状态由WAITING变为BLOCKED**；

**5、****wait()方法上等待锁，可以通过wait(longtimeout)设置等待的超时时间**；

上一篇文章还有正确恢复线程的问题需要解决，因为通过使用wait()、notify()和notifyAll()可以很好恢复与挂起线程，下面是改进的代码：

```java
package com.ddkk.concurrency;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.TimeUnit;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-2.
 */
public class SafeResumeAndSuspendThread {
    private static DateFormat format = new SimpleDateFormat("HH:mm:ss");
    //对象锁
    private static Object lock = new Object();
    public static void main(String[] args) throws InterruptedException {
        Runner r = new Runner();
        Thread runThread = new Thread(r,"CountThread");
        runThread.start();
        //主线程休眠一会，让CountThread有机会执行
        TimeUnit.SECONDS.sleep(2);
        for (int i = 0; i < 3; i++){
            //让线程挂起
            r.suspendRequest();
            //让计数线程挂起两秒
            TimeUnit.SECONDS.sleep(2);
            //看看i的值
            System.out.println("after suspend, i = " + r.getValue());
            //恢复线程的执行
            r.resumeRequest();
            //线程休眠一会
            TimeUnit.SECONDS.sleep(1);
        }
        //退出程序
        System.exit(0);
    }
    /**
     * 该线程是一个计数线程
     */
    private static class Runner implements Runnable{
        //变量i
        private volatile long i;
        //是否继续运行的标志
        //这里使用volatile关键字可以保证多线程并发访问该变量的时候
        //其他线程都可以感知到该变量值的变化。这样所有线程都会从共享
        //内存中取值
        private volatile boolean suspendFlag;
        public void run() {
            try {
                suspendFlag = false;
                i = 0;
                work();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        private void work() throws InterruptedException {
            while (true){
                //只有当线程挂起的时候才会执行这段代码
                waitWhileSuspend();
                i++;
                System.out.println("calling work method, i = " + i);
                //只有当线程挂起的时候才会执行这段代码
                waitWhileSuspend();
                //休眠1秒
                TimeUnit.SECONDS.sleep(1);
            }
        }
        /**
         * 忙等待
         * @throws InterruptedException
         */
        private void waitWhileSuspend() throws InterruptedException {
            /*while (suspendFlag){
                TimeUnit.SECONDS.sleep(1);
            }*/
            /**
             * 等待通知的方式才是最佳选择
             */
            synchronized (lock){
                while (suspendFlag){
                    System.out.println(Thread.currentThread().getName() + " suspend at " + format.format(new Date()));
                    lock.wait();
                }
            }
        }
        //让线程终止的方法
        public void resumeRequest(){
            synchronized (lock){
                try {
                    suspendFlag = false;
                    System.out.print("after call resumeRequest method, i = " + getValue() + ". ");
                    lock.notifyAll();
                    TimeUnit.SECONDS.sleep(1);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
        public void suspendRequest(){
            suspendFlag = true;
            System.out.print("after call suspendRequest method, i = " + getValue() + ". ");
        }
        public long getValue(){
            return i;
        }
    }
}
```

代码的执行结果如下：

可以看到不管是挂起还是恢复，得到的结果都是正确的，在使用等待/通知机制实现的时候，需要注意必须使用同一个lock对象作为两个线程沟通的桥梁，由于synchronized关键字的可重入性（这点后面还会提到），保证了整个程序的正常执行。

**总结：正确挂起和恢复线程的方法是使用boolean变量做为标志位，能够在合适的时间和位置正确恢复与挂起线程。**
