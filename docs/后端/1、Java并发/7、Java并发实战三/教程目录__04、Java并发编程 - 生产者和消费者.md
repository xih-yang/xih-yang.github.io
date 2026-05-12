# 04、Java并发编程 - 生产者和消费者
- 来源：https://ddkk.com/zhuanlan/java/concurrency/7/4.html
- 分类：Java并发
- 分组：教程目录
## 4、生产者和消费者

线程间默认是无法通信的，所以需要调度线程。

Producer And Consumer，以下代码中简称Pac。

### 4.1. 生产者消费者编码模型

1、判断

2、干活

3、通知

### 4.2. 生产者和消费者- synchroinzed 版

#### 4.2.1. synchroinzed 实现的生产者与消费者

```java
package com.interview.concurrent.lock.prodconsumer;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述
 *  题目：现在两个线程，操作一个初始值为0的变量
 *         一个线程 + 1， 一个线程 -1。判断什么时候+1，什么时候-1
 *         交替10 次
 *
 *  方法论：
 *
 *  多线程编程模型：
 *   1、高内聚，低耦合  （前提）
 *   2、线程  操作(调用对外暴露的方法)   资源类  (要点)
 *
 *  生产者消费者模型： 判断、干活、通知
 * @date 2023/2/26 15:26
 */
public class PacBySynchronized {
    public static void main(String[] args) {
        //1、使用synchronized关键字实现
        MyResourcesBySynchronized myResources = new MyResourcesBySynchronized();
        new Thread(()- {
     for (int i = 0; i < 10; i++) {
            myResources.increment();
        }},"A").start();
        new Thread(()- {
     for (int i = 0; i < 10; i++) {
            myResources.decrement();
        }},"B").start();
    }
}
class MyResourcesBySynchronized {
    private int num = 0;
    //加1操作
    public synchronized void increment() {
        //1、判断
        try {
            if(num != 0) this.wait();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        //2、干活
        num ++;
        System.out.print("线程" + Thread.currentThread().getName() + ":" + num + ";\t");
        //3、通知
        this.notifyAll();
    }
    //减1操作
    public synchronized void decrement(){
        //1、判断
        try {
            if(num == 0) this.wait();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        //2、干活
        num --;
        System.out.println("线程" + Thread.currentThread().getName() + ":" + num + ";\t");
        //3、通知
        this.notifyAll();
    }
}
```

运行结果如下：

#### 4.1.2. 虚假唤醒:FalseNotify

产生原因：

虚假唤醒:FalseNotify（这是我自个取得英文名^），线程竞争监视器导致的虚假唤醒。

虚假唤醒原因：A线程由wait被notify后，状态由WAITING变成BLOCKED状态，来竞争监视器，但是另外一个线程B也处于BLOCKED状态，它也会来竞争监视器，这是，CPU是没办法控制到底是谁先拿到监视器。

如果不是wait的A线程先拿到监视器,那当wait的A线程拿到监视器的时候，共享的值已经改变了。

当只有两个进程，一个进程做加操作，一个进程做减操作，以上程序没有问题，但如果有4个进程，两个进程做加操作，两个进程做减操作呢？

如下代码：

```java
package com.interview.concurrent.lock.prodconsumer;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:虚假唤醒出现的诡异现象。
 * 有4个进程，两个进程做加操作，两个进程做减操作
 * @date 2023/2/26 15:26
 */
public class PacFalseNotify {
    public static void main(String[] args) {
        //1、虚假唤醒
        MyResourcesFalseNotify falseNotify = new MyResourcesFalseNotify();
        new Thread(()- {
     for (int i = 0; i < 10; i++) {
            falseNotify.increment();
        }},"A").start();
        new Thread(()- {
     for (int i = 0; i < 10; i++) {
            falseNotify.increment();
        }},"B").start();
        new Thread(()- {
     for (int i = 0; i < 10; i++) {
            falseNotify.decrement();
        }},"C").start();
        new Thread(()- {
     for (int i = 0; i < 10; i++) {
            falseNotify.decrement();
        }},"D").start();
    }
}
class MyResourcesFalseNotify {
    private int num = 0;
    //加1操作
    public synchronized void increment() {
        //1、判断
        try {
            if(num != 0) this.wait();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        //2、干活
        num ++;
        System.out.print("线程" + Thread.currentThread().getName() + ":" + num + ";\t");
        //3、通知
        this.notifyAll();
    }
    //减1操作
    public synchronized void decrement(){
        //1、判断
        try {
            if(num == 0) this.wait();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        //2、干活
        num --;
        System.out.println("线程" + Thread.currentThread().getName() + ":" + num + ";\t");
        //3、通知
        this.notifyAll();
    }
}
```

