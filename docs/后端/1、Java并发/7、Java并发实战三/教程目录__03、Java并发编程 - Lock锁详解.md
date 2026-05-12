# 03、Java并发编程 - Lock锁详解
- 来源：https://ddkk.com/zhuanlan/java/concurrency/7/3.html
- 分类：Java并发
- 分组：教程目录
## 3、Lock锁

### 3.1. 多线程的编程模型

多线程编程的代码编写模型：

1、高内聚，低耦合 :必须保证业务代码的高内聚、低耦合；

2、线程去操作(调用对外暴露的方法) 资源类。

### 3.2. 使用传统的关键字synchronized实现Lock锁

要按照多线程的编程模型来实现Lock锁。如下方式，在企业中静止这样写。

```java
package com.interview.concurrent.lock;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述
 * @date 2023/2/21 11:15
 */
public class SaleTicketUseSynchronizeedError {
    public static void main(String[] args) {
        //1、错误的写法
        SaleTicketThreadError saleTicketThreadError = new SaleTicketThreadError();
        for (int i=0;i<30;i++) new Thread(saleTicketThreadError,"A").start();
        for (int i=0;i<30;i++) new Thread(saleTicketThreadError,"B").start();
        for (int i=0;i<30;i++) new Thread(saleTicketThreadError,"C").start();
        for (int i=0;i<30;i++) new Thread(saleTicketThreadError,"D").start();
        for (int i=0;i<30;i++) new Thread(saleTicketThreadError,"E").start();
    }
}
/**
 *  @description: 错误的写法，不能让资源和方法高度封装，达不到高内聚
 *  @author DDKK.COM 弟弟快看，程序员编程资料站
 *  @date 2023/2/20 19:45
 */
class SaleTicketThreadError implements Runnable{
    int ticketNumber = 50;
    @Override
    public synchronized void run() {
        if(ticketNumber  0)
            System.out.println(Thread.currentThread().getName() + "卖出第" + (ticketNumber--) + "张票，还剩" + ticketNumber + "张票");
    }
}
```

正确的写法是：将方法和资源单独封装，不要和线程有任何关系（线程是通过方法去操作资源的）。

```java
package com.interview.concurrent.lock;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述：卖票，5个售票员卖出50张票
 * @date 2023/2/20 19:29
 */
public class SaleTicketUseSynchronizeed {
    public static void main(String[] args) {
       //2、正确的写法，将资源和方法高度封装，达到高内聚
        SaleTicket saleTicket = new SaleTicket();
        new Thread(()-{
            for (int i=0;i<20;i++) saleTicket.saleTicket();
        },"A").start();
        new Thread(()-{
            for (int i=0;i<20;i++) saleTicket.saleTicket();
        },"B").start();
        new Thread(()-{
            for (int i=0;i<20;i++) saleTicket.saleTicket();
        },"C").start();
        new Thread(()-{
            for (int i=0;i<20;i++) saleTicket.saleTicket();
        },"D").start();
        new Thread(()-{
            for (int i=0;i<20;i++) saleTicket.saleTicket();
        },"E").start();
    }
}
/**
 *  @description: 资源类：将属性（票）和方法（卖票）封装起来，实现了高内聚
 *  @author DDKK.COM 弟弟快看，程序员编程资料站
 *  @date 2023/2/20 19:42
 */
class SaleTicket{
    int ticketNumber = 50;
    //卖票方法
    public synchronized void saleTicket(){
        if(ticketNumber  0)
            System.out.println(Thread.currentThread().getName() + "卖出第" + (ticketNumber--)  + "张票，还剩" + ticketNumber + "张票");
    }
}
```

### 3.3. 使用juc.locks包下的类实现Lock锁

#### 3.3.1. Lock的编程模型

使用 juc.locks 包下的类操作 Lock 锁 + Lambda 表达式。

Lock是一个接口，其实现类ReentranLock（可重入锁，后面章节会详细讲解）。

**Lock的编程模型**：

1、创建锁；

2、加锁：lock.lock()；

3、在try/catch里面写业务代码；

4、在try/catch的finally里面解锁lock.unlock()；

注意：Lock的加锁解锁要配对出现，即有一个lock.lock()加锁，就必须在finally里面有一个lock.unlock()，出现两个lock.lock()加锁，在finally里面也必须有两个lock.unlock(),

#### 3.3.2. 示例代码

完整代码如下：

```java
package com.interview.concurrent.lock;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述
 * @date 2023/2/21 11:41
 */
public class SaleTicketUseLock {
    public static void main(String[] args) {
        SaleTicketLock saleTicketLock = new SaleTicketLock();
        new Thread(()-{
     for(int i=0;i<20;i++) saleTicketLock.saleTicket();},"A").start();
        new Thread(()-{
     for(int i=0;i<20;i++) saleTicketLock.saleTicket();},"B").start();
        new Thread(()-{
     for(int i=0;i<20;i++) saleTicketLock.saleTicket();},"C").start();
        new Thread(()-{
     for(int i=0;i<20;i++) saleTicketLock.saleTicket();},"D").start();
        new Thread(()-{
     for(int i=0;i<20;i++) saleTicketLock.saleTicket();},"E").start();
    }
}
class SaleTicketLock{
    int ticketNumber = 50;
    //1、创建锁
    Lock lock = new ReentrantLock();
    public void saleTicket(){
        //2、加锁
        lock.lock();
        try{
            //3、业务代码
            if(ticketNumber  0)
                System.out.println(Thread.currentThread().getName() + "卖出第" + (ticketNumber--) + "张票，还剩" + ticketNumber + "张票");
        }catch(Exception e) {
            e.printStackTrace();
        }finally {
            //4、解锁
            lock.unlock();
        }
    }
}
```

### 3.3. synchronized 和 Lock 区别

synchronized 和 lock 区别 （自动挡 手动挡）。

1、synchronized 关键字，Java内置的。Lock 是一个Java 类；

2、synchronized 无法判断是否获取锁。Lock可以判断是否获得锁（通过isLocked（）方法）；

3、synchronized 锁会自动释放！ Lock需要手动在 finally 释放锁，如果不释放锁，就会死锁，Lock的加锁解锁要配对出现；

4、synchronized线程1阻塞，线程2永久等待下去。 Lock可以 lock.tryLock(); // 尝试获取锁，如果尝试获取不到锁，可以结束等待；

5、synchronized 可重入，不可中断，非公平的。Lock锁，可重入、可以判断、可以公平！

公平：线程必须排队，必须先来后到；

非公平：线程可以插队。

出现；

4、synchronized线程1阻塞，线程2永久等待下去。 Lock可以 lock.tryLock(); // 尝试获取锁，如果尝试获取不到锁，可以结束等待；

5、synchronized 可重入，不可中断，非公平的。Lock锁，可重入、可以判断、可以公平！

公平：线程必须排队，必须先来后到；

非公平：线程可以插队。
