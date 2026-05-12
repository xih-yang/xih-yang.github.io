# 13、Java并发编程：过早的通知
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/13.html
- 分类：Java并发
- 分组：教程目录
**等待通知机制**

在前面介绍了等待通知机制，并使用该机制实现了消费者-生产者模式。我们知道，一个因为调用wait的线程会进入等待队列，当有其他的线程通知的时候才会从等待队列中返回，线程状态会变为RUNNABLE。但是，反过来说，如果一个线程从wait方法中返回，是不是就一定意味着线程等待的条件满足了呢？答案是否定的。考虑这样的场景：比如两个人的手机铃声是一样的（音量和类型），那么当两个手机同时响的时候，就不能正确判断哪个响的手机是自己的。而且线程从wait方法返回完成可能是意外导致的。

从线程的角度分析，每次调用wait方法的前提必然是首先获得了锁，然后会因为某个等待条件去调用wait方法，调用wait方法的时候会释放锁的持有。那么，当线程重新进入的调用wait方法的代码时，等待的条件就不一定满足了，那么继续往下执行就会出现错误的结果。比如，在执行notify通知的线程调用notify方法时，等待的条件是成立的，但是当线程重新获得锁的时候等待条件却是假的。出现这种情况的根源在于从调用notify进行唤醒并释放锁，到线程重新获取锁的这个时间内，如果有其他线程修改了等待条件，这种情况就出现了。

以上的现象称为“过早的通知”，为了更好理解这种现象，看看下面的代码就知道了：

```java
package com.ddkk.patchwork.concurrency.r0414;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-14.
 */
public class EarlySignalDemo {
    //元素列表
    private List<String> list;
    //日期格式器
    private static final DateFormat format = new SimpleDateFormat("HH:mm:ss");
    //计数器
    private AtomicLong number = new AtomicLong();
    public EarlySignalDemo() {
        list = new ArrayList<>();
    }
    //对list执行删除的元素
    public void remove() throws InterruptedException {
        synchronized (list){
            if (list.isEmpty()){
                //只要list为空，那么调用此方法的线程必须等待
                list.wait();
            }
            //如果执行到这里，说明list已经不为空了
            //这样执行元素的删除操作才不会出错
            String item = list.remove(0);
            System.out.println(Thread.currentThread().getName() + ": remove element " + item + "! "
                + format.format(new Date()));
        }
    }
    //对list执行添加操作
    public void add(){
        synchronized (list){
            //添加元素不要进行判断
            list.add(""+ number.incrementAndGet());
            System.out.println(Thread.currentThread().getName() + ": add item " + number.get()
                + " " +format.format(new Date()));
            list.notifyAll();
        }
    }
    static class AddThread implements Runnable{
        private EarlySignalDemo es;
        public AddThread(EarlySignalDemo es) {
            this.es = es;
        }
        @Override
        public void run() {
            try {
                TimeUnit.MILLISECONDS.sleep(600);
                es.add();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
    static class RemoveThread implements Runnable{
        private EarlySignalDemo es;
        public RemoveThread(EarlySignalDemo es) {
            this.es = es;
        }
        @Override
        public void run() {
            try {
                TimeUnit.MILLISECONDS.sleep(100);
                es.remove();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
    public static void main(String[] args){
        EarlySignalDemo es = new EarlySignalDemo();
        for (int i = 0; i < 3; i++){
            new Thread(new RemoveThread(es),"RemoveThread" + i).start();
        }
        new Thread(new AddThread(es),"AddThread").start();
    }
}
```

运行的结果如下：

程序出现了数组下标越界的错误，简单计算一下，3个RemoveThread的等待时间之和是300毫秒，而AddThread需要600毫秒之后才会执行，所以在600毫秒之前，所有的RemoveThread都因为等待条件list为空陷入等待，进入等待队列中。当执行到600毫秒的时候，唤醒全部的RemoveThread，从wait返回的RemoveThread不会重新判断list的等待条件，这样造成的后果就是三个RemoveThread同时删除list中的一个元素，自然就会出现下标越界错误了。也正是3个RemoveThread在被唤醒到重新获得锁的期间等待条件被修改了，导致出现了错误的结果。

更正的办法就是把remove方法中对list是否为空的判断改为while循环就可以了。

**小结**

当使用条件等待时，往往需要对等待条件进行循环测试，避免过早的通知。