出现了不正常的数据，这是为什么呢？这是虚假唤醒导致的。

查看Object类中的wait()方法api:

```java
  public final void wait() throws InterruptedException
```

导致当前线程等待，直到另一个线程调用该对象的notify()方法或notifyAll()方法。 换句话说，这个方法的行为就好像简单地执行呼叫wait(0) 。

当前的线程必须拥有该对象的显示器。 该线程释放此监视器的所有权，并等待另一个线程通知等待该对象监视器的线程通过调用notify方法或notifyAll方法notifyAll 。 然后线程等待，直到它可以重新获得监视器的所有权并恢复执行。

像在一个参数版本中，中断和虚假唤醒是可能的，并且该方法应该始终在循环中使用：

```java
 synchronized (obj) {
     while (<condition does not hold)
            obj.wait();
 ... // Perform action appropriate to condition
 } 
```

该方法只能由作为该对象的监视器的所有者的线程调用。 有关线程可以成为监视器所有者的方式的说明，请参阅notify方法。

```java
    总结：
     虚假唤醒原因：A线程由wait被notify后，状态由WAITING变成BLOCKED状态，来竞争监视器，但是另外一个线程B也处于BLOCKED状态，它也会来竞争监视器，这是，CPU是没办法控制到底是谁先拿到监视器。
     如果不是wait的A线程先拿到监视器,那当wait的A线程拿到监视器的时候，共享的值已经改变了。
```

JDK的API推荐写法:

```java
synchronized (obj) {
    while (<condition does not hold)
           obj.wait();
... // Perform action appropriate to condition
} 
```

将以上代码的if语句改成while解决问题

```java
package com.interview.concurrent.lock.prodconsumer;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:虚假唤醒出现的诡异现象。
 * 有4个进程，两个进程做加操作，两个进程做减操作。
 * 解决方案：
 * 将判断语句的If,修改为while
 * @date 2023/2/26 15:26
 */
public class PacFalseNotify {
    public static void main(String[] args) {
        //1、虚假唤醒
        MyResourcesFalseNotify falseNotify = new MyResourcesFalseNotify();
        new Thread(()- {
     for (int i = 0; i < 10; i++) {
            falseNotify.increment();
        }},"A").start();
        new Thread(()- {
     for (int i = 0; i < 10; i++) {
            falseNotify.increment();
        }},"B").start();
        new Thread(()- {
     for (int i = 0; i < 10; i++) {
            falseNotify.decrement();
        }},"C").start();
        new Thread(()- {
     for (int i = 0; i < 10; i++) {
            falseNotify.decrement();
        }},"D").start();
    }
}
class MyResourcesFalseNotify {
    private int num = 0;
    //加1操作
    public synchronized void increment() {
        //1、判断
        try {
            while(num != 0) this.wait();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        //2、干活
        num ++;
        System.out.print("线程" + Thread.currentThread().getName() + ":" + num + ";\t");
        //3、通知
        this.notifyAll();
    }
    //减1操作
    public synchronized void decrement(){
        //1、判断
        try {
            while(num == 0) this.wait();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        //2、干活
        num --;
        System.out.println("线程" + Thread.currentThread().getName() + ":" + num + ";\t");
        //3、通知
        this.notifyAll();
    }
}
```

这样就成果的执行。

### 4.2. 生产者和消费者-新版JUC写法

#### 4.2.1. 使用JUC实现生产者与消费者

通过JUC实现生产者消费者问题，会让别人对你刮目相看，也是衡量您比别人优秀的原因。

使用synchronized，是通过synchronized、wait、notify三者之间的配合而实现的。

Lock,是通过lock、await、signal三者之间配合而实现。如下代码：

```java
class MyResourcesByLock{
    private int num = 0;
    //1、创建锁
    Lock lock = new ReentrantLock();
    Condition condition = lock.newCondition();
    //加1操作
    public void increment(){
        //2、加锁
        lock.lock();
        try {
            while(num != 0) condition.await();//等待
            //3、干活
            num ++;
            System.out.print("线程" + Thread.currentThread().getName() + ":" + num + ";\t");
            //通知
            condition.signalAll();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            //4、解锁
            lock.unlock();
        }
    }
    //减1操作
    public void decrement(){
        //2、加锁
        lock.lock();
        try {
            while(num == 0) condition.await();//等待
            //3、干活
            num --;
            System.out.println("线程" + Thread.currentThread().getName() + ":" + num + ";\t");
            //通知
            condition.signalAll();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            //4、解锁
            lock.unlock();
        }
    }
}
```

