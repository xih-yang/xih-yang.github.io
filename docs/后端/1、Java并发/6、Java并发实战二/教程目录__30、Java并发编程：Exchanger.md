# 30、Java并发编程：Exchanger
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/30.html
- 分类：Java并发
- 分组：教程目录
**Exchanger是一个线程间交换数据的工具类。**

Exchanger从字面上可以理解为交换者，是一个可以用于线程间协作的工具类。主要用于线程间的数据交换。Exchanger提供一个同步点，在这个同步点上，两个线程可以交换彼此的数据。这两个线程可以通过exchange方法交换数据，当然存在线程执行不同步的情况，如果第一个线程先到达同步点，那么在第二个线程到达同步点之前，第一个线程会阻塞等待，直到两个线程都到达同步点，两个线程就可以使用exchange方法交换彼此的数据。

Exchanger可以用于遗传算法得到不同的交配结果。也可以用于校验数据，比如有两个会计师进行账目的对账工作，为了防止出错，系统可以将这两个会计师对账的结果进行比对，从而检查结果是否一致。下面的代码演示了这个场景：

```java
package com.ddkk.patchwork.concurrency.r0407;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.Exchanger;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-7.
 */
public class ExchangerDemo {
    /**
     * 交换器
     */
    private static final Exchanger<String> exchanger = new Exchanger<>();
    /**
     * 线程池
     */
    private static ExecutorService threadPool = Executors.newFixedThreadPool(2);
    /**
     *
     */
    private static final DateFormat format = new SimpleDateFormat("HH:mm:ss");
    /**
     * 主线程
     * @param args
     */
    public static void main(String[] args){
        //第一个会计师进行对账
        threadPool.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    String resA = "A's result";
                    //调用exchange方法表示当前线程已经到达了同步点
                    exchanger.exchange(resA);
                    System.out.println(Thread.currentThread().getName() + " arrives at syncPoint at "
                            + format.format(new Date()));
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });
        //第二个会计师进行对账
        threadPool.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    String resB = "B's result";
                    String resF = exchanger.exchange(resB);
                    System.out.println(Thread.currentThread().getName() + " arrives at syncPoint at " 
                        + format.format(new Date()));
                    System.out.println("Is the data consistent？" + resF.equals(resB)
                        + ". A:" + resF + ", B:" + resB + " at " + format.format(new Date()));
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });
        //关闭线程池
        threadPool.shutdown();
    }
}
```

代码执行的结果如下：

程序中如果有一个线程没有到达同步点，则会一直等待，如果不希望一直等待可以使用指定等待时间的exchange(V x,long timeout,TimeUnit unit)指定最长的等待时间。
