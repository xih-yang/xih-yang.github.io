# 03、Java多线程：线程安全问题
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/17.html
- 分类：Java并发
- 分组：Java 多线程 (B)
## 3.1 线程安全问题

非线程安全：主要是指多个线程对同一个对象的实例变量进行操作时，会出现值被更改，值不同步的问题。

线程安全：原子性、可见性、有序性

## 3.2 原子性

原子(Atomic)就是不可分割的意思。

原子操作的不可分割有两层含义：1）访问（读、写）某个共享变量的操作从其他线程来看，该操作要么已经执行完毕，要么尚未发生。即其他线程看不到当前操作的中间结果。2）访问同一组共享变量的原子操作，是不能够交叉的。

Java有两种方式实现原子性：一种是使用锁，另一种是利用处理器的CAS（Compare and Swap）指令。

锁具有排它性，保证共享变量在某一时刻只能被一个线程访问。

CAS指令直接在硬件（处理器和内存）层次上实现原子性。看作是硬件锁。

以下这段代码因为没有考虑原子性，导致这两个线程读取的num值有时候是一样的（因为num++其实是分步执行的）。

```java
package threadSafe;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
public class Test01 {
    public static void main(String[] args) {
        //启动两个线程，不断调用getNum()方法
        MyInt myInt = new MyInt();
        for(int i = 1; i <= 2; i++) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    while(true) {
                        System.out.println(Thread.currentThread().getName() + "->" + myInt.getNum());
                        try {
                            TimeUnit.MILLISECONDS.sleep(100);
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                    }
                }
            }).start();
        }
    }
    static class MyInt{
        int num;
        public int getNum() {
            return num++;
        }
    }
}
```

## 3.3 可见性

在多线程环境中，一个线程对某个共享变量进行更新后，后续其他的线程可能无法立即读取到这个更新后的结果。这是线程安全问题的另一种形式：可见性（visibility）。

如果一个线程对共享变量更新后，后续访问该变量的其他线程可以马上读到更新的结果，称这个线程对共享变量的更新对其他线程具有可见性；反之称为没有可见性。

多线程程序可能因为可见性，导致其他线程读取到了旧数据（脏数据）。

下面这段代码可能出现这种情况：在main线程中调用了myTask的cancel()方法修改toCancel为true，但是myTask线程看不到。

原因：
**1、** JIT及时编译器可能对while循环进行优化：

```java
if(!toCancel) {
    while(true) {
        doSomething();
    }
}
```

**2、** 可能与计算机的存储系统有关假设main线程和myTask线程分别运行在两个cpu上，而一个cpu不能立即读取到另一个cpu中的数据；

```java
package threadSafe;
import createThread.p1.MyThread;
import java.util.concurrent.TimeUnit;
//测试线程的可见性
public class Test02 {
    public static void main(String[] args) throws InterruptedException {
        MyTask myTask = new MyTask();
        new Thread(myTask).start();
        TimeUnit.MILLISECONDS.sleep(1000);
        myTask.cancel();
    }
    static class MyTask implements Runnable {
        private boolean toCancel = false;
        @Override
        public void run() {
            while(!toCancel) {
                doSomething();
            }
            if(toCancel) System.out.println("任务被取消");
            else System.out.println("任务正常结束");
        }
        private boolean doSomething() {
            System.out.println("执行某个任务");
            try {
                TimeUnit.MILLISECONDS.sleep(1000); //模拟任务执行需要的时间
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return true;
        }
        public void cancel() {
            toCancel = true;
        }
    }
}
```

## 3.4 有序性

有序性（Ordering）：在某种情况下，一个处理器上某个线程执行的内存访问操作，在另一个处理器上的线程看来是乱序的。

与内存操作顺序相关的概念：

- 源代码顺序：源码中指定的操作顺序
- 程序顺序：处理器上目标代码的顺序
- 执行顺序：内存访问操作在处理器上的实际操作顺序
- 感知顺序：处理器感受到该处理器和其他处理器的内存操作顺序

重排序可以分为指令重排序和存储子系统重排序：

- 指令重排序主要是由JIT编译器、处理器引起的，指程序顺序和执行顺序不一致
- 存储子系统重排序是由高速缓存、写缓冲器引起的，感知顺序与执行顺序不一致

指令重排序：

当源代码顺序和程序顺序不一致，或者程序顺序与执行顺序不一致的情况下，我们就说发生了指令重排序（Instruction Reorder）。

指令重排是一种动作，确实对指令进行了调整，重排序的对象是指令。Java编译器一般不会进行指令重排，但是JIT可能会执行这个操作。

处理器也可能执行指令重排，使得执行顺序和程序顺序不一致。

指令重排不会对单线程程序的结果产生影响，但是可能对多线程程序的结果产生影响。

存储子系统重排序：

存储子系统指的是高速缓存和写缓冲器：

- 高速缓存指的是CPU为了弥补其与主存储器处理速度不一致的问题而设置的，目的是提高CPU读取数据的速度。
- 写缓冲器，用来提高写高速缓存的效率。

即使严格按照程序顺序的两个内存访问操作，在存储子系统的作用下，其他处理器对这两个操作的感知顺序可能不一样，即这两个操作的顺序看起来像是发生了变化，这就是存储子系统重排序。

存储子系统重排序并没有对指令执行顺序产生影响，而是造成指令执行顺序被调整的假象。

存储子系统操作的对象是内存操作的结果。