以上4个进程，唤醒是随机的，即进程的执行时随机的，不是有序进行的，那怎么能让进程有序执行呢。接下来我们讨论进程间如何精确通知访问。

**任何一个新技术的出现，一定不仅仅是换了个马甲**，如果Lock只提供了类似于synchronized的三板斧(synchronized、wait、notify) lock、await、signal,那不能体现Lock的强大。以下讲解Lock的特性Condition。

#### 4.2.2. 如何精确通知访问：Condition

Lock提供了一个接口Condition,通过Lock类对象获取Condition实现类对象。通过Condition，可以指定唤醒哪个进程。

针对Condition官方给出的api如下：

public interface ConditionCondition因素出Object监视器方法（ wait ， notify和notifyAll ）成不同的对象，以得到具有多个等待集的每个对象，通过将它们与使用任意的组合的效果Lock个实现。 Lock替换synchronized方法和语句的使用， Condition取代了对象监视器方法的使用。

条件（也称为条件队列或条件变量 ）为一个线程暂停执行（“等待”）提供了一种方法，直到另一个线程通知某些状态现在可能为真。 因为访问此共享状态信息发生在不同的线程中，所以它必须被保护，因此某种形式的锁与该条件相关联。 等待条件的关键属性是它原子地释放相关的锁并挂起当前线程，就像Object.wait 。

一个Condition实例本质上绑定到一个锁。 要获得特定Condition实例的Condition实例，请使用其newCondition()方法。

例如，假设我们有一个有限的缓冲区，它支持put和take方法。 如果在一个空的缓冲区尝试一个take ，则线程将阻塞直到一个项目可用; 如果put试图在一个完整的缓冲区，那么线程将阻塞，直到空间变得可用。 我们希望在单独的等待集中等待put线程和take线程，以便我们可以在缓冲区中的项目或空间可用的时候使用仅通知单个线程的优化。 这可以使用两个Condition实例来实现。

```java
class BoundedBuffer {
final Lock lock = new ReentrantLock();
final Condition notFull  = lock.newCondition(); 
final Condition notEmpty = lock.newCondition(); 
final Object[] items = new Object[100];
int putptr, takeptr, count;
public void put(Object x) throws InterruptedException {
  lock.lock(); try {
    while (count == items.length)
      notFull.await();
    items[putptr] = x;
    if (++putptr == items.length) putptr = 0;
    ++count;
    notEmpty.signal();
  } finally {
    lock.unlock(); }
}
public Object take() throws InterruptedException {
  lock.lock(); try {
    while (count == 0)
      notEmpty.await();
    Object x = items[takeptr];
    if (++takeptr == items.length) takeptr = 0;
    --count;
    notFull.signal();
    return x;
  } finally {
    lock.unlock(); }
}
} 
```

（ArrayBlockingQueue类提供此功能，因此没有理由实现此示例使用类。）

Condition实现可以提供Object监视器方法的行为和语义，例如有保证的通知顺序，或者在执行通知时不需要锁定。 如果一个实现提供了这样的专门的语义，那么实现必须记录这些语义。

需要注意的是Condition实例只是普通的对象，其本身作为一个目标synchronized语句，可以有自己的监视器wait和notification个方法调用。 获取Condition实例的监视器锁或使用其监视方法与获取与该Condition相关联的Condition或使用其waiting和signalling方法没有特定关系。 建议为避免混淆，您永远不会以这种方式使用Condition实例，除了可能在自己的实现之内。

除非另有说明，传递任何参数的null值将导致NullPointerException被抛出。

实施注意事项

当等待Condition时，允许发生“ 虚假唤醒 ”，一般来说，作为对底层平台语义的让步。 这对大多数应用程序几乎没有实际的影响，因为Condition应该始终在循环中等待，测试正在等待的状态谓词。 一个实现可以免除虚假唤醒的可能性，但建议应用程序员总是假定它们可以发生，因此总是等待循环。

条件等待（可中断，不可中断和定时）的三种形式在一些平台上的易用性和性能特征可能不同。 特别地，可能难以提供这些特征并保持特定的语义，例如排序保证。 此外，中断线程实际挂起的能力可能并不总是在所有平台上实现。

