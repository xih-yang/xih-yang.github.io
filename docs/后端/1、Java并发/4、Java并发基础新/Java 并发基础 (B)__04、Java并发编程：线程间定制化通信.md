# 04、Java并发编程：线程间定制化通信
- 来源：https://ddkk.com/zhuanlan/java/concurrency/4/24.html
- 分类：Java并发
- 分组：Java 并发基础 (B)
## 4.1 案例分析

其实代码写起来也没什么特别的，就是condition.signal()可以唤醒指定的线程。看代码就知道怎么写了，不是以参数的方式来写的哦～

代码：

```java
package communicate;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
public class ThreadDemo3 {
    public static void main(String[] args) {
        Share3 share3 = new Share3();
        new Thread(()->{
            for(int i = 0; i < 10; i++) {
                try{
                    share3.printAA();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }, "AA").start();
        new Thread(()->{
            for(int i = 0; i < 10; i++) {
                try{
                    share3.printBB();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }, "BB").start();
        new Thread(()->{
            for(int i = 0; i < 10; i++) {
                try{
                    share3.printCC();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }, "CC").start();
    }
}
class Share3 {
    private int flag = 1;
    private Lock lock = new ReentrantLock();
    private Condition condition1 = lock.newCondition();
    private Condition condition2 = lock.newCondition();
    private Condition condition3 = lock.newCondition();
    public void printAA() throws InterruptedException {
        lock.lock();
        try {
            while(flag != 1) {
                condition1.await();
            }
            for(int i = 0; i < 5; i++) {
                System.out.println(Thread.currentThread().getName());
            }
            flag = 2;
            condition2.signal();
        }
        finally {
            lock.unlock();
        }
    }
    public void printBB() throws InterruptedException {
        lock.lock();
        try {
            while(flag != 2) {
                condition2.await();
            }
            for(int i = 0; i < 10; i++) {
                System.out.println(Thread.currentThread().getName());
            }
            flag = 3;
            condition3.signal();
        }
        finally {
            lock.unlock();
        }
    }
    public void printCC() throws InterruptedException {
        lock.lock();
        try {
            while(flag != 3) {
                condition3.await();
            }
            for(int i = 0; i < 15; i++) {
                System.out.println(Thread.currentThread().getName());
            }
            flag = 1;
            condition1.signal();
        }
        finally {
            lock.unlock();
        }
    }
}
```
