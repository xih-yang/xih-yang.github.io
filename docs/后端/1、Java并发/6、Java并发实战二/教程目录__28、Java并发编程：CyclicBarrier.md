# 28、Java并发编程：CyclicBarrier
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/28.html
- 分类：Java并发
- 分组：教程目录
CyclicBarrier意为可循环使用的（Cyclic）屏障（Barrier），属于jdk 5新增加的并发工具，需要导入java.util.concurrent.CylicBarrier才能使用。CyclicBarrier适用于这样的场景：多线程并发执行，已经执行完的线程需要阻塞等待其他线程执行完毕，最后执行主线程的工作。听起来非常类似CountDownLatch，CyclicBarrier与CountDownLatch的区别主要在于CyclicBarrier是可循环利用的，而CountDownLatch只能使用一次。

下面使用CyclicBarrier实现上一篇文章读取文件的例子，从而演示CyclicBarrier的基本用法：

```java
package com.ddkk.concurrency.r0406;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.BrokenBarrierException;
import java.util.concurrent.CyclicBarrier;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-6.
 */
public class CyclicBarrierDemo {
    //参数3表示的是屏障拦截的线程数
    static CyclicBarrier cyclicBarrier = new CyclicBarrier(3);
    //日期格式器
    static final DateFormat format = new SimpleDateFormat("HH:mm:ss");
    public static void main(String[] args) throws BrokenBarrierException, InterruptedException {
        //第一个读取的线程
        Thread thread1 = new Thread(new Runnable() {
            public void run() {
                long start = System.currentTimeMillis();
                for (;;){
                    if (System.currentTimeMillis() - start > 1000 * 10){
                        break;
                    }
                }
                System.out.println(Thread.currentThread().getName() + " finished task at " + format.format(new Date()));
                try {
                    //调用await方法告诉CyclicBarrier我已经到达了屏障
                    cyclicBarrier.await();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } catch (BrokenBarrierException e) {
                    e.printStackTrace();
                }
            }
        },"Thread-1");
        //第二个线程开始读取
        Thread thread2 = new Thread(new Runnable() {
            public void run() {
                long start = System.currentTimeMillis();
                for (;;){
                    if (System.currentTimeMillis() - start > 1000 * 5){
                        break;
                    }
                }
                System.out.println(Thread.currentThread().getName() + " finished task at " + format.format(new Date()));
                try {
                    //表示当前线程已经到达了屏障
                    cyclicBarrier.await();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } catch (BrokenBarrierException e) {
                    e.printStackTrace();
                }
            }
        }, "Thread-2");
        System.out.println(Thread.currentThread().getName() + " start task at " + format.format(new Date()));
        thread1.start();
        thread2.start();
        //主线程调用await方法表示主线程已经到达了屏障
        cyclicBarrier.await();
        System.out.println(Thread.currentThread().getName() + " ended task at " + format.format(new Date()));
    }
}
```

运行结果如下：

可以发现与之前使用CountDownLatch的结果是一样的，唯一一点区别是CyclicBarrier的参数的意义不同，之前代码的参数是2，现在是3，因为除了两个子线程还包括主线程，而参数的本义就是屏障拦截的线程数，所以改成3也就情理之中了。另外，如果把3改成4，那么当前两个子线程和主线程都通知CyclicBarrier到达屏障后，由于没有第四个线程到达屏障，所以这三个线程都将阻塞等待，永远不会停止。

除此之外，CyclicBarrier还提供了高级的功能：`CyclicBarrier(int parties, Runnable action)`。用于在线程到达屏障后优先执行action。这个构造函数适用于处理更为复杂的业务场景。

现在为了演示这个功能，将之前的需求进行一点修改：需要并发统计每个文件的字符数，所有线程统计完毕后由另外的线程得到总字符数。

演示代码如下：

```java
package com.ddkk.concurrency.r0406;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.*;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-6.
 */
public class CyclicBarrierDemo2 implements Runnable{
    /**
     * 创建4个屏障
     * 表示4个线程并发统计文件的字符数
     * this:表示4个屏障用完后执行当前线程
     */
    private CyclicBarrier cyclicBarrier = new CyclicBarrier(4,this);
    /**
     * 日期格式器
     */
    private DateFormat format = new SimpleDateFormat("HH:mm:ss");
    /**
     * 适用线程池执行线程
     */
    private Executor executor = Executors.newFixedThreadPool(4);
    /**
     * 保存每个线程执行的结果
     */
    private Map<String,Integer> result = new ConcurrentHashMap<String, Integer>();
    /**
     * 随机数生成器
     */
    private Random random = new Random();
    /**
     * 统计方法
     */
    private void count(){
        for (int i = 0; i < 4; i++){
            executor.execute(new Runnable() {
                public void run() {
                    //计算当前文件的字符数
                    result.put(Thread.currentThread().getName(),random.nextInt(5));
                    System.out.println(Thread.currentThread().getName() + " finish task at "+ format.format(new Date()));
                    //计算完成插入屏障
                    try {
                        cyclicBarrier.await();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    } catch (BrokenBarrierException e) {
                        e.printStackTrace();
                    }
                }
            });
        }
    }
    public void run() {
        int res = 0;
        //汇总每个线程的执行结果
        for (Map.Entry<String,Integer> entry : result.entrySet()){
            res += entry.getValue();
        }
        //将结果保存到map中
        result.put("result",res);
        System.out.println("final result:" + res);
    }
    public static void main(String[] args){
        CyclicBarrierDemo2 c = new CyclicBarrierDemo2();
        c.count();
    }
}
```

运行结果如下：

之前提到CyclicBarrier的屏障可以多次使用，比如在处理复杂业务场景的时候，可以让线程重新运行一遍。除此之外，CyclicBarrier还提供了其他的方法。比如getNumberWaiting可以获得当前阻塞的线程数。isBroken用来了解阻塞的线程释放被中断。