因此，不需要一个实现来为所有三种形式的等待定义完全相同的保证或语义，也不需要支持中断线程的实际暂停。

需要一个实现来清楚地记录每个等待方法提供的语义和保证，并且当一个实现确实支持线程挂起中断时，它必须遵守该接口中定义的中断语义。

由于中断通常意味着取消，并且检查中断通常是不频繁的，所以实现可以有利于通过正常方法返回来响应中断。 即使可以显示中断发生在另一个可能解除阻塞线程的动作之后，这一点也是如此。 一个实现应该记录这个行为。

Lock里面聚合了一个Condition接口

[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-oJSyevQY-1582721425336)(JUC精讲.assets/image-20200226160757692.png)]

精确通知顺序访问 Condition

Condition的使用代码示例：

```java
package com.interview.concurrent.lock;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:精确通知，即A线程唤醒B线程，B线程唤醒C线程，C线程唤醒A线程
 * @date 2023/2/21 23:48
 */
public class LockConditionAccurate {
    public static void main(String[] args) {
        ProductProcessing productProcessing = new ProductProcessing();
        new Thread(()- {
            for (int i = 0; i < 10; i++) {
                productProcessing.processFirst();
            }
        },"A").start();
        new Thread(()- {
            for (int i = 0; i < 10; i++) {
                productProcessing.processSecond();
            }
        },"B").start();
        new Thread(()- {
            for (int i = 0; i < 10; i++) {
                productProcessing.processAssembly();
            }
        },"C").start();
        new Thread(()- {
            for (int i = 0; i < 10; i++) {
                productProcessing.processTake();
            }
        },"C").start();
    }
}
class ProductProcessing{
    //仓库最大库存量
    private int stock;
    private int firstCount;
    private int secondCount;
    //1、创建锁
    Lock lock = new ReentrantLock();
    //线程执行顺序 First-Second-Assembly-Take-First
    Condition conditionFirst = lock.newCondition();
    Condition conditionSecond = lock.newCondition();
    Condition conditionAssembly = lock.newCondition();
    Condition conditionTake = lock.newCondition();
    /**
     *  @description: 产品生产第一阶段
     */
    public void processFirst(){
        //加锁
        lock.lock();
        //干活
        try {
            //仓库满的，就等待
            while (stock == 30)conditionFirst.await();
            firstCount++;
            System.out.println(Thread.currentThread().getName() + ":生产第一批零件，已生" + firstCount + "件");
            conditionSecond.signal();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            //解锁
            lock.unlock();
        }
    }
    /**
     *  @description: 产品生产第二阶段
     */
    public void processSecond(){
        //加锁
        lock.lock();
        //干活
        try {
            //第一零件有了，我要开始生产第二零件
            while (firstCount == 0)conditionSecond.await();
            firstCount--; //用掉了一个第一批零件
            secondCount++;
            System.out.println(Thread.currentThread().getName() + ":生产第二批零件，已生产" + secondCount + "件");
            conditionAssembly.signal();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            //解锁
            lock.unlock();
        }
    }
    /**
     *  @description: 产品组装阶段
     */
    public void processAssembly(){
        //加锁
        lock.lock();
        //干活
        try {
            //第二零件有了，我要开始组装产品
            while (secondCount == 0)conditionAssembly.await();
            secondCount--;//用掉了一个第二批零件
            stock++;
            System.out.println(Thread.currentThread().getName() + ":组装产品，已组装" + stock + "件");
            conditionTake.signal();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            //解锁
            lock.unlock();
        }
    }
    /**
     *  @description: 产品取走阶段
     */
    public void processTake(){
        //加锁
        lock.lock();
        //干活
        try {
            //第二零件有了，我要开始组装产品
            while (stock == 0)conditionTake.await();
            stock--;
            System.out.println(Thread.currentThread().getName() + ":拿走了一件产品，库存量=" + stock);
            conditionFirst.signal();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            //解锁
            lock.unlock();
        }
    }
}
```java
  lock.unlock();
        }
    }
    /**
     *  @description: 产品取走阶段
     */
    public void processTake(){
        //加锁
        lock.lock();
        //干活
        try {
            //第二零件有了，我要开始组装产品
            while (stock == 0)conditionTake.await();
            stock--;
            System.out.println(Thread.currentThread().getName() + ":拿走了一件产品，库存量=" + stock);
            conditionFirst.signal();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            //解锁
            lock.unlock();
        }
    }
}
```
